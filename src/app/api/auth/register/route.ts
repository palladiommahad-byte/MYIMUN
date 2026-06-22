import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession, publicUser } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const schema = z.object({
    fullName: z.string().trim().min(2, 'Full name is too short').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(200),
});

export const POST = route(async (req: Request) => {
    const body = schema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return fail('An account with this email already exists', 409);

    const user = await prisma.user.create({
        data: {
            email: body.email,
            fullName: body.fullName,
            passwordHash: await hashPassword(body.password),
            role: 'delegate',
        },
    });

    await createSession(user);
    return ok(publicUser(user), 201);
});
