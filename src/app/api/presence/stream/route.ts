import { requirePage } from '@/lib/auth';
import { prunePresence, subscribePresence } from '@/lib/presence';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await requirePage('/admin/live-users');
    } catch {
        return new Response('Unauthorized', { status: 401 });
    }

    const encoder = new TextEncoder();
    let unsubscribe: () => void = () => {};
    let heartbeat: ReturnType<typeof setInterval>;

    const stream = new ReadableStream({
        start(controller) {
            const send = (data: string) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                } catch {
                    // The browser disconnected between callbacks.
                }
            };

            unsubscribe = subscribePresence(() => send('update'));
            heartbeat = setInterval(() => {
                if (!prunePresence()) send('ping');
            }, 15_000);
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
