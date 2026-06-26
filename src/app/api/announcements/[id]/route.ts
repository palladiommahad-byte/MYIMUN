import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { broadcast } from '@/lib/events';

/** DELETE — staff remove a broadcast. */
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/announcements');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    await prisma.announcement.delete({ where: { id } });
    broadcast({ audience: 'everyone' });
    return ok({ deleted: id });
});
