import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, publicUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { notifyStaff } from '@/lib/notifications';

const schema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(true),
});

const MAX_FAILED_LOGINS = 4;
const TEMP_LOCK_MS = 5 * 60 * 1000;
const ACCESS_REVIEW_PHONE = 'Automatic security lockout';

function remainingMinutes(until: Date) {
    return Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000));
}

async function createAccessReviewRequest(user: { id: string; email: string; fullName: string }) {
    const pending = await prisma.passwordResetRequest.findFirst({
        where: { email: user.email, status: 'pending' },
        select: { id: true },
    });
    if (pending) return;

    await prisma.passwordResetRequest.create({
        data: {
            email: user.email,
            phone: ACCESS_REVIEW_PHONE,
            userId: user.id,
            delegateName: user.fullName,
        },
    });

    await notifyStaff({
        type: 'access_review_requested',
        title: 'Delegate access review required',
        message: `${user.fullName} was locked after repeated failed login attempts.`,
        link: '/admin/accounts',
    });
}

async function failDelegateLogin(user: Awaited<ReturnType<typeof prisma.user.findUnique>>) {
    if (!user || user.role !== 'delegate') return fail('Invalid email or password', 401);

    if (user.accessReviewRequired) {
        await createAccessReviewRequest(user);
        return fail('Access is locked. Request access from the secretariat so they can reset your email or password.', 423);
    }

    if (user.loginLockUntil && user.loginLockUntil > new Date()) {
        return fail(`Too many failed attempts. Try again in ${remainingMinutes(user.loginLockUntil)} minute(s).`, 429);
    }

    const attempts = user.failedLoginAttempts + 1;
    if (attempts < MAX_FAILED_LOGINS) {
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: attempts, loginLockUntil: null },
        });
        return fail(`Invalid email or password. ${MAX_FAILED_LOGINS - attempts} attempt(s) left before a temporary lock.`, 401);
    }

    if (user.loginLockLevel >= 1) {
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, loginLockUntil: null, accessReviewRequired: true },
        });
        await createAccessReviewRequest(user);
        return fail('Access is locked after repeated failed attempts. Request access from the secretariat so they can reset your email or password.', 423);
    }

    const lockUntil = new Date(Date.now() + TEMP_LOCK_MS);
    await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, loginLockUntil: lockUntil, loginLockLevel: 1 },
    });
    return fail('Too many failed attempts. Login is locked for 5 minutes.', 429);
}

export const POST = route(async (req: Request) => {
    const body = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (user?.role === 'delegate') {
        if (user.accessReviewRequired) {
            await createAccessReviewRequest(user);
            return fail('Access is locked. Request access from the secretariat so they can reset your email or password.', 423);
        }
        if (user.loginLockUntil && user.loginLockUntil > new Date()) {
            return fail(`Too many failed attempts. Try again in ${remainingMinutes(user.loginLockUntil)} minute(s).`, 429);
        }
    }

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
        return failDelegateLogin(user);
    }
    if (user.status === 'inactive') return fail('This account is disabled', 403);

    if (user.role === 'delegate' && (user.failedLoginAttempts || user.loginLockUntil || user.loginLockLevel || user.accessReviewRequired)) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                loginLockUntil: null,
                loginLockLevel: 0,
                accessReviewRequired: false,
            },
        });
    }

    await createSession(user, body.rememberMe);
    return ok(publicUser(user));
});
