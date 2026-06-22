'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, List, LayoutList, Calendar } from 'lucide-react';
import { useConference, ScheduleEvent } from '@/context/ConferenceContext';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const TYPE_COLOR: Record<string, { bg: string; color: string; border: string }> = {
    Logistics: { bg: `${C.accent}12`,    color: C.accent,   border: `${C.accent}30`   },
    Keynote:   { bg: '#7C5FFF14',        color: '#7C5FFF',  border: '#7C5FFF30'        },
    Break:     { bg: `${C.textMuted}12`, color: C.textSec,  border: `${C.textMuted}30` },
    Session:   { bg: `${C.green}12`,     color: C.green,    border: `${C.green}30`     },
    Special:   { bg: '#7C5FFF14',        color: '#7C5FFF',  border: '#7C5FFF30'        },
    Social:    { bg: '#EC489912',        color: '#EC4899',  border: '#EC489930'        },
    Excursion: { bg: `${C.amber}14`,     color: C.amber,    border: `${C.amber}30`     },
};

function parse12h(t: string): number {
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return 0;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    const pm = m[3].toUpperCase() === 'PM';
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    return h * 60 + min;
}

export default function DashboardSchedulePage() {
    const { scheduleEvents } = useConference();
    const [view, setView] = useState<'timeline' | 'table'>('timeline');

    const days = useMemo(() => {
        const map = new Map<string, { day: string; date: string; events: ScheduleEvent[] }>();
        scheduleEvents.forEach(e => {
            if (!map.has(e.day)) map.set(e.day, { day: e.day, date: e.date, events: [] });
            map.get(e.day)!.events.push(e);
        });
        map.forEach(d => d.events.sort((a, b) => parse12h(a.time) - parse12h(b.time)));
        return Array.from(map.values()).sort((a, b) => {
            const n1 = parseInt(a.day.replace(/\D/g, '') || '0');
            const n2 = parseInt(b.day.replace(/\D/g, '') || '0');
            return n1 - n2;
        });
    }, [scheduleEvents]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                        Conference Schedule
                    </h1>
                    <p style={{ fontSize: 14, color: C.textSec }}>Keep track of your sessions and events.</p>
                </div>
                {/* View toggle */}
                <div style={{ display: 'inline-flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3, gap: 3, boxShadow: C.shadow }}>
                    {([['timeline', LayoutList, 'Timeline'], ['table', List, 'Table']] as const).map(([v, Icon, label]) => (
                        <button key={v} onClick={() => setView(v)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                fontSize: 13, fontWeight: 600,
                                background: view === v ? C.accent : 'transparent',
                                color: view === v ? 'white' : C.textSec,
                                transition: 'all .15s',
                            }}
                        >
                            <Icon size={14} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty state */}
            {days.length === 0 && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '56px 24px', textAlign: 'center', boxShadow: C.shadow }}>
                    <Calendar size={40} style={{ color: C.border, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 15, fontWeight: 500, color: C.textMuted }}>No schedule published yet.</p>
                    <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Check back soon — the admin team will update the itinerary shortly.</p>
                </div>
            )}

            {/* Days */}
            {days.map((dayGroup, di) => (
                <div key={dayGroup.day}>
                    {/* Sticky day header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                        position: 'sticky', top: 0, zIndex: 10,
                        background: C.bg, paddingTop: 8, paddingBottom: 12,
                        borderBottom: `1px solid ${C.border}`,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                            background: 'linear-gradient(135deg, #1A3A8F, #3B7FFF)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{di + 1}</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{dayGroup.day}</p>
                            <p style={{ fontSize: 13, color: C.textSec }}>{dayGroup.date}</p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {view === 'timeline' ? (
                            <div key={`tl-${dayGroup.day}`} style={{ position: 'relative', borderLeft: `2px solid ${C.border}`, marginLeft: 18, paddingBottom: 8 }}>
                                {dayGroup.events.map((event, i) => {
                                    const tc = TYPE_COLOR[event.type] || TYPE_COLOR.Logistics;
                                    return (
                                        <motion.div key={event.id}
                                            initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                                            style={{ position: 'relative', paddingLeft: 28, marginBottom: 12 }}
                                        >
                                            {/* Timeline dot */}
                                            <div style={{
                                                position: 'absolute', left: -9, top: 18,
                                                width: 14, height: 14, borderRadius: '50%',
                                                background: C.surface, border: `3px solid ${C.accent}`,
                                            }} />
                                            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', boxShadow: C.shadow }}
                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#CDD3DE'}
                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
                                            >
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                                                        padding: '2px 8px', borderRadius: 4,
                                                        background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                                                    }}>{event.type}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textSec }}>
                                                        <Clock size={12} style={{ color: C.accent }} /> {event.time}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textSec }}>
                                                        <MapPin size={12} style={{ color: C.accent }} /> {event.location}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{event.title}</p>
                                                {event.description && (
                                                    <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>{event.description}</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div key={`tb-${dayGroup.day}`} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#FAFBFC', borderBottom: `1px solid ${C.border}` }}>
                                            {['Time', 'Event Details', 'Type'].map((h, i) => (
                                                <th key={h} style={{
                                                    padding: '10px 18px', fontSize: 11, fontWeight: 600, color: C.textMuted,
                                                    textTransform: 'uppercase', letterSpacing: '0.07em',
                                                    textAlign: i === 2 ? 'right' : 'left',
                                                    width: i === 0 ? 110 : i === 2 ? 110 : 'auto',
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dayGroup.events.map((event, i) => {
                                            const tc = TYPE_COLOR[event.type] || TYPE_COLOR.Logistics;
                                            return (
                                                <tr key={event.id}
                                                    style={{ borderBottom: i < dayGroup.events.length - 1 ? `1px solid ${C.border}` : 'none', verticalAlign: 'top' }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                                >
                                                    <td style={{ padding: '13px 18px' }}>
                                                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{event.time}</p>
                                                        <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{event.location}</p>
                                                    </td>
                                                    <td style={{ padding: '13px 18px' }}>
                                                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{event.title}</p>
                                                        {event.description && (
                                                            <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{event.description}</p>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                                                            padding: '3px 8px', borderRadius: 4,
                                                            background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                                                            whiteSpace: 'nowrap',
                                                        }}>{event.type}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}
