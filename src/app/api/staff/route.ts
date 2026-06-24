import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, publicUser, hashPassword } from '@/lib/auth';
import { ok, fail, route } from '@/lib/api';
import { ADMIN_PAGES } from '@/lib/adminPages';

const VALID_PAGES = ADMIN_PAGES.map(p => p.path);
const permissionsSchema = z.array(z.string()).refine(
    (arr) => arr.every((p) => VALID_PAGES.includes(p)),
    'Unknown page in permissions',
);

const createSchema = z.object({
    role: z.enum(['secretary', 'manager']),
    fullName: z.string().trim().min(2),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(6),
    status: z.enum(['active', 'inactive']).default('active'),
    permissions: permissionsSchema.default([]),
});

/** GET — admin-only list of secretary/manager accounts. */
export const GET = route(async () => {
    await requireAdmin();
    const rows = await prisma.user.findMany({
        where: { role: { in: ['secretary', 'manager'] } },
        orderBy: { fullName: 'asc' },
    });
    return ok(rows.map(publicUser));
});

/** POST — admin creates a secretary/manager account with a password and a set
    of /admin/* pages they're allowed to access. */
export const POST = route(async (req: Request) => {
    await requireAdmin();
    const body = createSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return fail('A user with that email already exists', 409);

    const row = await prisma.user.create({
        data: {
            role: body.role,
            fullName: body.fullName,
            email: body.email,
            passwordHash: await hashPassword(body.password),
            status: body.status,
            permissions: body.permissions,
        },
    });
    return ok(publicUser(row), 201);
});
