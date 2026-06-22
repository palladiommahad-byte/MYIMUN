import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const ALLOWED = ['payment', 'conference', 'landing'];

/** GET — public read of a site-config document (payment | conference | landing). */
export const GET = route(async (_req: Request, ctx: { params: Promise<{ key: string }> }) => {
    const { key } = await ctx.params;
    if (!ALLOWED.includes(key)) return fail('Unknown settings key', 404);
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return ok(row?.value ?? null);
});

/** PUT — staff replace a site-config document. */
export const PUT = route(async (req: Request, ctx: { params: Promise<{ key: string }> }) => {
    await requireStaff();
    const { key } = await ctx.params;
    if (!ALLOWED.includes(key)) return fail('Unknown settings key', 404);
    const value = await req.json();
    const row = await prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
    return ok(row.value);
});
