import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyAdmin, notifyDelegate } from '@/lib/notifications';
import { formatMoney } from '@/lib/currency';
import { canManageRefunds, refundScopeForStaff } from '@/lib/refunds';

/** GET — delegates see their own refund requests; staff who manage delegates or
    payments see every request (non-admin staff only for payments shared with them). */
export const GET = route(async () => {
    const user = await requireUser();
    if (user.role === 'delegate') {
        const rows = await prisma.refundRequest.findMany({ where: { delegateId: user.id }, orderBy: { id: 'desc' } });
        return ok(rows);
    }
    if (!canManageRefunds(user)) return ok([]);
    const rows = await prisma.refundRequest.findMany({ where: await refundScopeForStaff(user), orderBy: { id: 'desc' } });
    return ok(rows);
});

const schema = z.object({
    reason: z.string().trim().min(10, 'Please explain why you want a refund (at least 10 characters).').max(2000),
});

/** POST — a delegate with a verified payment asks for a refund. */
export const POST = route(async (req: Request) => {
    const user = await requireUser();
    if (user.role !== 'delegate') return fail('Only delegates can request a refund', 403);
    const { reason } = schema.parse(await req.json());

    const payment = await prisma.paymentSubmission.findFirst({
        where: { delegateId: user.id, status: 'Approved' },
        orderBy: { id: 'desc' },
    });
    if (!payment) return fail('A refund can only be requested after your payment has been verified.', 409);

    const open = await prisma.refundRequest.findFirst({
        where: { delegateId: user.id, status: { in: ['Pending', 'Approved', 'Refunded'] } },
    });
    if (open) {
        return fail(open.status === 'Refunded'
            ? 'Your payment has already been refunded.'
            : 'You already have a refund request in progress.', 409);
    }

    const pkg = payment.packageId ? await prisma.conferencePackage.findUnique({ where: { id: payment.packageId } }) : null;
    const row = await prisma.refundRequest.create({
        data: {
            delegateId: user.id,
            delegateName: payment.participantName || user.fullName,
            paymentId: payment.id,
            amount: payment.amount,
            packageName: payment.packageName,
            reason,
        },
    });

    await notifyAdmin({
        type: 'refund_requested',
        title: 'New refund request',
        message: `${row.delegateName} requested a refund of ${formatMoney(row.amount, pkg?.currency)}.`,
        link: '/admin/delegates',
    });
    await notifyDelegate(user.id, {
        type: 'refund_requested',
        title: 'Refund request sent',
        message: 'Your refund request was sent to the secretariat. You will be notified once it is reviewed.',
        link: '/dashboard/payments',
    });

    return ok(row, 201);
});
