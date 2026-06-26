'use client';

import React, { useState } from 'react';
import { Megaphone, Send, Clock, Users, CheckCircle2, CircleDashed, AlertTriangle, Info, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference } from '@/context/ConferenceContext';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', amber: '#F59E0B', green: '#10B981', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const AUDIENCES = [
    { key: 'all',    label: 'All Delegates',  sub: 'Everyone registered',     Icon: Users,        color: C.accent },
    { key: 'paid',   label: 'Paid',           sub: 'Completed payment',       Icon: CheckCircle2, color: C.green  },
    { key: 'unpaid', label: 'Unpaid',         sub: 'Payment still pending',   Icon: CircleDashed, color: C.amber  },
] as const;

const LEVELS = [
    { key: 'info',   label: 'Info',   Icon: Info,           color: C.accent },
    { key: 'urgent', label: 'Urgent', Icon: AlertTriangle,  color: C.amber  },
] as const;

const AUDIENCE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
    all:    { label: 'All Delegates', bg: `${C.accent}12`, color: C.accent },
    paid:   { label: 'Paid',          bg: `${C.green}14`,  color: C.green  },
    unpaid: { label: 'Unpaid',        bg: `${C.amber}15`,  color: C.amber  },
};

export default function AdminAnnouncementsPage() {
    const { showToast } = useToast();
    const { announcements, sendBroadcast, deleteAnnouncement } = useConference();

    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [level, setLevel] = useState<'info' | 'urgent'>('info');
    const [sending, setSending] = useState(false);

    const handleBroadcast = async () => {
        if (!message.trim()) { showToast('Please enter a message to broadcast', 'warning'); return; }
        setSending(true);
        try {
            await sendBroadcast(message.trim(), audience, level);
            const aud = AUDIENCES.find(a => a.key === audience)!;
            showToast(`Broadcast sent to ${aud.label.toLowerCase() === 'all delegates' ? 'all delegates' : aud.label.toLowerCase() + ' delegates'}`, 'success');
            setMessage('');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not send broadcast', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                    Broadcasts
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Send targeted announcements that appear on delegates&apos; dashboards instantly.</p>
            </div>

            {/* Compose card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, boxShadow: C.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Megaphone size={15} style={{ color: C.accent }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>New Announcement</span>
                </div>

                {/* Audience selector */}
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Send to</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                    {AUDIENCES.map(a => {
                        const active = audience === a.key;
                        return (
                            <button key={a.key} type="button" onClick={() => setAudience(a.key)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                    border: `1.5px solid ${active ? a.color : C.border}`, background: active ? `${a.color}0E` : C.bg, transition: 'all .12s',
                                }}>
                                <a.Icon size={17} style={{ color: active ? a.color : C.textMuted }} />
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: active ? a.color : C.text }}>{a.label}</span>
                                <span style={{ fontSize: 11.5, color: C.textMuted }}>{a.sub}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Level selector */}
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Priority</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    {LEVELS.map(l => {
                        const active = level === l.key;
                        return (
                            <button key={l.key} type="button" onClick={() => setLevel(l.key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                                    border: `1.5px solid ${active ? l.color : C.border}`, background: active ? `${l.color}0E` : C.bg,
                                    fontSize: 13, fontWeight: 600, color: active ? l.color : C.textSec,
                                }}>
                                <l.Icon size={14} /> {l.label}
                            </button>
                        );
                    })}
                </div>

                {/* Message */}
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Message</label>
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your announcement here…"
                    maxLength={1000}
                    style={{
                        width: '100%', minHeight: 110, padding: 14, border: `1px solid ${C.border}`, borderRadius: 8,
                        fontSize: 14, color: C.text, background: C.bg, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.border}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                    <span style={{ fontSize: 12, color: C.textMuted }}>{message.length}/1000</span>
                    <button
                        onClick={handleBroadcast}
                        disabled={sending}
                        className="flex items-center gap-2 font-semibold text-sm text-white"
                        style={{ background: C.accent, padding: '10px 22px', borderRadius: 8, boxShadow: `0 2px 8px ${C.accent}40`, opacity: sending ? 0.7 : 1, cursor: sending ? 'default' : 'pointer', border: 'none' }}
                        onMouseEnter={e => { if (!sending) (e.currentTarget as HTMLElement).style.background = '#2C6FEF'; }}
                        onMouseLeave={e => { if (!sending) (e.currentTarget as HTMLElement).style.background = C.accent; }}
                    >
                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {sending ? 'Sending…' : 'Broadcast Now'}
                    </button>
                </div>
            </div>

            {/* History */}
            <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Recent Broadcasts
                </p>
                {announcements.length === 0 ? (
                    <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: '32px 20px', textAlign: 'center' }}>
                        <Megaphone size={22} style={{ color: C.border, margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 13, color: C.textMuted }}>No broadcasts yet. Your sent announcements will appear here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {announcements.map(item => {
                            const ab = AUDIENCE_BADGE[item.audience] || AUDIENCE_BADGE.all;
                            const urgent = item.level === 'urgent';
                            return (
                                <div key={item.id}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
                                        background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${urgent ? C.amber : C.accent}`,
                                        borderRadius: 10, padding: '14px 18px', boxShadow: C.shadow,
                                    }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 8, lineHeight: 1.5 }}>{item.message}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 9px', borderRadius: 999, background: ab.bg, color: ab.color }}>{ab.label}</span>
                                            {urgent && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 9px', borderRadius: 999, background: `${C.amber}15`, color: C.amber }}>
                                                    <AlertTriangle size={10} /> Urgent
                                                </span>
                                            )}
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textMuted }}>
                                                <Clock size={11} /> {item.createdAt}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteAnnouncement(item.id)} title="Delete broadcast"
                                        style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', flexShrink: 0 }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
