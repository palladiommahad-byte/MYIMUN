import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { fail, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];

// Only these types are rendered inline; everything else is forced to download so a
// malicious upload (e.g. HTML/SVG) can never execute script in our origin.
const INLINE_TYPES = new Set([
    'application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
]);

/** Stream a stored file. Staff can read any file; a delegate can only read files
    referenced by their own registration / payment / position paper. */
export const GET = route(async (_req: Request, ctx: { params: Promise<{ key: string }> }) => {
    const user = await requireUser();
    const { key } = await ctx.params;

    if (!STAFF.includes(user.role)) {
        const owns =
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
