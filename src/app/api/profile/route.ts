import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { publicUser, requireUser } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';

const avatarPattern = /^\/api\/files\/[a-zA-Z0-9-]+$/;

const schema = z.object({
    email: z.string().trim().toLowerCase().email(),
    address: z.string().trim().max(300).optional().default(''),
    country: z.string().trim().max(120).optional().default(''),
    avatarUrl: z.string().regex(avatarPattern).nullable().optional(),
});

/** Update the signed-in user's own profile details and avatar. */
export const PATCH = route(async (req: Request) => {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    if (body.email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } });
        if (existing) return fail('That email address is already in use', 409);
    }

    if (body.avatarUrl) {
        const key = body.avatarUrl.split('/').pop()!;
        const file = await prisma.storedFile.findUnique({ where: { key }, select: { type: true } });
        if (!file || !file.type.startsWith('image/')) return fail('Choose a valid image for your profile photo', 422);
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            email: body.email,
            address: body.address || null,
            country: body.country || null,
            avatarUrl: body.avatarUrl || null,
        },
    });

    return ok(publicUser(updated));
});
