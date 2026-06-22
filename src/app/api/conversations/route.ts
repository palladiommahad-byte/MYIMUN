import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];

/** GET — staff see all conversations; delegates see their own (with messages). */
export const GET = route(async () => {
    const user = await requireUser();
    const where = STAFF.includes(user.role) ? {} : { delegateId: user.id };
    const rows = await prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        include: { messages: { orderBy: { id: 'asc' } } },
    });
    return ok(rows);
});

const schema = z.object({
    subject: z.string().trim().min(1),
    category: z.string().trim().min(1),
    firstMessage: z.string().trim().min(1),
});

/** POST — a delegate opens a new support conversation. */
export const POST = route(async (req: Request) => {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const row = await prisma.conversation.create({
        data: {
            delegateId: user.id,
            delegateName: user.fullName,
            delegateEmail: user.email,
            delegateCountry: user.country ?? '',
            subject: body.subject,
            category: body.category,
            adminUnread: 1,
            delegateUnread: 0,
            messages: { create: { text: body.firstMessage, sender: 'delegate' } },
        },
        include: { messages: true },
    });
    return ok(row, 201);
});
