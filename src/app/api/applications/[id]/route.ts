import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];

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

    const isStaff = STAFF.includes(user.role);
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
    } else if (body.action === 'reject' || body.action === 'withdraw') {
        row = await prisma.committeeApplication.update({ where: { id }, data: { status: 'Rejected' } });
    } else if (body.action === 'reassign') {
        row = await prisma.committeeApplication.update({ where: { id }, data: { committeeAbbr: body.committeeAbbr, status: 'Approved' } });
        await decWaitlist(body.committeeAbbr);
    } else {
        row = await prisma.committeeApplication.update({ where: { id }, data: { assignedCountry: body.country } });
    }
    return ok(row);
});
