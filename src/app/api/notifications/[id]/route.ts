import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];

/** PATCH — mark a single notification as read. */
export const PATCH = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n) return fail('Notification not found', 404);

    const isStaff = STAFF.includes(user.role);
    if (n.audience === 'staff' && !isStaff) return fail('Forbidden', 403);
    if (n.audience === 'delegate' && n.recipientId !== user.id) return fail('Forbidden', 403);

    const row = await prisma.notification.update({ where: { id }, data: { read: true } });
    return ok(row);
});
