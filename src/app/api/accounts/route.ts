import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePage, publicUser, hashPassword } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';

const createSchema = z.object({
    fullName: z.string().trim().min(2, 'Full name is too short').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(200),
    country: z.string().trim().max(80).optional(),
    status: z.enum(['active', 'inactive']).default('active'),
});

/** GET — staff with Accounts access list every delegate account for credential management. */
export const GET = route(async () => {
    await requirePage('/admin/accounts');
    const rows = await prisma.user.findMany({
        where: { role: 'delegate' },
        orderBy: { createdAt: 'desc' },
    });
    return ok(rows.map(publicUser));
});

/** POST - staff with Accounts access create a delegate login. */
export const POST = route(async (req: Request) => {
    await requirePage('/admin/accounts');
    const body = createSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return fail('A user with that email already exists', 409);

    const row = await prisma.user.create({
        data: {
            role: 'delegate',
            fullName: body.fullName,
            email: body.email,
            passwordHash: await hashPassword(body.password),
            country: body.country || null,
            status: body.status,
            permissions: null,
            mustChangeCredentials: false,
        },
    });

    return ok(publicUser(row), 201);
});
