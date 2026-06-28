import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasPageAccess } from '@/lib/auth';
import { ok, route } from '@/lib/api';
import { notifyStaff } from '@/lib/notifications';

/** GET — staff with Accounts access see all reset requests; everyone else gets an empty list
    (so the delegate-side context can poll without 403 noise). */
export const GET = route(async () => {
    const user = await requireUser();
    if (!hasPageAccess(user, '/admin/accounts')) return ok([]);
    const rows = await prisma.passwordResetRequest.findMany({ orderBy: { id: 'desc' } });
    return ok(rows);
});

const schema = z.object({
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(3),
});

// Collapse repeat submissions: ignore a new request if the same email already has a
// pending one from the last 10 minutes. Stops a public endpoint from being used to
// flood the DB / spam staff notifications, without needing any rate-limit infra.
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

/** POST — public. A locked-out delegate submits their email + phone; staff pick it up
    on the Accounts page and generate a new password for them. */
export const POST = route(async (req: Request) => {
    const { email, phone } = schema.parse(await req.json());

    const recent = await prisma.passwordResetRequest.findFirst({
        where: { email, status: 'pending', createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } },
        select: { id: true },
    });
    // Always report success so the endpoint can't be used to probe which emails exist.
    if (recent) return ok({ id: recent.id }, 201);

    // Match an existing delegate so staff can act in one click; still log unmatched requests.
    const delegate = await prisma.user.findFirst({ where: { email, role: 'delegate' } });

    const row = await prisma.passwordResetRequest.create({
        data: { email, phone, userId: delegate?.id ?? null, delegateName: delegate?.fullName ?? null },
    });

    await notifyStaff({
        type: 'password_reset_requested',
        title: 'Password reset requested',
        message: `${delegate?.fullName ?? email} requested a password reset.`,
        link: '/admin/accounts',
    });

    return ok({ id: row.id }, 201);
});
