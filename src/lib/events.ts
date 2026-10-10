import 'server-only';

type EventAudience =
    | { audience: 'staff' }
    | { audience: 'admin' }
    | { audience: 'delegate'; recipientId: string }
    | { audience: 'everyone' }; // every connected client should refetch (e.g. a new broadcast)
/** `kind` narrows what changed so clients refetch only that: chat conversations, or the email inbox. */
type EventPayload = EventAudience & { kind?: 'messages' | 'email' };
type Listener = (payload: EventPayload) => void;

// Reuse a single listener set across hot-reloads in dev, same reasoning as prisma.ts.
const globalForEvents = globalThis as unknown as { __myimunListeners?: Set<Listener> };
const listeners = globalForEvents.__myimunListeners ?? new Set<Listener>();
if (process.env.NODE_ENV !== 'production') globalForEvents.__myimunListeners = listeners;

/** Subscribe to data-change events. Returns an unsubscribe function. */
export function subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** Tell every connected client (SSE) that something changed so it should refetch. */
export function broadcast(payload: EventPayload) {
    for (const fn of listeners) fn(payload);
}
