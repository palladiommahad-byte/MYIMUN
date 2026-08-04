import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, hasPageAccess } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';
import { notifyDelegate, notifyStaff } from '@/lib/notifications';

const schema = z.object({ speech: z.string().trim().min(20).max(6000) });

/** Staff see all drafts; delegates can see only their own. */
export const GET = route(async () => {
    const user = await requireUser();
    const where = hasPageAccess(user, '/admin/papers') ? {} : { delegateId: user.id };
    const rows = await prisma.openingSpeech.findMany({ where, orderBy: { updatedAt: 'desc' } });
    return ok(rows);
});

/** Submit or replace an opening speech for the delegate's approved committee. */
export const POST = route(async (req: Request) => {
    const user = await requireUser();
    const data = schema.parse(await req.json());
    const membership = await prisma.committeeApplication.findFirst({
        where: { delegateId: user.id, status: 'Approved' },
        select: { committeeAbbr: true, assignedCountry: true, country: true },
    });
    if (!membership) return fail('Committee approval is required before submitting an opening speech', 403);

    const row = await prisma.openingSpeech.upsert({
        where: { delegateId_committee: { delegateId: user.id, committee: membership.committeeAbbr } },
        update: { speech: data.speech, submittedAt: new Date() },
        create: {
            delegateId: user.id,
            delegateName: user.fullName,
            committee: membership.committeeAbbr,
            country: membership.assignedCountry || membership.country,
            speech: data.speech,
        },
    });

    await notifyStaff({
        type: 'opening_speech_submitted',
        title: 'Opening speech submitted',
        message: `${user.fullName} submitted an opening speech for ${membership.committeeAbbr}.`,
        link: '/admin/papers',
    });
    await notifyDelegate(user.id, {
        type: 'opening_speech_submitted',
        title: 'Opening speech submitted',
        message: `Your opening speech for ${membership.committeeAbbr} has been saved.`,
        link: '/dashboard/opening-speech',
    });

    return ok(row, 201);
});
