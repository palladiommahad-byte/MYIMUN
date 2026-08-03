import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, publicUser, requireAdmin, verifyPassword } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';

const schema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').optional(),
    newPassword: z.string().min(12, 'New password must be at least 12 characters').max(200).optional(),
    confirmPassword: z.string().optional(),
}).superRefine((body, ctx) => {
    if (!body.email && !body.newPassword) {
        ctx.addIssue({ code: 'custom', message: 'Enter a new email or password' });
    }
    if (body.newPassword && body.newPassword !== body.confirmPassword) {
        ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' });
    }
});

/** Update the signed-in administrator's own login credentials. */
export const PATCH = route(async (req: Request) => {
    const admin = await requireAdmin();
    const body = schema.parse(await req.json());

    if (!(await verifyPassword(body.currentPassword, admin.passwordHash))) {
        return fail('Current password is incorrect', 401);
    }

    const data: { email?: string; passwordHash?: string } = {};

    if (body.email && body.email !== admin.email) {
        const existing = await prisma.user.findUnique({ where: { email: body.email } });
        if (existing) return fail('A user with that email already exists', 409);
        data.email = body.email;
    }

    if (body.newPassword) {
        if (await verifyPassword(body.newPassword, admin.passwordHash)) {
            return fail('Choose a password different from the current password', 400);
        }
        data.passwordHash = await hashPassword(body.newPassword);
    }

    if (Object.keys(data).length === 0) return fail('No credential changes were provided', 400);

    const updated = await prisma.user.update({ where: { id: admin.id }, data });
    return ok(publicUser(updated));
});
