'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronUp, Plus, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useConference } from '@/context/ConferenceContext';
import { Countdown } from '@/components/ui/Countdown';
import { phoneDigits, whatsappHref } from '@/lib/contactLinks';

/* ════════════════════════════════════════════════════════════
   MYIMUN Landing Page — fully admin-controllable.
   Every section reads its copy/images from the `landingPage`
   context (editable in Admin → Landing Page). Font: Outfit.
   ════════════════════════════════════════════════════════════ */

const C = {
    blue:        '#2C74FF',
    blueHover:   '#1A5FE6',
    cyan:        '#06BAD3',
    gradient:    'linear-gradient(90deg, #2C74FF 0%, #06BAD3 100%)',
    heading:     '#0B1220',
    body:        '#4A5568',
    bodyLight:   '#6B7280',
    softBlue:    '#EAF1FD',
    dark:        '#00091C',
    onDarkMuted: '#9CA8BD',
    onDarkBody:  '#C5CCD9',
    border:      '#E5E7EB',
    white:       '#FFFFFF',
};

const FONT = '"Outfit", -apple-system, sans-serif';

/* Placeholder photography used only when an admin image isn't set yet */
const IMG = {
    hero:         'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
    whoWeAre:     'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1100&q=80',
    announcement: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1000&q=80',
    getStarted:   'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1100&q=80',
};

/* Default gallery photos (used until the admin uploads their own) */
const DEFAULT_GALLERY = [
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
];

function ImagePlaceholder({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={className}
            aria-hidden
            style={{
                width: '100%',
                background: 'linear-gradient(135deg, #00091C 0%, #102A5C 52%, #2C74FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                ...style,
            }}
        >
            <img src="/assets/MYIMUN-LOGO-WHITE-.png" alt="" style={{ width: '58%', maxWidth: 280, opacity: 0.22 }} />
        </div>
    );
}

function AdminImage({ src, fallback, loading, alt, className, style }: {
    src: string; fallback: string; loading: boolean; alt: string; className?: string; style?: React.CSSProperties;
}) {
    const resolvedSrc = src || (!loading ? fallback : '');
    if (!resolvedSrc) return <ImagePlaceholder className={className} style={style} />;
    return <img src={resolvedSrc} alt={alt} loading="lazy" decoding="async" className={className} style={style} />;
}

/* Parse **bold** spans (admin-editable) into <strong> on dark bg */
function renderBold(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} style={{ fontWeight: 700, color: C.white }}>{part.slice(2, -2)}</strong>
            : <React.Fragment key={i}>{part}</React.Fragment>
    );
}

/* ── Reusable: notched gradient eyebrow tag ── */
function Tag({ children }: { children: React.ReactNode }) {
    return <span className="tag-notched">{children}</span>;
}

const triggerRegister = () => document.getElementById('register-trigger')?.click();

function useAutoplayEnabled() {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
        const sync = () => setEnabled(media.matches);
        sync();
        media.addEventListener('change', sync);
        return () => media.removeEventListener('change', sync);
    }, []);

    return enabled;
}

/* ════ PAGE ════ */
export default function LandingPage() {
    return (
        <div style={{ background: C.white, fontFamily: FONT, color: C.heading, overflowX: 'hidden' }}>
            <Hero />
            <Ticker />
            <WhoWeAre />
            <Partners />
            <EventAnnouncement />
            <GetStarted />
            <GallerySection />
            <FAQ />
            <ScrollToTop />
        </div>
    );
}

/* ════ HERO ════ */
function Hero() {
    const { landingPage, isPublicLoading } = useConference();
    const h = landingPage.hero;
    const slides = h.backgroundImages ?? [];
    const [index, setIndex] = useState(0);
    const autoplay = useAutoplayEnabled();

    useEffect(() => {
        if (!autoplay || slides.length < 2) return;
        const id = setInterval(() => setIndex(i => (i + 1) % slides.length), 5000);
        return () => clearInterval(id);
    }, [autoplay, slides.length]);

    return (
        <section className="lp-hero" style={{ position: 'relative', minHeight: 620, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                {slides.length > 0 ? (
                    slides.map((src, i) => (
                        <img key={src + i} src={src} alt="" decoding="async"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === index ? 1 : 0, transition: 'opacity 1.4s ease-in-out' }} />
                    ))
                ) : h.imageUrl ? (
                    <img src={h.imageUrl} alt="" decoding="async" fetchPriority="high" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : isPublicLoading ? (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #00091C 0%, #102A5C 52%, #2C74FF 100%)' }} />
                ) : (
                    <img src={IMG.hero} alt="" decoding="async" fetchPriority="high" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,9,28,0.78) 0%, rgba(0,9,28,0.5) 45%, rgba(0,9,28,0.18) 100%)' }} />
                <img src="/assets/MYIMUN-LOGO-WHITE-.png" alt="" aria-hidden
                    style={{ position: 'absolute', top: '34%', left: '52%', transform: 'translate(-50%,-50%)', width: 320, opacity: 0.1, pointerEvents: 'none' }} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', width: '100%', padding: '120px 64px 60px' }} className="hero-pad">
                <div className="lp-hero-copy" style={{ maxWidth: 640 }}>
                    <h1 className="lp-hero-title" style={{ lineHeight: 1.25, margin: 0 }}>
                        <span style={{ fontWeight: 800, fontSize: 'clamp(40px,6.25vw,60px)', color: C.blue }}>{h.headlineAccent}</span>
                        <span style={{ fontWeight: 800, fontSize: 'clamp(40px,6.25vw,60px)', color: C.blue }}> . </span>
                        <span style={{ fontWeight: 700, fontSize: 'clamp(40px,6.25vw,60px)', color: C.white }}>{h.headline}</span>
                    </h1>

                    <p className="lp-hero-description" style={{ marginTop: 20, maxWidth: 480, fontWeight: 400, fontSize: 20, lineHeight: 1.6, color: 'rgba(255,255,255,0.92)' }}>
                        {h.subheadline}
                    </p>

                    <div className="lp-hero-actions" style={{ marginTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Link className="lp-hero-action" href="/login"><button className="lp-btn-outline">{h.ctaSecondary === 'Discover More' ? 'Log In' : h.ctaSecondary}</button></Link>
                        <button className="lp-btn-primary" onClick={triggerRegister}>{h.ctaPrimary}</button>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ════ MARQUEE TICKER ════ */
function Ticker() {
    const { landingPage } = useConference();
    const phrase = landingPage.ticker.text;
    const content = `${phrase} / ${phrase} / ${phrase} / ${phrase} / `;
    return (
        <div style={{ background: C.gradient, height: 44, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <div className="ticker-track">
                <span style={{ color: C.white, fontWeight: 500, fontSize: 18, paddingRight: 40 }}>{content}</span>
                <span style={{ color: C.white, fontWeight: 500, fontSize: 18, paddingRight: 40 }}>{content}</span>
            </div>
        </div>
    );
}

/* ════ WHO WE ARE ════ */
function WhoWeAre() {
    const { landingPage, isPublicLoading } = useConference();
    const w = landingPage.whoWeAre;
    return (
        <section style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF1FD 100%)', padding: '96px 64px' }} className="lp-section">
            <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 64, alignItems: 'center' }} className="lp-2col">
                <div style={{ flex: '0 0 42%' }} className="lp-2col-img">
                    <AdminImage src={w.image} fallback={IMG.whoWeAre} loading={isPublicLoading} alt="MYIMUN delegates at conference table" className="img-corner-cut" style={{ aspectRatio: '4 / 3.4' }} />
                </div>
                <div style={{ flex: '0 0 58%' }}>
                    <Tag>{w.tag}</Tag>
                    <h2 className="lp-section-title" style={{ marginTop: 20, marginBottom: 24, fontWeight: 700, fontSize: 35, lineHeight: 1.35 }}>
                        <span style={{ color: C.blue }}>{w.headingAccent}</span>{' '}
                        <span style={{ color: C.heading }}>{w.heading}</span>
                    </h2>

                    <div style={{ display: 'flex', gap: 64, marginBottom: 24, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                {w.stat1Prefix && <span style={{ color: C.blue, fontWeight: 600, fontSize: 18, marginRight: 3 }}>{w.stat1Prefix}</span>}
                                <span style={{ color: C.blue, fontWeight: 800, fontSize: 43 }}>{w.stat1Value}</span>
                            </div>
                            <span style={{ color: C.heading, fontWeight: 400, fontSize: 18 }}>{w.stat1Label}</span>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                {w.stat2Prefix && <span style={{ color: C.blue, fontWeight: 600, fontSize: 18, marginRight: 3 }}>{w.stat2Prefix}</span>}
                                <span style={{ color: C.blue, fontWeight: 800, fontSize: 43 }}>{w.stat2Value}</span>
                            </div>
                            <span style={{ color: C.heading, fontWeight: 400, fontSize: 18 }}>{w.stat2Label}</span>
                        </div>
                    </div>

                    <p className="lp-section-copy" style={{ maxWidth: 480, marginBottom: 32, fontWeight: 400, fontSize: 20, lineHeight: 1.7, color: C.body }}>{w.body}</p>

                    <button className="lp-btn-primary" onClick={triggerRegister}>{w.cta}</button>
                </div>
            </div>
        </section>
    );
}

/* ════ PARTNER LOGOS ════ */
function Partners() {
    const { landingPage } = useConference();
    const p = landingPage.partners;
    return (
        <section style={{ background: C.white, padding: '64px 64px 96px', textAlign: 'center' }} className="lp-section">
            <p style={{ fontWeight: 500, fontSize: 23, color: C.heading, marginBottom: 48 }}>{p.heading}</p>
            <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexWrap: 'wrap', gap: 40 }}>
                {p.logos.map((logo, i) => (
                    logo.image
                        ? <img key={i} src={logo.image} alt={logo.name} loading="lazy" decoding="async" style={{ height: 64, objectFit: 'contain', filter: 'grayscale(1) brightness(0.4)' }} />
                        : <span key={i} style={{ fontWeight: 700, fontSize: 20, letterSpacing: '0.05em', color: C.heading, opacity: 0.7 }}>{logo.name}</span>
                ))}
            </div>
        </section>
    );
}

/* ════ EVENT ANNOUNCEMENT (DARK) ════ */
function EventAnnouncement() {
    const { landingPage, events, isPublicLoading } = useConference();
    const a = landingPage.announcement;
    // Countdown is tied to the actual conference start date (Admin → Events), not a
    // separately-set value, so it's always in sync with the real schedule.
    const upcomingEvent = events.find(e => e.published) ?? events[0];
    // bullets render left-to-right in a 2-col grid; keep source order
    return (
        <section style={{ background: C.dark, padding: '96px 64px' }} className="lp-section lp-announcement">
            <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 48, alignItems: 'flex-start' }} className="lp-2col">
                <div style={{ flex: '0 0 55%' }}>
                    <Tag>{a.tag}</Tag>
                    <h2 className="lp-announcement-title" style={{ marginTop: 24, marginBottom: 32, fontWeight: 700, fontSize: 48, lineHeight: 1.25, color: C.white }}>{a.heading}</h2>

                    {upcomingEvent?.startDate && (
                        <div style={{ marginBottom: 32 }}>
                            <Countdown target={upcomingEvent.startDate} variant="dark" />
                        </div>
                    )}

                    <h3 className="lp-announcement-subtitle" style={{ fontWeight: 700, fontSize: 28, color: C.onDarkMuted, marginBottom: 16 }}>{a.subheading}</h3>

                    {a.paragraphs.map((para, i) => (
                        <p key={i} className="lp-announcement-copy" style={{ fontWeight: 400, fontSize: 19, lineHeight: 1.7, color: C.onDarkBody, marginBottom: 16 }}>{renderBold(para)}</p>
                    ))}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 64, rowGap: 16, marginTop: 32, marginBottom: 32 }} className="lp-bullets">
                        {a.bullets.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <ChevronRight size={18} strokeWidth={3} style={{ color: C.cyan, flexShrink: 0, marginTop: 1 }} />
                                <span style={{ fontWeight: 600, fontSize: 20, color: C.white }}>{item}</span>
                            </div>
                        ))}
                    </div>

                    <button className="lp-btn-primary" onClick={triggerRegister}>{a.cta}</button>
                </div>

                <div style={{ flex: '0 0 45%' }} className="lp-2col-img">
                    <AdminImage src={a.image} fallback={IMG.announcement} loading={isPublicLoading} alt="MYIMUN conference room" style={{ width: '100%', objectFit: 'cover', borderRadius: '0 0 32px 0', aspectRatio: '4 / 5' }} />
                </div>
            </div>
        </section>
    );
}

/* ════ GET STARTED TODAY ════ */
function GetStarted() {
    const { landingPage, isPublicLoading, conferenceSettings } = useConference();
    const g = landingPage.getStarted;
    const whatsappPhone = conferenceSettings.whatsappSupportPhone;
    const waLink = whatsappHref(whatsappPhone, 'Hello MYIMUN Secretariat, I would like more information about registration.');
    return (
        <section style={{ background: C.white, padding: '96px 64px' }} className="lp-section">
            <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 64, alignItems: 'center' }} className="lp-2col">
                <div style={{ flex: '0 0 42%' }} className="lp-2col-img">
                    <AdminImage src={g.image} fallback={IMG.getStarted} loading={isPublicLoading} alt="MYIMUN delegates with country flags" className="img-corner-cut" style={{ aspectRatio: '4 / 3' }} />
                </div>
                <div style={{ flex: '0 0 58%' }}>
                    <Tag>{g.tag}</Tag>
                    <h2 className="lp-section-title" style={{ marginTop: 20, marginBottom: 28, fontWeight: 700, fontSize: 35, lineHeight: 1.4, color: C.heading }}>{g.heading}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                        <button className="lp-btn-primary" onClick={triggerRegister}>{g.cta}</button>
                        {conferenceSettings.whatsappSupportEnabled && phoneDigits(whatsappPhone) && (
                            <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                                <span style={{ fontWeight: 600, fontSize: 19, color: C.blue }}>{g.contactLabel}</span>
                                <span style={{ fontWeight: 600, fontSize: 19, color: C.heading }}>{whatsappPhone}</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ════ GALLERY (3D coverflow carousel) ════ */
function GallerySection() {
    const { landingPage, isPublicLoading } = useConference();
    const g = landingPage.gallery;
    const images = (g.images && g.images.length > 0) ? g.images : (isPublicLoading ? [] : DEFAULT_GALLERY);
    const N = images.length;
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const autoplay = useAutoplayEnabled();
    const currentActive = N > 0 ? active % N : 0;

    useEffect(() => {
        if (!autoplay || paused || N < 2) return;
        const id = setInterval(() => setActive(a => (a + 1) % N), 4500);
        return () => clearInterval(id);
    }, [autoplay, paused, N]);

    const go = (dir: number) => setActive(a => (a + dir + N) % N);

    const slideStyle = (i: number): React.CSSProperties => {
        let off = i - currentActive;
        if (off > N / 2) off -= N;
        if (off < -N / 2) off += N;
        const abs = Math.abs(off);
        if (abs > 2) {
            return { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0, zIndex: 0, pointerEvents: 'none' };
        }
        const translateX = off * 250;
        const scale = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.66;
        const rotateY = off === 0 ? 0 : (off > 0 ? -26 : 26);
        return {
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
            opacity: abs === 0 ? 1 : abs === 1 ? 0.95 : 0.6,
            zIndex: 30 - abs * 10,
            filter: abs === 0 ? 'none' : 'brightness(0.82)',
            cursor: abs === 0 ? 'default' : 'pointer',
        };
    };

    return (
        <section style={{ background: C.white, padding: '88px 64px 96px', overflow: 'hidden' }} className="lp-section">
            {(g.eyebrow || g.title) && (
                <div style={{ textAlign: 'center', marginBottom: 44 }}>
                    {g.eyebrow && <Tag>{g.eyebrow}</Tag>}
                    {g.title && <h2 style={{ marginTop: 18, fontWeight: 700, fontSize: 35, color: C.heading }}>{g.title}</h2>}
                </div>
            )}

            {/* Coverflow stage */}
            <div
                onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
                style={{ position: 'relative', height: 470, maxWidth: 1100, margin: '0 auto', perspective: '1600px' }}
            >
                {images.length === 0 ? (
                    <ImagePlaceholder style={{ height: 440, maxWidth: 340, margin: '15px auto 0', borderRadius: 18, boxShadow: '0 24px 60px rgba(11,18,32,0.18)' }} />
                ) : images.map((src, i) => (
                    <div key={i} onClick={() => setActive(i)}
                        style={{
                            position: 'absolute', left: '50%', top: '50%',
                            width: 340, height: 440, borderRadius: 18, overflow: 'hidden',
                            boxShadow: '0 24px 60px rgba(11,18,32,0.28)',
                            transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease, filter 0.6s ease',
                            transformStyle: 'preserve-3d', willChange: 'transform',
                            ...slideStyle(i),
                        }}>
                        <img src={src} alt={`Gallery ${i + 1}`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                ))}
            </div>

            {/* Nav arrows */}
            {images.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 36 }}>
                {[{ Icon: ArrowLeft, dir: -1, label: 'Previous' }, { Icon: ArrowRight, dir: 1, label: 'Next' }].map(({ Icon, dir, label }) => (
                    <button key={label} onClick={() => go(dir)} aria-label={label}
                        style={{ width: 48, height: 48, borderRadius: '50%', border: `1.5px solid ${C.border}`, background: C.white, color: C.heading, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.blue; (e.currentTarget as HTMLElement).style.color = C.blue; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.heading; }}>
                        <Icon size={18} />
                    </button>
                ))}
            </div>}
        </section>
    );
}

/* ════ FAQ ════ */
function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom: `1px solid ${C.border}`, padding: '22px 0', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <span style={{ fontWeight: 500, fontSize: 21, color: C.heading }}>{question}</span>
                <Plus size={20} strokeWidth={1.5} color={C.heading} style={{ flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </div>
            {open && <p style={{ marginTop: 12, fontWeight: 400, fontSize: 19, color: C.body, lineHeight: 1.6 }}>{answer}</p>}
        </div>
    );
}
function FAQ() {
    const { landingPage } = useConference();
    const f = landingPage.faq;
    const items = f.items;
    const mid = Math.ceil(items.length / 2);
    const left = items.slice(0, mid);
    const right = items.slice(mid);
    return (
        <section style={{ background: C.white, padding: '96px 64px' }} className="lp-section">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <Tag>{f.tag}</Tag>
            </div>
            <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 64 }} className="lp-faq-grid">
                <div>{left.map((it, i) => <FAQItem key={i} question={it.question} answer={it.answer} />)}</div>
                <div>{right.map((it, i) => <FAQItem key={i} question={it.question} answer={it.answer} />)}</div>
            </div>
        </section>
    );
}

/* ════ GLOBAL — Scroll to top ════ */
function ScrollToTop() {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 400);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    if (!visible) return null;
    return (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Scroll to top"
            style={{ position: 'fixed', bottom: 24, right: 28, width: 48, height: 48, borderRadius: '50%', background: C.white, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 90 }}>
            <ChevronUp size={20} color={C.blue} />
        </button>
    );
}
