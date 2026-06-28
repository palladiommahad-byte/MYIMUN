import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

// The only things delegates legitimately upload here are ID docs, payment receipts
// (PDF or image) and position papers (PDF) — see the `accept=` attrs on the upload
// inputs. Reject anything else at the door; the download route already neutralises
// stored files, but there's no reason to accept e.g. HTML/SVG/scripts in the first place.
const ALLOWED_TYPES = new Set([
    'application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
]);
const ALLOWED_EXTS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp']);

/** Upload a file (ID doc, receipt, position paper, image). Returns a key to reference later. */
export const POST = route(async (req: Request) => {
    await requireUser();
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return fail('No file provided', 400);
    if (file.size > MAX_BYTES) return fail('File exceeds the 20 MB limit', 413);

    // Accept by MIME when the browser provides a known one; otherwise fall back to the
    // file extension so a missing/generic content-type doesn't reject a valid upload.
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    const typeOk = file.type ? ALLOWED_TYPES.has(file.type) : ALLOWED_EXTS.has(ext);
    if (!typeOk) return fail('Unsupported file type. Upload a PDF or an image.', 415);

    const bytes = Buffer.from(await file.arrayBuffer());
    const key = randomUUID();
    await prisma.storedFile.create({
        data: { key, name: file.name || 'file', type: file.type || 'application/octet-stream', size: file.size, data: bytes },
    });

    return ok({ key, name: file.name, type: file.type, size: file.size }, 201);
});
