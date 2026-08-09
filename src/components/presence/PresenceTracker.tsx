'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';

const HEARTBEAT_MS = 20_000;
const STORAGE_KEY = 'myimun_presence_id';

function createClientId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function PresenceTracker() {
    const pathname = usePathname();
    const { user, isLoading } = useAuth();
    const clientIdRef = useRef<string | null>(null);

    const ensureClientId = useCallback(() => {
        if (clientIdRef.current) return clientIdRef.current;
        const saved = sessionStorage.getItem(STORAGE_KEY);
        const clientId = saved || createClientId();
        if (!saved) sessionStorage.setItem(STORAGE_KEY, clientId);
        clientIdRef.current = clientId;
        return clientId;
    }, []);

    const reportPresence = useCallback((offline = false, beacon = false) => {
        const body = JSON.stringify({
            clientId: ensureClientId(),
            path: pathname || '/',
            offline,
        });

        if (beacon && navigator.sendBeacon) {
            navigator.sendBeacon('/api/presence', new Blob([body], { type: 'application/json' }));
            return;
        }

        void fetch('/api/presence', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: offline,
        }).catch(() => undefined);
    }, [ensureClientId, pathname]);

    useEffect(() => {
        if (!isLoading && document.visibilityState === 'visible') reportPresence();
    }, [isLoading, pathname, user?.id, reportPresence]);

    useEffect(() => {
        if (isLoading) return;

        const interval = window.setInterval(() => {
            if (document.visibilityState === 'visible') reportPresence();
        }, HEARTBEAT_MS);

        const handleVisibility = () => {
            reportPresence(document.visibilityState !== 'visible');
        };
        const handlePageHide = () => reportPresence(true, true);

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('pagehide', handlePageHide);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [isLoading, reportPresence]);

    return null;
}
