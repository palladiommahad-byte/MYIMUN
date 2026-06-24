import { getCurrentUser, publicUser, destroySession } from '@/lib/auth';
import { ok, route } from '@/lib/api';

export const GET = route(async () => {
    const user = await getCurrentUser();
    if (user?.status === 'inactive') {
        await destroySession();
        return ok(null);
    }
    return ok(user ? publicUser(user) : null);
});
