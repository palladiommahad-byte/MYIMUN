import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';
import { sendOutboundEmail, type EmailRecipient } from '@/lib/email';

export const runtime = 'nodejs';
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const MAX_RECIPIENTS_PER_EMAIL = 40;

const recipientSchema = z.object({
    name: z.string().trim().optional(),
    email: z.string().trim().toLowerCase().email(),
});

const attachmentSchema = z.object({
    filename: z.string().trim().min(1).max(180),
    contentType: z.string().trim().min(1).max(120),
    contentBase64: z.string().min(1),
    size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

const composeSchema = z.object({
    to: z.array(recipientSchema).default([]),
    cc: z.array(recipientSchema).default([]),
    bcc: z.array(recipientSchema).default([]),
    subject: z.string().trim().min(1),
    text: z.string().trim().min(1),
    html: z.string().trim().min(1).optional(),
    attachments: z.array(attachmentSchema).max(5).default([]),
}).superRefine((data, ctx) => {
    if (data.to.length + data.cc.length + data.bcc.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['to'],
            message: 'Add at least one recipient.',
        });
    }
    const uniqueAddresses = new Set(
        [...data.to, ...data.cc, ...data.bcc].map(recipient => recipient.email.toLowerCase()),
    );
    if (uniqueAddresses.size > MAX_RECIPIENTS_PER_EMAIL) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['bcc'],
            message: `Send no more than ${MAX_RECIPIENTS_PER_EMAIL} recipients in one email.`,
        });
    }
    const total = data.attachments.reduce((sum, attachment) => sum + attachment.size, 0);
    if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['attachments'],
            message: 'Attachments must be 15 MB or less in total.',
        });
    }
});

function uniqueRecipients(recipients: EmailRecipient[]) {
    const seen = new Set<string>();
    return recipients.filter(recipient => {
        const email = recipient.email.toLowerCase();
        if (seen.has(email)) return false;
        seen.add(email);
        return true;
    });
}

/** GET - list synced/sent email threads for the admin Email page. */
export const GET = route(async (req: Request) => {
    await requirePage('/admin/email');
    const url = new URL(req.url);
    const mailbox = url.searchParams.get('mailbox');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.trim();

    const where = {
        ...(mailbox === 'inbox' || mailbox === 'sent' ? { mailbox } : {}),
        ...(status === 'open' || status === 'resolved' ? { status } : {}),
        ...(search ? {
            OR: [
                { subject: { contains: search } },
                { externalName: { contains: search } },
                { externalEmail: { contains: search } },
                { messages: { some: { text: { contains: search } } } },
            ],
        } : {}),
    };

    const rows = await prisma.emailThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        include: { messages: { orderBy: { sentAt: 'asc' } } },
    });
    return ok(rows);
});

/** POST - compose a new outbound email through Namecheap SMTP. */
export const POST = route(async (req: Request) => {
    await requirePage('/admin/email');
    const body = composeSchema.parse(await req.json());
    try {
        const row = await sendOutboundEmail({
            to: uniqueRecipients(body.to),
            cc: uniqueRecipients(body.cc),
            bcc: uniqueRecipients(body.bcc),
            subject: body.subject,
            text: body.text,
            html: body.html,
            attachments: body.attachments,
        });
        return ok(row, 201);
    } catch (error) {
        return fail(error instanceof Error ? error.message : 'Could not send email', 400);
    }
});
