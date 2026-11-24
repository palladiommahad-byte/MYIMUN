import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireStaff, AuthError } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyDelegate } from '@/lib/notifications';
import { canManageRefunds, refundScopeForStaff } from '@/lib/refunds';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date')
    .refine(value => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'Invalid date');

const schema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('approve'), scheduledDate: isoDate.optional() }),
    z.object({ action: z.literal('decline'), declineReason: z.string().trim().min(3, 'Please give a reason for declining').max(2000) }),
    z.object({ action: z.literal('schedule'), scheduledDate: isoDate }),
    z.object({ action: z.literal('markRefunded') }),
]);

function displayDate(value: string) {
    return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** PATCH — staff approve / decline / schedule / complete a refund request. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireStaff();
    if (!canManageRefunds(user)) throw new AuthError(403, 'You do not have access to this section');

    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    const body = schema.parse(await req.json());

    const refund = await prisma.refundRequest.findFirst({ where: { AND: [{ id }, await refundScopeForStaff(user)] } });
    if (!refund) return fail('Refund request not found', 404);

    const reviewed = { reviewedBy: user.fullName, reviewedAt: new Date() };

    if (body.action === 'approve') {
        if (refund.status !== 'Pending') return fail(`This request is already ${refund.status.toLowerCase()}.`, 409);
        const row = await prisma.refundRequest.update({
            where: { id },
            data: { ...reviewed, status: 'Approved', declineReason: null, scheduledDate: body.scheduledDate ?? null },
        });
        await notifyDelegate(refund.delegateId, {
            type: 'refund_approved',
            title: 'Refund approved',
            message: body.scheduledDate
                ? `Your refund request was approved. It is scheduled for ${displayDate(body.scheduledDate)}.`
                : 'Your refund request was approved. The secretariat will confirm the refund date soon.',
            link: '/dashboard/payments',
        });
        return ok(row);
    }

    if (body.action === 'decline') {
        if (refund.status !== 'Pending' && refund.status !== 'Approved') {
            return fail(`This request is already ${refund.status.toLowerCase()}.`, 409);
        }
        const row = await prisma.refundRequest.update({
            where: { id },
            data: { ...reviewed, status: 'Declined', declineReason: body.declineReason, scheduledDate: null },
        });
        await notifyDelegate(refund.delegateId, {
            type: 'refund_declined',
            title: 'Refund declined',
            message: `Your refund request was declined: ${body.declineReason}`,
            link: '/dashboard/payments',
        });
        return ok(row);
    }

    if (body.action === 'schedule') {
        if (refund.status !== 'Approved') return fail('Approve the request before scheduling the refund.', 409);
        const row = await prisma.refundRequest.update({
            where: { id },
            data: { ...reviewed, scheduledDate: body.scheduledDate },
        });
        await notifyDelegate(refund.delegateId, {
            type: 'refund_scheduled',
            title: 'Refund date set',
            message: `Your refund is scheduled for ${displayDate(body.scheduledDate)}.`,
            link: '/dashboard/payments',
        });
        return ok(row);
    }

    // markRefunded
    if (refund.status !== 'Approved') return fail('Only approved refunds can be marked as refunded.', 409);
    const row = await prisma.refundRequest.update({
        where: { id },
        data: { ...reviewed, status: 'Refunded', refundedAt: new Date() },
    });
    await notifyDelegate(refund.delegateId, {
        type: 'refund_completed',
        title: 'Refund completed',
        message: 'Your refund has been sent. Please allow a few days for it to reach your account.',
        link: '/dashboard/payments',
    });
    return ok(row);
});
