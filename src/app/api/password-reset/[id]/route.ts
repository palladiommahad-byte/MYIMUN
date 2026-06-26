import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePage, hashPassword } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyDelegate } from '@/lib/notifications';

const schema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('resolve'), newPassword: z.string().min(6) }),
    z.object({ action: z.literal('dismiss') }),
]);

/** PATCH — staff resolve a reset request by setting a new password on the matched
    delegate, or dismiss it. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/accounts');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const reqRow = await prisma.passwordResetRequest.findUnique({ where: { id } });
    if (!reqRow) return fail('Request not found', 404);

    const body = schema.parse(await req.json());

    if (body.action === 'dismiss') {
        const row = await prisma.passwordResetRequest.update({
            where: { id }, data: { status: 'dismissed', resolvedAt: new Date() },
        });
        return ok(row);
    }

    // resolve: requires a matched delegate account
    if (!reqRow.userId) return fail('No account matches this email — dismiss the request instead.', 400);
    const target = await prisma.user.findUnique({ where: { id: reqRow.userId } });
    if (!target) return fail('The matched account no longer exists.', 404);

    await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await hashPassword(body.newPassword) } });
    const row = await prisma.passwordResetRequest.update({
        where: { id }, data: { status: 'resolved', resolvedAt: new Date() },
    });

    await notifyDelegate(target.id, {
        type: 'password_reset_resolved',
        title: 'Your password was reset',
        message: 'An organizer set a new password for your account. Check with them for your new login details.',
        link: '/dashboard',
    });

    return ok(row);
});
