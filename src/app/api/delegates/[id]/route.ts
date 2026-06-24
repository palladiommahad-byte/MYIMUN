import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, requirePage, publicUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

/** DELETE — remove a delegate account and all their data.
    A delegate may delete their own account; staff need the Delegates page permission to delete anyone else's. */
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    if (user.id !== id) await requirePage('/admin/delegates');

    // Related registrations/payments/papers/applications cascade automatically.
    await prisma.conversation.deleteMany({ where: { delegateId: id } });
    await prisma.user.delete({ where: { id } });
    return ok({ deleted: id });
});

const statusSchema = z.object({ status: z.enum(['active', 'inactive']) });

/** PATCH — staff suspend/reactivate a delegate's account, cutting off platform access. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requirePage('/admin/delegates');
    const { id } = await ctx.params;
    if (user.id === id) return fail('You cannot suspend your own account', 400);

    const { status } = statusSchema.parse(await req.json());
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return fail('Delegate not found', 404);
    if (target.role !== 'delegate') return fail('Only delegate accounts can be suspended here', 400);

    const row = await prisma.user.update({ where: { id }, data: { status } });
    return ok(publicUser(row));
});
