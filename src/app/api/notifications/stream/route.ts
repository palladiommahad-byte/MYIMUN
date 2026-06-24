import { requireUser } from '@/lib/auth';
import { subscribe } from '@/lib/events';

export const dynamic = 'force-dynamic';

const STAFF = ['admin', 'secretary', 'manager'];

/** SSE stream — pushes an "update" event the instant a notification is created
    for this user (staff feed, or this delegate's private feed), so the client
    can refetch immediately instead of waiting on a poll interval. */
export async function GET() {
    let user;
    try {
        user = await requireUser();
    } catch {
        return new Response('Unauthorized', { status: 401 });
    }

    const isStaff = STAFF.includes(user.role);
    const userId = user.id;
    const encoder = new TextEncoder();

    let unsubscribe: () => void = () => {};
    let heartbeat: ReturnType<typeof setInterval>;

    const stream = new ReadableStream({
        start(controller) {
            const send = (data: string) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                } catch {
                    // Controller already closed (client disconnected) — ignore.
                }
            };

            unsubscribe = subscribe((payload) => {
                if (payload.audience === 'staff' && isStaff) send('update');
                else if (payload.audience === 'delegate' && payload.recipientId === userId) send('update');
            });

            heartbeat = setInterval(() => send('ping'), 25000);
            send('connected');
        },
        cancel() {
            unsubscribe();
            clearInterval(heartbeat);
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    });
}
