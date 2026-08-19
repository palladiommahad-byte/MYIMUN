import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePage, publicUser, hashPassword } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyDelegate } from '@/lib/notifications';
import { sendDelegateCredentialEmail } from '@/lib/credentialEmail';

const schema = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('resetPassword'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
        emailCredentials: z.boolean().optional().default(false),
    }),
    z.object({ action: z.literal('updateEmail'), email: z.string().trim().toLowerCase().email() }),
    z.object({ action: z.literal('setStatus'), status: z.enum(['active', 'inactive']) }),
]);

export const runtime = 'nodejs';

/** PATCH — staff manage a delegate account: reset password, change email, or suspend/restore. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/accounts');
    const { id } = await ctx.params;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== 'delegate') return fail('Delegate account not found', 404);

    const body = schema.parse(await req.json());

    if (body.action === 'updateEmail' && body.email !== target.email) {
        const existing = await prisma.user.findUnique({ where: { email: body.email } });
        if (existing) return fail('A user with that email already exists', 409);
    }

    const data =
        body.action === 'resetPassword' ? {
            passwordHash: await hashPassword(body.newPassword),
            failedLoginAttempts: 0,
            loginLockUntil: null,
            loginLockLevel: 0,
            accessReviewRequired: false,
        }
        : body.action === 'updateEmail' ? {
            email: body.email,
            failedLoginAttempts: 0,
            loginLockUntil: null,
            loginLockLevel: 0,
            accessReviewRequired: false,
        }
        : { status: body.status };

    const row = await prisma.user.update({ where: { id }, data });
    let credentialEmailSent = false;
    let credentialEmailError: string | null = null;

    if (body.action === 'setStatus') {
        await notifyDelegate(id, body.status === 'inactive' ? {
            type: 'account_suspended',
            title: 'Account suspended',
            message: 'Your account access has been suspended by an organizer.',
        } : {
            type: 'account_restored',
            title: 'Account restored',
            message: 'Your account access has been restored. You can log in again.',
            link: '/dashboard',
        });
    } else if (body.action === 'updateEmail') {
        await notifyDelegate(id, {
            type: 'account_email_changed',
            title: 'Login email updated',
            message: `An organizer updated your login email to ${body.email}.`,
            link: '/dashboard',
        });
    } else if (body.action === 'resetPassword') {
        if (body.emailCredentials) {
            try {
                await sendDelegateCredentialEmail({
                    fullName: row.fullName,
                    email: row.email,
                    password: body.newPassword,
                });
                credentialEmailSent = true;
            } catch (error) {
                credentialEmailError = error instanceof Error ? error.message : 'Could not send credentials email';
            }
        }
    }

    return ok({ ...publicUser(row), credentialEmailSent, credentialEmailError });
});
