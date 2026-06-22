'use client';

import React, { useState, useRef } from 'react';
import {
    User, Mail, Phone, MapPin, Globe, Megaphone, Users, UserCircle,
    Building2, Hash, CheckCircle2, Clock, XCircle, ArrowRight, AlertCircle, MessageSquareText,
    Upload, FileText, Image as ImageIcon, X as XIcon, ShieldCheck, Lock,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/auth/AuthContext';
import { useConference } from '@/context/ConferenceContext';
import { useRouter } from 'next/navigation';
import { uploadFile, fileUrl } from '@/lib/fileStore';
import { AcceptanceLetterDownloadButton, AcceptanceLetterPreview } from '@/components/AcceptanceLetterButton';

function openStoredDoc(key: string) {
    window.open(fileUrl(key), '_blank', 'noopener');
}

const MAX_DOC_MB = 20;

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', purple: '#7C5FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const HEARD_OPTIONS = ['Social Media', 'Friend / Colleague', 'School / University', 'Past MUN Event', 'Online Search', 'Other'];

/* ── Stable, module-level field components (defined OUTSIDE the page so React never remounts them) ── */

interface TextFieldProps {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}

function TextField({ icon: Icon, label, value, onChange, placeholder, type = 'text', required = true }: TextFieldProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSec }}>
                {label}{required && <span style={{ color: C.red }}> *</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <Icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                <input
                    type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    style={{
                        width: '100%', padding: '10px 12px 10px 38px', borderRadius: 9, border: `1px solid ${C.border}`,
                        fontSize: 13.5, color: C.text, background: C.bg, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = C.accent)}
                    onBlur={e => (e.target.style.borderColor = C.border)}
                />
            </div>
        </div>
    );
}

interface YesNoProps {
    label: string;
    value: boolean | null;
    onChange: (v: boolean) => void;
}

function YesNoField({ label, value, onChange }: YesNoProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSec }}>
                {label}<span style={{ color: C.red }}> *</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: true, t: 'Yes' }, { v: false, t: 'No' }].map(opt => {
                    const selected = value === opt.v;
                    return (
                        <button type="button" key={opt.t} onClick={() => onChange(opt.v)}
                            style={{
                                flex: 1, padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                                border: `1.5px solid ${selected ? C.accent : C.border}`,
                                background: selected ? `${C.accent}0E` : C.bg,
                                color: selected ? C.accent : C.textSec, fontSize: 13, fontWeight: 600,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .12s',
                            }}
                        >
                            <span style={{ width: 15, height: 15, borderRadius: '50%', border: `2px solid ${selected ? C.accent : C.border}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selected && <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent }} />}
                            </span>
                            {opt.t}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const EMPTY = {
    fullName: '', email: '', phone: '', address: '', country: '', heardFrom: '',
    firstTimeMun: null as boolean | null,
    attendedMyimunBefore: null as boolean | null,
    motivation: '',
    type: 'Individual' as 'Individual' | 'Group',
    groupName: '', groupSize: '', institution: '',
};

export default function DelegateRegistrationPage() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const { submitRegistration, getRegistrationForDelegate, getPaymentForDelegate, packages, events, conferenceSettings } = useConference();

    const delegateId = user?.id ?? 'unknown';
    const existing = getRegistrationForDelegate(delegateId);
    const payment = getPaymentForDelegate(delegateId);

    const [form, setForm] = useState({
        ...EMPTY,
        fullName: user?.name && user.name !== 'Honorable Delegate' ? user.name : '',
        email: user?.email ?? '',
        country: user?.country ?? '',
    });
    const [idFile, setIdFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [reapplying, setReapplying] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm(f => ({ ...f, [key]: value }));

    const pickFile = (file: File) => {
        const okType = file.type === 'application/pdf' || file.type.startsWith('image/');
        if (!okType) { showToast('Only PDF or image files are accepted.', 'error'); return; }
        if (file.size > MAX_DOC_MB * 1024 * 1024) { showToast(`File must be under ${MAX_DOC_MB} MB.`, 'error'); return; }
        setIdFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.country.trim() || !form.heardFrom) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        if (form.firstTimeMun === null || form.attendedMyimunBefore === null) {
            showToast('Please answer the experience questions.', 'error');
            return;
        }
        if (!form.motivation.trim()) {
            showToast('Please tell us a bit about yourself and why you want to participate.', 'error');
            return;
        }
        if (!idFile) {
            showToast('Please upload your ID card or passport for hotel reservation.', 'error');
            return;
        }
        if (form.type === 'Group' && (!form.groupName.trim() || !form.institution.trim() || !form.groupSize.trim())) {
            showToast('Please complete the group details.', 'error');
            return;
        }

        setSubmitting(true);
        let docMeta: { idDocName?: string; idDocSize?: number; idDocType?: string; idDocKey?: string } = {};
        try {
            const up = await uploadFile(idFile);
            docMeta = { idDocName: idFile.name, idDocSize: idFile.size, idDocType: idFile.type, idDocKey: up.key };
        } catch {
            setSubmitting(false);
            showToast('Could not upload your document. Please try a smaller file.', 'error');
            return;
        }

        try {
            await submitRegistration({
                delegateId,
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                country: form.country.trim(),
                heardFrom: form.heardFrom,
                firstTimeMun: form.firstTimeMun,
                attendedMyimunBefore: form.attendedMyimunBefore,
                motivation: form.motivation.trim(),
                ...docMeta,
                type: form.type,
                groupName: form.type === 'Group' ? form.groupName.trim() : undefined,
                groupSize: form.type === 'Group' ? parseInt(form.groupSize) || 0 : undefined,
                institution: form.type === 'Group' ? form.institution.trim() : undefined,
            } as never);
            setReapplying(false); // return to status view (now showing the fresh Pending registration)
            showToast('Registration submitted! Our team will review it shortly.', 'success');
        } catch {
            showToast('Could not submit your registration. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const startReapply = () => {
        if (existing) {
            setForm({
                fullName: existing.fullName,
                email: existing.email,
                phone: existing.phone,
                address: existing.address,
                country: existing.country,
                heardFrom: existing.heardFrom,
                firstTimeMun: existing.firstTimeMun,
                attendedMyimunBefore: existing.attendedMyimunBefore,
                motivation: existing.motivation,
                type: existing.type,
                groupName: existing.groupName ?? '',
                groupSize: existing.groupSize ? String(existing.groupSize) : '',
                institution: existing.institution ?? '',
            });
        }
        setReapplying(true);
    };

    if (existing && !reapplying) {
        const activeEvent = events[0];
        const fmtDate = (iso: string) => { try { return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return iso; } };
        return <RegistrationStatus existing={existing} payment={payment} packages={packages}
            onGoToPayment={() => router.push('/dashboard/payments')} onReapply={startReapply}
            registrationOpen={conferenceSettings.registrationOpen}
            letterEditionYear={activeEvent?.letterEditionYear || '8th Annual Edition 2026'}
            letterStart={fmtDate(activeEvent?.startDate || '')}
            letterEnd={fmtDate(activeEvent?.endDate || '')} />;
    }

    if (!conferenceSettings.registrationOpen) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', maxWidth: 720 }}>
                <div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                        Event Registration
                    </h1>
                    <p style={{ fontSize: 14, color: C.textSec }}>Complete your registration to participate in MYIMUN events.</p>
                </div>
                <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}28`, borderRadius: 14, padding: '32px 28px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow }}>
                        <Lock size={24} style={{ color: C.red }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>Registration Closed</p>
                        <p style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.6 }}>
                            Registrations for this conference are currently closed by the organizers. Please check back later or contact the secretariat for more information.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', maxWidth: 760 }}>

            {/* Header */}
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                    Event Registration
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>
                    Complete your registration to participate in MYIMUN events. Once approved, you'll unlock payment and full platform access.
                </p>
            </div>

            {/* Progress indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 20px', boxShadow: C.shadow }}>
                {[
                    { label: 'Register', active: true },
                    { label: 'Approval', active: false },
                    { label: 'Payment', active: false },
                    { label: 'Full Access', active: false },
                ].map((step, i, arr) => (
                    <React.Fragment key={step.label}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                background: step.active ? C.accent : C.bg, color: step.active ? '#fff' : C.textMuted,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                                border: step.active ? 'none' : `1px solid ${C.border}`,
                            }}>{i + 1}</div>
                            <span style={{ fontSize: 12.5, fontWeight: step.active ? 700 : 500, color: step.active ? C.text : C.textMuted, whiteSpace: 'nowrap' }}>{step.label}</span>
                        </div>
                        {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: C.border, margin: '0 12px', minWidth: 16 }} />}
                    </React.Fragment>
                ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Participation type ── */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, boxShadow: C.shadow }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Participation Type</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {([
                            { val: 'Individual', icon: UserCircle, title: 'Individual Delegate', desc: 'I am registering as a single participant.' },
                            { val: 'Group', icon: Users, title: 'Group Representative', desc: 'I am registering a group from my school/university.' },
                        ] as const).map(opt => {
                            const selected = form.type === opt.val;
                            return (
                                <button type="button" key={opt.val} onClick={() => set('type', opt.val)}
                                    style={{
                                        textAlign: 'left', padding: '16px 16px', borderRadius: 12, cursor: 'pointer',
                                        border: `2px solid ${selected ? C.accent : C.border}`,
                                        background: selected ? `${C.accent}08` : C.surface,
                                        display: 'flex', flexDirection: 'column', gap: 8, transition: 'all .15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 10, background: selected ? C.accent : C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <opt.icon size={19} style={{ color: selected ? '#fff' : C.textMuted }} />
                                        </div>
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? C.accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {selected && <div style={{ width: 9, height: 9, borderRadius: '50%', background: C.accent }} />}
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{opt.title}</p>
                                        <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.45 }}>{opt.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Group extra fields */}
                    {form.type === 'Group' && (
                        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px dashed ${C.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.purple, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Users size={13} /> Group Details
                            </p>
                            <TextField icon={Building2} label="School / University Name" value={form.institution} onChange={v => set('institution', v)} placeholder="e.g. Royal University of Diplomacy" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <TextField icon={Users} label="Group / Delegation Name" value={form.groupName} onChange={v => set('groupName', v)} placeholder="e.g. Team Falcon" />
                                <TextField icon={Hash} label="Number of Delegates" value={form.groupSize} onChange={v => set('groupSize', v)} placeholder="e.g. 8" type="number" />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Personal information ── */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {form.type === 'Group' ? 'Representative Information' : 'Personal Information'}
                    </p>
                    <TextField icon={User} label="Full Name" value={form.fullName} onChange={v => set('fullName', v)} placeholder="Your full name" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <TextField icon={Mail} label="Email Address" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" type="email" />
                        <TextField icon={Phone} label="Phone Number" value={form.phone} onChange={v => set('phone', v)} placeholder="+1 555 000 0000" type="tel" />
                    </div>
                    <TextField icon={MapPin} label="Address" value={form.address} onChange={v => set('address', v)} placeholder="Street, City, ZIP" />
                    <TextField icon={Globe} label="Country" value={form.country} onChange={v => set('country', v)} placeholder="e.g. France" />

                    {/* Heard from select */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSec }}>
                            Where did you hear about us?<span style={{ color: C.red }}> *</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Megaphone size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                            <select value={form.heardFrom} onChange={e => set('heardFrom', e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px 10px 38px', borderRadius: 9, border: `1px solid ${C.border}`,
                                    fontSize: 13.5, color: form.heardFrom ? C.text : C.textMuted, background: C.bg, outline: 'none', cursor: 'pointer',
                                    appearance: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                }}
                            >
                                <option value="">Select an option…</option>
                                {HEARD_OPTIONS.map(o => <option key={o} value={o} style={{ color: C.text }}>{o}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Experience & motivation ── */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Experience & Motivation</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <YesNoField label="Is this your first time in a MUN?" value={form.firstTimeMun} onChange={v => set('firstTimeMun', v)} />
                        <YesNoField label="Have you participated in MYIMUN before?" value={form.attendedMyimunBefore} onChange={v => set('attendedMyimunBefore', v)} />
                    </div>

                    {/* Motivation textarea */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageSquareText size={14} style={{ color: C.textMuted }} />
                            Tell us about yourself & why you want to participate<span style={{ color: C.red }}> *</span>
                        </label>
                        <textarea value={form.motivation} onChange={e => set('motivation', e.target.value)} rows={4}
                            placeholder="Introduce yourself, your interests in diplomacy, and what motivates you to join MYIMUN…"
                            style={{
                                width: '100%', padding: '12px 14px', borderRadius: 9, border: `1px solid ${C.border}`,
                                fontSize: 13.5, color: C.text, background: C.bg, outline: 'none', resize: 'vertical',
                                fontFamily: 'inherit', lineHeight: 1.55, boxSizing: 'border-box',
                            }}
                            onFocus={e => (e.target.style.borderColor = C.accent)}
                            onBlur={e => (e.target.style.borderColor = C.border)}
                        />
                    </div>
                </div>

                {/* ── Identity document ── */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Identity Document</p>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: C.green, fontWeight: 600 }}>
                            <ShieldCheck size={13} /> Used only for hotel reservation
                        </span>
                    </div>
                    <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5, marginTop: -4 }}>
                        Upload your <strong style={{ color: C.text }}>ID card or passport</strong> so we can complete your hotel reservation.<span style={{ color: C.red }}> *</span>
                    </p>

                    {!idFile ? (
                        <div
                            onClick={() => fileRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
                            style={{
                                border: `2px dashed ${C.border}`, borderRadius: 12, padding: '28px 20px',
                                textAlign: 'center', cursor: 'pointer', background: C.bg, transition: 'all .15s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
                        >
                            <div style={{ width: 46, height: 46, borderRadius: 12, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <Upload size={20} style={{ color: C.accent }} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Click to upload or drag & drop</p>
                            <p style={{ fontSize: 12.5, color: C.textMuted, marginTop: 5 }}>PDF or image · Max {MAX_DOC_MB} MB</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: `${C.green}08`, border: `1px solid ${C.green}30` }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow }}>
                                {idFile.type === 'application/pdf'
                                    ? <FileText size={20} style={{ color: C.red }} />
                                    : <ImageIcon size={20} style={{ color: C.accent }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13.5, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idFile.name}</p>
                                <p style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>
                                    {(idFile.size / (1024 * 1024)).toFixed(2)} MB · {idFile.type === 'application/pdf' ? 'PDF' : 'Image'}
                                </p>
                            </div>
                            <button type="button" onClick={() => { setIdFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                title="Remove file"
                                style={{ padding: 7, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted, flexShrink: 0 }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                            ><XIcon size={16} /></button>
                        </div>
                    )}
                    <input ref={fileRef} type="file" accept=".pdf,application/pdf,image/*" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }}
                    />
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 12, color: C.textMuted, marginRight: 'auto' }}>
                        By submitting, you agree to MYIMUN's participation terms.
                    </p>
                    <button type="submit" disabled={submitting} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 26px', borderRadius: 10, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                        background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700,
                        boxShadow: `0 4px 14px ${C.accent}45`, opacity: submitting ? 0.6 : 1,
                    }}
                        onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = '#2C6FEF'; }}
                        onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = C.accent; }}
                    >
                        {submitting ? 'Submitting…' : 'Submit Registration'} {!submitting && <ArrowRight size={16} />}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ── Status screen after submission ── */
function RegistrationStatus({ existing, payment, packages, onGoToPayment, onReapply, registrationOpen, letterEditionYear, letterStart, letterEnd }: {
    existing: any;
    payment?: any;
    packages: any[];
    onGoToPayment: () => void;
    onReapply: () => void;
    registrationOpen: boolean;
    letterEditionYear?: string;
    letterStart?: string;
    letterEnd?: string;
}) {
    const isConfirmed = existing.status === 'Accepted' && existing.paymentStatus === 'Paid' && payment?.status === 'Approved';
    const paidPkg = isConfirmed && payment?.packageId ? packages.find((p: any) => p.id === payment.packageId) : null;

    const meta = {
        Pending:  { Icon: Clock,        color: C.amber, bg: `${C.amber}12`, title: 'Registration Under Review', desc: 'Thanks for registering! Our team is reviewing your application. You will be notified once a decision is made.' },
        Accepted: { Icon: CheckCircle2, color: C.green, bg: `${C.green}12`, title: 'Registration Accepted', desc: 'Congratulations! Your registration has been approved. Proceed to payment to unlock full platform access.' },
        Declined: { Icon: XCircle,      color: C.red,   bg: `${C.red}12`,   title: 'Registration Declined', desc: 'Unfortunately, your registration was not approved at this time.' },
    }[existing.status as 'Pending' | 'Accepted' | 'Declined'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', maxWidth: 720 }}>
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>Event Registration</h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Your registration status and submitted details.</p>
            </div>

            {/* ── Confirmed Participant banner (accepted + paid) ── */}
            {isConfirmed ? (
                <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: `0 8px 28px ${C.green}22`, border: `1px solid ${C.green}30` }}>
                    {/* Green hero */}
                    <div style={{ background: `linear-gradient(135deg, #059669, #10B981)`, padding: '24px 24px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 26 }}>
                            🏅
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Status</p>
                            <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Confirmed Participant</p>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>Your registration and payment are both verified. You have full access to all conference features.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.2)' }}>
                            <ShieldCheck size={14} style={{ color: '#fff' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Verified</span>
                        </div>
                    </div>

                    {/* Package strip */}
                    {payment?.packageName && (
                        <div style={{ background: paidPkg ? `${paidPkg.color}10` : `${C.accent}08`, borderTop: `1px solid ${paidPkg ? paidPkg.color + '25' : C.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 22 }}>{paidPkg?.emoji ?? '📋'}</span>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Package</p>
                                <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{payment.packageName}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Amount Paid</p>
                                <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 18, fontWeight: 800, color: paidPkg?.color ?? C.green }}>${Number(payment.amount).toFixed(2)}</p>
                            </div>
                        </div>
                    )}

                    {/* Features */}
                    {paidPkg && paidPkg.features.length > 0 && (
                        <div style={{ padding: '14px 24px', background: C.surface, borderTop: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>What's included in your package</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                                {paidPkg.features.map((f: string, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13, color: C.text }}>
                                        <div style={{ width: 17, height: 17, borderRadius: '50%', background: `${paidPkg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                            <CheckCircle2 size={10} style={{ color: paidPkg.color }} />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* ── Normal status banner ── */
                <div style={{ background: meta.bg, border: `1px solid ${meta.color}28`, borderRadius: 14, padding: '24px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow }}>
                        <meta.Icon size={24} style={{ color: meta.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5 }}>{meta.title}</p>
                        <p style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.55 }}>{meta.desc}</p>

                        {existing.status === 'Declined' && existing.declineReason && (
                            <div style={{ marginTop: 14, padding: '12px 14px', background: C.surface, borderRadius: 10, border: `1px solid ${C.red}22` }}>
                                <p style={{ fontSize: 11.5, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Reason from organizers</p>
                                <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{existing.declineReason}</p>
                            </div>
                        )}

                        {existing.status === 'Accepted' && (
                            <button onClick={onGoToPayment} style={{
                                marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
                                padding: '11px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
                                background: C.green, color: '#fff', fontSize: 13.5, fontWeight: 700,
                                boxShadow: `0 4px 14px ${C.green}45`,
                            }}>
                                Proceed to Payment <ArrowRight size={15} />
                            </button>
                        )}
                        {existing.status === 'Declined' && (
                            registrationOpen ? (
                                <button onClick={onReapply} style={{
                                    marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 20px', borderRadius: 9, border: `1px solid ${C.border}`, cursor: 'pointer',
                                    background: C.surface, color: C.text, fontSize: 13, fontWeight: 600,
                                }}>
                                    Submit a New Registration
                                </button>
                            ) : (
                                <p style={{ marginTop: 16, fontSize: 12.5, color: C.red, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <AlertCircle size={13} /> Registration is currently closed — you cannot resubmit at this time.
                                </p>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* ── Acceptance Letter card (when accepted) ── */}
            {existing.status === 'Accepted' && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: C.shadow }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, padding: 22, alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.green}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle2 size={18} style={{ color: C.green }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Acceptance Letter</p>
                                    <p style={{ fontSize: 12, color: C.textMuted }}>Official MYIMUN acceptance confirmation</p>
                                </div>
                            </div>
                            <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6, marginBottom: 16, maxWidth: 420 }}>
                                Your official acceptance letter for <strong style={{ color: C.text }}>MYIMUN {letterEditionYear}</strong>.
                                Download it as a PDF for your records or for visa applications.
                            </p>
                            <AcceptanceLetterDownloadButton
                                delegateName={existing.fullName}
                                editionYear={letterEditionYear || '8th Annual Edition 2026'}
                                startDate={letterStart || ''}
                                endDate={letterEnd || ''}
                            />
                        </div>
                        <AcceptanceLetterPreview
                            delegateName={existing.fullName}
                            editionYear={letterEditionYear || '8th Annual Edition 2026'}
                            startDate={letterStart || ''}
                            endDate={letterEnd || ''}
                            scale={0.22}
                        />
                    </div>
                </div>
            )}

            {/* Submitted details summary */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Submitted Details</p>
                    <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                        background: existing.type === 'Group' ? `${C.purple}14` : `${C.accent}14`,
                        color: existing.type === 'Group' ? C.purple : C.accent,
                    }}>{existing.type === 'Group' ? 'Group Representative' : 'Individual Delegate'}</span>
                </div>
                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                        ['Full Name', existing.fullName],
                        ['Email', existing.email],
                        ['Phone', existing.phone],
                        ['Country', existing.country],
                        ['Address', existing.address],
                        ['Heard from', existing.heardFrom],
                        ['First MUN?', existing.firstTimeMun ? 'Yes' : 'No'],
                        ['Attended MYIMUN before?', existing.attendedMyimunBefore ? 'Yes' : 'No'],
                        ...(existing.type === 'Group' ? [
                            ['Institution', existing.institution],
                            ['Group Name', existing.groupName],
                            ['Group Size', `${existing.groupSize} delegates`],
                        ] : []),
                    ].map(([label, val]) => (
                        <div key={label}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</p>
                            <p style={{ fontSize: 13.5, color: C.text, fontWeight: 500 }}>{val || '—'}</p>
                        </div>
                    ))}
                </div>
                {existing.motivation && (
                    <div style={{ padding: '0 20px 18px' }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Motivation</p>
                        <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55, padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>{existing.motivation}</p>
                    </div>
                )}
                {existing.idDocKey && (
                    <div style={{ padding: '0 20px 18px' }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Identity Document (hotel)</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                            <div style={{ width: 38, height: 38, borderRadius: 9, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow }}>
                                {existing.idDocType === 'application/pdf'
                                    ? <FileText size={17} style={{ color: C.red }} />
                                    : <ImageIcon size={17} style={{ color: C.accent }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{existing.idDocName}</p>
                                <p style={{ fontSize: 11.5, color: C.textMuted }}>{existing.idDocSize ? `${(existing.idDocSize / (1024 * 1024)).toFixed(2)} MB` : ''}</p>
                            </div>
                            <button onClick={() => openStoredDoc(existing.idDocKey)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12.5, fontWeight: 600, color: C.accent, cursor: 'pointer', flexShrink: 0 }}>
                                View
                            </button>
                        </div>
                    </div>
                )}
                <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} style={{ color: C.textMuted }} />
                    <span style={{ fontSize: 12, color: C.textMuted }}>Submitted {existing.submittedAt}</span>
                </div>
            </div>

            {existing.status === 'Pending' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.textSec, padding: '12px 16px', background: `${C.accent}06`, borderRadius: 10, border: `1px solid ${C.accent}18` }}>
                    <AlertCircle size={15} style={{ color: C.accent, flexShrink: 0 }} />
                    Full platform access (committees, papers, schedule) unlocks after your registration is approved and payment is complete.
                </div>
            )}
        </div>
    );
}
