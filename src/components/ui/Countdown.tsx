'use client';

import React, { useEffect, useState } from 'react';

/** `target` is a date ("2026-09-15") or datetime-local string ("2026-09-15T08:00") with
    no timezone info. Interpreted as Morocco time (UTC+1) — same convention the rest of
    the app uses for conference dates (e.g. the position-paper deadline, certificate
    availability) — so the countdown reads identically for every delegate regardless of
    their own browser timezone. A bare date counts down to midnight that day. */
function parseTarget(target: string): number {
    const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(target);
    const hasTime = /T\d{2}:\d{2}/.test(target);
    const withTime = hasTime ? target : `${target}T00:00`;
    const withSeconds = /T\d{2}:\d{2}$/.test(withTime) ? `${withTime}:00` : withTime;
    return new Date(hasTimezone ? withSeconds : `${withSeconds}+01:00`).getTime();
}

function msRemaining(target: string): number {
    return Math.max(0, parseTarget(target) - Date.now());
}

const C = {
    accent: '#3B7FFF', purple: '#7C5FFF', green: '#10B981',
    border: '#E4E8EF', textMuted: '#9CA3AF', dark: '#9CA8BD',
};

export function Countdown({ target, variant = 'light', label = 'Conference begins in' }: {
    target: string; variant?: 'light' | 'dark'; label?: string;
}) {
    // Start as null (not yet mounted) to avoid an SSR/client hydration mismatch on the ticking value.
    const [ms, setMs] = useState<number | null>(null);

    useEffect(() => {
        const tick = () => setMs(msRemaining(target));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [target]);

    if (ms === null) return null;

    const dark = variant === 'dark';

    if (ms <= 0) {
        return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '11px 18px', borderRadius: 999, background: dark ? 'rgba(16,185,129,0.14)' : `${C.green}10`, border: `1px solid ${dark ? 'rgba(16,185,129,0.3)' : `${C.green}30`}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, display: 'inline-block', boxShadow: '0 0 8px rgba(16,185,129,0.7)', animation: 'live-pulse 2s infinite' }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: C.green }}>We&apos;re live — the conference has started!</span>
            </div>
        );
    }

    const days    = Math.floor(ms / 86400000);
    const hours   = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const units = [
        { value: days,    label: days === 1 ? 'Day' : 'Days' },
        { value: hours,   label: 'Hrs' },
        { value: minutes, label: 'Min' },
        { value: seconds, label: 'Sec' },
    ];

    return (
        <div>
            {label && (
                <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: dark ? C.dark : '#6B7280', marginBottom: 10 }}>
                    {label}
                </p>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {units.map(u => (
                    <div key={u.label} style={{
                        minWidth: 68, padding: '13px 8px', borderRadius: 14, textAlign: 'center',
                        background: dark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                        border: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : C.border}`,
                        boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                        <div style={{
                            fontSize: 28, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                            fontFamily: '"Plus Jakarta Sans",Inter,sans-serif',
                            backgroundImage: dark ? 'linear-gradient(135deg,#FFFFFF,#9CA8BD)' : `linear-gradient(135deg,${C.accent},${C.purple})`,
                            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                        }}>
                            {String(u.value).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 5, color: dark ? C.dark : C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {u.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
