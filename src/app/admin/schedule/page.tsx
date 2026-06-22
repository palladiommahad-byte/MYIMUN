'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Edit2, Trash2, Clock, MapPin, X, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference, ScheduleEvent } from '@/context/ConferenceContext';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
    overlay: 'rgba(17,24,39,0.35)',
};

const EVENT_TYPES = ['Logistics', 'Keynote', 'Break', 'Session', 'Special', 'Social', 'Excursion'];

const TYPE_COLOR: Record<string, { bg: string; color: string; border: string }> = {
    Logistics: { bg: `${C.accent}12`,    color: C.accent,   border: `${C.accent}30`   },
    Keynote:   { bg: '#7C5FFF14',        color: '#7C5FFF',  border: '#7C5FFF30'        },
    Break:     { bg: `${C.textMuted}12`, color: C.textSec,  border: `${C.textMuted}30` },
    Session:   { bg: `${C.green}12`,     color: C.green,    border: `${C.green}30`     },
    Special:   { bg: '#7C5FFF14',        color: '#7C5FFF',  border: '#7C5FFF30'        },
    Social:    { bg: '#EC489912',        color: '#EC4899',  border: '#EC489930'        },
    Excursion: { bg: `${C.amber}14`,     color: C.amber,    border: `${C.amber}30`     },
};

const EMPTY_FORM = {
    day: '', date: '', time: '', title: '', location: '', type: 'Session', description: '',
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

export default function AdminSchedulePage() {
    const { showToast } = useToast();
    const { scheduleEvents, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent } = useConference();

    const [modalOpen,   setModalOpen]   = useState(false);
    const [editId,      setEditId]      = useState<number | null>(null);
    const [form,        setForm]        = useState(EMPTY_FORM);
    const [deleteConf,  setDeleteConf]  = useState<number | null>(null);
    const [newDay,      setNewDay]      = useState(false);

    // Group and sort events by day
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

    // Unique days for the day picker dropdown
    const existingDays = useMemo(() =>
        days.map(d => ({ day: d.day, date: d.date })),
    [days]);

    const openAdd = () => {
        setEditId(null);
        setForm(EMPTY_FORM);
        setNewDay(false);
        setModalOpen(true);
    };

    const openEdit = (e: ScheduleEvent) => {
        setEditId(e.id);
        setForm({ day: e.day, date: e.date, time: e.time, title: e.title, location: e.location, type: e.type, description: e.description });
        setNewDay(false);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditId(null); setNewDay(false); };

    const handleDaySelect = (value: string) => {
        if (value === '__new__') {
            setNewDay(true);
            setForm(f => ({ ...f, day: '', date: '' }));
        } else {
            setNewDay(false);
            const found = existingDays.find(d => d.day === value);
            setForm(f => ({ ...f, day: value, date: found?.date ?? '' }));
        }
    };

    const save = () => {
        if (!form.day.trim() || !form.date.trim() || !form.time.trim() || !form.title.trim() || !form.location.trim()) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        if (editId !== null) {
            updateScheduleEvent(editId, form);
            showToast('Event updated successfully.', 'success');
        } else {
            addScheduleEvent(form);
            showToast('Event added to schedule.', 'success');
        }
        closeModal();
    };

    const confirmDelete = (id: number) => setDeleteConf(id);

    const doDelete = () => {
        if (deleteConf === null) return;
        deleteScheduleEvent(deleteConf);
        showToast('Event removed from schedule.', 'success');
        setDeleteConf(null);
    };

    const field = (label: string, key: keyof typeof EMPTY_FORM, placeholder: string, required = true) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>
                {label}{required && <span style={{ color: C.red }}> *</span>}
            </label>
            <input
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{
                    padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                    fontSize: 13, color: C.text, background: C.bg, outline: 'none',
                    fontFamily: 'inherit',
                }}
                onFocus={e => (e.target.style.borderColor = C.accent)}
                onBlur={e  => (e.target.style.borderColor = C.border)}
            />
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                        Schedule Manager
                    </h1>
                    <p style={{ fontSize: 14, color: C.textSec }}>
                        Plan and update the conference itinerary. Changes sync instantly to delegates.
                    </p>
                </div>
                <button onClick={openAdd} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600,
                    boxShadow: `0 2px 8px ${C.accent}40`,
                }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                >
                    <Plus size={15} /> Add Event
                </button>
            </div>

            {/* Day cards */}
            {days.length === 0 ? (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '56px 24px', textAlign: 'center', boxShadow: C.shadow }}>
                    <Calendar size={40} style={{ color: C.border, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 15, fontWeight: 500, color: C.textMuted }}>No schedule events yet.</p>
                    <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Click "Add Event" to build your conference itinerary.</p>
                </div>
            ) : days.map((dayGroup, di) => (
                <div key={dayGroup.day} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>

                    {/* Day header */}
                    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, background: '#FAFBFC' }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                            background: 'linear-gradient(135deg, #1A3A8F, #3B7FFF)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{di + 1}</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{dayGroup.day}</p>
                            <p style={{ fontSize: 12, color: C.textMuted }}>{dayGroup.date}</p>
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
                            {dayGroup.events.length} event{dayGroup.events.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Events */}
                    <div>
                        {dayGroup.events.map((event, idx) => {
                            const tc = TYPE_COLOR[event.type] || TYPE_COLOR.Logistics;
                            return (
                                <div key={event.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 16,
                                        padding: '14px 20px',
                                        borderBottom: idx < dayGroup.events.length - 1 ? `1px solid ${C.border}` : 'none',
                                        transition: 'background .12s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                >
                                    {/* Time */}
                                    <div style={{ width: 88, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Clock size={12} style={{ color: C.accent, flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: 'monospace' }}>{event.time}</span>
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{event.title}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: C.textSec }}>
                                                <MapPin size={11} style={{ color: C.textMuted }} /> {event.location}
                                            </span>
                                            <span style={{ color: C.border }}>·</span>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                                                padding: '2px 7px', borderRadius: 4,
                                                background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                                            }}>{event.type}</span>
                                            {event.description && (
                                                <span style={{ fontSize: 12, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
                                                    {event.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                        <button onClick={() => openEdit(event)} title="Edit event"
                                            style={{ padding: 7, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                        ><Edit2 size={14} /></button>
                                        <button onClick={() => confirmDelete(event.id)} title="Delete event"
                                            style={{ padding: 7, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                        ><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* ── Add / Edit modal ── */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                }} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div style={{
                        background: C.surface, borderRadius: 16, width: '100%', maxWidth: 540,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden',
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                    }}>
                        {/* Modal header */}
                        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                                {editId !== null ? 'Edit Event' : 'Add New Event'}
                            </p>
                            <button onClick={closeModal} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                            ><X size={18} /></button>
                        </div>

                        {/* Modal body */}
                        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Day selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>
                                    Day <span style={{ color: C.red }}>*</span>
                                </label>
                                <select
                                    value={newDay ? '__new__' : (form.day || '')}
                                    onChange={e => handleDaySelect(e.target.value)}
                                    style={{
                                        padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                                        fontSize: 13, color: C.text, background: C.bg, outline: 'none', cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <option value="">Select a day…</option>
                                    {existingDays.map(d => (
                                        <option key={d.day} value={d.day}>{d.day} — {d.date}</option>
                                    ))}
                                    <option value="__new__">+ Create new day…</option>
                                </select>
                            </div>

                            {/* New day fields */}
                            {newDay && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 16px', background: `${C.accent}06`, borderRadius: 8, border: `1px solid ${C.accent}20` }}>
                                    {field('Day Label', 'day', 'e.g. Day 5')}
                                    {field('Date', 'date', 'e.g. Tuesday, Oct 16')}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {field('Time', 'time', 'e.g. 09:00 AM')}

                                {/* Type select */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>
                                        Type <span style={{ color: C.red }}>*</span>
                                    </label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        style={{
                                            padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                                            fontSize: 13, color: C.text, background: C.bg, outline: 'none', cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {field('Event Title', 'title', 'e.g. Committee Session I')}
                            {field('Location', 'location', 'e.g. Breakout Rooms')}

                            {/* Description textarea */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Brief description visible to delegates…"
                                    rows={3}
                                    style={{
                                        padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                                        fontSize: 13, color: C.text, background: C.bg, outline: 'none',
                                        resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                                    }}
                                    onFocus={e => (e.target.style.borderColor = C.accent)}
                                    onBlur={e  => (e.target.style.borderColor = C.border)}
                                />
                            </div>

                            {/* Preview badge */}
                            {form.type && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                                    <span style={{ fontSize: 11, color: C.textMuted }}>Preview:</span>
                                    {(() => {
                                        const tc = TYPE_COLOR[form.type] || TYPE_COLOR.Logistics;
                                        return (
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                                                padding: '2px 8px', borderRadius: 4,
                                                background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                                            }}>{form.type}</span>
                                        );
                                    })()}
                                    {form.time && <span style={{ fontSize: 12, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} style={{ color: C.accent }} />{form.time}</span>}
                                    {form.location && <span style={{ fontSize: 12, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} style={{ color: C.accent }} />{form.location}</span>}
                                </div>
                            )}
                        </div>

                        {/* Modal footer */}
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#FAFBFC' }}>
                            <button onClick={closeModal} style={{
                                padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`,
                                background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={save} style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '9px 20px', borderRadius: 8, border: 'none',
                                background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            }}><Check size={14} /> {editId !== null ? 'Save Changes' : 'Add Event'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete confirmation modal ── */}
            {deleteConf !== null && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                }}>
                    <div style={{
                        background: C.surface, borderRadius: 14, width: '100%', maxWidth: 380,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 28,
                    }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <Trash2 size={20} style={{ color: C.red }} />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Delete Event?</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5, marginBottom: 24 }}>
                            This event will be permanently removed from the schedule and delegates will no longer see it.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConf(null)} style={{
                                padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`,
                                background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={doDelete} style={{
                                padding: '9px 18px', borderRadius: 8, border: 'none',
                                background: C.red, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
