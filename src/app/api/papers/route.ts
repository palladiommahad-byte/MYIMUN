import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];

export const GET = route(async () => {
    const user = await requireUser();
    const where = STAFF.includes(user.role) ? {} : { delegateId: user.id };
    const rows = await prisma.positionPaper.findMany({ where, orderBy: { id: 'desc' } });
    return ok(rows);
});

const schema = z.object({
    delegateName: z.string().trim().min(1),
    committee: z.string().trim().min(1),
    country: z.string().trim().min(1),
    fileName: z.string().min(1),
    fileKey: z.string().optional(),
    fileSize: z.number().optional(),
});

/** POST — submit or replace a position paper (one per delegate per committee). */
export const POST = route(async (req: Request) => {
    const user = await requireUser();
    const data = schema.parse(await req.json());

    const row = await prisma.positionPaper.upsert({
        where: { delegateId_committee: { delegateId: user.id, committee: data.committee } },
        update: { ...data, status: 'Pending' },
        create: { ...data, delegateId: user.id },
    });
    return ok(row, 201);
});
