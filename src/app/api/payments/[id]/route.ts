import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyDelegate } from '@/lib/notifications';

const schema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('approve') }),
    z.object({ action: z.literal('decline'), declineReason: z.string().optional() }),
]);

/** PATCH — staff approve/decline a payment. Approval marks the delegate's
    registration Paid; decline resets it to Unpaid (mirrors the old client logic). */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/payments');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const body = schema.parse(await req.json());
    const pay = await prisma.paymentSubmission.findUnique({ where: { id } });
    if (!pay) return fail('Payment not found', 404);

    const status = body.action === 'approve' ? 'Approved' : 'Declined';
    const declineReason = body.action === 'decline' ? (body.declineReason ?? 'No reason provided.') : null;

    const [row] = await prisma.$transaction([
        prisma.paymentSubmission.update({ where: { id }, data: { status, declineReason } }),
        prisma.registration.updateMany({
            where: { delegateId: pay.delegateId },
            data: { paymentStatus: body.action === 'approve' ? 'Paid' : 'Unpaid' },
        }),
    ]);

    await notifyDelegate(pay.delegateId, body.action === 'approve' ? {
        type: 'payment_approved',
        title: 'Payment approved',
        message: 'Your payment has been verified. You now have full platform access.',
        link: '/dashboard/payments',
    } : {
        type: 'payment_declined',
        title: 'Payment declined',
        message: `Your payment receipt was declined: ${declineReason}`,
        link: '/dashboard/payments',
    });

    return ok(row);
});
