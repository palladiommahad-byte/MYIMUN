import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

/** Upload a file (ID doc, receipt, position paper, image). Returns a key to reference later. */
export const POST = route(async (req: Request) => {
    await requireUser();
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return fail('No file provided', 400);
    if (file.size > MAX_BYTES) return fail('File exceeds the 20 MB limit', 413);

    const bytes = Buffer.from(await file.arrayBuffer());
    const key = randomUUID();
    await prisma.storedFile.create({
        data: { key, name: file.name || 'file', type: file.type || 'application/octet-stream', size: file.size, data: bytes },
    });

    return ok({ key, name: file.name, type: file.type, size: file.size }, 201);
});
