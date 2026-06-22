'use client';

import React, { useState } from 'react';
import { Megaphone, Send, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', amber: '#F59E0B',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const HISTORY = [
    { msg: 'Committee Session I will begin in 15 minutes.', time: '10:45 AM', type: 'Urgent' },
    { msg: 'Lunch is now being served in the Grand Hall.',  time: '01:00 PM', type: 'Info'   },
];

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
    Urgent: { bg: `${C.amber}15`, color: C.amber   },
    Info:   { bg: `${C.accent}12`, color: C.accent },
};

export default function AdminAnnouncementsPage() {
    const { showToast } = useToast();
    const [message, setMessage] = useState('');

    const handleBroadcast = () => {
        if (!message.trim()) {
            showToast('Please enter a message to broadcast', 'warning');
            return;
        }
        showToast('Announcement broadcasted to all delegates', 'success');
        setMessage('');
    };

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Page header */}
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                    Broadcasts
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Send announcements to all delegates instantly.</p>
            </div>

            {/* Compose card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px', boxShadow: C.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Megaphone size={15} style={{ color: C.accent }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>New Announcement</span>
                </div>

                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your message here…"
                    style={{
                        width: '100%', minHeight: 120, padding: 14,
                        border: `1px solid ${C.border}`, borderRadius: 8,
                        fontSize: 14, color: C.text, background: C.bg,
                        resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                        boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.border}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                        onClick={handleBroadcast}
                        className="flex items-center gap-2 font-semibold text-sm text-white"
                        style={{ background: C.accent, padding: '9px 20px', borderRadius: 8, boxShadow: `0 2px 8px ${C.accent}40` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                    >
                        <Send size={14} /> Broadcast Now
                    </button>
                </div>
            </div>

            {/* History */}
            <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Recent Broadcasts
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {HISTORY.map((item, i) => {
                        const ts = TYPE_STYLE[item.type] || TYPE_STYLE.Info;
                        return (
                            <div key={i}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                                    background: C.surface, border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: '14px 18px', boxShadow: C.shadow,
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>{item.msg}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={11} style={{ color: C.textMuted }} />
                                        <span style={{ fontSize: 12, color: C.textMuted }}>{item.time}</span>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                                    padding: '3px 10px', borderRadius: 999,
                                    background: ts.bg, color: ts.color,
                                    flexShrink: 0,
                                }}>{item.type}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
