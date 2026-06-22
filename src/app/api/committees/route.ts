import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { ok, route } from '@/lib/api';

/** GET — public list of committees. */
export const GET = route(async () => {
    const rows = await prisma.committee.findMany({ orderBy: { id: 'asc' } });
    return ok(rows);
});

const schema = z.object({
    name: z.string().min(1),
    abbr: z.string().min(1),
    capacity: z.number().int().nonnegative().default(30),
    topics: z.number().int().nonnegative().default(2),
    director: z.string().default(''),
    topicList: z.array(z.string()).default([]),
    logoUrl: z.string().optional(),
});

/** POST — staff create a committee. */
export const POST = route(async (req: Request) => {
    await requireStaff();
    const data = schema.parse(await req.json());
    const row = await prisma.committee.create({
        data: { ...data, abbr: data.abbr.toUpperCase(), waiting: Math.floor(Math.random() * 16) + 6 },
    });
    return ok(row, 201);
});
