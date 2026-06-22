'use client';

import React, { useState, useRef } from 'react';
import { Plus, X, Edit2, Trash2, Eye, EyeOff, Upload, ImageIcon, Star, Calendar, MapPin, Users, Clock, ChevronDown, ChevronUp, Hotel, BookOpen, Camera, Award } from 'lucide-react';
import { useConference, ConferenceEvent, EventDay, EventAgendaItem } from '@/context/ConferenceContext';
import { useToast } from '@/components/ui/Toast';
import { CertificatePreview } from '@/components/CertificateDownloadButton';
import { AcceptanceLetterPreview } from '@/components/AcceptanceLetterButton';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444', purple: '#7C5FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
    shadowModal: '0 20px 60px rgba(0,0,0,0.18)',
};

const AGENDA_TYPE_META: Record<string, { color: string; label: string }> = {
    plenary:   { color: C.purple, label: 'Plenary' },
    committee: { color: C.accent, label: 'Committee' },
    break:     { color: C.textMuted, label: 'Break' },
    ceremony:  { color: C.amber, label: 'Ceremony' },
    social:    { color: C.green, label: 'Social' },
    other:     { color: C.textSec, label: 'Other' },
};

function Inp({ label, value, onChange, placeholder, type = 'text', required }: {
    label: string; value: string | number; onChange: (v: string) => void;
    placeholder?: string; type?: string; required?: boolean;
}) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
            </label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
            />
        </div>
    );
}

const EMPTY_EVENT: Omit<ConferenceEvent, 'id' | 'createdAt'> = {
    title: '', subtitle: '', edition: '', startDate: '', endDate: '', venue: '', address: '',
    city: '', country: '', description: '', guidelines: [''], bannerUrl: '', galleryUrls: [],
    hotel: null, agenda: [], published: false, registrationDeadline: '', capacity: 300,
};

const EMPTY_HOTEL = {
    name: '', address: '', stars: 5, phone: '', website: '', imageUrl: '',
    description: '', checkIn: '14:00', checkOut: '12:00', pricePerNight: '', bookingNote: '',
};

export default function AdminEventsPage() {
    const { showToast } = useToast();
    const { events, addEvent, updateEvent, deleteEvent } = useConference();
    const [modal, setModal] = useState<{ open: boolean; event: ConferenceEvent | null }>({ open: false, event: null });
    const [form, setForm] = useState<Omit<ConferenceEvent, 'id' | 'createdAt'>>(EMPTY_EVENT);
    const [section, setSection] = useState<'basic' | 'details' | 'hotel' | 'agenda' | 'media' | 'certificates'>('basic');
    const [hasHotel, setHasHotel] = useState(false);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);
    const bannerRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const hotelImgRef = useRef<HTMLInputElement>(null);

    const openCreate = () => {
        setForm({ ...EMPTY_EVENT, guidelines: [''], agenda: [] });
        setHasHotel(false); setSection('basic'); setExpandedDay(null);
        setModal({ open: true, event: null });
    };
    const openEdit = (e: ConferenceEvent) => {
        setForm({ ...e }); setHasHotel(!!e.hotel);
        setSection('basic'); setExpandedDay(null);
        setModal({ open: true, event: e });
    };
    const closeModal = () => setModal({ open: false, event: null });

    const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(f => ({ ...f, [k]: v }));

    /* Compress image to JPEG ≤1200px wide at 0.78 quality — keeps data URLs small enough for localStorage */
    const compressImage = (file: File, maxWidth = 1200, quality = 0.78): Promise<string> =>
        new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                const scale = Math.min(1, maxWidth / img.width);
                const canvas = document.createElement('canvas');
                canvas.width  = Math.round(img.width  * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = url;
        });

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        e.target.value = '';
        try { set('bannerUrl', await compressImage(file, 1400)); }
        catch { showToast('Failed to process image', 'warning'); }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        const results = await Promise.all(files.map(f => compressImage(f, 800, 0.75)));
        setForm(f => ({ ...f, galleryUrls: [...f.galleryUrls, ...results] }));
    };

    const handleHotelImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        e.target.value = '';
        try { set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), imageUrl: await compressImage(file, 800) }); }
        catch { showToast('Failed to process image', 'warning'); }
    };

    const handleSave = () => {
        if (!form.title.trim() || !form.startDate || !form.venue.trim()) {
            showToast('Please fill in title, dates, and venue', 'warning'); return;
        }
        const data = { ...form, hotel: hasHotel ? (form.hotel ?? EMPTY_HOTEL) : null };
        if (modal.event) { updateEvent(modal.event.id, data); showToast('Event updated', 'success'); }
        else { addEvent(data); showToast('Event created', 'success'); }
        closeModal();
    };

    const handleDelete = (e: ConferenceEvent) => {
        if (!confirm(`Delete "${e.title}"? This cannot be undone.`)) return;
        deleteEvent(e.id); showToast('Event deleted', 'info');
    };

    const togglePublish = (e: ConferenceEvent) => {
        updateEvent(e.id, { published: !e.published });
        showToast(e.published ? 'Event unpublished' : 'Event published — delegates can now see it', e.published ? 'info' : 'success');
    };

    /* ── Guideline helpers ── */
    const updateGuideline = (i: number, v: string) => {
        const g = [...form.guidelines]; g[i] = v; set('guidelines', g);
    };
    const addGuideline    = () => set('guidelines', [...form.guidelines, '']);
    const removeGuideline = (i: number) => set('guidelines', form.guidelines.filter((_, idx) => idx !== i));

    /* ── Agenda helpers ── */
    const addDay = () => {
        const newDay: EventDay = { id: Date.now(), label: `Day ${form.agenda.length + 1}`, date: '', items: [] };
        set('agenda', [...form.agenda, newDay]);
        setExpandedDay(newDay.id);
    };
    const updateDay = (id: number, patch: Partial<EventDay>) =>
        set('agenda', form.agenda.map(d => d.id === id ? { ...d, ...patch } : d));
    const removeDay = (id: number) =>
        set('agenda', form.agenda.filter(d => d.id !== id));
    const addItem = (dayId: number) => {
        const newItem: EventAgendaItem = { id: Date.now(), time: '', title: '', description: '', location: '', type: 'other' };
        set('agenda', form.agenda.map(d => d.id === dayId ? { ...d, items: [...d.items, newItem] } : d));
    };
    const updateItem = (dayId: number, itemId: number, patch: Partial<EventAgendaItem>) =>
        set('agenda', form.agenda.map(d => d.id === dayId
            ? { ...d, items: d.items.map(it => it.id === itemId ? { ...it, ...patch } : it) } : d));
    const removeItem = (dayId: number, itemId: number) =>
        set('agenda', form.agenda.map(d => d.id === dayId
            ? { ...d, items: d.items.filter(it => it.id !== itemId) } : d));

    const TABS = [
        { key: 'basic',         label: 'Basic Info' },
        { key: 'details',       label: 'Description & Guidelines' },
        { key: 'hotel',         label: 'Hotel' },
        { key: 'agenda',        label: 'Agenda' },
        { key: 'media',         label: 'Media' },
        { key: 'certificates',  label: 'Certificates' },
    ] as const;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>Events</h1>
                    <p style={{ fontSize: 14, color: C.textSec }}>Create and manage conference events visible to delegates.</p>
                </div>
                <button onClick={openCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.accent, color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: `0 2px 8px ${C.accent}40` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                ><Plus size={15} /> New Event</button>
            </div>

            {/* Event cards */}
            {events.length === 0 ? (
                <div style={{ padding: 72, textAlign: 'center', background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <Star size={40} style={{ color: C.border, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 15, fontWeight: 500, color: C.textMuted }}>No events yet. Create your first conference event.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {events.map(ev => (
                        <div key={ev.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: C.shadow }}>
                            <div style={{ display: 'flex', gap: 0 }}>
                                {/* Banner strip */}
                                <div style={{ width: 6, flexShrink: 0, background: ev.published ? C.green : C.textMuted }} />
                                {/* Content */}
                                <div style={{ flex: 1, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                                    {/* Banner thumbnail */}
                                    <div style={{ width: 80, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {ev.bannerUrl
                                            ? <img src={ev.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <Star size={24} style={{ color: 'rgba(255,255,255,0.7)' }} />
                                        }
                                    </div>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{ev.title}</h3>
                                            {ev.edition && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: `${C.purple}12`, color: C.purple }}>{ev.edition}</span>}
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: ev.published ? `${C.green}12` : `${C.textMuted}12`, color: ev.published ? C.green : C.textMuted }}>
                                                {ev.published ? '● Published' : '○ Draft'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, color: C.textSec, marginBottom: 8 }}>{ev.subtitle}</p>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMuted }}>
                                                <Calendar size={12} /> {ev.startDate}{ev.endDate && ev.endDate !== ev.startDate ? ` → ${ev.endDate}` : ''}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMuted }}>
                                                <MapPin size={12} /> {ev.venue}{ev.city ? `, ${ev.city}` : ''}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMuted }}>
                                                <Users size={12} /> {ev.capacity} delegates
                                            </span>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                        <button onClick={() => togglePublish(ev)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 12, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = ev.published ? C.amber : C.green}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
                                        >{ev.published ? <EyeOff size={13} /> : <Eye size={13} />} {ev.published ? 'Unpublish' : 'Publish'}</button>
                                        <button onClick={() => openEdit(ev)}
                                            style={{ padding: 8, borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                        ><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(ev)}
                                            style={{ padding: 8, borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; (e.currentTarget as HTMLElement).style.borderColor = `${C.red}30`; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                                        ><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create / Edit Modal ── */}
            {modal.open && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 20px', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
                    <div style={{ background: C.surface, borderRadius: 16, width: '100%', maxWidth: 720, boxShadow: C.shadowModal, marginTop: 'auto', marginBottom: 'auto' }}>

                        {/* Modal header */}
                        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 18, fontWeight: 700, color: C.text }}>
                                {modal.event ? 'Edit Event' : 'New Event'}
                            </h3>
                            <button onClick={closeModal} style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            ><X size={18} /></button>
                        </div>

                        {/* Tab bar */}
                        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 28px', gap: 0, overflowX: 'auto' }}>
                            {TABS.map(t => (
                                <button key={t.key} onClick={() => setSection(t.key)}
                                    style={{ padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: section === t.key ? 600 : 400, color: section === t.key ? C.accent : C.textSec, borderBottom: section === t.key ? `2px solid ${C.accent}` : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' }}
                                >{t.label}</button>
                            ))}
                        </div>

                        {/* Tab body */}
                        <div style={{ padding: 28, maxHeight: '65vh', overflowY: 'auto' }}>

                            {/* ── BASIC INFO ── */}
                            {section === 'basic' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12 }}>
                                        <Inp label="Event Title" value={form.title} onChange={v => set('title', v)} placeholder="MYIMUN 2026" required />
                                        <Inp label="Edition" value={form.edition} onChange={v => set('edition', v)} placeholder="12th Annual" />
                                    </div>
                                    <Inp label="Subtitle" value={form.subtitle} onChange={v => set('subtitle', v)} placeholder="Model United Nations Conference" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                        <Inp label="Start Date" value={form.startDate} onChange={v => set('startDate', v)} type="date" required />
                                        <Inp label="End Date"   value={form.endDate}   onChange={v => set('endDate', v)}   type="date" />
                                        <Inp label="Registration Deadline" value={form.registrationDeadline} onChange={v => set('registrationDeadline', v)} type="date" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <Inp label="Venue Name" value={form.venue}   onChange={v => set('venue', v)}   placeholder="Royal Hotel Conference Center" required />
                                        <Inp label="Address"    value={form.address} onChange={v => set('address', v)} placeholder="12 Boulevard Mohammed V" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
                                        <Inp label="City"     value={form.city}     onChange={v => set('city', v)}     placeholder="Casablanca" />
                                        <Inp label="Country"  value={form.country}  onChange={v => set('country', v)}  placeholder="Morocco" />
                                        <Inp label="Capacity" value={form.capacity} onChange={v => set('capacity', Number(v))} type="number" />
                                    </div>
                                    {/* Published toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Publish Event</p>
                                            <p style={{ fontSize: 12, color: C.textMuted }}>Published events are visible to all delegates</p>
                                        </div>
                                        <button onClick={() => set('published', !form.published)}
                                            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.published ? C.green : '#D1D5DB', position: 'relative', transition: 'background .2s' }}>
                                            <span style={{ position: 'absolute', top: 2, left: form.published ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── DESCRIPTION & GUIDELINES ── */}
                            {section === 'details' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Event Description</label>
                                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={6}
                                            placeholder="Describe the conference — its purpose, theme, and what delegates can expect…"
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }}
                                            onFocus={e => e.target.style.borderColor = C.accent}
                                            onBlur={e => e.target.style.borderColor = C.border}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Delegate Guidelines</label>
                                            <button onClick={addGuideline} style={{ fontSize: 12, fontWeight: 600, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Plus size={13} /> Add Guideline
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {form.guidelines.map((g, i) => (
                                                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, width: 22, textAlign: 'right', flexShrink: 0 }}>{i + 1}.</span>
                                                    <input value={g} onChange={e => updateGuideline(i, e.target.value)} placeholder={`Guideline ${i + 1}…`}
                                                        style={{ flex: 1, padding: '8px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none' }}
                                                        onFocus={e => e.target.style.borderColor = C.accent}
                                                        onBlur={e => e.target.style.borderColor = C.border}
                                                    />
                                                    <button onClick={() => removeGuideline(i)}
                                                        style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.red; (e.currentTarget as HTMLElement).style.background = `${C.red}10`; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.textMuted; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                                    ><X size={13} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── HOTEL ── */}
                            {section === 'hotel' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Include Hotel / Accommodation Info</p>
                                            <p style={{ fontSize: 12, color: C.textMuted }}>Show hotel details to delegates on the events page</p>
                                        </div>
                                        <button onClick={() => { setHasHotel(!hasHotel); if (!hasHotel) set('hotel', { ...EMPTY_HOTEL }); }}
                                            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: hasHotel ? C.green : '#D1D5DB', position: 'relative', transition: 'background .2s' }}>
                                            <span style={{ position: 'absolute', top: 2, left: hasHotel ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                        </button>
                                    </div>
                                    {hasHotel && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            {/* Hotel banner image */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Hotel Image</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 80, height: 60, borderRadius: 10, border: `2px dashed ${C.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, flexShrink: 0 }}>
                                                        {form.hotel?.imageUrl ? <img src={form.hotel.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} style={{ color: C.textMuted }} />}
                                                    </div>
                                                    <button type="button" onClick={() => hotelImgRef.current?.click()}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 13, color: C.textSec, cursor: 'pointer' }}
                                                    ><Upload size={14} /> Upload Photo</button>
                                                    <input ref={hotelImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleHotelImgUpload} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12 }}>
                                                <Inp label="Hotel Name" value={form.hotel?.name ?? ''} onChange={v => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), name: v })} placeholder="Royal Atlantic Hotel" />
                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Stars</label>
                                                    <select value={form.hotel?.stars ?? 5} onChange={e => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), stars: Number(e.target.value) })}
                                                        style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none' }}>
                                                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <Inp label="Address" value={form.hotel?.address ?? ''} onChange={v => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), address: v })} placeholder="14 Avenue des FAR, Casablanca" />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <Inp label="Phone" value={form.hotel?.phone ?? ''} onChange={v => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), phone: v })} placeholder="+212 522 000 000" />
                                                <Inp label="Website" value={form.hotel?.website ?? ''} onChange={v => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), website: v })} placeholder="www.hotel.com" />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                                <Inp label="Check-in"  value={form.hotel?.checkIn ?? ''} onChange={v => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), checkIn: v })} placeholder="14:00" />
                                                <Inp label="Check-out" value={form.hotel?.checkOut ?? ''} onChange={v => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), checkOut: v })} placeholder="12:00" />
                                                <Inp label="Price / Night" value={form.hotel?.pricePerNight ?? ''} onChange={v => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), pricePerNight: v })} placeholder="$120 / night" />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Description</label>
                                                <textarea value={form.hotel?.description ?? ''} onChange={e => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), description: e.target.value })} rows={3}
                                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                                    onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Booking Note / Promo Code</label>
                                                <textarea value={form.hotel?.bookingNote ?? ''} onChange={e => set('hotel', { ...(form.hotel ?? EMPTY_HOTEL), bookingNote: e.target.value })} rows={2}
                                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                                    onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── AGENDA ── */}
                            {section === 'agenda' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <p style={{ fontSize: 13, color: C.textSec }}>Build the event agenda day by day.</p>
                                        <button onClick={addDay}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: 'none', background: C.accent, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                        ><Plus size={13} /> Add Day</button>
                                    </div>
                                    {form.agenda.length === 0 && (
                                        <div style={{ padding: 32, textAlign: 'center', background: C.bg, borderRadius: 10, border: `1px dashed ${C.border}` }}>
                                            <p style={{ fontSize: 13, color: C.textMuted }}>No agenda days yet. Click "Add Day" to start building.</p>
                                        </div>
                                    )}
                                    {form.agenda.map(day => (
                                        <div key={day.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FAFBFC', cursor: 'pointer' }}
                                                onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}>
                                                <button style={{ padding: 4, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}>{expandedDay === day.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
                                                <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
                                                    <input value={day.label} onChange={e => { e.stopPropagation(); updateDay(day.id, { label: e.target.value }); }} onClick={e => e.stopPropagation()}
                                                        style={{ fontSize: 13, fontWeight: 600, color: C.text, border: 'none', background: 'transparent', outline: 'none', width: 80 }} />
                                                    <input type="date" value={day.date} onChange={e => { e.stopPropagation(); updateDay(day.id, { date: e.target.value }); }} onClick={e => e.stopPropagation()}
                                                        style={{ fontSize: 12, color: C.textSec, border: 'none', background: 'transparent', outline: 'none' }} />
                                                    <span style={{ fontSize: 11, color: C.textMuted }}>{day.items.length} item{day.items.length !== 1 ? 's' : ''}</span>
                                                </div>
                                                <button onClick={e => { e.stopPropagation(); removeDay(day.id); }}
                                                    style={{ padding: 5, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.red}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMuted}
                                                ><Trash2 size={13} /></button>
                                            </div>
                                            {expandedDay === day.id && (
                                                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {day.items.map(item => (
                                                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 100px 28px', gap: 8, alignItems: 'start' }}>
                                                            <input value={item.time} onChange={e => updateItem(day.id, item.id, { time: e.target.value })} placeholder="09:00"
                                                                style={{ padding: '7px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text, background: C.bg, outline: 'none', textAlign: 'center' }}
                                                                onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
                                                            />
                                                            <input value={item.title} onChange={e => updateItem(day.id, item.id, { title: e.target.value })} placeholder="Session title…"
                                                                style={{ padding: '7px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text, background: C.bg, outline: 'none' }}
                                                                onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
                                                            />
                                                            <input value={item.location} onChange={e => updateItem(day.id, item.id, { location: e.target.value })} placeholder="Location…"
                                                                style={{ padding: '7px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text, background: C.bg, outline: 'none' }}
                                                                onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
                                                            />
                                                            <select value={item.type} onChange={e => updateItem(day.id, item.id, { type: e.target.value as EventAgendaItem['type'] })}
                                                                style={{ padding: '7px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text, background: C.bg, outline: 'none' }}>
                                                                {Object.entries(AGENDA_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                            </select>
                                                            <button onClick={() => removeItem(day.id, item.id)}
                                                                style={{ padding: 6, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted, alignSelf: 'center' }}
                                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.red}
                                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMuted}
                                                            ><X size={12} /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addItem(day.id)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0', fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                                    ><Plus size={12} /> Add Item</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── CERTIFICATES ── */}
                            {section === 'certificates' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {/* Info banner */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: `${C.purple}0D`, border: `1px solid ${C.purple}25`, borderRadius: 10 }}>
                                        <Award size={16} style={{ color: C.purple, flexShrink: 0 }} />
                                        <p style={{ fontSize: 13, color: C.purple, fontWeight: 500 }}>
                                            These settings control what appears on participation certificates issued to accepted delegates.
                                        </p>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <Inp label="Certificate Date" value={form.certDateDisplay ?? ''} onChange={v => set('certDateDisplay', v)} placeholder="September 15–18, 2026" />
                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Edition Number</label>
                                            <input type="number" min={1} max={99} value={form.certEditionNumber ?? ''} onChange={e => set('certEditionNumber', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="8"
                                                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                                                onFocus={e => e.target.style.borderColor = C.accent}
                                                onBlur={e => e.target.style.borderColor = C.border}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <Inp label="Certificate Location" value={form.certLocation ?? ''} onChange={v => set('certLocation', v)} placeholder="Marrakech" />
                                        <Inp label="Signatory Name" value={form.certSignatory ?? ''} onChange={v => set('certSignatory', v)} placeholder="Mustapha Ait Mbark" />
                                    </div>
                                    {/* Live preview */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Live Preview</label>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <CertificatePreview
                                                delegateName="Sample Delegate"
                                                eventDate={form.certDateDisplay || form.startDate || 'September 15–18, 2026'}
                                                location={form.certLocation || 'Marrakech'}
                                                signatory={form.certSignatory || 'Mustapha Ait Mbark'}
                                                edition={form.certEditionNumber}
                                                scale={0.46}
                                            />
                                        </div>
                                        <p style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 8 }}>
                                            Preview uses "Sample Delegate" — actual certificates use each delegate's name.
                                        </p>
                                    </div>

                                    {/* ── Acceptance Letter section ── */}
                                    <div style={{ borderTop: `2px dashed ${C.border}`, paddingTop: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 7, background: `${C.green}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: 14 }}>✉️</span>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Acceptance Letter</p>
                                                <p style={{ fontSize: 11, color: C.textMuted }}>Sent to delegates upon acceptance — auto-populated from event dates</p>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: 14 }}>
                                            <Inp label="Edition / Year" value={form.letterEditionYear ?? ''} onChange={v => set('letterEditionYear', v)} placeholder="8th Annual Edition 2026" />
                                            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>
                                                Shown as "MYIMUN [Edition/Year]" in the letter. Start &amp; end dates come from the Basic Info tab.
                                            </p>
                                        </div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Letter Preview</label>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <AcceptanceLetterPreview
                                                delegateName="Sample Delegate"
                                                editionYear={form.letterEditionYear || '8th Annual Edition 2026'}
                                                startDate={form.startDate || 'September 15, 2026'}
                                                endDate={form.endDate || 'September 18, 2026'}
                                                scale={0.38}
                                            />
                                        </div>
                                        <p style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 8 }}>
                                            Dates auto-fill from Basic Info. Preview uses "Sample Delegate".
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── MEDIA ── */}
                            {section === 'media' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {/* Banner */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Banner / Hero Image</label>
                                        <div style={{ borderRadius: 12, overflow: 'hidden', border: `2px dashed ${C.border}`, background: C.bg, position: 'relative', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            onClick={() => bannerRef.current?.click()}>
                                            {form.bannerUrl
                                                ? <img src={form.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                                                : <div style={{ textAlign: 'center' }}><Upload size={28} style={{ color: C.textMuted, margin: '0 auto 8px' }} /><p style={{ fontSize: 13, color: C.textMuted }}>Click to upload banner image</p></div>
                                            }
                                            {form.bannerUrl && (
                                                <button onClick={e => { e.stopPropagation(); set('bannerUrl', ''); }}
                                                    style={{ position: 'absolute', top: 8, right: 8, padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 11, cursor: 'pointer' }}>Remove</button>
                                            )}
                                        </div>
                                        <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
                                    </div>
                                    {/* Gallery */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Gallery Photos</label>
                                            <button onClick={() => galleryRef.current?.click()}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 7, background: C.bg, fontSize: 12, color: C.textSec, cursor: 'pointer' }}
                                            ><Camera size={13} /> Add Photos</button>
                                        </div>
                                        <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalleryUpload} />
                                        {form.galleryUrls.length === 0
                                            ? <div style={{ padding: 24, textAlign: 'center', background: C.bg, borderRadius: 10, border: `1px dashed ${C.border}` }}><p style={{ fontSize: 12, color: C.textMuted }}>No gallery photos yet</p></div>
                                            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                                                {form.galleryUrls.map((url, i) => (
                                                    <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '4/3' }}>
                                                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button onClick={() => set('galleryUrls', form.galleryUrls.filter((_, idx) => idx !== i))}
                                                            style={{ position: 'absolute', top: 4, right: 4, padding: '2px 4px', borderRadius: 4, border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, cursor: 'pointer' }}>✕</button>
                                                    </div>
                                                ))}
                                              </div>
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={closeModal}
                                style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 14, fontWeight: 500, color: C.textSec, cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >Cancel</button>
                            <button onClick={handleSave}
                                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: C.accent, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.accent}40` }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                            >{modal.event ? 'Save Changes' : 'Create Event'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
