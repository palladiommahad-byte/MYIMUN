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

/** POST — public. A locked-out delegate submits their email + phone; staff pick it up
    on the Accounts page and generate a new password for them. */
export const POST = route(async (req: Request) => {
    const { email, phone } = schema.parse(await req.json());

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
