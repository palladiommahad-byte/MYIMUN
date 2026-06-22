import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { fail, route } from '@/lib/api';

/** Stream a stored file back to authenticated users. */
export const GET = route(async (_req: Request, ctx: { params: Promise<{ key: string }> }) => {
    await requireUser();
    const { key } = await ctx.params;
    const file = await prisma.storedFile.findUnique({ where: { key } });
    if (!file) return fail('File not found', 404);

    const body = new Uint8Array(file.data);
    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'Content-Length': String(file.size),
            'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
            'Cache-Control': 'private, max-age=3600',
        },
    });
});
