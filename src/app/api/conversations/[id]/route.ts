import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasPageAccess } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyDelegate, notifyStaff } from '@/lib/notifications';

const schema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('message'), text: z.string().trim().min(1) }),
    z.object({ action: z.literal('markRead') }),
]);

/** PATCH — append a message, or mark the caller's side as read. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const convo = await prisma.conversation.findUnique({ where: { id } });
    if (!convo) return fail('Conversation not found', 404);
    const isStaff = hasPageAccess(user, '/admin/messages');
    if (!isStaff && convo.delegateId !== user.id) return fail('Forbidden', 403);

    const body = schema.parse(await req.json());

    if (body.action === 'markRead') {
        await prisma.conversation.update({
            where: { id },
            data: isStaff ? { adminUnread: 0 } : { delegateUnread: 0 },
        });
    } else {
        const sender = isStaff ? 'admin' : 'delegate';
        await prisma.$transaction([
            prisma.chatMessage.create({ data: { conversationId: id, text: body.text, sender } }),
            prisma.conversation.update({
                where: { id },
                data: {
                    lastMessageAt: new Date(),
                    adminUnread: sender === 'delegate' ? { increment: 1 } : undefined,
                    delegateUnread: sender === 'admin' ? { increment: 1 } : undefined,
                },
            }),
        ]);

        if (sender === 'admin' && convo.delegateId) {
            await notifyDelegate(convo.delegateId, {
                type: 'message_reply',
                title: 'New reply from the secretariat',
                message: `Re: "${convo.subject}" — ${body.text.slice(0, 80)}${body.text.length > 80 ? '…' : ''}`,
                link: '/dashboard/messages',
            });
        } else if (sender === 'delegate') {
            await notifyStaff({
                type: 'message_reply',
                title: 'New reply from delegate',
                message: `${convo.delegateName} replied to "${convo.subject}".`,
                link: '/admin/messages',
            });
        }
    }

    const row = await prisma.conversation.findUnique({ where: { id }, include: { messages: { orderBy: { id: 'asc' } } } });
    return ok(row);
});
