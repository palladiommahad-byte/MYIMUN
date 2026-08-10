import { requirePage } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';
import { syncInboxFromImap } from '@/lib/email';

export const runtime = 'nodejs';

export const POST = route(async () => {
    await requirePage('/admin/email');
    try {
        const result = await syncInboxFromImap();
        return ok(result);
    } catch (error) {
        return fail(error instanceof Error ? error.message : 'Could not sync inbox', 400);
    }
});
