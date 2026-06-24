import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];

/** GET — staff see the shared staff feed; delegates see their own private feed. */
export const GET = route(async () => {
    const user = await requireUser();
    const where = STAFF.includes(user.role)
        ? { audience: 'staff' }
        : { audience: 'delegate', recipientId: user.id };
    const rows = await prisma.notification.findMany({ where, orderBy: { id: 'desc' }, take: 100 });
    return ok(rows);
});

const schema = z.object({ action: z.literal('markAllRead') });

/** PATCH — mark every notification in the caller's feed as read. */
export const PATCH = route(async (req: Request) => {
    const user = await requireUser();
    schema.parse(await req.json());
    const where = STAFF.includes(user.role)
        ? { audience: 'staff', read: false }
        : { audience: 'delegate', recipientId: user.id, read: false };
    await prisma.notification.updateMany({ where, data: { read: true } });
    return ok({ done: true });
});
