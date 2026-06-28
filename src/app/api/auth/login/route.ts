import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, publicUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const schema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(true),
});

export const POST = route(async (req: Request) => {
    const body = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
        return fail('Invalid email or password', 401);
    }
    if (user.status === 'inactive') return fail('This account is disabled', 403);

    await createSession(user, body.rememberMe);
    return ok(publicUser(user));
});
