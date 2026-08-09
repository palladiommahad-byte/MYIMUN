import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasPageAccess } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';
import { notifyDelegate, notifyStaff } from '@/lib/notifications';

/** GET — staff with Messages access see all conversations; delegates see their own (with messages). */
export const GET = route(async () => {
    const user = await requireUser();
    const where = hasPageAccess(user, '/admin/messages') ? {} : { delegateId: user.id };
    const rows = await prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        include: { messages: { orderBy: { id: 'asc' } } },
    });
    return ok(rows);
});

const schema = z.object({
    delegateId: z.string().optional(),
    subject: z.string().trim().min(1),
    category: z.string().trim().min(1),
    firstMessage: z.string().trim().min(1),
});

/** POST — delegates open support conversations; staff can start direct delegate threads. */
export const POST = route(async (req: Request) => {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const isStaff = hasPageAccess(user, '/admin/messages');
    const registration = isStaff
        ? body.delegateId
            ? await prisma.registration.findUnique({ where: { delegateId: body.delegateId } })
            : null
        : null;

    if (isStaff && !registration) {
        return fail('Please choose a registered delegate.', 400);
    }

    const delegate = isStaff
        ? {
            id: registration!.delegateId,
            name: registration!.fullName,
            email: registration!.email,
            country: registration!.country,
        }
        : {
            id: user.id,
            name: user.fullName,
            email: user.email,
            country: user.country ?? '',
        };
    const sender = isStaff ? 'admin' : 'delegate';

    const row = await prisma.conversation.create({
        data: {
            delegateId: delegate.id,
            delegateName: delegate.name,
            delegateEmail: delegate.email,
            delegateCountry: delegate.country,
            subject: body.subject,
            category: body.category,
            adminUnread: isStaff ? 0 : 1,
            delegateUnread: isStaff ? 1 : 0,
            messages: { create: { text: body.firstMessage, sender } },
        },
        include: { messages: { orderBy: { id: 'asc' } } },
    });

    if (isStaff) {
        await notifyDelegate(delegate.id, {
            type: 'message_received',
            title: 'New message from the secretariat',
            message: `${body.subject}: ${body.firstMessage.slice(0, 80)}${body.firstMessage.length > 80 ? '...' : ''}`,
            link: '/dashboard/messages',
        });
    } else {
        await notifyStaff({
            type: 'message_received',
            title: 'New support message',
            message: `${user.fullName} sent a message: "${body.subject}"`,
            link: '/admin/messages',
        });
        await notifyDelegate(user.id, {
            type: 'message_sent',
            title: 'Message sent',
            message: `Your message about "${body.subject}" was sent to the secretariat.`,
            link: '/dashboard/messages',
        });
    }

    return ok(row, 201);
});
