'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ClipboardList, CreditCard, FileText, Shield, MessageSquare, CheckCheck, BellOff } from 'lucide-react';
import { useConference, AppNotification } from '@/context/ConferenceContext';

const C = {
    surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', red: '#EF4444', bg: '#F4F5F7',
    shadow: '0 12px 32px rgba(17,24,39,0.14)',
};

function iconFor(type: string): { Icon: React.ElementType; color: string } {
    if (type.startsWith('registration')) return { Icon: ClipboardList, color: C.accent };
    if (type.startsWith('payment'))      return { Icon: CreditCard,    color: '#10B981' };
    if (type.startsWith('paper'))        return { Icon: FileText,      color: '#7C5FFF' };
    if (type.startsWith('committee'))    return { Icon: Shield,        color: '#00A8CC' };
    if (type.startsWith('message'))      return { Icon: MessageSquare, color: '#F59E0B' };
    return { Icon: Bell, color: C.textMuted };
}

export function NotificationBell({ dark = false }: { dark?: boolean }) {
    const { notifications, markNotificationRead, markAllNotificationsRead, refreshNotifications } = useConference();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggle = () => {
        if (!open) refreshNotifications();
        setOpen(o => !o);
    };

    const openNotification = (n: AppNotification) => {
        if (!n.read) markNotificationRead(n.id);
        setOpen(false);
        if (n.link) router.push(n.link);
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button onClick={toggle} title="Notifications"
                style={{
                    position: 'relative', width: 36, height: 36, borderRadius: 10, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                    background: dark ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: dark ? '#fff' : C.textSec,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.18)' : C.bg; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 3, right: 3, minWidth: 16, height: 16, borderRadius: 999,
                        background: C.red, color: '#fff', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                        border: `2px solid ${dark ? '#1A3A8F' : C.surface}`,
                    }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 360, maxWidth: '90vw',
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow,
                    zIndex: 300, overflow: 'hidden', fontFamily: '"Inter",system-ui,sans-serif',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Notifications</p>
                        {unreadCount > 0 && (
                            <button onClick={markAllNotificationsRead}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <CheckCheck size={13} /> Mark all read
                            </button>
                        )}
                    </div>
                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <BellOff size={26} style={{ color: C.border, margin: '0 auto 10px' }} />
                                <p style={{ fontSize: 13, color: C.textMuted }}>No notifications yet.</p>
                            </div>
                        ) : notifications.map(n => {
                            const { Icon, color } = iconFor(n.type);
                            return (
                                <button key={n.id} onClick={() => openNotification(n)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 16px',
                                        border: 'none', borderBottom: `1px solid ${C.border}`, background: n.read ? 'transparent' : `${C.accent}06`,
                                        cursor: 'pointer', textAlign: 'left',
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : `${C.accent}06`}
                                >
                                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={15} style={{ color }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <p style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: C.text, flex: 1 }}>{n.title}</p>
                                            {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />}
                                        </div>
                                        <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.45, marginTop: 2 }}>{n.message}</p>
                                        <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{n.createdAt}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
