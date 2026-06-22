import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const schema = z.object({ status: z.enum(['Approved', 'Rejected']) });

/** PATCH — staff approve/reject a position paper. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireStaff();
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const { status } = schema.parse(await req.json());
    const row = await prisma.positionPaper.update({ where: { id }, data: { status } });
    return ok(row);
});
