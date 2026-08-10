import { requirePage } from '@/lib/auth';
import { ok, route } from '@/lib/api';
import { getMailConfig } from '@/lib/email';

export const runtime = 'nodejs';

export const GET = route(async () => {
    await requirePage('/admin/email');
    const config = getMailConfig();
    return ok({
        configured: Boolean(config),
        fromAddress: process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || 'contact@moroccanmun.org',
    });
});
