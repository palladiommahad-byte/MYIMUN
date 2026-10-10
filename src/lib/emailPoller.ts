import 'server-only';
import { getMailConfig, syncInboxFromImap } from './email';

const POLL_INTERVAL_MS = 60_000;

type PollerState = { holders: number; timer: ReturnType<typeof setInterval> | null; lastError: string };
// Survive dev hot-reloads, same reasoning as events.ts.
const globalForPoller = globalThis as unknown as { __myimunEmailPoller?: PollerState };
const state = globalForPoller.__myimunEmailPoller ?? { holders: 0, timer: null, lastError: '' };
globalForPoller.__myimunEmailPoller = state;

async function poll() {
    if (!getMailConfig()) return;
    try {
        await syncInboxFromImap();
        state.lastError = '';
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Log each distinct failure once instead of every minute.
        if (message !== state.lastError) console.warn('[email] background inbox sync failed:', message);
        state.lastError = message;
    }
}

/** Keep the inbox syncing in the background while at least one staff member with
    Email access is connected. Returns a release function for when they disconnect. */
export function retainEmailPoller() {
    state.holders += 1;
    if (!state.timer) {
        void poll();
        state.timer = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
    }
    let released = false;
    return () => {
        if (released) return;
        released = true;
        state.holders = Math.max(0, state.holders - 1);
        if (state.holders === 0 && state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
    };
}
