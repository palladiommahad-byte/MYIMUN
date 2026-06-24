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

const updateSchema = z.object({
    role: z.enum(['secretary', 'manager']).optional(),
    fullName: z.string().trim().min(2).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    password: z.string().min(6).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    permissions: permissionsSchema.optional(),
});

async function loadStaffTarget(id: string) {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || !['secretary', 'manager'].includes(target.role)) return null;
    return target;
}

/** PATCH — admin edits a secretary/manager's name, email, password, status, role, or page permissions. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await ctx.params;
    const target = await loadStaffTarget(id);
    if (!target) return fail('Staff member not found', 404);

    const body = updateSchema.parse(await req.json());

    if (body.email && body.email !== target.email) {
        const existing = await prisma.user.findUnique({ where: { email: body.email } });
        if (existing) return fail('A user with that email already exists', 409);
    }

    const row = await prisma.user.update({
        where: { id },
        data: {
            role: body.role,
            fullName: body.fullName,
            email: body.email,
            status: body.status,
            permissions: body.permissions,
            ...(body.password ? { passwordHash: await hashPassword(body.password) } : {}),
        },
    });
    return ok(publicUser(row));
});

/** DELETE — admin removes a secretary/manager account. */
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    if (admin.id === id) return fail('You cannot delete your own account', 400);
    const target = await loadStaffTarget(id);
    if (!target) return fail('Staff member not found', 404);

    await prisma.user.delete({ where: { id } });
    return ok({ deleted: id });
});
