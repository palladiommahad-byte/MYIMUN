import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, route } from '@/lib/api';

export const SCHED_FIELDS = ['day', 'date', 'time', 'title', 'location', 'type', 'description'] as const;

/** GET — public schedule rows. */
export const GET = route(async () => {
    const rows = await prisma.scheduleEvent.findMany({ orderBy: { id: 'asc' } });
    return ok(rows);
});

/** POST — staff add a schedule row. */
export const POST = route(async (req: Request) => {
    await requirePage('/admin/schedule');
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of SCHED_FIELDS) if (k in body) data[k] = body[k];
    const row = await prisma.scheduleEvent.create({ data: data as never });
    return ok(row, 201);
});
