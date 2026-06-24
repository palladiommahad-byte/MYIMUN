import 'server-only';
import { prisma } from './prisma';
import { broadcast } from './events';

/** Fired whenever a delegate does something staff should know about (register,
    pay, submit a paper, apply to a committee, message support). Shared across
    every admin/secretary/manager account. */
export async function notifyStaff(input: { type: string; title: string; message: string; link?: string }) {
    const n = await prisma.notification.create({
        data: { audience: 'staff', type: input.type, title: input.title, message: input.message, link: input.link },
    });
    broadcast({ audience: 'staff' });
    return n;
}

/** Fired whenever staff act on a delegate's submission (accept/decline, approve/reject,
    assign a country, reply to a conversation). Private to that one delegate. */
export async function notifyDelegate(recipientId: string, input: { type: string; title: string; message: string; link?: string }) {
    const n = await prisma.notification.create({
        data: { audience: 'delegate', recipientId, type: input.type, title: input.title, message: input.message, link: input.link },
    });
    broadcast({ audience: 'delegate', recipientId });
    return n;
}
