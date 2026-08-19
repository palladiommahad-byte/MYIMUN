import 'server-only';
import { sendOutboundEmail } from '@/lib/email';

function loginUrl() {
    const base =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.SITE_URL ||
        process.env.MAIL_SIGNATURE_WEBSITE ||
        (process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'https://moroccanmun.org');

    return `${base.replace(/\/+$/, '')}/login`;
}

export async function sendDelegateCredentialEmail(input: {
    fullName: string;
    email: string;
    password: string;
}) {
    const text = [
        `Hello ${input.fullName},`,
        '',
        'Your MYIMUN delegate login credentials have been updated.',
        '',
        `Full name: ${input.fullName}`,
        `Email: ${input.email}`,
        `Password: ${input.password}`,
        '',
        `Sign in here: ${loginUrl()}`,
        '',
        'Please keep this password private. You can change it from your profile after logging in.',
    ].join('\n');

    return sendOutboundEmail({
        to: [{ name: input.fullName, email: input.email }],
        subject: 'Your MYIMUN login credentials',
        text,
    });
}
