import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasPageAccess } from '@/lib/auth';
import { ok, route } from '@/lib/api';
import { notifyStaff } from '@/lib/notifications';

/** GET — staff with Registrations access see all; delegates see their own. */
export const GET = route(async () => {
    const user = await requireUser();
    const where = hasPageAccess(user, '/admin/registration') ? {} : { delegateId: user.id };
    const rows = await prisma.registration.findMany({
        where, orderBy: { id: 'desc' },
        include: { delegate: { select: { status: true } } },
    });
    const data = rows.map(({ delegate, ...r }) => ({ ...r, accountStatus: delegate?.status ?? 'active' }));
    return ok(data);
});

const schema = z.object({
    fullName: z.string().trim().min(2),
    email: z.string().trim().email(),
    phone: z.string().trim().min(3),
    address: z.string().trim().min(2),
    country: z.string().trim().min(2),
    heardFrom: z.string().trim().min(1),
    firstTimeMun: z.boolean(),
    attendedMyimunBefore: z.boolean(),
    motivation: z.string().trim().min(1),
    idDocName: z.string().optional(),
    idDocSize: z.number().optional(),
    idDocType: z.string().optional(),
    idDocKey: z.string().optional(),
    type: z.enum(['Individual', 'Group']).default('Individual'),
    groupName: z.string().optional(),
    groupSize: z.number().optional(),
    institution: z.string().optional(),
});

/** POST — a delegate submits (or re-submits) their registration. */
export const POST = route(async (req: Request) => {
    const user = await requireUser();
    const data = schema.parse(await req.json());

    const row = await prisma.registration.upsert({
        where: { delegateId: user.id },
        // Re-applying resets the review back to Pending (matches the old client behaviour).
        update: { ...data, status: 'Pending', declineReason: null },
        create: { ...data, delegateId: user.id },
    });

    await notifyStaff({
        type: 'registration_submitted',
        title: 'New registration',
        message: `${data.fullName} submitted a registration for review.`,
        link: '/admin/registration',
    });

    return ok(row, 201);
});
