import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, route } from '@/lib/api';

export const runtime = 'nodejs';

export const GET = route(async () => {
    await requirePage('/admin/email');
    const rows = await prisma.registration.findMany({
        where: { delegateId: { not: '' } },
        orderBy: { fullName: 'asc' },
        select: {
            delegateId: true,
            fullName: true,
            email: true,
            country: true,
            paymentStatus: true,
            status: true,
        },
    });
    return ok(rows);
});
