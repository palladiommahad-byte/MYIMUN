'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Activity, Clock3, Laptop, Monitor, Radio, RefreshCw,
    Search, ShieldCheck, Smartphone, Tablet, UserRound, Users,
} from 'lucide-react';
import type { PresenceEntry, PresenceSnapshot } from '@/types';

const C = {
    surface: '#FFFFFF', border: '#E4E8EF', bg: '#F4F5F7',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', purple: '#7C5FFF', amber: '#F59E0B',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const STAFF_ROLES = new Set(['admin', 'secretary', 'manager']);

const PAGE_NAMES: Array<[string, string]> = [
    ['/dashboard/opening-speech', 'Opening Speech'],
    ['/dashboard/registration', 'Delegate Registration'],
    ['/dashboard/app-guide', 'App Guide'],
    ['/dashboard/committee', 'Committee'],
    ['/dashboard/payments', 'Payments'],
    ['/dashboard/messages', 'Messages'],
    ['/dashboard/papers', 'Position Papers'],
    ['/dashboard/events', 'Events'],
    ['/dashboard/schedule', 'Schedule'],
    ['/dashboard/profile', 'Profile'],
    ['/admin/live-users', 'Live Users'],
    ['/admin/registration', 'Registrations'],
    ['/admin/announcements', 'Broadcasts'],
    ['/admin/committees', 'Committees'],
    ['/admin/certificates', 'Certificates'],
    ['/admin/delegates', 'Delegates'],
    ['/admin/accounts', 'Accounts'],
    ['/admin/messages', 'Admin Messages'],
    ['/admin/payments', 'Admin Payments'],
    ['/admin/events', 'Admin Events'],
    ['/admin/settings', 'Settings'],
    ['/dashboard', 'Delegate Overview'],
    ['/admin', 'Admin Overview'],
    ['/contact', 'Contact'],
    ['/about', 'About'],
    ['/login', 'Login'],
    ['/', 'Home'],
];

function pageName(path: string) {
    return PAGE_NAMES.find(([prefix]) => prefix === '/' ? path === '/' : path.startsWith(prefix))?.[1]
        ?? path.split('/').filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' / ')
        ?? 'Unknown page';
}

function roleLabel(role: string) {
    if (role === 'guest') return 'Visitor';
    return role.charAt(0).toUpperCase() + role.slice(1);
}

function roleStyle(role: string) {
    if (role === 'delegate') return { color: C.accent, background: `${C.accent}12` };
    if (STAFF_ROLES.has(role)) return { color: C.purple, background: `${C.purple}12` };
    return { color: C.textSec, background: C.bg };
}

function activeDuration(firstSeen: number, now: number) {
    const minutes = Math.max(0, Math.floor((now - firstSeen) / 60_000));
    if (minutes < 1) return 'Just joined';
    if (minutes < 60) return `${minutes}m active`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m active`;
}

function DeviceIcon({ device }: { device: PresenceEntry['device'] }) {
    if (device === 'Mobile') return <Smartphone size={15} />;
    if (device === 'Tablet') return <Tablet size={15} />;
    return <Monitor size={15} />;
}

function Avatar({ entry }: { entry: PresenceEntry }) {
    const initials = entry.role === 'guest'
        ? 'V'
        : entry.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
    const color = entry.role === 'delegate' ? C.accent : STAFF_ROLES.has(entry.role) ? C.purple : C.textSec;
    return (
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${color}14`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
            {initials || 'U'}
        </div>
    );
}

type Filter = 'all' | 'delegate' | 'staff' | 'visitor';

export default function LiveUsersPage() {
    const [snapshot, setSnapshot] = useState<PresenceSnapshot | null>(null);
    const [connection, setConnection] = useState<'connecting' | 'live' | 'reconnecting'>('connecting');
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [now, setNow] = useState(0);

    const loadPresence = useCallback(async () => {
        try {
            const response = await fetch('/api/presence', { credentials: 'same-origin', cache: 'no-store' });
            const json = await response.json().catch(() => ({}));
            if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Could not load live users');
            setSnapshot(json.data);
            setNow(Date.now());
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load live users');
        }
    }, []);

    useEffect(() => {
        const initialLoad = window.setTimeout(() => void loadPresence(), 0);
        const stream = new EventSource('/api/presence/stream');
        stream.onopen = () => setConnection('live');
        stream.onmessage = event => {
            if (event.data === 'connected' || event.data === 'update') void loadPresence();
        };
        stream.onerror = () => setConnection('reconnecting');
        const fallback = window.setInterval(() => void loadPresence(), 15_000);
        const clock = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => {
            window.clearTimeout(initialLoad);
            stream.close();
            window.clearInterval(fallback);
            window.clearInterval(clock);
        };
    }, [loadPresence]);

    const filteredEntries = useMemo(() => {
        const query = search.trim().toLowerCase();
        return (snapshot?.entries ?? []).filter(entry => {
            const matchesFilter = filter === 'all'
                || (filter === 'delegate' && entry.role === 'delegate')
                || (filter === 'staff' && STAFF_ROLES.has(entry.role))
                || (filter === 'visitor' && entry.role === 'guest');
            const matchesSearch = !query || [entry.name, entry.role, pageName(entry.path), entry.device]
                .some(value => value.toLowerCase().includes(query));
            return matchesFilter && matchesSearch;
        });
    }, [snapshot?.entries, search, filter]);

    const pageActivity = useMemo(() => {
        const counts = new Map<string, number>();
        for (const entry of snapshot?.entries ?? []) {
            const label = pageName(entry.path);
            counts.set(label, (counts.get(label) ?? 0) + 1);
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    }, [snapshot?.entries]);

    const stats = [
        { label: 'Active Now', value: snapshot?.totalUsers ?? 0, note: `${snapshot?.totalSessions ?? 0} active session${snapshot?.totalSessions === 1 ? '' : 's'}`, Icon: Activity, color: C.green },
        { label: 'Delegates', value: snapshot?.delegates ?? 0, note: 'Signed-in delegates', Icon: Users, color: C.accent },
        { label: 'Staff', value: snapshot?.staff ?? 0, note: 'Admin and secretariat', Icon: ShieldCheck, color: C.purple },
        { label: 'Visitors', value: snapshot?.visitors ?? 0, note: 'Public website visitors', Icon: UserRound, color: C.amber },
    ];

    const connectionColor = connection === 'live' ? C.green : connection === 'reconnecting' ? C.amber : C.textMuted;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontFamily: '"Inter",system-ui,sans-serif' }}>
            <div className="live-users-titlebar">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text }}>Live Users</h1>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 999, background: `${connectionColor}12`, color: connectionColor, fontSize: 11, fontWeight: 700 }}>
                            <span className={connection === 'live' ? 'live-users-pulse' : ''} style={{ width: 7, height: 7, borderRadius: '50%', background: connectionColor }} />
                            {connection === 'live' ? 'Live' : connection === 'reconnecting' ? 'Reconnecting' : 'Connecting'}
                        </span>
                    </div>
                    <p style={{ marginTop: 4, fontSize: 14, color: C.textSec }}>See who is actively viewing the platform and where they are in real time.</p>
                </div>
                <button onClick={() => void loadPresence()} title="Refresh live users" aria-label="Refresh live users"
                    style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: C.shadow }}>
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="live-users-stats">
                {stats.map(({ label, value, note, Icon, color }) => (
                    <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, boxShadow: C.shadow, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>{label}</p>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}12`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} /></div>
                        </div>
                        <p style={{ marginTop: 10, fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 30, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</p>
                        <p style={{ marginTop: 5, fontSize: 11.5, color: C.textMuted }}>{note}</p>
                    </div>
                ))}
            </div>

            {error && (
                <div style={{ padding: '11px 14px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}>{error}</div>
            )}

            <div className="live-users-content">
                <section style={{ minWidth: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: C.shadow, overflow: 'hidden' }}>
                    <div className="live-users-toolbar">
                        <div>
                            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Active Sessions</h2>
                            <p style={{ marginTop: 2, fontSize: 11.5, color: C.textMuted }}>Visible tabs active within the last minute</p>
                        </div>
                        <div className="live-users-controls">
                            <div style={{ position: 'relative', minWidth: 0 }}>
                                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search users or pages"
                                    style={{ width: '100%', height: 36, padding: '0 11px 0 32px', borderRadius: 8, border: `1px solid ${C.border}`, outline: 'none', color: C.text, background: C.surface, fontSize: 12.5 }} />
                            </div>
                            <div className="live-users-filter" role="group" aria-label="Filter live users">
                                {(['all', 'delegate', 'staff', 'visitor'] as Filter[]).map(option => (
                                    <button key={option} onClick={() => setFilter(option)} aria-pressed={filter === option}
                                        style={{ minHeight: 32, padding: '0 10px', border: 'none', borderRadius: 6, background: filter === option ? C.surface : 'transparent', color: filter === option ? C.accent : C.textSec, boxShadow: filter === option ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', fontSize: 11.5, fontWeight: filter === option ? 700 : 500, cursor: 'pointer', textTransform: 'capitalize' }}>
                                        {option === 'all' ? 'All' : option === 'visitor' ? 'Visitors' : `${option}s`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="live-user-table-head">
                        <span>User</span><span>Current page</span><span>Device</span><span>Session</span>
                    </div>

                    {filteredEntries.length === 0 ? (
                        <div style={{ minHeight: 220, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${C.accent}0D`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Radio size={20} /></div>
                            <p style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: C.text }}>No matching live users</p>
                            <p style={{ marginTop: 4, maxWidth: 300, fontSize: 12.5, color: C.textMuted }}>Active visitors and signed-in users will appear here automatically.</p>
                        </div>
                    ) : filteredEntries.map(entry => {
                        const badge = roleStyle(entry.role);
                        return (
                            <div key={entry.clientId} className="live-user-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    <Avatar entry={entry} />
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ color: C.text, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</p>
                                        <span style={{ display: 'inline-flex', marginTop: 3, padding: '2px 7px', borderRadius: 999, background: badge.background, color: badge.color, fontSize: 9.5, fontWeight: 700 }}>{roleLabel(entry.role)}</span>
                                    </div>
                                </div>
                                <div className="live-user-page" style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, color: C.textSec }}>
                                    <Laptop size={14} style={{ color: C.accent, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pageName(entry.path)}</span>
                                </div>
                                <div className="live-user-device" style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textMuted, fontSize: 11.5 }}>
                                    <DeviceIcon device={entry.device} /> {entry.device}
                                </div>
                                <div className="live-user-session" style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textMuted, fontSize: 11.5, whiteSpace: 'nowrap' }}>
                                    <Clock3 size={13} /> {activeDuration(entry.firstSeen, now)}
                                </div>
                            </div>
                        );
                    })}
                </section>

                <aside style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, boxShadow: C.shadow, alignSelf: 'start' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Activity By Page</h2>
                    <p style={{ marginTop: 2, marginBottom: 18, fontSize: 11.5, color: C.textMuted }}>Active sessions across the platform</p>
                    {pageActivity.length === 0 ? (
                        <p style={{ padding: '28px 0', textAlign: 'center', fontSize: 12.5, color: C.textMuted }}>No page activity yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {pageActivity.slice(0, 8).map(([label, count]) => {
                                const max = pageActivity[0]?.[1] ?? 1;
                                return (
                                    <div key={label}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                                            <span style={{ minWidth: 0, color: C.textSec, fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                                            <span style={{ color: C.text, fontSize: 11.5, fontWeight: 700 }}>{count}</span>
                                        </div>
                                        <div style={{ height: 6, borderRadius: 999, background: C.bg, overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.max(8, (count / max) * 100)}%`, height: '100%', borderRadius: 999, background: C.accent }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </aside>
            </div>

            <style jsx>{`
                .live-users-titlebar { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
                .live-users-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
                .live-users-content { display:grid; grid-template-columns:minmax(0,1fr) 250px; gap:16px; align-items:start; }
                .live-users-toolbar { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:16px 18px; border-bottom:1px solid ${C.border}; }
                .live-users-controls { display:flex; align-items:center; gap:8px; }
                .live-users-filter { display:flex; align-items:center; gap:2px; padding:2px; border-radius:8px; background:${C.bg}; }
                .live-user-table-head, .live-user-row { display:grid; grid-template-columns:minmax(170px,1.35fr) minmax(140px,1fr) 90px 110px; gap:14px; align-items:center; }
                .live-user-table-head { padding:9px 18px; border-bottom:1px solid ${C.border}; background:#FAFBFC; color:${C.textMuted}; font-size:10px; font-weight:700; text-transform:uppercase; }
                .live-user-row { min-height:66px; padding:10px 18px; border-bottom:1px solid ${C.border}; }
                .live-user-row:last-child { border-bottom:0; }
                .live-users-pulse { animation:livePulse 1.8s ease-out infinite; }
                @keyframes livePulse { 0% { box-shadow:0 0 0 0 rgba(16,185,129,.35); } 70% { box-shadow:0 0 0 6px rgba(16,185,129,0); } 100% { box-shadow:0 0 0 0 rgba(16,185,129,0); } }
                @media (max-width: 980px) {
                    .live-users-stats { grid-template-columns:repeat(2,minmax(0,1fr)); }
                    .live-users-content { grid-template-columns:1fr; }
                }
                @media (max-width: 700px) {
                    .live-users-toolbar { flex-direction:column; }
                    .live-users-controls { width:100%; flex-direction:column; align-items:stretch; }
                    .live-users-filter { width:100%; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); }
                    .live-user-table-head { display:none; }
                    .live-user-row { grid-template-columns:minmax(0,1fr) auto; gap:9px 12px; padding:14px 16px; }
                    .live-user-page { grid-column:1 / -1; padding-left:48px; }
                    .live-user-device { grid-column:1; padding-left:48px; }
                    .live-user-session { grid-column:2; grid-row:1; }
                }
                @media (max-width: 480px) {
                    .live-users-stats { grid-template-columns:1fr 1fr; gap:10px; }
                    .live-user-device { display:none !important; }
                    .live-user-page { padding-left:48px; }
                }
            `}</style>
        </div>
    );
}
