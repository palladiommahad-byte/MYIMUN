'use client';

import React, { useEffect, useId, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, History, Loader2, Plus, Save, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
    DEFAULT_ABOUT_PAGE,
    resolveAboutPage,
    type AboutFeature,
    type AboutHistoryEntry,
    type AboutPageData,
    type AboutPartner,
} from '@/lib/aboutPage';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box',
};

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
            <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} style={fieldStyle}
                onFocus={event => event.currentTarget.style.borderColor = C.accent}
                onBlur={event => event.currentTarget.style.borderColor = C.border} />
        </label>
    );
}

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
            <textarea value={value} onChange={event => onChange(event.target.value)} rows={rows} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.55 }}
                onFocus={event => event.currentTarget.style.borderColor = C.accent}
                onBlur={event => event.currentTarget.style.borderColor = C.border} />
        </label>
    );
}

async function compressImage(file: File, maxWidth = 1400, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
        const source = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(source);
            const scale = Math.min(1, maxWidth / image.width);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);
            canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        image.onerror = reject;
        image.src = source;
    });
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    const inputId = useId();
    const [processing, setProcessing] = useState(false);
    const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setProcessing(true);
        try { onChange(await compressImage(file)); } finally { setProcessing(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
            <div style={{ display: 'grid', gridTemplateColumns: value ? '96px minmax(0, 1fr)' : '1fr', gap: 10, alignItems: 'stretch' }}>
                {value && (
                    <div style={{ width: 96, minHeight: 72, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, background: C.bg }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input value={value.startsWith('data:') ? '' : value} onChange={event => onChange(event.target.value)} placeholder="Paste an image URL" style={fieldStyle} />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <label htmlFor={inputId} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 12, fontWeight: 600, cursor: processing ? 'default' : 'pointer' }}>
                            {processing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
                        </label>
                        {value && <button type="button" onClick={() => onChange('')} style={{ padding: '8px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.red, fontSize: 12, cursor: 'pointer' }}>Remove</button>}
                        <input id={inputId} type="file" accept="image/*" hidden onChange={handleFile} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function EditorSection({ title, description, children, action }: { title: string; description: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: C.shadow, overflow: 'hidden' }}>
            <header style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h2>
                    <p style={{ marginTop: 3, fontSize: 12.5, color: C.textSec }}>{description}</p>
                </div>
                {action}
            </header>
            <div style={{ padding: 20 }}>{children}</div>
        </section>
    );
}

function RowActions({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
    const button: React.CSSProperties = { width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer' };
    return (
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button type="button" title="Move up" disabled={index === 0} onClick={() => onMove(-1)} style={{ ...button, opacity: index === 0 ? 0.35 : 1 }}><ArrowUp size={14} /></button>
            <button type="button" title="Move down" disabled={index === count - 1} onClick={() => onMove(1)} style={{ ...button, opacity: index === count - 1 ? 0.35 : 1 }}><ArrowDown size={14} /></button>
            <button type="button" title="Remove" onClick={onRemove} style={{ ...button, color: C.red }}><Trash2 size={14} /></button>
        </div>
    );
}

const addButton = (onClick: () => void, label: string) => (
    <button type="button" onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        <Plus size={14} /> {label}
    </button>
);

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

export function AboutPageEditor({ onBack }: { onBack: () => void }) {
    const { showToast } = useToast();
    const [draft, setDraft] = useState<AboutPageData>(DEFAULT_ABOUT_PAGE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch('/api/settings/about', { cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(json => {
                if (!alive) return;
                setDraft(resolveAboutPage(json?.ok ? json.data : null));
                setLoading(false);
            })
            .catch(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    const patch = (value: Partial<AboutPageData>) => setDraft(current => ({ ...current, ...value }));
    const save = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings/about', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Could not save About page');
            showToast('About page saved', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not save About page', 'error');
        } finally {
            setSaving(false);
        }
    };

    const updatePartner = (index: number, value: Partial<AboutPartner>) => patch({ partners: draft.partners.map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item) });
    const updateFeature = (index: number, value: Partial<AboutFeature>) => patch({ features: draft.features.map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item) });
    const updateHistory = (index: number, value: Partial<AboutHistoryEntry>) => patch({ history: draft.history.map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item) });

    if (loading) return <div style={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.textMuted }}><Loader2 size={18} className="animate-spin" /> Loading About page...</div>;

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, fontFamily: '"Inter",system-ui,sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="button" title="Back to events" onClick={onBack} style={{ width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer' }}><ArrowLeft size={17} /></button>
                    <div>
                        <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text }}>About & History</h1>
                        <p style={{ marginTop: 4, fontSize: 14, color: C.textSec }}>Manage the public story, partnerships, benefits, and conference timeline.</p>
                    </div>
                </div>
                <button type="button" onClick={save} disabled={saving} style={{ minWidth: 150, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 16px', borderRadius: 8, border: 'none', background: C.accent, color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.65 : 1 }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save About Page
                </button>
            </div>

            <EditorSection title="Our Story" description="The opening mission statement and feature image.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                    <Field label="Section Label" value={draft.missionTag} onChange={missionTag => patch({ missionTag })} />
                    <div style={{ gridColumn: '1 / -1' }}><TextArea label="Mission Heading" value={draft.missionHeading} onChange={missionHeading => patch({ missionHeading })} rows={3} /></div>
                    <div style={{ gridColumn: '1 / -1' }}><TextArea label="Mission Description" value={draft.missionBody} onChange={missionBody => patch({ missionBody })} rows={5} /></div>
                    <div style={{ gridColumn: '1 / -1' }}><ImageField label="Mission Image" value={draft.missionImage} onChange={missionImage => patch({ missionImage })} /></div>
                </div>
            </EditorSection>

            <EditorSection
                title="Strategic Partners"
                description="Partner names and logos shown below the mission section."
                action={addButton(() => patch({ partners: [...draft.partners, { id: crypto.randomUUID(), name: 'New Partner', image: '' }] }), 'Add Partner')}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Field label="Section Heading" value={draft.partnersHeading} onChange={partnersHeading => patch({ partnersHeading })} />
                    {draft.partners.map((partner, index) => (
                        <div key={partner.id} style={{ padding: 16, border: `1px solid ${C.border}`, borderRadius: 8, display: 'grid', gap: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <strong style={{ fontSize: 13, color: C.text }}>Partner {index + 1}</strong>
                                <RowActions index={index} count={draft.partners.length} onMove={direction => patch({ partners: moveItem(draft.partners, index, direction) })} onRemove={() => patch({ partners: draft.partners.filter((_, itemIndex) => itemIndex !== index) })} />
                            </div>
                            <Field label="Partner Name" value={partner.name} onChange={name => updatePartner(index, { name })} />
                            <ImageField label="Partner Logo" value={partner.image} onChange={image => updatePartner(index, { image })} />
                        </div>
                    ))}
                </div>
            </EditorSection>

            <EditorSection
                title="Why MYIMUN"
                description="The dark benefits section and each supporting point."
                action={addButton(() => patch({ features: [...draft.features, { id: crypto.randomUUID(), title: 'New Benefit', body: '' }] }), 'Add Benefit')}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                        <Field label="Section Label" value={draft.whyTag} onChange={whyTag => patch({ whyTag })} />
                        <Field label="Section Heading" value={draft.whyHeading} onChange={whyHeading => patch({ whyHeading })} />
                    </div>
                    {draft.features.map((feature, index) => (
                        <div key={feature.id} style={{ padding: 16, border: `1px solid ${C.border}`, borderRadius: 8, display: 'grid', gap: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <strong style={{ fontSize: 13, color: C.text }}>Benefit {index + 1}</strong>
                                <RowActions index={index} count={draft.features.length} onMove={direction => patch({ features: moveItem(draft.features, index, direction) })} onRemove={() => patch({ features: draft.features.filter((_, itemIndex) => itemIndex !== index) })} />
                            </div>
                            <Field label="Title" value={feature.title} onChange={title => updateFeature(index, { title })} />
                            <TextArea label="Description" value={feature.body} onChange={body => updateFeature(index, { body })} rows={3} />
                        </div>
                    ))}
                </div>
            </EditorSection>

            <EditorSection
                title="Conference History"
                description="The timeline introduction and every previous conference."
                action={addButton(() => patch({ history: [...draft.history, { id: crypto.randomUUID(), year: new Date().getFullYear().toString(), title: 'New Conference', location: '', date: '', body: '', image: '' }] }), 'Add Conference')}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                        <Field label="Section Label" value={draft.historyTag} onChange={historyTag => patch({ historyTag })} />
                        <Field label="Section Heading" value={draft.historyHeading} onChange={historyHeading => patch({ historyHeading })} />
                    </div>
                    <TextArea label="Section Introduction" value={draft.historyIntro} onChange={historyIntro => patch({ historyIntro })} rows={2} />
                    {draft.history.map((entry, index) => (
                        <div key={entry.id} style={{ padding: 18, border: `1px solid ${C.border}`, borderRadius: 8, display: 'grid', gap: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><History size={15} style={{ color: C.accent }} /><strong style={{ fontSize: 13, color: C.text }}>{entry.year || 'Conference'} - {entry.title}</strong></div>
                                <RowActions index={index} count={draft.history.length} onMove={direction => patch({ history: moveItem(draft.history, index, direction) })} onRemove={() => patch({ history: draft.history.filter((_, itemIndex) => itemIndex !== index) })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                <Field label="Year" value={entry.year} onChange={year => updateHistory(index, { year })} />
                                <Field label="Conference Title" value={entry.title} onChange={title => updateHistory(index, { title })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                <Field label="Location" value={entry.location} onChange={location => updateHistory(index, { location })} />
                                <Field label="Date" value={entry.date} onChange={date => updateHistory(index, { date })} />
                            </div>
                            <TextArea label="Story" value={entry.body} onChange={body => updateHistory(index, { body })} rows={4} />
                            <ImageField label="Conference Image" value={entry.image} onChange={image => updateHistory(index, { image })} />
                        </div>
                    ))}
                </div>
            </EditorSection>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={save} disabled={saving} style={{ minWidth: 170, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 18px', borderRadius: 8, border: 'none', background: C.green, color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.65 : 1 }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save About Page
                </button>
            </div>
        </div>
    );
}
