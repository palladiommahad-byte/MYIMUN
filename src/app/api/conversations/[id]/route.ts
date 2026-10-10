import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasPageAccess } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { appendMessage, broadcastChatChange, canAccess, loadConversation, serializeConversation } from '@/lib/chat';

const schema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('message'), text: z.string().trim().min(1).max(5000) }),
    z.object({ action: z.literal('markRead') }),
    z.object({ action: z.literal('rename'), title: z.string().trim().min(1).max(120) }),
    z.object({ action: z.literal('addMembers'), memberIds: z.array(z.string().min(1)).min(1) }),
    z.object({ action: z.literal('removeMember'), delegateId: z.string().min(1) }),
]);

type Ctx = { params: Promise<{ id: string }> };

/** PATCH — send a message, mark the caller's side read, or (staff) manage a group chat. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
    const user = await requireUser();
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const convo = await loadConversation(id);
    if (!convo) return fail('Conversation not found', 404);
    const isStaff = hasPageAccess(user, '/admin/messages');
    if (!canAccess(convo, user, isStaff)) return fail('Forbidden', 403);

    const body = schema.parse(await req.json());
    const memberIds = convo.members.map(m => m.delegateId);

    if (body.action === 'message') {
        await appendMessage(id, body.text, user, isStaff);
    } else if (body.action === 'markRead') {
        if (isStaff) await prisma.conversation.update({ where: { id }, data: { adminUnread: 0 } });
        else if (convo.type === 'group') await prisma.conversationMember.updateMany({ where: { conversationId: id, delegateId: user.id }, data: { unread: 0 } });
        else await prisma.conversation.update({ where: { id }, data: { delegateUnread: 0 } });
    } else {
        if (!isStaff) return fail('Forbidden', 403);
        if (convo.type !== 'group') return fail('Only group chats can be managed.', 400);

        if (body.action === 'rename') {
            await prisma.conversation.update({ where: { id }, data: { title: body.title } });
            broadcastChatChange(memberIds);
        } else if (body.action === 'addMembers') {
            const delegates = await prisma.user.findMany({
                where: { id: { in: body.memberIds.filter(m => !memberIds.includes(m)) }, role: 'delegate' },
                select: { id: true },
            });
            if (delegates.length > 0) {
                await prisma.conversationMember.createMany({ data: delegates.map(d => ({ conversationId: id, delegateId: d.id })) });
            }
            broadcastChatChange([...memberIds, ...delegates.map(d => d.id)]);
        } else {
            await prisma.conversationMember.deleteMany({ where: { conversationId: id, delegateId: body.delegateId } });
            broadcastChatChange(memberIds);
        }
    }

    return ok(serializeConversation((await loadConversation(id))!, user, isStaff));
});

/** DELETE — staff remove a chat and its history. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
    const user = await requireUser();
    if (!hasPageAccess(user, '/admin/messages')) return fail('Forbidden', 403);
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);

    const convo = await loadConversation(id);
    if (!convo) return fail('Conversation not found', 404);
    await prisma.conversation.delete({ where: { id } });
    broadcastChatChange(convo.type === 'group' ? convo.members.map(m => m.delegateId) : convo.delegateId ? [convo.delegateId] : []);
    return ok({ id });
});
