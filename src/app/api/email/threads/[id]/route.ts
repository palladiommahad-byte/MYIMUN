import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';

export const runtime = 'nodejs';

const patchSchema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('markRead') }),
    z.object({ action: z.literal('markUnread') }),
    z.object({ action: z.literal('setStatus'), status: z.enum(['open', 'resolved']) }),
]);

async function getThread(id: number) {
    return prisma.emailThread.findUnique({
        where: { id },
        include: { messages: { orderBy: { sentAt: 'asc' } } },
    });
}

export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/email');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const row = await getThread(id);
    if (!row) return fail('Email thread not found', 404);
    return ok(row);
});

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/email');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    const body = patchSchema.parse(await req.json());

    const data = body.action === 'markRead'
        ? { unread: false }
        : body.action === 'markUnread'
            ? { unread: true }
            : { status: body.status };

    const row = await prisma.emailThread.update({
        where: { id },
        data,
        include: { messages: { orderBy: { sentAt: 'asc' } } },
    });
    return ok(row);
});
