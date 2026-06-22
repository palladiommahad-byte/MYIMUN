'use client';

import React, { useState } from 'react';
import {
    ClipboardList, CheckCircle2, XCircle, Clock, Search, Eye, X, Check,
    User, Mail, Phone, MapPin, Globe, Megaphone, Building2, Users, Hash, CreditCard,
    Award, Repeat, MessageSquareText, FileText, Image as ImageIcon, ExternalLink, Download,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference, Registration } from '@/context/ConferenceContext';
import { fileUrl } from '@/lib/fileStore';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', purple: '#7C5FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
    overlay: 'rgba(17,24,39,0.35)',
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    Accepted: { bg: `${C.green}14`, color: C.green },
    Declined: { bg: `${C.red}12`,   color: C.red   },
    Pending:  { bg: `${C.amber}14`, color: C.amber },
};

type FilterKey = 'All' | 'Pending' | 'Accepted' | 'Declined';

export default function AdminRegistrationPage() {
    const { showToast } = useToast();
    const { registrations, updateRegistrationStatus } = useConference();

    const [filter, setFilter]     = useState<FilterKey>('All');
    const [search, setSearch]     = useState('');
    const [viewReg, setViewReg]   = useState<Registration | null>(null);
    const [declineFor, setDeclineFor] = useState<Registration | null>(null);
    const [declineMsg, setDeclineMsg] = useState('');

    const accept = (reg: Registration) => {
        updateRegistrationStatus(reg.id, 'Accepted');
        showToast(`${reg.fullName}'s registration accepted.`, 'success');
        setViewReg(null);
    };

    const viewDoc = (key: string) => {
        window.open(fileUrl(key), '_blank', 'noopener');
    };

    const downloadDoc = (key: string, name: string) => {
        const a = document.createElement('a');
        a.href = fileUrl(key); a.download = name; a.target = '_blank'; a.click();
    };

    const openDecline = (reg: Registration) => { setDeclineFor(reg); setDeclineMsg(''); };
    const confirmDecline = () => {
        if (!declineFor) return;
        updateRegistrationStatus(declineFor.id, 'Declined', declineMsg.trim() || 'No reason provided.');
        showToast(`${declineFor.fullName}'s registration declined.`, 'warning');
        setDeclineFor(null);
        setViewReg(null);
    };

    const counts = {
        All: registrations.length,
        Pending: registrations.filter(r => r.status === 'Pending').length,
        Accepted: registrations.filter(r => r.status === 'Accepted').length,
        Declined: registrations.filter(r => r.status === 'Declined').length,
    };

    const filtered = registrations
        .filter(r => filter === 'All' || r.status === filter)
        .filter(r =>
            r.fullName.toLowerCase().includes(search.toLowerCase()) ||
            r.email.toLowerCase().includes(search.toLowerCase()) ||
            r.country.toLowerCase().includes(search.toLowerCase()) ||
            (r.institution ?? '').toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => b.id - a.id);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                    Registrations
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Review and approve delegates applying to participate in MYIMUN.</p>
            </div>

            {/* Stat chips + search */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['All', 'Pending', 'Accepted', 'Declined'] as FilterKey[]).map(key => {
                        const active = filter === key;
                        const col = key === 'All' ? C.accent : key === 'Pending' ? C.amber : key === 'Accepted' ? C.green : C.red;
                        return (
                            <button key={key} onClick={() => setFilter(key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, border: `1px solid ${active ? col : C.border}`,
                                    background: active ? `${col}12` : C.surface, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                    color: active ? col : C.textSec,
                                }}
                            >
                                {key}
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: active ? `${col}20` : C.bg, color: active ? col : C.textMuted }}>{counts[key]}</span>
                            </button>
                        );
                    })}
                </div>
                <div style={{ position: 'relative', minWidth: 220 }}>
                    <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                    <input type="text" placeholder="Search name, email, country…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', paddingLeft: 33, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e => e.target.style.borderColor = C.border}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
                        <thead>
                            <tr style={{ background: '#FAFBFC', borderBottom: `1px solid ${C.border}` }}>
                                {['Applicant', 'Type', 'Contact', 'Country', 'Heard From', 'Payment', 'Status', 'Actions'].map((h, i) => (
                                    <th key={h} style={{ padding: '11px 16px', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 7 ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '56px 20px', textAlign: 'center' }}>
                                        <ClipboardList size={36} style={{ color: C.border, margin: '0 auto 12px' }} />
                                        <p style={{ fontSize: 15, fontWeight: 500, color: C.textMuted }}>
                                            {registrations.length === 0 ? 'No registrations yet.' : `No ${filter.toLowerCase()} registrations.`}
                                        </p>
                                        {registrations.length === 0 && <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Applications will appear here once delegates register.</p>}
                                    </td>
                                </tr>
                            ) : filtered.map((reg, idx) => {
                                const ss = STATUS_STYLE[reg.status];
                                return (
                                    <tr key={reg.id}
                                        style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                    >
                                        {/* Applicant */}
                                        <td style={{ padding: '13px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: reg.type === 'Group' ? `${C.purple}18` : `${C.accent}18`, color: reg.type === 'Group' ? C.purple : C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                                                    {reg.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{reg.fullName}</p>
                                                    {reg.type === 'Group' && <p style={{ fontSize: 11, color: C.textMuted }}>{reg.institution}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Type */}
                                        <td style={{ padding: '13px 16px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: reg.type === 'Group' ? `${C.purple}14` : `${C.accent}14`, color: reg.type === 'Group' ? C.purple : C.accent, whiteSpace: 'nowrap' }}>
                                                {reg.type === 'Group' ? `Group · ${reg.groupSize}` : 'Individual'}
                                            </span>
                                        </td>
                                        {/* Contact */}
                                        <td style={{ padding: '13px 16px' }}>
                                            <p style={{ fontSize: 12.5, color: C.text }}>{reg.email}</p>
                                            <p style={{ fontSize: 11, color: C.textMuted }}>{reg.phone}</p>
                                        </td>
                                        {/* Country */}
                                        <td style={{ padding: '13px 16px' }}>
                                            <span style={{ fontSize: 13, color: C.text }}>{reg.country}</span>
                                        </td>
                                        {/* Heard from */}
                                        <td style={{ padding: '13px 16px' }}>
                                            <span style={{ fontSize: 12.5, color: C.textSec }}>{reg.heardFrom}</span>
                                        </td>
                                        {/* Payment */}
                                        <td style={{ padding: '13px 16px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: reg.paymentStatus === 'Paid' ? `${C.green}14` : C.bg, color: reg.paymentStatus === 'Paid' ? C.green : C.textMuted, whiteSpace: 'nowrap' }}>
                                                {reg.paymentStatus}
                                            </span>
                                        </td>
                                        {/* Status */}
                                        <td style={{ padding: '13px 16px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: ss.bg, color: ss.color }}>{reg.status}</span>
                                        </td>
                                        {/* Actions */}
                                        <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                                                <button onClick={() => setViewReg(reg)} title="View details"
                                                    style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.accent; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                ><Eye size={15} /></button>
                                                {reg.status !== 'Accepted' && (
                                                    <button onClick={() => accept(reg)} title="Accept"
                                                        style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.green}12`; (e.currentTarget as HTMLElement).style.color = C.green; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    ><CheckCircle2 size={16} /></button>
                                                )}
                                                {reg.status !== 'Declined' && (
                                                    <button onClick={() => openDecline(reg)} title="Decline"
                                                        style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    ><XCircle size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Detail modal ── */}
            {viewReg && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) setViewReg(null); }}>
                    <div style={{ background: C.surface, borderRadius: 16, width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: '50%', background: viewReg.type === 'Group' ? `${C.purple}18` : `${C.accent}18`, color: viewReg.type === 'Group' ? C.purple : C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                                    {viewReg.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{viewReg.fullName}</p>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: viewReg.type === 'Group' ? `${C.purple}14` : `${C.accent}14`, color: viewReg.type === 'Group' ? C.purple : C.accent }}>
                                        {viewReg.type === 'Group' ? 'Group Representative' : 'Individual Delegate'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setViewReg(null)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}><X size={18} /></button>
                        </div>
                        {/* Body */}
                        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {[
                                [User, 'Full Name', viewReg.fullName],
                                [Mail, 'Email', viewReg.email],
                                [Phone, 'Phone', viewReg.phone],
                                [MapPin, 'Address', viewReg.address],
                                [Globe, 'Country', viewReg.country],
                                [Megaphone, 'Heard about us from', viewReg.heardFrom],
                                [Award, 'First time in a MUN?', viewReg.firstTimeMun ? 'Yes' : 'No'],
                                [Repeat, 'Attended MYIMUN before?', viewReg.attendedMyimunBefore ? 'Yes' : 'No'],
                                ...(viewReg.type === 'Group' ? [
                                    [Building2, 'Institution', viewReg.institution],
                                    [Users, 'Group Name', viewReg.groupName],
                                    [Hash, 'Number of Delegates', String(viewReg.groupSize)],
                                ] as [any, string, string][] : []),
                                [CreditCard, 'Payment Status', viewReg.paymentStatus],
                            ].map(([Icon, label, val]: any) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={15} style={{ color: C.textSec }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                                        <p style={{ fontSize: 13.5, color: C.text, fontWeight: 500 }}>{val || '—'}</p>
                                    </div>
                                </div>
                            ))}
                            {viewReg.motivation && (
                                <div style={{ paddingTop: 14 }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <MessageSquareText size={13} /> Motivation / Self-introduction
                                    </p>
                                    <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55, padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>{viewReg.motivation}</p>
                                </div>
                            )}
                            {viewReg.idDocKey && (
                                <div style={{ paddingTop: 14 }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FileText size={13} /> ID / Passport (for hotel reservation)
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 9, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow }}>
                                            {viewReg.idDocType === 'application/pdf'
                                                ? <FileText size={18} style={{ color: C.red }} />
                                                : <ImageIcon size={18} style={{ color: C.accent }} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewReg.idDocName}</p>
                                            <p style={{ fontSize: 11.5, color: C.textMuted }}>
                                                {viewReg.idDocSize ? `${(viewReg.idDocSize / (1024 * 1024)).toFixed(2)} MB · ` : ''}{viewReg.idDocType === 'application/pdf' ? 'PDF' : 'Image'}
                                            </p>
                                        </div>
                                        <button onClick={() => viewDoc(viewReg.idDocKey!)} title="View"
                                            style={{ padding: 7, borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', color: C.accent, flexShrink: 0 }}
                                        ><ExternalLink size={15} /></button>
                                        <button onClick={() => downloadDoc(viewReg.idDocKey!, viewReg.idDocName || 'document')} title="Download"
                                            style={{ padding: 7, borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', color: C.textSec, flexShrink: 0 }}
                                        ><Download size={15} /></button>
                                    </div>
                                </div>
                            )}
                            {viewReg.status === 'Declined' && viewReg.declineReason && (
                                <div style={{ marginTop: 12, padding: '12px 14px', background: `${C.red}08`, borderRadius: 10, border: `1px solid ${C.red}20` }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Decline Reason</p>
                                    <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{viewReg.declineReason}</p>
                                </div>
                            )}
                        </div>
                        {/* Footer actions */}
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#FAFBFC' }}>
                            {viewReg.status !== 'Declined' && (
                                <button onClick={() => openDecline(viewReg)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.red}40`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.red, cursor: 'pointer' }}>
                                    <XCircle size={15} /> Decline
                                </button>
                            )}
                            {viewReg.status !== 'Accepted' && (
                                <button onClick={() => accept(viewReg)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, border: 'none', background: C.green, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                    <Check size={15} /> Accept Registration
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Decline modal ── */}
            {declineFor && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) setDeclineFor(null); }}>
                    <div style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 26 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <XCircle size={20} style={{ color: C.red }} />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>Decline {declineFor.fullName}?</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5, marginBottom: 16 }}>
                            Optionally add a short message explaining why. The applicant will see this and may submit a new registration.
                        </p>
                        <textarea value={declineMsg} onChange={e => setDeclineMsg(e.target.value)} rows={3}
                            placeholder="e.g. Registration is full for your category. Please reapply for the next session."
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', marginBottom: 20 }}
                            onFocus={e => e.target.style.borderColor = C.red}
                            onBlur={e => e.target.style.borderColor = C.border}
                        />
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeclineFor(null)} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDecline} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Decline Registration</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
