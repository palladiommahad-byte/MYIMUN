import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from './auth';

export const ok = (data: unknown, init?: number) =>
    NextResponse.json({ ok: true, data }, { status: init ?? 200 });

export const fail = (message: string, status = 400, extra?: unknown) =>
    NextResponse.json({ ok: false, error: message, ...(extra ? { details: extra } : {}) }, { status });

/** Wrap a route handler so AuthError / ZodError / unexpected errors map to clean JSON. */
export function route<T extends (...args: never[]) => Promise<Response>>(handler: T): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await handler(...args);
        } catch (err) {
            if (err instanceof AuthError) return fail(err.message, err.status);
            if (err instanceof ZodError) return fail('Invalid input', 422, err.flatten());
            console.error('[api] unhandled error:', err);
            return fail('Something went wrong', 500);
        }
    }) as T;
}
