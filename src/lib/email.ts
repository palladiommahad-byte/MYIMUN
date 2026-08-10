import 'server-only';
import { existsSync } from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser, type AddressObject, type ParsedMail } from 'mailparser';
import { prisma } from '@/lib/prisma';

export type EmailRecipient = { name?: string; email: string };
export type OutboundAttachment = {
    filename: string;
    contentType: string;
    contentBase64: string;
    size: number;
};

type MailConfig = {
    fromName: string;
    fromAddress: string;
    signature: {
        name: string;
        title: string;
        phone: string;
        website: string;
        address: string;
    };
    smtp: { host: string; port: number; secure: boolean; user: string; password: string };
    imap: { host: string; port: number; secure: boolean; user: string; password: string };
};

const SYNC_KEY = 'imap:inbox:lastUid';
const LOGO_CID = 'myimun-email-logo';

function envBool(value: string | undefined, fallback: boolean) {
    if (!value) return fallback;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function envInt(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : fallback;
}

export function getMailConfig(): MailConfig | null {
    const smtpPassword = process.env.SMTP_PASSWORD;
    const imapPassword = process.env.IMAP_PASSWORD;
    const smtpUser = process.env.SMTP_USER || 'contact@moroccanmun.org';
    const imapUser = process.env.IMAP_USER || smtpUser;
    if (!smtpPassword || !imapPassword) return null;

    return {
        fromName: process.env.MAIL_FROM_NAME || 'Moroccan MUN',
        fromAddress: process.env.MAIL_FROM_ADDRESS || smtpUser,
        signature: {
            name: process.env.MAIL_SIGNATURE_NAME || 'MYIMUN Secretariat',
            title: process.env.MAIL_SIGNATURE_TITLE || 'Moroccan Youth International Model United Nations',
            phone: process.env.MAIL_SIGNATURE_PHONE || '',
            website: process.env.MAIL_SIGNATURE_WEBSITE || 'https://moroccanmun.org',
            address: process.env.MAIL_SIGNATURE_ADDRESS || 'Morocco',
        },
        smtp: {
            host: process.env.SMTP_HOST || 'mail.privateemail.com',
            port: envInt(process.env.SMTP_PORT, 465),
            secure: envBool(process.env.SMTP_SECURE, true),
            user: smtpUser,
            password: smtpPassword,
        },
        imap: {
            host: process.env.IMAP_HOST || 'mail.privateemail.com',
            port: envInt(process.env.IMAP_PORT, 993),
            secure: envBool(process.env.IMAP_SECURE, true),
            user: imapUser,
            password: imapPassword,
        },
    };
}

export function normalizeSubject(subject: string) {
    return subject
        .replace(/^(\s*(re|fw|fwd)\s*:\s*)+/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function cleanSnippet(text: string) {
    return text.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function addressList(input: AddressObject | AddressObject[] | undefined): EmailRecipient[] {
    const objects = Array.isArray(input) ? input : input ? [input] : [];
    return objects.flatMap(item =>
        item.value
            .filter(address => Boolean(address.address))
            .map(address => ({ name: address.name || undefined, email: String(address.address).toLowerCase() })),
    );
}

function firstAddress(input: AddressObject | AddressObject[] | undefined): EmailRecipient {
    return addressList(input)[0] ?? { name: '', email: 'unknown@example.com' };
}

function attachmentMeta(mail: ParsedMail) {
    return mail.attachments.map(attachment => ({
        filename: attachment.filename || 'attachment',
        contentType: attachment.contentType,
        size: attachment.size,
        checksum: attachment.checksum,
    }));
}

function toNodemailerAddresses(recipients: EmailRecipient[]) {
    return recipients.map(recipient => ({
        name: recipient.name || '',
        address: recipient.email,
    }));
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function htmlBodyFromText(text: string) {
    return escapeHtml(text)
        .split(/\n{2,}/)
        .map(paragraph => `<p style="margin:0 0 14px;color:#111827;font-size:15px;line-height:1.65;">${paragraph.replace(/\n/g, '<br />')}</p>`)
        .join('');
}

function plainTextWithSignature(text: string, config: MailConfig) {
    return [
        text.trim(),
        '',
        '--',
        config.signature.name,
        config.signature.title,
        config.signature.phone,
        config.fromAddress,
        config.signature.website,
        config.signature.address,
    ].filter(Boolean).join('\n');
}

function logoAttachment() {
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'MYIMUN-BLUE-LOGO-VERTICAL.png');
    if (!existsSync(logoPath)) return [];
    return [{ filename: 'MYIMUN-BLUE-LOGO-VERTICAL.png', path: logoPath, cid: LOGO_CID }];
}

function mailAttachments(attachments: OutboundAttachment[] | undefined) {
    return [
        ...logoAttachment(),
        ...(attachments ?? []).map(attachment => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.contentBase64, 'base64'),
            contentType: attachment.contentType,
        })),
    ];
}

function outboundAttachmentMeta(attachments: OutboundAttachment[] | undefined) {
    return (attachments ?? []).map(attachment => ({
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
    }));
}

function buildEmailHtml(text: string, config: MailConfig) {
    const s = config.signature;
    const safeWebsite = escapeHtml(s.website);
    const safeEmail = escapeHtml(config.fromAddress);
    const safePhone = escapeHtml(s.phone.trim());
    const safeAddress = escapeHtml(s.address);
    const safeTitle = escapeHtml(s.title);
    const safeName = escapeHtml(s.name);

    return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e5eaf2;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="height:5px;background:#3B7FFF;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 30px 18px;">
              ${htmlBodyFromText(text)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 30px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e5eaf2;padding-top:18px;">
                <tr>
                  <td style="width:155px;padding:4px 22px 4px 0;vertical-align:middle;border-right:3px solid #3B7FFF;">
                    <img src="cid:${LOGO_CID}" width="132" alt="MYIMUN" style="display:block;width:132px;max-width:132px;height:auto;border:0;outline:none;text-decoration:none;" />
                  </td>
                  <td style="padding:4px 0 4px 22px;vertical-align:middle;">
                    <p style="margin:0;color:#111827;font-size:16px;font-weight:700;line-height:1.3;">${safeName}</p>
                    <p style="margin:4px 0 12px;color:#3B7FFF;font-size:12px;font-weight:700;line-height:1.4;text-transform:uppercase;letter-spacing:0.08em;">${safeTitle}</p>
                    <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.7;">
                      <a href="mailto:${safeEmail}" style="color:#111827;text-decoration:none;">${safeEmail}</a><br />
                      <a href="${safeWebsite}" style="color:#111827;text-decoration:none;">${safeWebsite.replace(/^https?:\/\//, '')}</a><br />
                      ${safePhone ? `<span>${safePhone}</span><br />` : ''}
                      <span>${safeAddress}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function findDelegateByEmail(email: string) {
    return prisma.user.findFirst({
        where: { email: email.toLowerCase(), role: 'delegate' },
        select: { id: true },
    });
}

async function findOrCreateThread(input: {
    subject: string;
    externalName: string;
    externalEmail: string;
    linkedDelegateId?: string | null;
    mailbox: 'inbox' | 'sent';
    unread: boolean;
    sentAt: Date;
}) {
    const normalizedSubject = normalizeSubject(input.subject || '(no subject)');
    const existing = await prisma.emailThread.findFirst({
        where: {
            normalizedSubject,
            externalEmail: input.externalEmail.toLowerCase(),
        },
        orderBy: { lastMessageAt: 'desc' },
    });

    if (existing) {
        return prisma.emailThread.update({
            where: { id: existing.id },
            data: {
                subject: input.subject || existing.subject,
                externalName: input.externalName || existing.externalName,
                linkedDelegateId: input.linkedDelegateId ?? existing.linkedDelegateId,
                mailbox: input.mailbox === 'inbox' ? 'inbox' : existing.mailbox,
                unread: existing.unread || input.unread,
                lastMessageAt: input.sentAt,
            },
        });
    }

    return prisma.emailThread.create({
        data: {
            subject: input.subject || '(no subject)',
            normalizedSubject,
            externalName: input.externalName || input.externalEmail,
            externalEmail: input.externalEmail.toLowerCase(),
            linkedDelegateId: input.linkedDelegateId ?? null,
            mailbox: input.mailbox,
            unread: input.unread,
            lastMessageAt: input.sentAt,
        },
    });
}

export async function sendOutboundEmail(input: {
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    subject: string;
    text: string;
    threadId?: number;
    attachments?: OutboundAttachment[];
}) {
    const config = getMailConfig();
    if (!config) throw new Error('Email credentials are not configured.');

    const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: { user: config.smtp.user, pass: config.smtp.password },
    });

    const info = await transporter.sendMail({
        from: { name: config.fromName, address: config.fromAddress },
        to: toNodemailerAddresses(input.to),
        cc: input.cc?.length ? toNodemailerAddresses(input.cc) : undefined,
        bcc: input.bcc?.length ? toNodemailerAddresses(input.bcc) : undefined,
        subject: input.subject,
        text: plainTextWithSignature(input.text, config),
        html: buildEmailHtml(input.text, config),
        attachments: mailAttachments(input.attachments),
    });

    const primary = input.to[0];
    if (!primary) throw new Error('Add at least one recipient.');
    const delegate = await findDelegateByEmail(primary.email);
    const sentAt = new Date();
    const thread = input.threadId
        ? await prisma.emailThread.update({
            where: { id: input.threadId },
            data: { lastMessageAt: sentAt, status: 'open' },
        })
        : await findOrCreateThread({
            subject: input.subject,
            externalName: primary.name || primary.email,
            externalEmail: primary.email,
            linkedDelegateId: delegate?.id ?? null,
            mailbox: 'sent',
            unread: false,
            sentAt,
        });

    await prisma.emailMessage.create({
        data: {
            threadId: thread.id,
            messageId: info.messageId || null,
            direction: 'outbound',
            fromName: config.fromName,
            fromAddress: config.fromAddress.toLowerCase(),
            to: input.to,
            cc: input.cc ?? [],
            bcc: input.bcc ?? [],
            subject: input.subject,
            text: input.text,
            snippet: cleanSnippet(input.text),
            attachments: outboundAttachmentMeta(input.attachments),
            sentAt,
        },
    });

    return prisma.emailThread.findUnique({
        where: { id: thread.id },
        include: { messages: { orderBy: { sentAt: 'asc' } } },
    });
}

export async function syncInboxFromImap() {
    const config = getMailConfig();
    if (!config) throw new Error('Email credentials are not configured.');

    const state = await prisma.emailSyncState.findUnique({ where: { key: SYNC_KEY } });
    const lastUid = Number(state?.value ?? 0);
    let highestUid = Number.isFinite(lastUid) ? lastUid : 0;
    let imported = 0;

    const client = new ImapFlow({
        host: config.imap.host,
        port: config.imap.port,
        secure: config.imap.secure,
        auth: { user: config.imap.user, pass: config.imap.password },
        logger: false,
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
        const uids = await client.search({ uid: `${highestUid + 1}:*` }, { uid: true });
        if (!uids || uids.length === 0) return { imported: 0, highestUid };

        for await (const message of client.fetch(uids, { uid: true, source: true }, { uid: true })) {
            if (!message.source) continue;
            highestUid = Math.max(highestUid, message.uid);
            const parsed = await simpleParser(message.source);
            const messageId = parsed.messageId || null;
            if (messageId) {
                const existing = await prisma.emailMessage.findUnique({ where: { messageId } });
                if (existing) continue;
            }

            const from = firstAddress(parsed.from);
            const subject = parsed.subject || '(no subject)';
            const sentAt = parsed.date ?? new Date();
            const delegate = await findDelegateByEmail(from.email);
            const text = parsed.text?.trim() || (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]+>/g, ' ').trim() : '');
            const thread = await findOrCreateThread({
                subject,
                externalName: from.name || from.email,
                externalEmail: from.email,
                linkedDelegateId: delegate?.id ?? null,
                mailbox: 'inbox',
                unread: true,
                sentAt,
            });

            await prisma.emailMessage.create({
                data: {
                    threadId: thread.id,
                    messageId,
                    uid: message.uid,
                    direction: 'inbound',
                    fromName: from.name || from.email,
                    fromAddress: from.email,
                    to: addressList(parsed.to),
                    cc: addressList(parsed.cc),
                    bcc: addressList(parsed.bcc),
                    subject,
                    text,
                    html: parsed.html ? String(parsed.html) : null,
                    snippet: cleanSnippet(text || subject),
                    attachments: attachmentMeta(parsed),
                    sentAt,
                },
            });
            imported += 1;
        }

        await prisma.emailSyncState.upsert({
            where: { key: SYNC_KEY },
            update: { value: String(highestUid) },
            create: { key: SYNC_KEY, value: String(highestUid) },
        });
        return { imported, highestUid };
    } finally {
        lock.release();
        await client.logout().catch(() => undefined);
    }
}
