import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasAnyPageAccess } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';
import { notifyDelegate, notifyStaff } from '@/lib/notifications';

export const GET = route(async (req: Request) => {
    const user = await requireUser();
    const committee = new URL(req.url).searchParams.get('committee');
    const isStaff = hasAnyPageAccess(user, ['/admin', '/admin/delegates', '/admin/committees']);

    if (committee && !isStaff) {
        const membership = await prisma.committeeApplication.findFirst({
            where: { delegateId: user.id, committeeAbbr: committee, status: 'Approved' },
            select: { id: true },
        });
        if (!membership) return fail('You can only view the roster for your approved committee', 403);

        const rows = await prisma.committeeApplication.findMany({
            where: { committeeAbbr: committee, status: 'Approved' },
            orderBy: { id: 'asc' },
            select: {
                id: true, delegateId: true, delegateName: true, country: true,
                committeeAbbr: true, status: true, appliedAt: true, assignedCountry: true,
            },
        });
        return ok(rows);
    }

    const where = isStaff ? (committee ? { committeeAbbr: committee } : {}) : { delegateId: user.id };
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
    const committee = await prisma.committee.findUnique({ where: { abbr: data.committeeAbbr } });
    if (!committee || !committee.visible) return fail('This committee is not available to delegates', 404);
    if (committee.applicationState === 'comingSoon') return fail('Applications for this committee are coming soon', 409);
    if (committee.applicationState === 'closed') return fail('Applications for this committee are closed', 409);

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
    await notifyDelegate(user.id, {
        type: 'committee_application_submitted',
        title: 'Committee application submitted',
        message: `Your application for ${data.committeeAbbr} is awaiting review.`,
        link: '/dashboard/committee',
    });

    return ok(row, 201);
});
