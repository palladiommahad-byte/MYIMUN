'use client';

import React, { useState, useCallback, useRef, Suspense } from 'react';
import { useConference } from '@/context/ConferenceContext';
import { LANDING_SECTIONS } from '@/components/layout/AdminLayout';
import type { LandingPageData, LandingTestimonial, LandingStat } from '@/context/ConferenceContext';
import {
    Save, Eye, Trash2, Plus, Upload, X,
    CheckCircle2, Globe, Star, Users
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

/* ─── palette ─── */
const S = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', red: '#EF4444', amber: '#F59E0B', purple: '#7C5FFF',
};

type SectionKey = typeof LANDING_SECTIONS[number]['key'];

/* ─── Image compression ─── */
const compressImage = (file: File, maxWidth = 1400, quality = 0.78): Promise<string> =>
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

/* ══ SHARED COMPONENTS ══════════════════════════════════════ */

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 7, border: `1px solid ${S.border}`,
    fontSize: 13, color: S.text, outline: 'none', background: S.surface, boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
};

function Field({ label, hint, maxLen, value, children }: {
    label: string; hint?: string; maxLen?: number; value?: string; children: React.ReactNode;
}) {
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: S.textSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                {maxLen !== undefined && value !== undefined && (
                    <span style={{ fontSize: 10, color: value.length > maxLen * 0.88 ? S.amber : S.textMuted }}>{value.length}/{maxLen}</span>
                )}
            </div>
            {hint && <p style={{ fontSize: 11, color: S.textMuted, marginBottom: 7, lineHeight: 1.4 }}>{hint}</p>}
            {children}
        </div>
    );
}

function Input({ value, onChange, placeholder, type = 'text', maxLen }: {
    value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLen?: number;
}) {
    return (
        <input type={type} value={value} placeholder={placeholder} maxLength={maxLen}
            onChange={e => onChange(e.target.value)} style={inputStyle}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = S.accent}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = S.border} />
    );
}

function Textarea({ value, onChange, placeholder, rows = 3, maxLen }: {
    value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; maxLen?: number;
}) {
    return (
        <textarea value={value} placeholder={placeholder} rows={rows} maxLength={maxLen}
            onChange={e => onChange(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = S.accent}
            onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = S.border} />
    );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} style={inputStyle}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = S.accent}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = S.border} />
    );
}

/* ─── Photo upload ─── */
function PhotoUpload({ value, onChange, label = 'Upload Image', height = 160 }: {
    value: string; onChange: (v: string) => void; label?: string; height?: number;
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handle = async (file: File) => { try { onChange(await compressImage(file)); } catch {} };
    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f?.type.startsWith('image/')) handle(f);
    };

    if (value) return (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `1px solid ${S.border}` }}>
            <img src={value} alt="" style={{ width: '100%', height, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                <button onClick={() => inputRef.current?.click()}
                    style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.95)', border: 'none', fontSize: 11, fontWeight: 600, color: S.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Upload size={12} /> Replace
                </button>
                <button onClick={() => onChange('')}
                    style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={13} />
                </button>
            </div>
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={async e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }} />
        </div>
    );

    return (
        <label
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height, borderRadius: 10, border: `2px dashed ${dragging ? S.accent : S.border}`, background: dragging ? `${S.accent}06` : S.bg, cursor: 'pointer', gap: 8, transition: 'all 0.15s' }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
        >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: S.surface, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={16} style={{ color: dragging ? S.accent : S.textMuted }} />
            </div>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: dragging ? S.accent : S.textSec }}>{label}</p>
                <p style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>Drag & drop or click to browse</p>
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={async e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }} />
        </label>
    );
}

/* ─── Multi-image slideshow upload ─── */
function MultiPhotoUpload({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = async (files: FileList | File[]) => {
        const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imgs.length === 0) return;
        const compressed = await Promise.all(imgs.map(f => compressImage(f).catch(() => null)));
        onChange([...images, ...compressed.filter((c): c is string => !!c)]);
    };
    const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };
    const removeAt = (i: number) => onChange(images.filter((_, idx) => idx !== i));

    return (
        <div>
            {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 10 }}>
                    {images.map((src, i) => (
                        <div key={i} style={{ position: 'relative', borderRadius: 9, overflow: 'hidden', border: `1px solid ${S.border}`, aspectRatio: '16/10' }}>
                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <span style={{ position: 'absolute', bottom: 4, left: 5, fontSize: 10, fontWeight: 700, color: 'white', background: 'rgba(0,0,0,0.55)', padding: '1px 6px', borderRadius: 999 }}>{i + 1}</span>
                            <button onClick={() => removeAt(i)} title="Remove"
                                style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 6, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <label
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, borderRadius: 10, border: `2px dashed ${dragging ? S.accent : S.border}`, background: dragging ? `${S.accent}06` : S.bg, cursor: 'pointer', gap: 6, transition: 'all 0.15s' }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
            >
                <Upload size={16} style={{ color: dragging ? S.accent : S.textMuted }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: dragging ? S.accent : S.textSec }}>
                    {images.length > 0 ? 'Add more slides' : 'Upload slideshow images'}
                </p>
                <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                    onChange={async e => { if (e.target.files) await addFiles(e.target.files); e.target.value = ''; }} />
            </label>
        </div>
    );
}

/* ─── Card wrapper ─── */
function Card({ title, subtitle, accent = S.accent, children }: {
    title: string; subtitle?: string; accent?: string; children: React.ReactNode;
}) {
    return (
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ borderLeft: `3px solid ${accent}`, padding: '14px 20px', background: `${accent}04`, borderBottom: `1px solid ${S.border}` }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: S.text }}>{title}</p>
                {subtitle && <p style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{subtitle}</p>}
            </div>
            <div style={{ padding: '20px 20px 4px' }}>{children}</div>
        </div>
    );
}

function Grid2({ children }: { children: React.ReactNode }) {
    return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
    return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>{children}</div>;
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: S.textMuted, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${S.border}` }}>
                {label}
            </p>
            {children}
        </div>
    );
}

function ListEditor({ items, onChange, placeholder, addLabel, accent = S.accent }: {
    items: string[]; onChange: (v: string[]) => void; placeholder?: string; addLabel?: string; accent?: string;
}) {
    return (
        <div>
            {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: `${accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: accent }}>{i + 1}</span>
                    </div>
                    <input value={item} placeholder={placeholder}
                        onChange={e => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={e => (e.target as HTMLInputElement).style.borderColor = accent}
                        onBlur={e => (e.target as HTMLInputElement).style.borderColor = S.border} />
                    <button onClick={() => onChange(items.filter((_, j) => j !== i))}
                        style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${S.border}`, background: S.surface, color: S.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <X size={13} />
                    </button>
                </div>
            ))}
            <button onClick={() => onChange([...items, ''])}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: `1px dashed ${accent}60`, background: `${accent}06`, color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4, width: '100%', justifyContent: 'center' }}>
                <Plus size={13} /> {addLabel ?? 'Add item'}
            </button>
        </div>
    );
}

/* ══ MAIN (wrapped in Suspense by the export) ══ */
function LandingEditorInner() {
    const { landingPage, updateLandingPage, committees } = useConference();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

    const activeKey = (searchParams.get('section') ?? 'hero') as SectionKey;
    const activeSection = LANDING_SECTIONS.find(s => s.key === activeKey) ?? LANDING_SECTIONS[0];

    const handleSave = () => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2200); };

    /* Section updaters */
    const setHero     = useCallback((p: Partial<typeof landingPage.hero>)         => updateLandingPage({ hero:         { ...landingPage.hero,         ...p } }), [landingPage, updateLandingPage]);
    const setTicker   = useCallback((p: Partial<typeof landingPage.ticker>)       => updateLandingPage({ ticker:       { ...landingPage.ticker,       ...p } }), [landingPage, updateLandingPage]);
    const setWho      = useCallback((p: Partial<typeof landingPage.whoWeAre>)     => updateLandingPage({ whoWeAre:     { ...landingPage.whoWeAre,     ...p } }), [landingPage, updateLandingPage]);
    const setPartners = useCallback((p: Partial<typeof landingPage.partners>)     => updateLandingPage({ partners:     { ...landingPage.partners,     ...p } }), [landingPage, updateLandingPage]);
    const setAnnounce = useCallback((p: Partial<typeof landingPage.announcement>) => updateLandingPage({ announcement: { ...landingPage.announcement, ...p } }), [landingPage, updateLandingPage]);
    const setGetStart = useCallback((p: Partial<typeof landingPage.getStarted>)   => updateLandingPage({ getStarted:   { ...landingPage.getStarted,   ...p } }), [landingPage, updateLandingPage]);
    const setFaq      = useCallback((p: Partial<typeof landingPage.faq>)          => updateLandingPage({ faq:          { ...landingPage.faq,          ...p } }), [landingPage, updateLandingPage]);
    const setGal      = useCallback((p: Partial<typeof landingPage.gallery>)      => updateLandingPage({ gallery:      { ...landingPage.gallery,      ...p } }), [landingPage, updateLandingPage]);
    const setFooter   = useCallback((p: Partial<typeof landingPage.footerData>)   => updateLandingPage({ footerData:   { ...landingPage.footerData,   ...p } }), [landingPage, updateLandingPage]);

    /* Navigate between sections */
    const gotoSection = (key: string) => router.push(`/admin/landing?section=${key}`, { scroll: false });
    const currentIdx = LANDING_SECTIONS.findIndex(s => s.key === activeKey);
    const prevSec = currentIdx > 0 ? LANDING_SECTIONS[currentIdx - 1] : null;
    const nextSec = currentIdx < LANDING_SECTIONS.length - 1 ? LANDING_SECTIONS[currentIdx + 1] : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: S.bg }}>

            {/* ── TOP BAR ── */}
            <div style={{ background: S.surface, borderBottom: `1px solid ${S.border}`, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 54, flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>

                {/* Section breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${activeSection.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <activeSection.icon size={14} style={{ color: activeSection.color }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: S.textMuted }}>Landing Page</span>
                            <span style={{ fontSize: 11, color: S.border }}>/</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: S.text }}>{activeSection.label}</span>
                        </div>
                        <p style={{ fontSize: 10, color: S.textMuted }}>Changes save automatically</p>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Section prev/next */}
                    <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
                        {prevSec && (
                            <button onClick={() => gotoSection(prevSec.key)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: `1px solid ${S.border}`, background: S.surface, color: S.textSec, fontSize: 11, cursor: 'pointer' }}>
                                ← {prevSec.label}
                            </button>
                        )}
                        {nextSec && (
                            <button onClick={() => gotoSection(nextSec.key)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: `1px solid ${S.border}`, background: S.surface, color: S.textSec, fontSize: 11, cursor: 'pointer' }}>
                                {nextSec.label} →
                            </button>
                        )}
                    </div>

                    {saveState === 'saved' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: `${S.green}12`, border: `1px solid ${S.green}30`, color: S.green, fontSize: 11, fontWeight: 600 }}>
                            <CheckCircle2 size={12} /> Saved
                        </div>
                    )}
                    <Link href="/" target="_blank" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: `1px solid ${S.border}`, background: S.surface, color: S.textSec, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            <Eye size={13} /> Preview
                        </button>
                    </Link>
                    <button onClick={handleSave}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 7, border: 'none', background: S.accent, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <Save size={13} /> Save
                    </button>
                </div>
            </div>

            {/* ── SECTION PROGRESS STRIP ── */}
            <div style={{ background: S.surface, borderBottom: `1px solid ${S.border}`, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 2, height: 40, overflowX: 'auto' }}>
                {LANDING_SECTIONS.map((sec, i) => {
                    const isActive = sec.key === activeKey;
                    const Icon = sec.icon;
                    return (
                        <button key={sec.key} onClick={() => gotoSection(sec.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6,
                                border: 'none', background: isActive ? `${sec.color}12` : 'transparent',
                                color: isActive ? sec.color : S.textMuted,
                                fontWeight: isActive ? 600 : 400, fontSize: 12, cursor: 'pointer',
                                whiteSpace: 'nowrap', transition: 'all 0.12s',
                                borderBottom: `2px solid ${isActive ? sec.color : 'transparent'}`,
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = S.textSec; }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = S.textMuted; }}
                        >
                            <Icon size={11} />
                            {sec.label}
                        </button>
                    );
                })}
            </div>

            {/* ── FORM CONTENT ── */}
            <div style={{ flex: 1, padding: '24px 28px', maxWidth: 960, width: '100%' }}>

                {/* ── HERO ── */}
                {activeKey === 'hero' && (
                    <>
                        <Card title="Headline" subtitle="Main text shown over the hero background" accent={S.accent}>
                            <FormSection label="Main Headline">
                                <Grid2>
                                    <Field label="Accent Word (shown first, in blue)" value={landingPage.hero.headlineAccent} maxLen={20}>
                                        <Input value={landingPage.hero.headlineAccent} onChange={v => setHero({ headlineAccent: v })} placeholder="MYIMUN" maxLen={20} />
                                    </Field>
                                    <Field label="Rest of Headline (white)" value={landingPage.hero.headline} maxLen={60}>
                                        <Input value={landingPage.hero.headline} onChange={v => setHero({ headline: v })} placeholder="Model United Nations" maxLen={60} />
                                    </Field>
                                </Grid2>
                                <div style={{ padding: '16px 20px', borderRadius: 10, background: '#0D1B4B', marginBottom: 16 }}>
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Headline Preview</p>
                                    <p style={{ fontWeight: 800, fontSize: 24, color: 'white', lineHeight: 1.15 }}>
                                        <span style={{ color: '#2C74FF' }}>{landingPage.hero.headlineAccent || 'MYIMUN'}</span>
                                        {' '}<span style={{ color: '#2C74FF' }}>.</span>{' '}
                                        {landingPage.hero.headline || 'Model United Nations'}
                                    </p>
                                </div>
                            </FormSection>
                            <FormSection label="Sub-headline">
                                <Field label="Paragraph below headline" value={landingPage.hero.subheadline} maxLen={260}>
                                    <Textarea value={landingPage.hero.subheadline} onChange={v => setHero({ subheadline: v })} rows={3} maxLen={260} />
                                </Field>
                            </FormSection>
                            <FormSection label="Buttons">
                                <Grid2>
                                    <Field label="Outline Button (left)"><Input value={landingPage.hero.ctaSecondary} onChange={v => setHero({ ctaSecondary: v })} placeholder="Discover More" /></Field>
                                    <Field label="Primary Button (right)"><Input value={landingPage.hero.ctaPrimary} onChange={v => setHero({ ctaPrimary: v })} placeholder="Register Now" /></Field>
                                </Grid2>
                            </FormSection>
                        </Card>

                        <Card title="Background" subtitle="Slideshow images cycle behind the hero; a single image is the fallback" accent={S.amber}>
                            <FormSection label="Slideshow Images (recommended)">
                                <Field label="" hint="Upload several photos — they auto-cycle behind the hero text every 5 seconds.">
                                    <MultiPhotoUpload images={landingPage.hero.backgroundImages ?? []} onChange={v => setHero({ backgroundImages: v })} />
                                </Field>
                            </FormSection>
                            <FormSection label="Or a single background image">
                                <Field label="Single Background Image" hint="Used only when no slideshow images are set.">
                                    <PhotoUpload value={landingPage.hero.imageUrl} onChange={v => setHero({ imageUrl: v })} label="Upload hero background" height={150} />
                                </Field>
                            </FormSection>
                        </Card>
                    </>
                )}

                {/* ── TICKER ── */}
                {activeKey === 'ticker' && (
                    <Card title="Scrolling Ticker Bar" subtitle="Gradient marquee that scrolls below the hero" accent={S.amber}>
                        <Field label="Ticker Text" hint="This phrase repeats and scrolls across the bar." value={landingPage.ticker.text} maxLen={120}>
                            <Input value={landingPage.ticker.text} onChange={v => setTicker({ text: v })} placeholder="Registration is Closed. We'll be back soon." maxLen={120} />
                        </Field>
                        <div style={{ marginTop: 8, height: 40, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', background: 'linear-gradient(90deg, #2C74FF 0%, #06BAD3 100%)' }}>
                            <span style={{ color: '#fff', fontWeight: 500, fontSize: 13, paddingLeft: 16, whiteSpace: 'nowrap' }}>
                                {[0,1,2].map(i => `${landingPage.ticker.text || 'Ticker text…'}   /   `).join('')}
                            </span>
                        </div>
                    </Card>
                )}

                {/* ── WHO WE ARE ── */}
                {activeKey === 'whoWeAre' && (
                    <>
                        <Card title="Heading & Body" subtitle="Right-column text of the Who We Are section" accent={S.purple}>
                            <Field label="Eyebrow Tag"><Input value={landingPage.whoWeAre.tag} onChange={v => setWho({ tag: v })} placeholder="WHO WE ARE" /></Field>
                            <Grid2>
                                <Field label="Heading — Blue Accent"><Input value={landingPage.whoWeAre.headingAccent} onChange={v => setWho({ headingAccent: v })} placeholder="MYIMUN :" /></Field>
                                <Field label="Heading — Rest"><Input value={landingPage.whoWeAre.heading} onChange={v => setWho({ heading: v })} placeholder="high-level debate, cultural exchange, and leadership growth." /></Field>
                            </Grid2>
                            <Field label="Body Paragraph"><Textarea value={landingPage.whoWeAre.body} onChange={v => setWho({ body: v })} rows={3} /></Field>
                            <Field label="Button Label"><Input value={landingPage.whoWeAre.cta} onChange={v => setWho({ cta: v })} placeholder="Register Now" /></Field>
                        </Card>

                        <Card title="Stats" subtitle="The two blue stat figures" accent={S.accent}>
                            <Grid2>
                                <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: 10, padding: 14 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, marginBottom: 10 }}>STAT 1</p>
                                    <Grid2>
                                        <Field label="Prefix"><Input value={landingPage.whoWeAre.stat1Prefix} onChange={v => setWho({ stat1Prefix: v })} placeholder="6th" /></Field>
                                        <Field label="Value"><Input value={landingPage.whoWeAre.stat1Value} onChange={v => setWho({ stat1Value: v })} placeholder="Editions" /></Field>
                                    </Grid2>
                                    <Field label="Label"><Input value={landingPage.whoWeAre.stat1Label} onChange={v => setWho({ stat1Label: v })} placeholder="And More" /></Field>
                                </div>
                                <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: 10, padding: 14 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, marginBottom: 10 }}>STAT 2</p>
                                    <Grid2>
                                        <Field label="Prefix"><Input value={landingPage.whoWeAre.stat2Prefix} onChange={v => setWho({ stat2Prefix: v })} placeholder="" /></Field>
                                        <Field label="Value"><Input value={landingPage.whoWeAre.stat2Value} onChange={v => setWho({ stat2Value: v })} placeholder="+436" /></Field>
                                    </Grid2>
                                    <Field label="Label"><Input value={landingPage.whoWeAre.stat2Label} onChange={v => setWho({ stat2Label: v })} placeholder="Participants" /></Field>
                                </div>
                            </Grid2>
                        </Card>

                        <Card title="Section Image" subtitle="Left-column photo (rounded bottom-right corner)" accent={S.purple}>
                            <PhotoUpload value={landingPage.whoWeAre.image} onChange={v => setWho({ image: v })} label="Upload section photo" height={200} />
                        </Card>
                    </>
                )}

                {/* ── PARTNERS ── */}
                {activeKey === 'partners' && (
                    <Card title="Strategic Partners" subtitle="Logos shown in the partnership row" accent={S.green}>
                        <Field label="Section Heading"><Input value={landingPage.partners.heading} onChange={v => setPartners({ heading: v })} placeholder="In Strategic Partnership With" /></Field>
                        <FormSection label={`Partners (${landingPage.partners.logos.length})`}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {landingPage.partners.logos.map((logo, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', background: S.bg, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12 }}>
                                        <div style={{ width: 64, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: S.surface, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {logo.image ? <img src={logo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 9, color: S.textMuted, textAlign: 'center', padding: 2 }}>Text only</span>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Input value={logo.name} onChange={v => { const logos = [...landingPage.partners.logos]; logos[i] = { ...logos[i], name: v }; setPartners({ logos }); }} placeholder="Partner name (shown if no logo image)" />
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: `1px solid ${S.border}`, borderRadius: 8, background: S.surface, fontSize: 12, color: S.textSec, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                            <Upload size={13} /> {logo.image ? 'Replace' : 'Logo'}
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; if (f) { const img = await compressImage(f, 400, 0.85); const logos = [...landingPage.partners.logos]; logos[i] = { ...logos[i], image: img }; setPartners({ logos }); } e.target.value = ''; }} />
                                        </label>
                                        {logo.image && <button onClick={() => { const logos = [...landingPage.partners.logos]; logos[i] = { ...logos[i], image: '' }; setPartners({ logos }); }} style={{ fontSize: 11, color: S.red, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}
                                        <button onClick={() => setPartners({ logos: landingPage.partners.logos.filter((_, j) => j !== i) })} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${S.border}`, background: S.surface, color: S.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={13} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setPartners({ logos: [...landingPage.partners.logos, { name: '', image: '' }] })}
                                style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px dashed ${S.green}50`, background: `${S.green}06`, color: S.green, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                <Plus size={14} /> Add partner
                            </button>
                        </FormSection>
                    </Card>
                )}

                {/* ── ANNOUNCEMENT ── */}
                {activeKey === 'announcement' && (
                    <>
                        <Card title="Heading" subtitle="Dark event-announcement section" accent={S.red}>
                            <Field label="Eyebrow Tag"><Input value={landingPage.announcement.tag} onChange={v => setAnnounce({ tag: v })} placeholder="REGISTRATION IS CLOSED. WE'LL BE BACK SOON." /></Field>
                            <Field label="Main Heading"><Textarea value={landingPage.announcement.heading} onChange={v => setAnnounce({ heading: v })} rows={2} /></Field>
                            <Field label="Subheading"><Input value={landingPage.announcement.subheading} onChange={v => setAnnounce({ subheading: v })} placeholder="About the Conference" /></Field>
                        </Card>

                        <Card title="Countdown Timer" subtitle="Shown here and on the delegate Events page" accent={S.accent}>
                            <p style={{ fontSize: 12.5, color: S.textSec, lineHeight: 1.6 }}>
                                The countdown is tied directly to the conference&apos;s start date — there&apos;s nothing to set here.
                                Edit the date in <strong style={{ color: S.text }}>Events</strong> and the countdown updates everywhere automatically.
                            </p>
                        </Card>

                        <Card title="Paragraphs" subtitle="Wrap words in **double asterisks** to make them bold & white" accent={S.red}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {landingPage.announcement.paragraphs.map((para, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <Textarea value={para} onChange={v => { const paragraphs = [...landingPage.announcement.paragraphs]; paragraphs[i] = v; setAnnounce({ paragraphs }); }} rows={2} />
                                        </div>
                                        <button onClick={() => setAnnounce({ paragraphs: landingPage.announcement.paragraphs.filter((_, j) => j !== i) })} style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${S.border}`, background: S.surface, color: S.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}><Trash2 size={13} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setAnnounce({ paragraphs: [...landingPage.announcement.paragraphs, ''] })}
                                style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px dashed ${S.red}50`, background: `${S.red}06`, color: S.red, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                <Plus size={14} /> Add paragraph
                            </button>
                        </Card>

                        <Card title="Highlights" subtitle="Chevron bullet list (2-column)" accent={S.green}>
                            <ListEditor items={landingPage.announcement.bullets} onChange={bullets => setAnnounce({ bullets })} placeholder="e.g. Opening & Closing Ceremonies" addLabel="Add highlight" accent={S.green} />
                        </Card>

                        <Card title="CTA & Image" accent={S.red}>
                            <Field label="Button Label"><Input value={landingPage.announcement.cta} onChange={v => setAnnounce({ cta: v })} placeholder="Register Now" /></Field>
                            <Field label="Section Image" hint="Right-side photo"><PhotoUpload value={landingPage.announcement.image} onChange={v => setAnnounce({ image: v })} label="Upload announcement photo" height={180} /></Field>
                        </Card>
                    </>
                )}

                {/* ── GET STARTED ── */}
                {activeKey === 'getStarted' && (
                    <>
                        <Card title="Text" subtitle="Get Started Today section" accent={S.accent}>
                            <Field label="Eyebrow Tag"><Input value={landingPage.getStarted.tag} onChange={v => setGetStart({ tag: v })} placeholder="GET STARTED TODAY" /></Field>
                            <Field label="Heading"><Textarea value={landingPage.getStarted.heading} onChange={v => setGetStart({ heading: v })} rows={2} /></Field>
                            <Field label="Button Label"><Input value={landingPage.getStarted.cta} onChange={v => setGetStart({ cta: v })} placeholder="Register Now" /></Field>
                            <Grid2>
                                <Field label="Contact Label"><Input value={landingPage.getStarted.contactLabel} onChange={v => setGetStart({ contactLabel: v })} placeholder="Message us:" /></Field>
                                <Field label="Phone (also powers the WhatsApp button)"><Input value={landingPage.getStarted.phone} onChange={v => setGetStart({ phone: v })} placeholder="+212 713 133 601" /></Field>
                            </Grid2>
                        </Card>
                        <Card title="Section Image" subtitle="Left-column photo (rounded bottom-right corner)" accent={S.accent}>
                            <PhotoUpload value={landingPage.getStarted.image} onChange={v => setGetStart({ image: v })} label="Upload section photo" height={200} />
                        </Card>
                    </>
                )}

                {/* ── GALLERY ── */}
                {activeKey === 'gallery' && (
                    <Card title="Photo Gallery" subtitle="Animated 3D coverflow carousel shown above the FAQ. Leave empty to use sample photos." accent={S.red}>
                        <Grid2>
                            <Field label="Eyebrow Tag"><Input value={landingPage.gallery.eyebrow} onChange={v => setGal({ eyebrow: v })} placeholder="Gallery" /></Field>
                            <Field label="Heading"><Input value={landingPage.gallery.title} onChange={v => setGal({ title: v })} placeholder="Moments from MYIMUN" /></Field>
                        </Grid2>
                        <FormSection label={`Photos (${landingPage.gallery.images.length})`}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                                {landingPage.gallery.images.map((img, i) => (
                                    <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${S.border}`, aspectRatio: '3/4' }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        <button onClick={() => setGal({ images: landingPage.gallery.images.filter((_, j) => j !== i) })}
                                            style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 5, background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <X size={11} />
                                        </button>
                                        <div style={{ position: 'absolute', bottom: 3, left: 4, padding: '1px 5px', borderRadius: 3, background: 'rgba(0,0,0,0.5)', fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>#{i + 1}</div>
                                    </div>
                                ))}
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `2px dashed ${S.border}`, background: S.bg, cursor: 'pointer', aspectRatio: '3/4', gap: 4, transition: 'all 0.15s' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = S.red; (e.currentTarget as HTMLElement).style.background = `${S.red}06`; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = S.border; (e.currentTarget as HTMLElement).style.background = S.bg; }}>
                                    <Plus size={16} style={{ color: S.textMuted }} />
                                    <span style={{ fontSize: 10, color: S.textMuted, fontWeight: 600 }}>Add Photos</span>
                                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={async e => {
                                        const files = Array.from(e.target.files ?? []);
                                        const compressed = await Promise.all(files.map(f => compressImage(f, 1000, 0.82)));
                                        setGal({ images: [...landingPage.gallery.images, ...compressed] });
                                        e.target.value = '';
                                    }} />
                                </label>
                            </div>
                            {landingPage.gallery.images.length === 0 ? (
                                <div style={{ padding: '14px', textAlign: 'center', background: `${S.accent}06`, borderRadius: 8, border: `1px dashed ${S.accent}30` }}>
                                    <p style={{ fontSize: 12, color: S.textSec }}>No photos uploaded — the gallery currently shows sample photos. Upload your own to replace them.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setGal({ images: [] })}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: `1px solid ${S.red}30`, background: `${S.red}08`, color: S.red, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                        <Trash2 size={12} /> Clear all
                                    </button>
                                </div>
                            )}
                        </FormSection>
                    </Card>
                )}

                {/* ── FAQ ── */}
                {activeKey === 'faq' && (
                    <Card title="Frequently Asked Questions" subtitle="Split automatically into two columns" accent={S.green}>
                        <Field label="Eyebrow Tag"><Input value={landingPage.faq.tag} onChange={v => setFaq({ tag: v })} placeholder="FREQUENTLY ASKED QUESTIONS" /></Field>
                        <FormSection label={`Questions (${landingPage.faq.items.length})`}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {landingPage.faq.items.map((item, i) => (
                                    <div key={i} style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: 10, padding: 14 }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, flexShrink: 0 }}>Q{i + 1}</span>
                                            <div style={{ flex: 1 }}>
                                                <Input value={item.question} onChange={v => { const items = [...landingPage.faq.items]; items[i] = { ...items[i], question: v }; setFaq({ items }); }} placeholder="Question" />
                                            </div>
                                            <button onClick={() => setFaq({ items: landingPage.faq.items.filter((_, j) => j !== i) })} style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${S.border}`, background: S.surface, color: S.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={13} /></button>
                                        </div>
                                        <Textarea value={item.answer} onChange={v => { const items = [...landingPage.faq.items]; items[i] = { ...items[i], answer: v }; setFaq({ items }); }} rows={2} placeholder="Answer" />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setFaq({ items: [...landingPage.faq.items, { question: '', answer: '' }] })}
                                style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px dashed ${S.green}50`, background: `${S.green}06`, color: S.green, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                <Plus size={14} /> Add question
                            </button>
                        </FormSection>
                    </Card>
                )}

                {/* ── FOOTER ── */}
                {activeKey === 'footer' && (
                    <Card title="Footer Content" subtitle="Contact details shown in the site footer" accent={S.textSec}>
                        <Grid2>
                            <Field label="Phone Number"><Input value={landingPage.footerData.phone} onChange={v => setFooter({ phone: v })} placeholder="+212 713 133 601" /></Field>
                            <Field label="Office Hours"><Input value={landingPage.footerData.hours} onChange={v => setFooter({ hours: v })} placeholder="Monday to Friday: 9 am – 6 pm" /></Field>
                        </Grid2>
                        <Field label="Copyright Line"><Input value={landingPage.footerData.copyright} onChange={v => setFooter({ copyright: v })} placeholder="© 2025 MYIMUN  |  All Rights Reserved" /></Field>
                        <Grid2>
                            <Field label="Contact Email (legacy)"><Input value={landingPage.footerData.email} onChange={v => setFooter({ email: v })} placeholder="info@myimun.org" type="email" /></Field>
                            <Field label="Location (legacy)"><Input value={landingPage.footerData.location} onChange={v => setFooter({ location: v })} placeholder="Casablanca, Morocco" /></Field>
                        </Grid2>
                    </Card>
                )}

                {/* Next section navigation */}
                {nextSec && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, paddingBottom: 24 }}>
                        <button onClick={() => gotoSection(nextSec.key)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 8, border: `1px solid ${S.border}`, background: S.surface, color: S.textSec, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                            Next: {nextSec.label} →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Wrap in Suspense (required for useSearchParams in App Router) ── */
export default function AdminLandingPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading editor…</p>
            </div>
        }>
            <LandingEditorInner />
        </Suspense>
    );
}
