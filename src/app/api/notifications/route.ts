import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/api';
import type { Prisma } from '@prisma/client';

const STAFF = ['admin', 'secretary', 'manager'];

function notificationWhere(user: { id: string; role: string }): Prisma.NotificationWhereInput {
    if (user.role === 'admin') {
        return { OR: [{ audience: 'staff' }, { audience: 'admin' }] };
    }
    if (STAFF.includes(user.role)) {
        // This also hides payment alerts created before the admin-only feed existed.
        return { audience: 'staff', NOT: { type: { startsWith: 'payment' } } };
    }
    return { audience: 'delegate', recipientId: user.id };
}

/** GET — admins see staff + sensitive admin alerts; other staff never see payments. */
export const GET = route(async () => {
    const user = await requireUser();
    const where = notificationWhere(user);
    const rows = await prisma.notification.findMany({ where, orderBy: { id: 'desc' }, take: 100 });
    return ok(rows);
});

const schema = z.object({ action: z.literal('markAllRead') });

/** PATCH — mark every notification in the caller's feed as read. */
export const PATCH = route(async (req: Request) => {
    const user = await requireUser();
    schema.parse(await req.json());
    const where = { ...notificationWhere(user), read: false };
    await prisma.notification.updateMany({ where, data: { read: true } });
    return ok({ done: true });
});
