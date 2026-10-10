import 'server-only';
import { prisma } from './prisma';
import { broadcast } from './events';
import { notifyDelegate, notifyStaff } from './notifications';

type Viewer = { id: string; fullName: string };

export const conversationInclude = {
    messages: { orderBy: { id: 'asc' as const } },
    members: {
        orderBy: { joinedAt: 'asc' as const },
        include: { delegate: { select: { fullName: true, email: true, country: true } } },
    },
};

type ConversationRow = NonNullable<Awaited<ReturnType<typeof loadConversation>>>;

export function loadConversation(id: number) {
    return prisma.conversation.findUnique({ where: { id }, include: conversationInclude });
}

/** Shape a conversation for the caller. Delegates get their own unread count for
    group chats and only the names of fellow members (no emails). */
export function serializeConversation(row: ConversationRow, viewer: Viewer, isStaff: boolean) {
    const members = row.members.map(m => ({
        delegateId: m.delegateId,
        name: m.delegate.fullName,
        email: isStaff ? m.delegate.email : '',
        country: m.delegate.country ?? '',
    }));
    const delegateUnread = row.type === 'group'
        ? row.members.find(m => m.delegateId === viewer.id)?.unread ?? 0
        : row.delegateUnread;
    return { ...row, members, delegateUnread };
}

/** Delegates may open a chat when it is their direct chat or a group they belong to. */
export function canAccess(row: ConversationRow, viewer: Viewer, isStaff: boolean) {
    if (isStaff) return true;
    if (row.type === 'group') return row.members.some(m => m.delegateId === viewer.id);
    return row.delegateId === viewer.id;
}

/** Find (or create) the single direct chat for a delegate. */
export async function getOrCreateDirectChat(delegate: { id: string; name: string; email: string; country: string }) {
    const existing = await prisma.conversation.findUnique({ where: { directKey: delegate.id } });
    if (existing) return existing;
    try {
        return await prisma.conversation.create({
            data: {
                type: 'direct', directKey: delegate.id, delegateId: delegate.id,
                delegateName: delegate.name, delegateEmail: delegate.email, delegateCountry: delegate.country,
                subject: '', category: '',
            },
        });
    } catch {
        // Lost a race with a concurrent create — the unique directKey row exists now.
        return prisma.conversation.findUniqueOrThrow({ where: { directKey: delegate.id } });
    }
}

const preview = (text: string) => (text.length > 80 ? `${text.slice(0, 80)}…` : text);

/** Append a message, bump unread counters for everyone else in the chat, and push a
    live update. A bell notification is only raised for the first unread message in a
    burst, so an active chat does not flood the notification center. */
export async function appendMessage(conversationId: number, text: string, viewer: Viewer, isStaff: boolean) {
    const convo = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId }, include: { members: true } });
    const sender = isStaff ? 'admin' : 'delegate';
    const isGroup = convo.type === 'group';
    const otherMembers = convo.members.filter(m => m.delegateId !== viewer.id);

    await prisma.$transaction([
        prisma.chatMessage.create({ data: { conversationId, text, sender, senderId: viewer.id, senderName: viewer.fullName } }),
        prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: new Date(),
                adminUnread: isStaff ? undefined : { increment: 1 },
                delegateUnread: isStaff && !isGroup ? { increment: 1 } : undefined,
            },
        }),
        ...(isGroup
            ? [prisma.conversationMember.updateMany({
                where: { conversationId, delegateId: { in: otherMembers.map(m => m.delegateId) } },
                data: { unread: { increment: 1 } },
            })]
            : []),
    ]);

    // Staff side
    if (!isStaff) {
        if (convo.adminUnread === 0) {
            await notifyStaff({
                type: 'message_received',
                title: isGroup ? `New message in ${convo.title}` : 'New message from delegate',
                message: `${viewer.fullName}: ${preview(text)}`,
                link: '/admin/messages',
            });
        } else {
            broadcast({ audience: 'staff', kind: 'messages' });
        }
    } else {
        broadcast({ audience: 'staff', kind: 'messages' });
    }

    // Delegate side
    const recipients = isGroup
        ? otherMembers.map(m => ({ id: m.delegateId, unread: m.unread }))
        : isStaff && convo.delegateId ? [{ id: convo.delegateId, unread: convo.delegateUnread }] : [];
    await Promise.all(recipients.map(r => r.unread === 0
        ? notifyDelegate(r.id, {
            type: 'message_received',
            title: isGroup ? `New message in ${convo.title}` : 'New message from the secretariat',
            message: `${isStaff ? 'Secretariat' : viewer.fullName}: ${preview(text)}`,
            link: '/dashboard/messages',
        })
        : Promise.resolve(broadcast({ audience: 'delegate', recipientId: r.id, kind: 'messages' }))));

    // The sending delegate's other tabs/devices should also see the message right away.
    if (!isStaff) broadcast({ audience: 'delegate', recipientId: viewer.id, kind: 'messages' });
}

/** Tell every member of a chat (and staff) that it changed, without a bell notification. */
export function broadcastChatChange(delegateIds: string[]) {
    broadcast({ audience: 'staff', kind: 'messages' });
    for (const id of delegateIds) broadcast({ audience: 'delegate', recipientId: id, kind: 'messages' });
}
