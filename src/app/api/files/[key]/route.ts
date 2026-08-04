import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { fail, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];
const PUBLIC_FILE_SETTING_KEYS = ['landing', 'about', 'committees-page', 'contact-page'];

// Only these types are rendered inline; everything else is forced to download so a
// malicious upload (e.g. HTML/SVG) can never execute script in our origin.
const INLINE_TYPES = new Set([
    'application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
]);

function valueReferencesFile(value: unknown, key: string): boolean {
    const url = `/api/files/${key}`;
    if (typeof value === 'string') return value === url || value.startsWith(`${url}?`) || value.startsWith(`${url}#`);
    if (Array.isArray(value)) return value.some(item => valueReferencesFile(item, key));
    if (value && typeof value === 'object') return Object.values(value).some(item => valueReferencesFile(item, key));
    return false;
}

async function isPublicSiteFile(key: string) {
    const settings = await prisma.appSetting.findMany({
        where: { key: { in: PUBLIC_FILE_SETTING_KEYS } },
        select: { value: true },
    });
    return settings.some(setting => valueReferencesFile(setting.value, key));
}

/** Stream a stored file. Staff can read any file; a delegate can only read files
    referenced by their own registration / payment / position paper. */
export const GET = route(async (_req: Request, ctx: { params: Promise<{ key: string }> }) => {
    const { key } = await ctx.params;

    const isPublic = await isPublicSiteFile(key);
    const user = isPublic ? null : await requireUser();

    if (user && !STAFF.includes(user.role)) {
        const exampleSetting = await prisma.appSetting.findUnique({
            where: { key: 'position-paper-example' },
            select: { value: true },
        });
        const exampleFileKey = typeof exampleSetting?.value === 'object' && exampleSetting.value !== null && !Array.isArray(exampleSetting.value)
            ? (exampleSetting.value as { fileKey?: unknown }).fileKey
            : undefined;
        const avatar = await prisma.user.findFirst({
            where: { id: user.id, avatarUrl: `/api/files/${key}` },
            select: { id: true },
        });
        const owns =
            exampleFileKey === key ||
            avatar ||
            (await prisma.registration.findFirst({ where: { delegateId: user.id, idDocKey: key }, select: { id: true } })) ||
            (await prisma.paymentSubmission.findFirst({ where: { delegateId: user.id, receiptKey: key }, select: { id: true } })) ||
            (await prisma.positionPaper.findFirst({ where: { delegateId: user.id, fileKey: key }, select: { id: true } }));
        if (!owns) return fail('File not found', 404);
    }

    const file = await prisma.storedFile.findUnique({ where: { key } });
    if (!file) return fail('File not found', 404);

    const inline = INLINE_TYPES.has(file.type);
    const disposition = `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.name)}"`;

    return new Response(new Uint8Array(file.data), {
        status: 200,
        headers: {
            // Force a safe content type for non-inline files so the browser never sniffs/executes them.
            'Content-Type': inline ? file.type : 'application/octet-stream',
            'Content-Length': String(file.size),
            'Content-Disposition': disposition,
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
            'Cache-Control': 'private, max-age=3600',
        },
    });
});
