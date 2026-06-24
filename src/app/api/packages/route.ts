import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, route } from '@/lib/api';

export const PKG_FIELDS = ['name', 'price', 'currency', 'description', 'features', 'emoji', 'logoUrl', 'badge', 'hidden', 'color'] as const;

/** GET — public list of conference packages. */
export const GET = route(async () => {
    const rows = await prisma.conferencePackage.findMany({ orderBy: { id: 'asc' } });
    return ok(rows);
});

/** POST — staff create a package. */
export const POST = route(async (req: Request) => {
    await requirePage('/admin/payments');
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of PKG_FIELDS) if (k in body) data[k] = body[k];
    if (!data.name) data.name = 'New Package';
    const row = await prisma.conferencePackage.create({ data: data as never });
    return ok(row, 201);
});
