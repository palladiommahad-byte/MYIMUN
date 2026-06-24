import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, route } from '@/lib/api';

export const EVENT_FIELDS = [
    'title', 'subtitle', 'edition', 'startDate', 'endDate', 'venue', 'address', 'city', 'country',
    'description', 'guidelines', 'bannerUrl', 'galleryUrls', 'hotel', 'agenda', 'published',
    'registrationDeadline', 'capacity', 'certEditionNumber', 'certDateDisplay', 'certLocation',
    'certSignatory', 'letterEditionYear',
] as const;

/** GET — public list of conference events. */
export const GET = route(async () => {
    const rows = await prisma.conferenceEvent.findMany({ orderBy: { id: 'asc' } });
    return ok(rows);
});

/** POST — staff create a conference event. */
export const POST = route(async (req: Request) => {
    await requirePage('/admin/events');
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of EVENT_FIELDS) if (k in body) data[k] = body[k];
    if (!data.title) data.title = 'Untitled Event';
    const row = await prisma.conferenceEvent.create({ data: data as never });
    return ok(row, 201);
});
