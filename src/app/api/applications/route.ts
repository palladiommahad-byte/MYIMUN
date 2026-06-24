import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasPageAccess } from '@/lib/auth';
import { ok, route } from '@/lib/api';
import { notifyStaff } from '@/lib/notifications';

export const GET = route(async (req: Request) => {
    const user = await requireUser();
    const committee = new URL(req.url).searchParams.get('committee');
    const where = hasPageAccess(user, '/admin/committees')
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

    await notifyStaff({
        type: 'committee_application_submitted',
        title: 'New committee application',
        message: `${data.delegateName} applied to ${data.committeeAbbr}.`,
        link: '/admin/committees',
    });

    return ok(row, 201);
});
