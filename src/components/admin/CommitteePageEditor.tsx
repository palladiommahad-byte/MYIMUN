'use client';

import React, { useEffect, useId, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Download, Loader2, Plus, Save, Trash2, Upload, Users } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
    DEFAULT_COMMITTEE_PAGE,
    resolveCommitteePage,
    type CommitteePageData,
    type CommitteeShowcaseItem,
} from '@/lib/committeePage';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF', text: '#111827',
    textSec: '#6B7280', textMuted: '#9CA3AF', accent: '#3B7FFF', green: '#10B981', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8,
    background: C.bg, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
            <input value={value} onChange={event => onChange(event.target.value)} style={inputStyle}
                onFocus={event => event.currentTarget.style.borderColor = C.accent}
                onBlur={event => event.currentTarget.style.borderColor = C.border} />
        </label>
    );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
            <textarea value={value} onChange={event => onChange(event.target.value)} rows={rows} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
                onFocus={event => event.currentTarget.style.borderColor = C.accent}
                onBlur={event => event.currentTarget.style.borderColor = C.border} />
        </label>
    );
}

async function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const source = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(source);
            const scale = Math.min(1, 900 / image.width);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);
            canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = reject;
        image.src = source;
    });
}

function LogoField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const inputId = useId();
    const [processing, setProcessing] = useState(false);
    const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setProcessing(true);
        try { onChange(await compressImage(file)); } finally { setProcessing(false); }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: value ? '92px minmax(0, 1fr)' : '1fr', gap: 10 }}>
            {value && <div style={{ width: 92, height: 82, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={value.startsWith('data:') ? '' : value} onChange={event => onChange(event.target.value)} placeholder="Paste logo URL" style={inputStyle} />
                <div style={{ display: 'flex', gap: 8 }}>
                    <label htmlFor={inputId} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 11px', borderRadius: 8, border: `1px solid ${C.border}`, color: C.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {processing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload Logo
                    </label>
                    {value && <button type="button" onClick={() => onChange('')} style={{ padding: '8px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.red, fontSize: 12, cursor: 'pointer' }}>Remove</button>}
                    <input id={inputId} type="file" accept="image/*" hidden onChange={upload} />
                </div>
            </div>
        </div>
    );
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

export function CommitteePageEditor({ onBack }: { onBack: () => void }) {
    const { showToast } = useToast();
    const [draft, setDraft] = useState<CommitteePageData>(DEFAULT_COMMITTEE_PAGE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch('/api/settings/committees-page', { cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(json => {
                if (!alive) return;
                setDraft(resolveCommitteePage(json?.ok ? json.data : null));
                setLoading(false);
            })
            .catch(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    const patch = (value: Partial<CommitteePageData>) => setDraft(current => ({ ...current, ...value }));
    const updateCommittee = (index: number, value: Partial<CommitteeShowcaseItem>) => patch({
        committees: draft.committees.map((committee, itemIndex) => itemIndex === index ? { ...committee, ...value } : committee),
    });

    const save = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings/committees-page', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Could not save Committees page');
            showToast('Committees page saved', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not save Committees page', 'error');
        } finally {
            setSaving(false);
        }
    };

    const importLiveCommittees = async () => {
        setImporting(true);
        try {
            const response = await fetch('/api/committees', { cache: 'no-store' });
            const json = await response.json().catch(() => ({}));
            if (!response.ok || !json?.ok) throw new Error('Could not load live committees');
            const imported: CommitteeShowcaseItem[] = (json.data ?? []).map((committee: Record<string, unknown>) => ({
                id: `live-${committee.id}`,
                name: String(committee.name ?? ''),
                abbreviation: String(committee.abbr ?? ''),
                description: Array.isArray(committee.topicList) && committee.topicList.length
                    ? `Committee topics: ${committee.topicList.join(', ')}.`
                    : 'Add a public description for this committee.',
                image: String(committee.logoUrl ?? ''),
            }));
            if (!imported.length) throw new Error('No live committees are available to import');
            patch({ committees: imported });
            showToast(`Imported ${imported.length} committees`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not import committees', 'error');
        } finally {
            setImporting(false);
        }
    };

    if (loading) return <div style={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.textMuted }}><Loader2 size={18} className="animate-spin" /> Loading Committees page...</div>;

    const iconButton: React.CSSProperties = { width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer' };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, fontFamily: '"Inter",system-ui,sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="button" title="Back to events" onClick={onBack} style={{ ...iconButton, width: 38, height: 38 }}><ArrowLeft size={17} /></button>
                    <div>
                        <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text }}>Committees Page</h1>
                        <p style={{ marginTop: 4, fontSize: 14, color: C.textSec }}>Manage the public committee introduction, order, descriptions, and logos.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={importLiveCommittees} disabled={importing} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: importing ? 'default' : 'pointer' }}>
                        {importing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Import Live Committees
                    </button>
                    <button type="button" onClick={save} disabled={saving} style={{ minWidth: 150, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 16px', borderRadius: 8, border: 'none', background: C.accent, color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.65 : 1 }}>
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Page
                    </button>
                </div>
            </div>

            <section style={{ padding: 20, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, boxShadow: C.shadow, display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Users size={17} style={{ color: C.accent }} /><h2 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Page Introduction</h2></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <Field label="Section Label" value={draft.tag} onChange={tag => patch({ tag })} />
                    <Field label="Main Heading" value={draft.heading} onChange={heading => patch({ heading })} />
                </div>
                <TextArea label="Introduction" value={draft.introduction} onChange={introduction => patch({ introduction })} rows={3} />
            </section>

            <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, boxShadow: C.shadow, overflow: 'hidden' }}>
                <header style={{ padding: '17px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div><h2 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Committee Showcase</h2><p style={{ marginTop: 3, fontSize: 12.5, color: C.textSec }}>Items appear in this order on the public timeline.</p></div>
                    <button type="button" onClick={() => patch({ committees: [...draft.committees, { id: crypto.randomUUID(), name: 'New Committee', abbreviation: '', description: '', image: '' }] })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Plus size={14} /> Add Committee</button>
                </header>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {draft.committees.map((committee, index) => (
                        <div key={committee.id} style={{ padding: 18, border: `1px solid ${C.border}`, borderRadius: 8, display: 'grid', gap: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <strong style={{ color: C.text, fontSize: 13 }}>{String(index + 1).padStart(2, '0')} - {committee.name}</strong>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <button type="button" title="Move up" disabled={index === 0} onClick={() => patch({ committees: moveItem(draft.committees, index, -1) })} style={{ ...iconButton, opacity: index === 0 ? 0.35 : 1 }}><ArrowUp size={14} /></button>
                                    <button type="button" title="Move down" disabled={index === draft.committees.length - 1} onClick={() => patch({ committees: moveItem(draft.committees, index, 1) })} style={{ ...iconButton, opacity: index === draft.committees.length - 1 ? 0.35 : 1 }}><ArrowDown size={14} /></button>
                                    <button type="button" title="Remove" onClick={() => patch({ committees: draft.committees.filter((_, itemIndex) => itemIndex !== index) })} style={{ ...iconButton, color: C.red }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                <Field label="Committee Name" value={committee.name} onChange={name => updateCommittee(index, { name })} />
                                <Field label="Abbreviation" value={committee.abbreviation} onChange={abbreviation => updateCommittee(index, { abbreviation })} />
                            </div>
                            <TextArea label="Public Description" value={committee.description} onChange={description => updateCommittee(index, { description })} rows={3} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Committee Logo</span><LogoField value={committee.image} onChange={image => updateCommittee(index, { image })} /></div>
                        </div>
                    ))}
                </div>
            </section>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={save} disabled={saving} style={{ minWidth: 170, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 18px', borderRadius: 8, border: 'none', background: C.green, color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.65 : 1 }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Committees Page
                </button>
            </div>
        </div>
    );
}
