import { prisma } from '@/lib/prisma';
import { ok, route } from '@/lib/api';

/** Lightweight readiness probe for Docker. It confirms the database is reachable without exposing data. */
export const GET = route(async () => {
    await prisma.user.count({ take: 1 });
    return ok({ status: 'ok' });
});
