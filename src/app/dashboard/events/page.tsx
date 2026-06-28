'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Clock, Hotel, BookOpen, ChevronDown, ChevronUp, Star, ImageIcon, ClipboardList, CreditCard, Lock, ArrowRight } from 'lucide-react';
import { useConference, ConferenceEvent, ScheduleEvent } from '@/context/ConferenceContext';
import { useAuth } from '@/auth/AuthContext';
import { Countdown } from '@/components/ui/Countdown';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444', purple: '#7C5FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
};

const SCHEDULE_TYPE_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
    session:   { bg: `${C.accent}12`,  text: C.accent,   dot: C.accent },
    keynote:   { bg: `${C.purple}12`,  text: C.purple,   dot: C.purple },
    ceremony:  { bg: `${C.purple}12`,  text: C.purple,   dot: C.purple },
    social:    { bg: `${C.green}12`,   text: C.green,    dot: C.green },
    special:   { bg: `${C.green}12`,   text: C.green,    dot: C.green },
    break:     { bg: '#F3F4F6',        text: C.textMuted, dot: C.textMuted },
    logistics: { bg: `${C.amber}12`,   text: C.amber,    dot: C.amber },
    excursion: { bg: `${C.amber}12`,   text: C.amber,    dot: C.amber },
    other:     { bg: `${C.textSec}12`, text: C.textSec,  dot: C.textSec },
};

function getScheduleTypeStyle(type: string) {
    return SCHEDULE_TYPE_STYLE[type.toLowerCase()] ?? SCHEDULE_TYPE_STYLE.other;
}

function groupByDay(events: ScheduleEvent[]): { day: string; date: string; items: ScheduleEvent[] }[] {
    const map = new Map<string, { date: string; items: ScheduleEvent[] }>();
    for (const e of events) {
        if (!map.has(e.day)) map.set(e.day, { date: e.date, items: [] });
        map.get(e.day)!.items.push(e);
    }
    return Array.from(map.entries()).map(([day, { date, items }]) => ({ day, date, items }));
}

function StarRating({ count }: { count: number }) {
    return (
        <span style={{ display: 'inline-flex', gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} fill={i < count ? C.amber : 'none'} style={{ color: i < count ? C.amber : '#D1D5DB' }} />
            ))}
        </span>
    );
}

function InfoBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 20px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, flex: 1, minWidth: 140 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.accent }}>
                <Icon size={15} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textMuted }}>{label}</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{value}</p>
        </div>
    );
}

function EventDetail({ event }: { event: ConferenceEvent }) {
    const { scheduleEvents } = useConference();
    const scheduleDays = groupByDay(scheduleEvents);
    const [openDay, setOpenDay] = useState<string | null>(scheduleDays[0]?.day ?? null);
    const [lightbox, setLightbox] = useState<string | null>(null);

    const dateStr = event.endDate && event.endDate !== event.startDate
        ? `${event.startDate} – ${event.endDate}` : event.startDate;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Hero Banner */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 28, height: 260, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})` }}>
                {event.bannerUrl && (
                    <img src={event.bannerUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {/* Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }} />
                {/* Edition badge */}
                {event.edition && (
                    <div style={{ position: 'absolute', top: 20, left: 20, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>
                        {event.edition}
                    </div>
                )}
                {/* Published badge */}
                <div style={{ position: 'absolute', top: 20, right: 20, padding: '4px 10px', borderRadius: 999, background: event.published ? `${C.green}CC` : '#00000088', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: 'white' }}>
                    {event.published ? '● Live' : '○ Draft'}
                </div>
                {/* Title */}
                <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                    <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 800, fontSize: 28, color: 'white', marginBottom: 6, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                        {event.title}
                    </h2>
                    {event.subtitle && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>{event.subtitle}</p>}
                </div>
            </div>

            {/* Countdown — tied directly to this event's start date (Admin → Events) */}
            {event.startDate && (
                <section style={{ background: C.surface, borderRadius: 14, padding: '20px 24px', border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: C.shadow }}>
                    <Countdown target={event.startDate} label="Conference begins in" />
                </section>
            )}

            {/* Info badges row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
                <InfoBadge icon={Calendar} label="Dates" value={dateStr || 'TBA'} />
                <InfoBadge icon={MapPin}   label="Venue" value={[event.venue, event.city].filter(Boolean).join(' · ') || 'TBA'} />
                <InfoBadge icon={Users}    label="Capacity" value={`${event.capacity} delegates`} />
                {event.registrationDeadline && <InfoBadge icon={Clock} label="Deadline" value={event.registrationDeadline} />}
            </div>

            {/* Description */}
            {event.description && (
                <section style={{ background: C.surface, borderRadius: 14, padding: '24px 28px', border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: C.shadow }}>
                    <h3 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 3, height: 18, background: C.accent, borderRadius: 2, display: 'inline-block' }} />
                        About This Conference
                    </h3>
                    <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{event.description}</p>
                </section>
            )}

            {/* Hotel */}
            {event.hotel && (
                <section style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: C.shadow, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: 0 }}>
                        {/* Hotel image */}
                        <div style={{ width: 180, flexShrink: 0, background: `linear-gradient(135deg, ${C.accent}22, ${C.purple}22)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                            {event.hotel.imageUrl
                                ? <img src={event.hotel.imageUrl} alt={event.hotel.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Hotel size={36} style={{ color: `${C.accent}60` }} />
                            }
                        </div>
                        {/* Hotel info */}
                        <div style={{ flex: 1, padding: '24px 28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Hotel size={15} style={{ color: C.accent }} />
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textMuted }}>Official Hotel</span>
                            </div>
                            <h3 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>{event.hotel.name}</h3>
                            <div style={{ marginBottom: 12 }}><StarRating count={event.hotel.stars} /></div>
                            {event.hotel.description && (
                                <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.65, marginBottom: 14 }}>{event.hotel.description}</p>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                                {event.hotel.address && (
                                    <div style={{ fontSize: 12, color: C.textSec }}>
                                        <span style={{ fontWeight: 600, color: C.text, display: 'block', marginBottom: 2 }}>Address</span>
                                        {event.hotel.address}
                                    </div>
                                )}
                                {event.hotel.checkIn && (
                                    <div style={{ fontSize: 12, color: C.textSec }}>
                                        <span style={{ fontWeight: 600, color: C.text, display: 'block', marginBottom: 2 }}>Check-in / Check-out</span>
                                        {event.hotel.checkIn} · {event.hotel.checkOut}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Guidelines */}
            {event.guidelines.filter(g => g.trim()).length > 0 && (
                <section style={{ background: C.surface, borderRadius: 14, padding: '24px 28px', border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: C.shadow }}>
                    <h3 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={16} style={{ color: C.accent }} />
                        Delegate Guidelines
                    </h3>
                    <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {event.guidelines.filter(g => g.trim()).map((g, i) => (
                            <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: `${C.accent}12`, color: C.accent, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                                <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, paddingTop: 4 }}>{g}</p>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {/* Agenda — sourced from Conference Schedule */}
            {scheduleDays.length > 0 && (
                <section style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: C.shadow, overflow: 'hidden' }}>
                    <div style={{ padding: '24px 28px 0' }}>
                        <h3 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={16} style={{ color: C.accent }} />
                            Conference Agenda
                        </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {scheduleDays.map(({ day, date, items }, idx) => (
                            <div key={day} style={{ borderTop: idx > 0 ? `1px solid ${C.border}` : undefined }}>
                                {/* Day header */}
                                <button onClick={() => setOpenDay(openDay === day ? null : day)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 28px', background: openDay === day ? `${C.accent}06` : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 10, background: openDay === day ? C.accent : C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}>
                                        <span style={{ fontSize: 18, fontWeight: 800, color: openDay === day ? 'white' : C.text, lineHeight: 1 }}>{idx + 1}</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{day}</p>
                                        {date && <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{date}</p>}
                                    </div>
                                    <span style={{ fontSize: 11, color: C.textMuted, marginRight: 8 }}>{items.length} session{items.length !== 1 ? 's' : ''}</span>
                                    {openDay === day ? <ChevronUp size={16} style={{ color: C.textMuted, flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: C.textMuted, flexShrink: 0 }} />}
                                </button>
                                {/* Day items */}
                                {openDay === day && items.length > 0 && (
                                    <div style={{ padding: '0 28px 20px' }}>
                                        <div style={{ position: 'relative', paddingLeft: 28 }}>
                                            <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: C.border }} />
                                            {items.map((item, iIdx) => {
                                                const ts = getScheduleTypeStyle(item.type);
                                                return (
                                                    <div key={item.id} style={{ position: 'relative', paddingBottom: iIdx < items.length - 1 ? 18 : 0, paddingTop: 2 }}>
                                                        <div style={{ position: 'absolute', left: -24, top: 8, width: 9, height: 9, borderRadius: '50%', background: ts.dot, border: `2px solid ${C.surface}`, zIndex: 1 }} />
                                                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                                            <div style={{ flexShrink: 0, width: 60, textAlign: 'right' }}>
                                                                {item.time && <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{item.time}</span>}
                                                            </div>
                                                            <div style={{ flex: 1, paddingTop: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                                                                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.title}</p>
                                                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: ts.bg, color: ts.text }}>{item.type}</span>
                                                                </div>
                                                                {item.location && <p style={{ fontSize: 12, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} /> {item.location}</p>}
                                                                {item.description && <p style={{ fontSize: 12, color: C.textSec, marginTop: 4, lineHeight: 1.55 }}>{item.description}</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Gallery */}
            {event.galleryUrls.length > 0 && (
                <section style={{ background: C.surface, borderRadius: 14, padding: '24px 28px', border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                    <h3 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ImageIcon size={16} style={{ color: C.accent }} />
                        Gallery
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                        {event.galleryUrls.map((url, i) => (
                            <div key={i} onClick={() => setLightbox(url)}
                                style={{ aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${C.border}`, transition: 'transform .15s', position: 'relative' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                            >
                                <img src={url} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div onClick={() => setLightbox(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
                    <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
                    <button onClick={() => setLightbox(null)}
                        style={{ position: 'absolute', top: 20, right: 20, padding: 8, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
                </div>
            )}
        </div>
    );
}

/** The funnel from "I read about the event" → registration → payment → full access. */
function ApplyCallToAction() {
    const { user } = useAuth();
    const { getRegistrationForDelegate } = useConference();
    const router = useRouter();

    if (!user) return null;
    const reg = getRegistrationForDelegate(user.id);
    const accepted = reg?.status === 'Accepted';
    const paid = reg?.paymentStatus === 'Paid';

    // Fully onboarded — no funnel CTA needed here.
    if (accepted && paid) return null;

    let cfg: { Icon: React.ElementType; color: string; title: string; desc: string; cta: string; to: string };
    if (!reg) {
        cfg = {
            Icon: ClipboardList, color: C.accent,
            title: 'Ready to Participate?',
            desc: 'Submit your registration to apply for this conference — our secretariat will review it shortly.',
            cta: 'Apply Now', to: '/dashboard/registration',
        };
    } else if (reg.status === 'Pending') {
        cfg = {
            Icon: Clock, color: C.amber,
            title: 'Application Submitted',
            desc: 'Your registration is awaiting review from our secretariat team.',
            cta: 'View Application Status', to: '/dashboard/registration',
        };
    } else if (reg.status === 'Declined') {
        cfg = {
            Icon: Lock, color: C.red,
            title: 'Registration Not Approved',
            desc: 'Your previous registration was not approved. Review the note and submit a new application.',
            cta: 'View & Reapply', to: '/dashboard/registration',
        };
    } else {
        cfg = {
            Icon: CreditCard, color: C.green,
            title: "You're Approved — Complete Payment",
            desc: 'Your registration has been accepted. Complete your payment to unlock the full platform.',
            cta: 'Go to Payment', to: '/dashboard/payments',
        };
    }

    return (
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: '22px 28px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${cfg.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <cfg.Icon size={22} style={{ color: cfg.color }} />
                </div>
                <div>
                    <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 3 }}>{cfg.title}</p>
                    <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5, maxWidth: 460 }}>{cfg.desc}</p>
                </div>
            </div>
            <button onClick={() => router.push(cfg.to)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
                padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: cfg.color, color: 'white', fontSize: 14, fontWeight: 700,
                boxShadow: `0 4px 14px ${cfg.color}40`,
            }}>
                {cfg.cta} <ArrowRight size={16} />
            </button>
        </div>
    );
}

export default function DelegateEventsPage() {
    const { events } = useConference();
    const published = events.filter(e => e.published);
    const [selected, setSelected] = useState<number | null>(published[0]?.id ?? null);
    const activeEvent = published.find(e => e.id === selected) ?? null;

    if (published.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, textAlign: 'center', fontFamily: '"Inter",system-ui,sans-serif' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: `${C.accent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Star size={28} style={{ color: C.accent }} />
                </div>
                <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>No Events Yet</h2>
                <p style={{ fontSize: 14, color: C.textSec, maxWidth: 360 }}>Conference events will appear here once the organizing team publishes them. Check back soon!</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Page heading */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 4 }}>Events</h1>
                <p style={{ fontSize: 14, color: C.textSec }}>{published.length} conference event{published.length !== 1 ? 's' : ''} available</p>
            </div>

            {/* If multiple events, show tab strip */}
            {published.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
                    {published.map(ev => (
                        <button key={ev.id} onClick={() => setSelected(ev.id)}
                            style={{ padding: '8px 18px', borderRadius: 999, border: `1.5px solid ${selected === ev.id ? C.accent : C.border}`, background: selected === ev.id ? `${C.accent}10` : C.surface, color: selected === ev.id ? C.accent : C.textSec, fontSize: 13, fontWeight: selected === ev.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}
                        >{ev.title}{ev.edition ? ` (${ev.edition})` : ''}</button>
                    ))}
                </div>
            )}

            {/* Event detail */}
            {activeEvent && <EventDetail key={activeEvent.id} event={activeEvent} />}

            {/* Apply / payment funnel CTA */}
            <ApplyCallToAction />
        </div>
    );
}
