import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { broadcast } from '@/lib/events';

const FIELDS = ['name', 'abbr', 'capacity', 'topics', 'director', 'topicList', 'logoUrl', 'waiting', 'visible', 'applicationState'] as const;

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/committees');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of FIELDS) if (k in body) data[k] = body[k];
    if (typeof data.abbr === 'string') data.abbr = data.abbr.toUpperCase();
    if (data.visible !== undefined && typeof data.visible !== 'boolean') return fail('Invalid visibility value', 422);
    if (data.applicationState !== undefined && !['open', 'closed', 'comingSoon'].includes(String(data.applicationState))) {
        return fail('Invalid committee application state', 422);
    }
    const row = await prisma.committee.update({ where: { id }, data });
    broadcast({ audience: 'everyone' });
    return ok(row);
});

export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/committees');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    await prisma.committee.delete({ where: { id } });
    broadcast({ audience: 'everyone' });
    return ok({ deleted: id });
});
