import { timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AuthError, createSession, getCurrentUser, hashPassword, publicUser, verifyPassword } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';

const schema = z.object({
    fullName: z.string().trim().min(2, 'Full name is too short').max(120).optional(),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(12, 'Choose a password with at least 12 characters').max(200),
    confirmPassword: z.string(),
    setupToken: z.string().min(1, 'Enter the initial setup token').max(500).optional(),
});

function hasValidSetupToken(value: string | undefined) {
    const expected = process.env.INITIAL_ADMIN_TOKEN;
    if (!expected || !value) return false;
    if (process.env.NODE_ENV === 'production' && (expected.length < 32 || /change-me|changeme|replace-me|example/i.test(expected))) {
        throw new Error('INITIAL_ADMIN_TOKEN is not securely configured');
    }
    const expectedBytes = Buffer.from(expected);
    const suppliedBytes = Buffer.from(value);
    return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

/**
 * Creates the first administrator only when the private setup token is supplied.
 * It also retains the credential-change flow for installations created by older
 * releases, so upgrading does not lock out an existing bootstrap administrator.
 */
export const POST = route(async (req: Request) => {
    const body = schema.parse(await req.json());
    if (body.password !== body.confirmPassword) return fail('Passwords do not match');

    const currentUser = await getCurrentUser();
    if (currentUser?.role === 'admin' && currentUser.mustChangeCredentials) {
        if (body.email === currentUser.email.toLowerCase()) return fail('Choose a new email address');
        if (await verifyPassword(body.password, currentUser.passwordHash)) return fail('Choose a new password');
        const existing = await prisma.user.findUnique({ where: { email: body.email } });
        if (existing && existing.id !== currentUser.id) return fail('An account with this email already exists', 409);

        const updated = await prisma.user.update({
            where: { id: currentUser.id },
            data: { email: body.email, passwordHash: await hashPassword(body.password), mustChangeCredentials: false },
        });
        await createSession(updated);
        return ok(publicUser(updated));
    }

    if (currentUser) return fail('Initial setup is only available while no administrator exists', 403);
    if (!hasValidSetupToken(body.setupToken)) return fail('The initial setup token is invalid', 403);
    if (!body.fullName) return fail('Full name is required', 422);

    try {
        const user = await prisma.$transaction(async tx => {
            const adminCount = await tx.user.count({ where: { role: 'admin' } });
            if (adminCount > 0) throw new AuthError(403, 'An administrator already exists. Sign in instead.');

            // A unique database lock makes competing first-setup requests fail closed.
            await tx.appSetting.create({
                data: { key: 'system:initial-setup', value: { completedAt: new Date().toISOString() } },
            });
            return tx.user.create({
                data: { email: body.email, fullName: body.fullName, passwordHash: await hashPassword(body.password), role: 'admin' },
            });
        });
        await createSession(user);
        return ok(publicUser(user), 201);
    } catch (error) {
        if (error instanceof AuthError) return fail(error.message, error.status);
        // The lock is unique. Do not disclose setup details after another request wins the race.
        return fail('Initial setup is no longer available. Sign in with the administrator account.', 409);
    }
});
