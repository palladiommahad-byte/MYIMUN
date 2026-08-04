import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requirePage } from '@/lib/auth';
import { ok, route } from '@/lib/api';
import { broadcast } from '@/lib/events';

/** GET — public list of committees. */
export const GET = route(async () => {
    const user = await getCurrentUser();
    const isStaff = !!user && ['admin', 'secretary', 'manager'].includes(user.role);
    const where = isStaff ? {} : { visible: true };
    const [rows, approvedCounts] = await Promise.all([
        prisma.committee.findMany({ where, orderBy: { id: 'asc' } }),
        prisma.committeeApplication.groupBy({
            by: ['committeeAbbr'],
            where: { status: 'Approved' },
            _count: { _all: true },
        }),
    ]);
    const approvedByCommittee = new Map(approvedCounts.map(item => [item.committeeAbbr, item._count._all]));
    return ok(rows.map(row => ({
        ...row,
        // Only the aggregate is public. Delegate identities remain private.
        approvedDelegates: approvedByCommittee.get(row.abbr) ?? 0,
    })));
});

const schema = z.object({
    name: z.string().min(1),
    abbr: z.string().min(1),
    capacity: z.number().int().nonnegative().default(30),
    topics: z.number().int().nonnegative().default(2),
    director: z.string().default(''),
    topicList: z.array(z.string()).default([]),
    logoUrl: z.string().optional(),
    visible: z.boolean().default(true),
    applicationState: z.enum(['open', 'closed', 'comingSoon']).default('open'),
});

/** POST — staff create a committee. */
export const POST = route(async (req: Request) => {
    await requirePage('/admin/committees');
    const data = schema.parse(await req.json());
    const row = await prisma.committee.create({
        data: { ...data, abbr: data.abbr.toUpperCase(), waiting: 0 },
    });
    broadcast({ audience: 'everyone' });
    return ok(row, 201);
});
