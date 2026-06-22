import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const schema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('accept') }),
    z.object({ action: z.literal('decline'), declineReason: z.string().optional() }),
    z.object({ action: z.literal('markPaid') }),
]);

/** PATCH — staff accept/decline a registration or mark it paid. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireStaff();
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const body = schema.parse(await req.json());
    const data =
        body.action === 'accept' ? { status: 'Accepted', declineReason: null }
        : body.action === 'decline' ? { status: 'Declined', declineReason: body.declineReason ?? 'No reason provided.' }
        : { paymentStatus: 'Paid' };

    const row = await prisma.registration.update({ where: { id }, data });
    return ok(row);
});
