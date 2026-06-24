import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyDelegate } from '@/lib/notifications';

const schema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('accept') }),
    z.object({ action: z.literal('decline'), declineReason: z.string().optional() }),
    z.object({ action: z.literal('markPaid') }),
]);

/** PATCH — staff accept/decline a registration or mark it paid. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/registration');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const body = schema.parse(await req.json());
    const data =
        body.action === 'accept' ? { status: 'Accepted', declineReason: null }
        : body.action === 'decline' ? { status: 'Declined', declineReason: body.declineReason ?? 'No reason provided.' }
        : { paymentStatus: 'Paid' };

    const row = await prisma.registration.update({ where: { id }, data });

    if (body.action === 'accept') {
        await notifyDelegate(row.delegateId, {
            type: 'registration_accepted',
            title: 'Registration accepted',
            message: 'Your registration has been accepted! You can now proceed to payment.',
            link: '/dashboard',
        });
    } else if (body.action === 'decline') {
        await notifyDelegate(row.delegateId, {
            type: 'registration_declined',
            title: 'Registration declined',
            message: `Your registration was not approved: ${row.declineReason}`,
            link: '/dashboard/registration',
        });
    } else {
        await notifyDelegate(row.delegateId, {
            type: 'registration_marked_paid',
            title: 'Payment confirmed',
            message: 'Your payment has been confirmed by the secretariat. You now have full platform access.',
            link: '/dashboard',
        });
    }

    return ok(row);
});
