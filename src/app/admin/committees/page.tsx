'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Shield, Plus, Trash2, Edit2, Search, X, Upload, ImageIcon, ChevronDown, ChevronUp, CheckCircle, XCircle, Users, Globe, Layers, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference, Committee } from '@/context/ConferenceContext';
import { COUNTRIES, getFlagUrl } from '@/lib/countries';
import { StatCard, StatPanel, BarRow } from '@/components/admin/StatWidgets';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    purple: '#7C5FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
    shadowModal: '0 20px 60px rgba(0,0,0,0.18)',
};

const EMPTY_FORM = {
    name: '', abbr: '', delegates: 30, topics: 2,
    director: '', topicList: ['', ''], logoUrl: '',
};

/* ── Input helper ── */
function Input({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string | number; onChange: (v: string) => void;
    placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                {label}
            </label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
            />
        </div>
    );
}

/* ── Country selector dropdown ── */
function CountrySelect({ value, onChange, takenCountries }: {
    value: string; onChange: (v: string) => void; takenCountries: string[];
}) {
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const available = COUNTRIES.filter(c => !takenCountries.includes(c.name));
    const filtered  = available.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    const selected  = COUNTRIES.find(c => c.name === value);
    const isTaken   = value ? takenCountries.includes(value) : false;

    return (
        <div ref={ref} style={{ position: 'relative', minWidth: 220 }}>
            <button type="button" onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '7px 11px', border: `1px solid ${open ? C.accent : C.border}`, borderRadius: 8,
                    background: C.bg, cursor: 'pointer', fontSize: 13,
                    color: selected ? C.text : C.textMuted,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selected
                        ? <><img src={getFlagUrl(selected.name)} alt={selected.name} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }} /> {selected.name}</>
                        : <><Globe size={14} style={{ color: C.textMuted }} /> Assign a country…</>
                    }
                </span>
                <ChevronDown size={13} style={{ color: C.textMuted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
            </button>
            {isTaken && <p style={{ fontSize: 11, color: C.red, marginTop: 3 }}>This country is already assigned to another delegate.</p>}
            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
                        <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search countries…"
                            style={{ width: '100%', padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border}
                        />
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {filtered.length === 0
                            ? <p style={{ padding: '12px 14px', fontSize: 12, color: C.textMuted }}>No available countries found.</p>
                            : filtered.map(c => (
                                <button key={c.name} type="button"
                                    onClick={() => { onChange(c.name); setOpen(false); setSearch(''); }}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', border: 'none', background: c.name === value ? `${C.accent}12` : 'transparent', cursor: 'pointer', textAlign: 'left', color: c.name === value ? C.accent : C.text, fontSize: 13, fontWeight: c.name === value ? 600 : 400 }}
                                    onMouseEnter={e => { if (c.name !== value) (e.currentTarget as HTMLElement).style.background = C.bg; }}
                                    onMouseLeave={e => { if (c.name !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <img src={getFlagUrl(c.name)} alt={c.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }} />
                                    <span>{c.name}</span>
                                </button>
                            ))
                        }
                    </div>
                    {takenCountries.length > 0 && (
                        <div style={{ padding: '6px 14px 10px', borderTop: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                                Already assigned in this committee
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {takenCountries.map(name => {
                                    const c = COUNTRIES.find(x => x.name === name);
                                    return (
                                        <span key={name} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: `${C.red}10`, color: C.red, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            {c && <img src={getFlagUrl(c.name)} alt={c.name} style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }} />}
                                            {name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Create/Edit Modal ── */
function CommitteeModal({ committee, onClose, onSave }: {
    committee: Committee | null;
    onClose: () => void;
    onSave: (data: Omit<Committee, 'id'>) => void;
}) {
    const [form, setForm] = useState<typeof EMPTY_FORM>(() => {
        if (committee) {
            return {
                name: committee.name, abbr: committee.abbr,
                delegates: committee.delegates, topics: committee.topics,
                director: committee.director, logoUrl: committee.logoUrl ?? '',
                topicList: [...committee.topicList, ...Array(Math.max(0, 2 - committee.topicList.length)).fill('')],
            };
        }
        return { ...EMPTY_FORM };
    });
    const logoInputRef = useRef<HTMLInputElement>(null);

    const setF = (key: keyof typeof EMPTY_FORM, val: any) => setForm(f => ({ ...f, [key]: val }));

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setF('logoUrl', ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const updateTopic = (i: number, val: string) => {
        const t = [...form.topicList]; t[i] = val; setF('topicList', t);
    };
    const addTopic    = () => setF('topicList', [...form.topicList, '']);
    const removeTopic = (i: number) => {
        const t = form.topicList.filter((_, idx) => idx !== i);
        setF('topicList', t.length ? t : ['']);
    };

    const handleSave = () => {
        if (!form.name.trim() || !form.abbr.trim()) return;
        onSave({
            name: form.name.trim(), abbr: form.abbr.trim().toUpperCase(),
            delegates: Number(form.delegates) || 0,
            topics: form.topicList.filter(t => t.trim()).length,
            director: form.director.trim(),
            topicList: form.topicList.filter(t => t.trim()),
            logoUrl: form.logoUrl,
        });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: C.shadowModal }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h3 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 18, fontWeight: 700, color: C.text }}>
                        {committee ? 'Edit Committee' : 'New Committee'}
                    </h3>
                    <button onClick={onClose} style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    ><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Logo */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Committee Logo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 60, height: 60, borderRadius: 12, border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, background: C.bg }}>
                                {form.logoUrl ? <img src={form.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={22} style={{ color: C.textMuted }} />}
                            </div>
                            <button type="button" onClick={() => logoInputRef.current?.click()}
                                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 13, color: C.textSec, cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
                            ><Upload size={14} /> Upload Image</button>
                            {form.logoUrl && (
                                <button type="button" onClick={() => setF('logoUrl', '')}
                                    style={{ fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                            )}
                            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                        <Input label="Committee Name" value={form.name} onChange={v => setF('name', v)} placeholder="e.g. United Nations Security Council" />
                        <Input label="Abbreviation"   value={form.abbr} onChange={v => setF('abbr', v.toUpperCase())} placeholder="UNSC" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Input label="Max Delegates"     value={form.delegates} onChange={v => setF('delegates', v)} type="number" />
                        <Input label="Committee Director" value={form.director}  onChange={v => setF('director', v)} placeholder="Dr. Jane Smith" />
                    </div>

                    {/* Topics */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Topics</label>
                            <button type="button" onClick={addTopic}
                                style={{ fontSize: 12, fontWeight: 600, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Plus size={13} /> Add Topic
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {form.topicList.map((topic, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}.</span>
                                    <input value={topic} onChange={e => updateTopic(i, e.target.value)} placeholder={`Topic ${i + 1}…`}
                                        style={{ flex: 1, padding: '8px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none' }}
                                        onFocus={e => e.target.style.borderColor = C.accent}
                                        onBlur={e => e.target.style.borderColor = C.border}
                                    />
                                    <button type="button" onClick={() => removeTopic(i)}
                                        style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.red; (e.currentTarget as HTMLElement).style.background = `${C.red}10`; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.textMuted; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                    ><X size={13} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                    <button onClick={onClose}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 14, fontWeight: 500, color: C.textSec, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >Cancel</button>
                    <button onClick={handleSave} disabled={!form.name.trim() || !form.abbr.trim()}
                        style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: form.name && form.abbr ? C.accent : C.border, color: form.name && form.abbr ? 'white' : C.textMuted, fontSize: 14, fontWeight: 600, cursor: form.name && form.abbr ? 'pointer' : 'not-allowed', boxShadow: form.name && form.abbr ? `0 2px 8px ${C.accent}40` : 'none' }}
                        onMouseEnter={e => { if (form.name && form.abbr) (e.currentTarget as HTMLElement).style.background = '#2C6FEF'; }}
                        onMouseLeave={e => { if (form.name && form.abbr) (e.currentTarget as HTMLElement).style.background = C.accent; }}
                    >{committee ? 'Save Changes' : 'Create Committee'}</button>
                </div>
            </div>
        </div>
    );
}

/* ── Main page ── */
export default function AdminCommitteesPage() {
    const { showToast } = useToast();
    const { committees, addCommittee, updateCommittee, deleteCommittee, getApplicationsForCommittee, updateApplicationStatus, reassignApplication, assignCountryToDelegate } = useConference();
    const [search,           setSearch]           = useState('');
    const [modal,            setModal]            = useState<{ open: boolean; committee: Committee | null }>({ open: false, committee: null });
    const [expandedId,       setExpandedId]       = useState<number | null>(null);
    const [appsId,           setAppsId]           = useState<number | null>(null);
    const [reassignId,        setReassignId]        = useState<number | null>(null);
    const [countrySelections, setCountrySelections] = useState<Record<number, string>>({});
    const [editCountryId,     setEditCountryId]     = useState<number | null>(null);
    const [editCountryValue,  setEditCountryValue]  = useState<string>('');

    const filtered = committees.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.abbr.toLowerCase().includes(search.toLowerCase())
    );

    /* ── Aggregate stats ── */
    const committeeFill = committees.map(c => {
        const apps = getApplicationsForCommittee(c.abbr);
        return { abbr: c.abbr, approved: apps.filter(a => a.status === 'Approved').length, pending: apps.filter(a => a.status === 'Pending').length, capacity: c.delegates };
    });
    const totalCapacity = committeeFill.reduce((s, c) => s + c.capacity, 0);
    const totalApproved = committeeFill.reduce((s, c) => s + c.approved, 0);
    const totalPending   = committeeFill.reduce((s, c) => s + c.pending, 0);
    const avgFillPct = totalCapacity > 0 ? Math.round((totalApproved / totalCapacity) * 100) : 0;
    const fillSorted = [...committeeFill].sort((a, b) => (b.approved / Math.max(b.capacity, 1)) - (a.approved / Math.max(a.capacity, 1)));

    const openCreate = () => setModal({ open: true, committee: null });
    const openEdit   = (c: Committee) => setModal({ open: true, committee: c });
    const closeModal = () => setModal({ open: false, committee: null });

    const handleSave = (data: Omit<Committee, 'id'>) => {
        if (modal.committee) { updateCommittee(modal.committee.id, data); showToast(`"${data.name}" updated`, 'success'); }
        else                 { addCommittee(data);                        showToast(`"${data.name}" created`, 'success'); }
        closeModal();
    };

    const handleDelete = (c: Committee) => {
        if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
        deleteCommittee(c.id);
        showToast('Committee deleted', 'info');
    };

    const approveApp = (id: number, name: string, abbr: string) => {
        const country = countrySelections[id];
        if (!country) { showToast('Select a country for this delegate first', 'warning'); return; }
        assignCountryToDelegate(id, country);
        updateApplicationStatus(id, 'Approved');
        showToast(`${name} approved for ${abbr} — representing ${country}`, 'success');
        setCountrySelections(prev => { const n = { ...prev }; delete n[id]; return n; });
    };

    const rejectApp = (id: number, name: string) => {
        updateApplicationStatus(id, 'Rejected');
        showToast(`${name}'s application rejected — delegate can now reapply`, 'warning');
        setReassignId(null);
    };

    const doReassign = (appId: number, newAbbr: string, name: string) => {
        reassignApplication(appId, newAbbr);
        showToast(`${name} reassigned to ${newAbbr}`, 'success');
        setReassignId(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>Committees</h1>
                    <p style={{ fontSize: 14, color: C.textSec }}>Manage committee details, topics, directors, and delegate applications.</p>
                </div>
                <button onClick={openCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.accent, color: 'white', padding: '9px 18px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: `0 2px 8px ${C.accent}40` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                >
                    <Plus size={14} /> New Committee
                </button>
            </div>

            {/* ── Aggregate stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
                <StatCard label="Committees" value={String(committees.length)} trend={`${totalCapacity} total seats`} iconBg={`${C.accent}15`} iconColor={C.accent} Icon={Shield} />
                <StatCard label="Capacity" value={String(totalCapacity)} trend={`${avgFillPct}% filled overall`} iconBg={`${C.purple}15`} iconColor={C.purple} Icon={Layers} />
                <StatCard label="Delegates Assigned" value={String(totalApproved)} trend={`${totalCapacity - totalApproved} seats open`} iconBg={`${C.green}15`} iconColor={C.green} Icon={Users} />
                <StatCard label="Pending Applications" value={String(totalPending)} trend="awaiting committee review" iconBg={`${C.amber}15`} iconColor={C.amber} Icon={Clock} />
            </div>

            {/* ── Capacity by committee ── */}
            {fillSorted.length > 0 && (
                <StatPanel title="Capacity by Committee" subtitle="Approved delegates vs. seats available, fullest first">
                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
                        {fillSorted.map(c => (
                            <BarRow key={c.abbr} label={c.abbr} value={c.approved} max={Math.max(c.capacity, 1)} color={C.accent}
                                sublabel={`${c.approved}/${c.capacity}${c.pending > 0 ? ` · ${c.pending} pending` : ''}`} />
                        ))}
                    </div>
                </StatPanel>
            )}

            {/* Table card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                {/* Search */}
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ position: 'relative', maxWidth: 380 }}>
                        <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                        <input type="text" placeholder="Search committees…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border}
                        />
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#FAFBFC', borderBottom: `1px solid ${C.border}` }}>
                                {['Committee', 'Abbr', 'Delegates', 'Topics', 'Director', 'Applications', 'Actions'].map((h, i) => (
                                    <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: i === 6 ? 'right' : 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => {
                                const apps = getApplicationsForCommittee(c.abbr);
                                const pendingCount  = apps.filter(a => a.status === 'Pending').length;
                                const approvedCount = apps.filter(a => a.status === 'Approved').length;
                                const topicsExpanded = expandedId === c.id;
                                const appsExpanded   = appsId === c.id;

                                return (
                                    <React.Fragment key={c.id}>
                                        <tr
                                            style={{ borderBottom: `1px solid ${C.border}` }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                        >
                                            {/* Name + logo */}
                                            <td style={{ padding: '13px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: `${C.accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {c.logoUrl ? <img src={c.logoUrl} alt={c.abbr} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Shield size={16} style={{ color: C.accent }} />}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.name}</p>
                                                        {c.director && <p style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{c.director}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '13px 18px', fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: C.accent }}>{c.abbr}</td>
                                            <td style={{ padding: '13px 18px', fontSize: 14, color: C.text }}>{c.delegates}</td>
                                            {/* Topics — expandable */}
                                            <td style={{ padding: '13px 18px' }}>
                                                <button onClick={() => setExpandedId(topicsExpanded ? null : c.id)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.text, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                                    {c.topicList.filter(t => t).length}
                                                    {topicsExpanded ? <ChevronUp size={13} style={{ color: C.textMuted }} /> : <ChevronDown size={13} style={{ color: C.textMuted }} />}
                                                </button>
                                            </td>
                                            <td style={{ padding: '13px 18px', fontSize: 13, color: C.textSec }}>{c.director || '—'}</td>
                                            {/* Applications badge */}
                                            <td style={{ padding: '13px 18px' }}>
                                                <button onClick={() => setAppsId(appsExpanded ? null : c.id)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                                    {pendingCount > 0 && (
                                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${C.amber}14`, color: C.amber }}>
                                                            {pendingCount} pending
                                                        </span>
                                                    )}
                                                    {approvedCount > 0 && (
                                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${C.green}12`, color: C.green }}>
                                                            {approvedCount} approved
                                                        </span>
                                                    )}
                                                    {apps.length === 0 && <span style={{ fontSize: 12, color: C.textMuted }}>—</span>}
                                                    {apps.length > 0 && (appsExpanded ? <ChevronUp size={12} style={{ color: C.textMuted }} /> : <ChevronDown size={12} style={{ color: C.textMuted }} />)}
                                                </button>
                                            </td>
                                            {/* Actions */}
                                            <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                                    <button onClick={() => openEdit(c)}
                                                        style={{ padding: 7, borderRadius: 7, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    ><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDelete(c)}
                                                        style={{ padding: 7, borderRadius: 7, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    ><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Topics expanded row */}
                                        {topicsExpanded && (
                                            <tr style={{ background: `${C.accent}04`, borderBottom: `1px solid ${C.border}` }}>
                                                <td colSpan={7} style={{ padding: '10px 18px 14px 66px' }}>
                                                    <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Topics on Agenda</p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {c.topicList.filter(t => t).map((t, i) => (
                                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ width: 20, height: 20, borderRadius: '50%', background: `${C.accent}15`, color: C.accent, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                                                                <span style={{ fontSize: 13, color: C.text }}>{t}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {/* Applications expanded row */}
                                        {appsExpanded && (
                                            <tr style={{ background: `${C.amber}05`, borderBottom: `1px solid ${C.border}` }}>
                                                <td colSpan={7} style={{ padding: '14px 18px 18px 18px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                        <Users size={13} style={{ color: C.amber }} />
                                                        <p style={{ fontSize: 11, fontWeight: 600, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                                            Committee Applications — {c.abbr}
                                                        </p>
                                                    </div>
                                                    {apps.length === 0 ? (
                                                        <p style={{ fontSize: 13, color: C.textMuted }}>No applications yet.</p>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            {apps.map(app => {
                                                                const statusColor = app.status === 'Approved' ? C.green : app.status === 'Rejected' ? C.red : C.amber;
                                                                const statusBg    = app.status === 'Approved' ? `${C.green}12` : app.status === 'Rejected' ? `${C.red}10` : `${C.amber}14`;
                                                                const isReassigning = reassignId === app.id;
                                                                const takenInCommittee = apps
                                                                    .filter(a => a.status === 'Approved' && a.assignedCountry && a.id !== app.id)
                                                                    .map(a => a.assignedCountry!);
                                                                const selectedCountry = countrySelections[app.id] ?? '';
                                                                const hasCountry = !!selectedCountry;
                                                                const assignedC = app.assignedCountry ? COUNTRIES.find(x => x.name === app.assignedCountry) : null;
                                                                return (
                                                                    <div key={app.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px' }}>
                                                                        {/* Header row */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                                                                            <div style={{ flex: 1, minWidth: 180 }}>
                                                                                <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{app.delegateName}</p>
                                                                                <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{app.country} · Applied {app.appliedAt}</p>
                                                                            </div>
                                                                            {/* Assigned country badge for approved */}
                                                                            {/* Assigned country — editable */}
                                                                            {app.status === 'Approved' && (
                                                                                editCountryId === app.id ? (
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                        <CountrySelect
                                                                                            value={editCountryValue}
                                                                                            onChange={setEditCountryValue}
                                                                                            takenCountries={takenInCommittee}
                                                                                        />
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                if (!editCountryValue) return;
                                                                                                assignCountryToDelegate(app.id, editCountryValue);
                                                                                                showToast(`Country updated to ${editCountryValue}`, 'success');
                                                                                                setEditCountryId(null);
                                                                                            }}
                                                                                            disabled={!editCountryValue}
                                                                                            style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: editCountryValue ? C.green : C.bg, color: editCountryValue ? 'white' : C.textMuted, fontWeight: 600, fontSize: 12, cursor: editCountryValue ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
                                                                                        >Save</button>
                                                                                        <button
                                                                                            onClick={() => setEditCountryId(null)}
                                                                                            style={{ padding: '6px 10px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSec, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                                                                                        >Cancel</button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: `${C.accent}12`, color: C.accent, border: `1px solid ${C.accent}25` }}>
                                                                                        {assignedC && <img src={getFlagUrl(assignedC.name)} alt={assignedC.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.accent}30` }} />}
                                                                                        {app.assignedCountry || 'No country assigned'}
                                                                                        <button
                                                                                            onClick={() => { setEditCountryId(app.id); setEditCountryValue(app.assignedCountry || ''); }}
                                                                                            title="Change assigned country"
                                                                                            style={{ display: 'flex', alignItems: 'center', padding: '1px 3px', borderRadius: 4, border: 'none', background: `${C.accent}20`, color: C.accent, cursor: 'pointer', marginLeft: 2 }}
                                                                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${C.accent}35`}
                                                                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${C.accent}20`}
                                                                                        ><Edit2 size={11} /></button>
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: statusBg, color: statusColor }}>
                                                                                {app.status}
                                                                            </span>
                                                                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                                                {/* Reject — shown when Pending or Approved (revoke) */}
                                                                                {app.status !== 'Rejected' && (
                                                                                    <button onClick={() => rejectApp(app.id, app.delegateName)}
                                                                                        style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: `${C.red}10`, color: C.red, fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                                                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${C.red}18`}
                                                                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${C.red}10`}
                                                                                    ><XCircle size={13} /> {app.status === 'Approved' ? 'Revoke' : 'Reject'}</button>
                                                                                )}
                                                                                {/* Reassign — only for Approved */}
                                                                                {app.status === 'Approved' && (
                                                                                    <button onClick={() => setReassignId(isReassigning ? null : app.id)}
                                                                                        style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${C.border}`, background: isReassigning ? C.bg : 'transparent', color: C.textSec, fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                                                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                                                                        onMouseLeave={e => { if (!isReassigning) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                                                                    >Reassign</button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {/* Country assignment row — pending only */}
                                                                        {app.status === 'Pending' && (
                                                                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                                                                                <div style={{ flex: 1, minWidth: 200 }}>
                                                                                    <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                                                                                        Assign Country to Represent <span style={{ color: C.red }}>*</span>
                                                                                    </p>
                                                                                    <CountrySelect
                                                                                        value={selectedCountry}
                                                                                        onChange={v => setCountrySelections(prev => ({ ...prev, [app.id]: v }))}
                                                                                        takenCountries={takenInCommittee}
                                                                                    />
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => approveApp(app.id, app.delegateName, c.abbr)}
                                                                                    disabled={!hasCountry}
                                                                                    title={hasCountry ? `Approve and assign ${selectedCountry}` : 'Select a country first'}
                                                                                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: hasCountry ? `${C.green}15` : C.bg, color: hasCountry ? C.green : C.textMuted, fontWeight: 600, fontSize: 12, cursor: hasCountry ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'all .15s' }}
                                                                                    onMouseEnter={e => { if (hasCountry) (e.currentTarget as HTMLElement).style.background = `${C.green}25`; }}
                                                                                    onMouseLeave={e => { if (hasCountry) (e.currentTarget as HTMLElement).style.background = `${C.green}15`; }}
                                                                                >
                                                                                    <CheckCircle size={14} />
                                                                                    Approve
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        {/* Application answers */}
                                                                        {(app.whyThisCommittee || app.preferredCountry || app.whyShouldWePickYou) && (
                                                                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', background: '#FAFBFC', borderRadius: 8, border: `1px solid ${C.border}` }}>
                                                                                <p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Application Answers</p>
                                                                                {app.whyThisCommittee && (
                                                                                    <div>
                                                                                        <p style={{ fontSize: 11, fontWeight: 600, color: C.accent, marginBottom: 3 }}>Why this committee?</p>
                                                                                        <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{app.whyThisCommittee}</p>
                                                                                    </div>
                                                                                )}
                                                                                {app.preferredCountry && (
                                                                                    <div>
                                                                                        <p style={{ fontSize: 11, fontWeight: 600, color: C.accent, marginBottom: 3 }}>Preferred country to represent?</p>
                                                                                        <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{app.preferredCountry}</p>
                                                                                    </div>
                                                                                )}
                                                                                {app.whyShouldWePickYou && (
                                                                                    <div>
                                                                                        <p style={{ fontSize: 11, fontWeight: 600, color: C.accent, marginBottom: 3 }}>Why should we select you?</p>
                                                                                        <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{app.whyShouldWePickYou}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {/* Reassign dropdown */}
                                                                        {isReassigning && (
                                                                            <div style={{ marginTop: 12, padding: '12px 14px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                                                                                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                                                                                    Move {app.delegateName} to:
                                                                                </p>
                                                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                                                    {committees.filter(cm => cm.abbr !== app.committeeAbbr).map(cm => (
                                                                                        <button key={cm.id}
                                                                                            onClick={() => doReassign(app.id, cm.abbr, app.delegateName)}
                                                                                            style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 600, color: C.text, cursor: 'pointer' }}
                                                                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.accent}10`; (e.currentTarget as HTMLElement).style.borderColor = C.accent; (e.currentTarget as HTMLElement).style.color = C.accent; }}
                                                                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                                                                        >
                                                                                            {cm.abbr} — {cm.name}
                                                                                        </button>
                                                                                    ))}
                                                                                    {committees.filter(cm => cm.abbr !== app.committeeAbbr).length === 0 && (
                                                                                        <p style={{ fontSize: 12, color: C.textMuted }}>No other committees available.</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', fontSize: 14, color: C.textMuted }}>No committees found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal.open && (
                <CommitteeModal committee={modal.committee} onClose={closeModal} onSave={handleSave} />
            )}
        </div>
    );
}
