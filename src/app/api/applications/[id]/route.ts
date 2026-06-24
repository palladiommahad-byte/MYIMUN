import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasPageAccess } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyDelegate, notifyStaff } from '@/lib/notifications';

const schema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('approve') }),
    z.object({ action: z.literal('reject') }),
    z.object({ action: z.literal('reassign'), committeeAbbr: z.string().min(1) }),
    z.object({ action: z.literal('assignCountry'), country: z.string().min(1) }),
    z.object({ action: z.literal('withdraw') }), // delegate self-service
]);

/** PATCH — staff approve/reject, reassign, or assign a country.
    `withdraw` is allowed for the owning delegate (or staff) so they can re-apply.
    Approving (or reassigning) frees a slot from the target committee's waitlist. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const app = await prisma.committeeApplication.findUnique({ where: { id } });
    if (!app) return fail('Application not found', 404);
    const body = schema.parse(await req.json());

    const isStaff = hasPageAccess(user, '/admin/committees');
    if (body.action === 'withdraw') {
        if (!isStaff && app.delegateId !== user.id) return fail('Forbidden', 403);
    } else if (!isStaff) {
        return fail('Staff access required', 403);
    }

    const decWaitlist = async (abbr: string) =>
        prisma.committee.updateMany({ where: { abbr }, data: { waiting: { decrement: 1 } } });

    let row;
    if (body.action === 'approve') {
        row = await prisma.committeeApplication.update({ where: { id }, data: { status: 'Approved' } });
        await decWaitlist(app.committeeAbbr);
        await notifyDelegate(app.delegateId, {
            type: 'committee_application_approved',
            title: 'Committee application approved',
            message: `You've been approved for ${app.committeeAbbr}.`,
            link: '/dashboard/committee',
        });
    } else if (body.action === 'reject') {
        row = await prisma.committeeApplication.update({ where: { id }, data: { status: 'Rejected' } });
        await notifyDelegate(app.delegateId, {
            type: 'committee_application_rejected',
            title: 'Committee application rejected',
            message: `Your application for ${app.committeeAbbr} was not approved. You can apply again.`,
            link: '/dashboard/committee',
        });
    } else if (body.action === 'withdraw') {
        row = await prisma.committeeApplication.update({ where: { id }, data: { status: 'Rejected' } });
        if (isStaff) {
            await notifyDelegate(app.delegateId, {
                type: 'committee_application_withdrawn',
                title: 'Committee application withdrawn',
                message: `Your application for ${app.committeeAbbr} was withdrawn by the secretariat. You can apply again.`,
                link: '/dashboard/committee',
            });
        } else {
            await notifyStaff({
                type: 'committee_application_withdrawn',
                title: 'Delegate withdrew their application',
                message: `${app.delegateName} withdrew their application for ${app.committeeAbbr}.`,
                link: '/admin/committees',
            });
        }
    } else if (body.action === 'reassign') {
        row = await prisma.committeeApplication.update({ where: { id }, data: { committeeAbbr: body.committeeAbbr, status: 'Approved' } });
        await decWaitlist(body.committeeAbbr);
        await notifyDelegate(app.delegateId, {
            type: 'committee_application_reassigned',
            title: 'Committee reassigned',
            message: `You've been reassigned to ${body.committeeAbbr}.`,
            link: '/dashboard/committee',
        });
    } else {
        row = await prisma.committeeApplication.update({ where: { id }, data: { assignedCountry: body.country } });
        await notifyDelegate(app.delegateId, {
            type: 'committee_country_assigned',
            title: 'Country assigned',
            message: `You'll be representing ${body.country} in ${app.committeeAbbr}.`,
            link: '/dashboard/committee',
        });
    }
    return ok(row);
});
