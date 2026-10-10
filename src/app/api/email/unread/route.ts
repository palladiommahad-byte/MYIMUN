import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { ok, route } from '@/lib/api';

export const runtime = 'nodejs';

/** GET — number of unread inbox threads, for the sidebar badge. */
export const GET = route(async () => {
    await requirePage('/admin/email');
    const count = await prisma.emailThread.count({ where: { unread: true, mailbox: 'inbox' } });
    return ok({ count });
});
