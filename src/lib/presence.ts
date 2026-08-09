import 'server-only';
import type { PresenceEntry, PresenceSnapshot } from '@/types';

type PresenceListener = () => void;

const ACTIVE_WINDOW_MS = 60_000;
const MAX_ENTRIES = 5_000;

const globalForPresence = globalThis as unknown as {
    __myimunPresence?: Map<string, PresenceEntry>;
    __myimunPresenceListeners?: Set<PresenceListener>;
};

const entries = globalForPresence.__myimunPresence ?? new Map<string, PresenceEntry>();
const listeners = globalForPresence.__myimunPresenceListeners ?? new Set<PresenceListener>();
globalForPresence.__myimunPresence = entries;
globalForPresence.__myimunPresenceListeners = listeners;

function notify() {
    for (const listener of listeners) listener();
}

export function getPresence(clientId: string) {
    return entries.get(clientId);
}

export function touchPresence(input: Omit<PresenceEntry, 'firstSeen' | 'lastSeen'>) {
    const now = Date.now();
    const existing = entries.get(input.clientId);

    if (!existing && entries.size >= MAX_ENTRIES) {
        const oldest = [...entries.values()].sort((a, b) => a.lastSeen - b.lastSeen)[0];
        if (oldest) entries.delete(oldest.clientId);
    }

    entries.set(input.clientId, {
        ...input,
        firstSeen: existing?.firstSeen ?? now,
        lastSeen: now,
    });
    notify();
}

export function removePresence(clientId: string) {
    if (entries.delete(clientId)) notify();
}

export function prunePresence() {
    const cutoff = Date.now() - ACTIVE_WINDOW_MS;
    let removed = false;
    for (const [clientId, entry] of entries) {
        if (entry.lastSeen < cutoff) {
            entries.delete(clientId);
            removed = true;
        }
    }
    if (removed) notify();
    return removed;
}

export function getPresenceSnapshot(): PresenceSnapshot {
    prunePresence();
    const activeEntries = [...entries.values()].sort((a, b) => b.lastSeen - a.lastSeen);
    const uniqueUsers = new Map<string, PresenceEntry>();

    for (const entry of activeEntries) {
        const key = entry.userId ? `user:${entry.userId}` : `visitor:${entry.clientId}`;
        if (!uniqueUsers.has(key)) uniqueUsers.set(key, entry);
    }

    const users = [...uniqueUsers.values()];
    const staffRoles = new Set(['admin', 'secretary', 'manager']);

    return {
        updatedAt: new Date().toISOString(),
        activeWindowSeconds: ACTIVE_WINDOW_MS / 1000,
        totalUsers: users.length,
        totalSessions: activeEntries.length,
        delegates: users.filter(entry => entry.role === 'delegate').length,
        staff: users.filter(entry => staffRoles.has(entry.role)).length,
        visitors: users.filter(entry => entry.role === 'guest').length,
        entries: activeEntries,
    };
}

export function subscribePresence(listener: PresenceListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
