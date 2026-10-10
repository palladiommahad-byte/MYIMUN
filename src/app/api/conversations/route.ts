import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasPageAccess } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';
import { appendMessage, broadcastChatChange, conversationInclude, getOrCreateDirectChat, loadConversation, serializeConversation } from '@/lib/chat';

/** GET — staff with Messages access see every chat; delegates see their direct chat
    with the secretariat plus the group chats they were added to. */
export const GET = route(async () => {
    const user = await requireUser();
    const isStaff = hasPageAccess(user, '/admin/messages');
    const where = isStaff
        ? {}
        : { OR: [{ type: 'direct', delegateId: user.id }, { type: 'group', members: { some: { delegateId: user.id } } }] };
    const rows = await prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        include: conversationInclude,
    });
    return ok(rows.map(row => serializeConversation(row, user, isStaff)));
});

const text = z.string().trim().min(1).max(5000);
const delegateSchema = z.object({ text });
const staffSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('direct'), delegateId: z.string().min(1), text: text.optional() }),
    z.object({ type: z.literal('group'), title: z.string().trim().min(1).max(120), memberIds: z.array(z.string().min(1)).min(1), text: text.optional() }),
]);

/** POST — delegates message the secretariat (always into their one direct chat).
    Staff open a direct chat with a delegate, or create a group chat. */
export const POST = route(async (req: Request) => {
    const user = await requireUser();
    const isStaff = hasPageAccess(user, '/admin/messages');
    const raw = await req.json();

    if (!isStaff) {
        const body = delegateSchema.parse(raw);
        const chat = await getOrCreateDirectChat({ id: user.id, name: user.fullName, email: user.email, country: user.country ?? '' });
        await appendMessage(chat.id, body.text, user, false);
        return ok(serializeConversation((await loadConversation(chat.id))!, user, false), 201);
    }

    const body = staffSchema.parse(raw);

    if (body.type === 'direct') {
        const delegate = await prisma.user.findFirst({ where: { id: body.delegateId, role: 'delegate' } });
        if (!delegate) return fail('Please choose a delegate.', 400);
        const chat = await getOrCreateDirectChat({ id: delegate.id, name: delegate.fullName, email: delegate.email, country: delegate.country ?? '' });
        if (body.text) await appendMessage(chat.id, body.text, user, true);
        return ok(serializeConversation((await loadConversation(chat.id))!, user, true), 201);
    }

    const delegates = await prisma.user.findMany({ where: { id: { in: body.memberIds }, role: 'delegate' }, select: { id: true } });
    if (delegates.length === 0) return fail('Add at least one delegate to the group.', 400);

    const chat = await prisma.conversation.create({
        data: {
            type: 'group', title: body.title,
            delegateName: '', delegateEmail: '', delegateCountry: '', subject: '', category: '',
            members: { create: delegates.map(d => ({ delegateId: d.id })) },
        },
    });
    if (body.text) await appendMessage(chat.id, body.text, user, true);
    else broadcastChatChange(delegates.map(d => d.id));

    return ok(serializeConversation((await loadConversation(chat.id))!, user, true), 201);
});
