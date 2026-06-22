import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];

/** DELETE — remove a delegate account and all their data.
    A delegate may delete their own account; staff may delete anyone. */
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    if (user.id !== id && !STAFF.includes(user.role)) return fail('Forbidden', 403);

    // Related registrations/payments/papers/applications cascade automatically.
    await prisma.conversation.deleteMany({ where: { delegateId: id } });
    await prisma.user.delete({ where: { id } });
    return ok({ deleted: id });
});
