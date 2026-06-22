import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/api';

const STAFF = ['admin', 'secretary', 'manager'];

export const GET = route(async (req: Request) => {
    const user = await requireUser();
    const committee = new URL(req.url).searchParams.get('committee');
    const where = STAFF.includes(user.role)
        ? (committee ? { committeeAbbr: committee } : {})
        : { delegateId: user.id };
    const rows = await prisma.committeeApplication.findMany({ where, orderBy: { id: 'desc' } });
    return ok(rows);
});

const schema = z.object({
    delegateName: z.string().trim().min(1),
    country: z.string().trim().min(1),
    committeeAbbr: z.string().trim().min(1),
    whyThisCommittee: z.string().default(''),
    preferredCountry: z.string().default(''),
    whyShouldWePickYou: z.string().default(''),
});

/** POST — a delegate applies to a committee (one application per delegate). */
export const POST = route(async (req: Request) => {
    const user = await requireUser();
    const data = schema.parse(await req.json());

    const row = await prisma.committeeApplication.upsert({
        where: { delegateId: user.id },
        update: { ...data, status: 'Pending' },
        create: { ...data, delegateId: user.id },
    });
    return ok(row, 201);
});
