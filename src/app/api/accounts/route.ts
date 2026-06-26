import { prisma } from '@/lib/prisma';
import { requirePage, publicUser } from '@/lib/auth';
import { ok, route } from '@/lib/api';

/** GET — staff with Accounts access list every delegate account for credential management. */
export const GET = route(async () => {
    await requirePage('/admin/accounts');
    const rows = await prisma.user.findMany({
        where: { role: 'delegate' },
        orderBy: { createdAt: 'desc' },
    });
    return ok(rows.map(publicUser));
});
