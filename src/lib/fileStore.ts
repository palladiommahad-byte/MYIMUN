/**
 * File helpers.
 *
 * Uploads now go to the backend (`POST /api/files`) and are referenced by a
 * server-issued key; download/view via `fileUrl(key)`. The IndexedDB store below
 * is kept only as a legacy fallback and is no longer the source of truth.
 */

/** Upload a file to the backend; returns the key to store and reference later. */
export async function uploadFile(file: File): Promise<{ key: string; name: string; size: number; type: string }> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/files', { method: 'POST', body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Upload failed');
    return json.data;
}

/** URL to view/download a stored file by key. */
export const fileUrl = (key: string) => `/api/files/${key}`;

const DB_NAME = 'myimun_files';
const STORE = 'files';
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function saveFile(key: string, file: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(file, key);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
    });
}

export async function getFile(key: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => { db.close(); resolve((req.result as Blob) ?? null); };
        req.onerror = () => reject(req.error);
    });
}

export async function deleteFile(key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
    });
}
