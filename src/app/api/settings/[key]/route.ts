import { prisma } from '@/lib/prisma';
import { requirePage, requireUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

const ALLOWED = ['payment', 'conference', 'landing', 'about', 'committees-page', 'contact-page', 'position-paper-example', 'delegate-support'];
const IMAGE_SETTING_KEYS = new Set(['landing', 'about', 'committees-page', 'contact-page']);
const DATA_IMAGE_RE = /^data:(image\/(?:png|jpe?g|gif|webp));base64,([A-Za-z0-9+/=]+)$/;
const PAGE_BY_KEY: Record<string, string> = {
    payment: '/admin/payments', conference: '/admin/settings', landing: '/admin/landing',
    about: '/admin/events', 'committees-page': '/admin/events', 'contact-page': '/admin/events',
    'position-paper-example': '/admin/papers',
    'delegate-support': '/admin/messages',
};

const EXT_BY_TYPE: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
};

async function normalizeStoredImages(value: unknown): Promise<{ value: unknown; changed: boolean }> {
    if (typeof value === 'string') {
        const match = value.match(DATA_IMAGE_RE);
        if (!match) return { value, changed: false };

        const [, type, base64] = match;
        const data = Buffer.from(base64, 'base64');
        const key = randomUUID();
        await prisma.storedFile.create({
            data: {
                key,
                name: `site-image-${key}.${EXT_BY_TYPE[type] ?? 'jpg'}`,
                type,
                size: data.length,
                data,
            },
        });
        return { value: `/api/files/${key}`, changed: true };
    }

    if (Array.isArray(value)) {
        let changed = false;
        const next = await Promise.all(value.map(async item => {
            const result = await normalizeStoredImages(item);
            changed ||= result.changed;
            return result.value;
        }));
        return { value: next, changed };
    }

    if (value && typeof value === 'object') {
        let changed = false;
        const entries = await Promise.all(Object.entries(value).map(async ([entryKey, entryValue]) => {
            const result = await normalizeStoredImages(entryValue);
            changed ||= result.changed;
            return [entryKey, result.value] as const;
        }));
        return { value: Object.fromEntries(entries), changed };
    }

    return { value, changed: false };
}

async function normalizeSettingValue(key: string, value: unknown) {
    if (!IMAGE_SETTING_KEYS.has(key)) return { value, changed: false };
    return normalizeStoredImages(value);
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
    return (value ?? {}) as Prisma.InputJsonValue;
}

/** GET - public read of a site-config document. */
export const GET = route(async (_req: Request, ctx: { params: Promise<{ key: string }> }) => {
    const { key } = await ctx.params;
    if (!ALLOWED.includes(key)) return fail('Unknown settings key', 404);
    if (key === 'payment') await requireUser();
    const row = await prisma.appSetting.findUnique({ where: { key } });
    if (!row) return ok(null);

    const normalized = await normalizeSettingValue(key, row.value);
    if (normalized.changed) {
        await prisma.appSetting.update({ where: { key }, data: { value: toInputJson(normalized.value) } });
    }
    return ok(normalized.value);
});

/** PUT — staff replace a site-config document. */
export const PUT = route(async (req: Request, ctx: { params: Promise<{ key: string }> }) => {
    const { key } = await ctx.params;
    if (!ALLOWED.includes(key)) return fail('Unknown settings key', 404);
    await requirePage(PAGE_BY_KEY[key]);
    const rawValue = await req.json();
    const { value } = await normalizeSettingValue(key, rawValue);
    const row = await prisma.appSetting.upsert({
        where: { key },
        update: { value: toInputJson(value) },
        create: { key, value: toInputJson(value) },
    });
    return ok(row.value);
});
