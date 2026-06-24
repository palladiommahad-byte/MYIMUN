import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyDelegate } from '@/lib/notifications';

const schema = z.object({ status: z.enum(['Approved', 'Rejected']) });

/** PATCH — staff approve/reject a position paper. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/papers');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const { status } = schema.parse(await req.json());
    const existing = await prisma.positionPaper.findUnique({ where: { id } });
    if (!existing) return fail('Position paper not found', 404);
    const row = await prisma.positionPaper.update({ where: { id }, data: { status } });

    await notifyDelegate(existing.delegateId, status === 'Approved' ? {
        type: 'paper_approved',
        title: 'Position paper approved',
        message: `Your position paper for ${existing.committee} has been approved.`,
        link: '/dashboard/papers',
    } : {
        type: 'paper_rejected',
        title: 'Position paper rejected',
        message: `Your position paper for ${existing.committee} was rejected. Please revise and resubmit.`,
        link: '/dashboard/papers',
    });

    return ok(row);
});
