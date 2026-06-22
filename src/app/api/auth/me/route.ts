import { getCurrentUser, publicUser } from '@/lib/auth';
import { ok, route } from '@/lib/api';

export const GET = route(async () => {
    const user = await getCurrentUser();
    return ok(user ? publicUser(user) : null);
});
