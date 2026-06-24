import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { PKG_FIELDS } from '../route';

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/payments');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of PKG_FIELDS) if (k in body) data[k] = body[k];
    const row = await prisma.conferencePackage.update({ where: { id }, data });
    return ok(row);
});

export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/payments');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    await prisma.conferencePackage.delete({ where: { id } });
    return ok({ deleted: id });
});
