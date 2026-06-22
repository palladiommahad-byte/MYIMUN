import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const FIELDS = ['name', 'abbr', 'capacity', 'topics', 'director', 'topicList', 'logoUrl', 'waiting'] as const;

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireStaff();
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of FIELDS) if (k in body) data[k] = body[k];
    if (typeof data.abbr === 'string') data.abbr = data.abbr.toUpperCase();
    const row = await prisma.committee.update({ where: { id }, data });
    return ok(row);
});

export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireStaff();
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    await prisma.committee.delete({ where: { id } });
    return ok({ deleted: id });
});
