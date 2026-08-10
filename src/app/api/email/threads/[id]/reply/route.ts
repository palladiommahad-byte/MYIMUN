import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePage } from '@/lib/auth';
import { fail, ok, route } from '@/lib/api';
import { sendOutboundEmail } from '@/lib/email';

export const runtime = 'nodejs';
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const attachmentSchema = z.object({
    filename: z.string().trim().min(1).max(180),
    contentType: z.string().trim().min(1).max(120),
    contentBase64: z.string().min(1),
    size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

const replySchema = z.object({
    text: z.string().trim().default(''),
    cc: z.array(z.object({
        name: z.string().trim().optional(),
        email: z.string().trim().toLowerCase().email(),
    })).default([]),
    bcc: z.array(z.object({
        name: z.string().trim().optional(),
        email: z.string().trim().toLowerCase().email(),
    })).default([]),
    attachments: z.array(attachmentSchema).max(5).default([]),
}).superRefine((data, ctx) => {
    const total = data.attachments.reduce((sum, attachment) => sum + attachment.size, 0);
    if (!data.text && data.attachments.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['text'],
            message: 'Write a reply or attach at least one file.',
        });
    }
    if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['attachments'],
            message: 'Attachments must be 15 MB or less in total.',
        });
    }
});

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requirePage('/admin/email');
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) return fail('Invalid id', 400);
    const body = replySchema.parse(await req.json());

    const thread = await prisma.emailThread.findUnique({ where: { id } });
    if (!thread) return fail('Email thread not found', 404);

    const subject = /^re:/i.test(thread.subject) ? thread.subject : `Re: ${thread.subject}`;
    try {
        const row = await sendOutboundEmail({
            threadId: thread.id,
            to: [{ name: thread.externalName, email: thread.externalEmail }],
            cc: body.cc,
            bcc: body.bcc,
            subject,
            text: body.text,
            attachments: body.attachments,
        });
        return ok(row);
    } catch (error) {
        return fail(error instanceof Error ? error.message : 'Could not send reply', 400);
    }
});
