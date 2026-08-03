import { z } from 'zod';
import { ok, route } from '@/lib/api';

const detailedSchema = z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email(),
    subject: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(5000),
});

const simpleSchema = z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email(),
    message: z.string().trim().min(1).max(5000),
});

const schema = z.union([detailedSchema, simpleSchema]);

export const POST = route(async (req: Request) => {
    // Validate the payload; the parsed result is intentionally not logged (it carries PII).
    // In production, send an email or persist to the database here.
    schema.parse(await req.json());

    return ok({ message: 'Your message has been received. We will get back to you shortly.' });
});

export const GET = route(async () => ok({ message: 'Contact API is running. Use POST to submit a message.' }));
