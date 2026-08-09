import { z } from 'zod';
import { getSession, requirePage } from '@/lib/auth';
import { ok, route } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { getPresence, getPresenceSnapshot, removePresence, touchPresence } from '@/lib/presence';

export const dynamic = 'force-dynamic';

const heartbeatSchema = z.object({
    clientId: z.string().trim().min(16).max(100),
    path: z.string().trim().min(1).max(300).refine(path => path.startsWith('/')),
    offline: z.boolean().optional(),
});

function deviceFromUserAgent(userAgent: string) {
    if (/ipad|tablet/i.test(userAgent)) return 'Tablet' as const;
    if (/mobile|android|iphone/i.test(userAgent)) return 'Mobile' as const;
    return 'Desktop' as const;
}

export const POST = route(async (req: Request) => {
    const body = heartbeatSchema.parse(await req.json());
    if (body.offline) {
        removePresence(body.clientId);
        return ok({ active: false });
    }

    const session = await getSession();
    const existing = getPresence(body.clientId);
    let name = 'Visitor';
    let role = 'guest';

    if (session) {
        role = session.role;
        if (existing?.userId === session.userId) {
            name = existing.name;
        } else {
            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: { fullName: true },
            });
            name = user?.fullName || 'Signed-in user';
        }
    }

    touchPresence({
        clientId: body.clientId,
        userId: session?.userId ?? null,
        name,
        role,
        path: body.path,
        device: deviceFromUserAgent(req.headers.get('user-agent') || ''),
    });

    return ok({ active: true });
});

export const GET = route(async () => {
    await requirePage('/admin/live-users');
    return ok(getPresenceSnapshot());
});
