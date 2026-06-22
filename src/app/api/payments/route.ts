import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];

export const GET = route(async () => {
    const user = await requireUser();
    const where = STAFF.includes(user.role) ? {} : { delegateId: user.id };
    const rows = await prisma.paymentSubmission.findMany({ where, orderBy: { id: 'desc' } });
    return ok(rows);
});

const schema = z.object({
    senderName: z.string().trim().min(1),
    participantName: z.string().trim().min(1),
    amount: z.number().nonnegative(),
    method: z.string().trim().min(1),
    packageId: z.number().optional(),
    packageName: z.string().optional(),
    receiptName: z.string().min(1),
    receiptSize: z.number().optional(),
    receiptType: z.string().optional(),
    receiptKey: z.string().min(1),
});

/** POST — a delegate submits (or replaces) their payment receipt. */
export const POST = route(async (req: Request) => {
    const user = await requireUser();
    const data = schema.parse(await req.json());

    const existing = await prisma.paymentSubmission.findFirst({ where: { delegateId: user.id } });
    const row = existing
        ? await prisma.paymentSubmission.update({
            where: { id: existing.id },
            data: { ...data, status: 'Pending', declineReason: null },
        })
        : await prisma.paymentSubmission.create({ data: { ...data, delegateId: user.id } });

    return ok(row, 201);
});
