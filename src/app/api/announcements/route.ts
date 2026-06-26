import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, requirePage } from '@/lib/auth';
import { ok, route } from '@/lib/api';
import { broadcast } from '@/lib/events';

const STAFF = ['admin', 'secretary', 'manager'];

/** GET — staff see every broadcast; a delegate sees only the ones aimed at them
    ('all', plus 'paid' or 'unpaid' depending on their payment status). */
export const GET = route(async () => {
    const user = await requireUser();

    if (STAFF.includes(user.role)) {
        const rows = await prisma.announcement.findMany({ orderBy: { id: 'desc' } });
        return ok(rows);
    }

    const reg = await prisma.registration.findFirst({
        where: { delegateId: user.id }, select: { paymentStatus: true },
    });
    const isPaid = reg?.paymentStatus === 'Paid';
    const audiences = isPaid ? ['all', 'paid'] : ['all', 'unpaid'];
    const rows = await prisma.announcement.findMany({
        where: { audience: { in: audiences } }, orderBy: { id: 'desc' },
    });
    return ok(rows);
});

const schema = z.object({
    message: z.string().trim().min(1).max(1000),
    audience: z.enum(['all', 'paid', 'unpaid']).default('all'),
    level: z.enum(['info', 'urgent']).default('info'),
});

/** POST — staff broadcast a new announcement to a targeted delegate audience. */
export const POST = route(async (req: Request) => {
    await requirePage('/admin/announcements');
    const data = schema.parse(await req.json());
    const row = await prisma.announcement.create({ data });
    broadcast({ audience: 'everyone' }); // every connected delegate refetches and sees it instantly
    return ok(row, 201);
});
