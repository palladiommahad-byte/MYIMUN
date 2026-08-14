import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';

export const runtime = 'nodejs';

const SETTING_KEY = 'email-media';
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);
const ALLOWED_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);

type EmailMediaItem = {
    key: string;
    name: string;
    type: string;
    size: number;
    url: string;
    createdAt: string;
};

function publicOrigin(req: Request) {
    const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.DOMAIN;
    if (configured) return configured.startsWith('http') ? configured.replace(/\/$/, '') : `https://${configured.replace(/\/$/, '')}`;
    return new URL(req.url).origin;
}

function fileUrl(req: Request, key: string) {
    return `${publicOrigin(req)}/api/files/${key}`;
}

function relativeUrl(key: string) {
    return `/api/files/${key}`;
}

function normalizeItems(value: unknown): EmailMediaItem[] {
    if (!Array.isArray(value)) return [];
    return value
        .map(item => {
            if (!item || typeof item !== 'object') return null;
            const row = item as Partial<EmailMediaItem>;
            if (!row.key || !row.name || !row.type || typeof row.size !== 'number') return null;
            return {
                key: row.key,
                name: row.name,
                type: row.type,
                size: row.size,
                url: row.url || relativeUrl(row.key),
                createdAt: row.createdAt || new Date().toISOString(),
            };
        })
        .filter((item): item is EmailMediaItem => Boolean(item));
}

async function readItems() {
    const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
    return normalizeItems(row?.value);
}

function toJson(value: EmailMediaItem[]): Prisma.InputJsonValue {
    return value as unknown as Prisma.InputJsonValue;
}

/** GET - list public media assets for HTML email design. */
export const GET = route(async (req: Request) => {
    await requirePage('/admin/email');
    const items = await readItems();
    return ok(items.map(item => ({ ...item, url: fileUrl(req, item.key) })));
});

/** POST - upload one public image and return its email-safe absolute URL. */
export const POST = route(async (req: Request) => {
    await requirePage('/admin/email');
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return fail('No file provided', 400);
    if (file.size > MAX_BYTES) return fail('Image exceeds the 8 MB limit', 413);

    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    const typeOk = file.type ? ALLOWED_TYPES.has(file.type) : ALLOWED_EXTS.has(ext);
    if (!typeOk) return fail('Upload a PNG, JPG, GIF, or WebP image.', 415);

    const key = randomUUID();
    const bytes = Buffer.from(await file.arrayBuffer());
    const item: EmailMediaItem = {
        key,
        name: file.name || `email-image-${key}`,
        type: file.type || 'image/jpeg',
        size: file.size,
        url: relativeUrl(key),
        createdAt: new Date().toISOString(),
    };

    const items = await readItems();
    await prisma.$transaction([
        prisma.storedFile.create({
            data: { key, name: item.name, type: item.type, size: item.size, data: bytes },
        }),
        prisma.appSetting.upsert({
            where: { key: SETTING_KEY },
            update: { value: toJson([item, ...items]) },
            create: { key: SETTING_KEY, value: toJson([item, ...items]) },
        }),
    ]);

    return ok({ ...item, url: fileUrl(req, key) }, 201);
});
