'use client';

import React, { useState, useMemo } from 'react';
import {
    Award, Search, Download, Loader2, Package, Eye, X, CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference } from '@/context/ConferenceContext';
import { generateCertificatePDF, bulkDownloadCertificates } from '@/lib/generateCertificate';
import { CertificatePreview } from '@/components/CertificateDownloadButton';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', purple: '#7C5FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
    overlay: 'rgba(17,24,39,0.35)',
};

type FilterKey = 'All' | 'Paid' | 'Unpaid';

export default function AdminCertificatesPage() {
    const { showToast } = useToast();
    const { registrations, landingPage, events } = useConference();

    const [filter, setFilter]   = useState<FilterKey>('All');
    const [search, setSearch]   = useState('');
    const [rowBusy, setRowBusy] = useState<number | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [bulkProg, setBulkProg] = useState({ done: 0, total: 0 });
    const [preview, setPreview] = useState<string | null>(null);

    const activeEvent = events[0];
    const eventDate   = activeEvent?.certDateDisplay || landingPage.conference.date || 'September 15–18, 2025';
    const certLocation  = activeEvent?.certLocation  || 'Marrakech';
    const certSignatory = activeEvent?.certSignatory || 'Mustapha Ait Mbark';
    const certEdition   = activeEvent?.certEditionNumber;

    /* Only accepted registrations are eligible for a certificate. */
    const eligible = useMemo(
        () => registrations.filter(r => r.status === 'Accepted'),
        [registrations],
    );

    const counts = {
        All: eligible.length,
        Paid: eligible.filter(r => r.paymentStatus === 'Paid').length,
        Unpaid: eligible.filter(r => r.paymentStatus === 'Unpaid').length,
    };

    const filtered = eligible
        .filter(r => filter === 'All' || (filter === 'Paid' ? r.paymentStatus === 'Paid' : r.paymentStatus === 'Unpaid'))
        .filter(r =>
            r.fullName.toLowerCase().includes(search.toLowerCase()) ||
            r.email.toLowerCase().includes(search.toLowerCase()) ||
            r.country.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.id - a.id);

    const certData = (name: string) => ({
        delegateName: name, eventDate,
        location: certLocation, signatory: certSignatory, edition: certEdition,
    });

    const downloadOne = async (id: number, name: string) => {
        setRowBusy(id);
        try {
            await generateCertificatePDF(certData(name));
            showToast(`Certificate generated for ${name}.`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Failed to generate certificate.', 'error');
        } finally {
            setRowBusy(null);
        }
    };

    const downloadAll = async () => {
        if (filtered.length === 0) { showToast('No eligible delegates to export.', 'warning'); return; }
        setBulkBusy(true);
        setBulkProg({ done: 0, total: filtered.length });
        try {
            await bulkDownloadCertificates(
                filtered.map(r => certData(r.fullName)),
                (done, total) => setBulkProg({ done, total }),
            );
            showToast(`${filtered.length} certificates exported as ZIP.`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Bulk export failed.', 'error');
        } finally {
            setBulkBusy(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                        Certificates
                    </h1>
                    <p style={{ fontSize: 14, color: C.textSec }}>Issue and download participation certificates for accepted delegates.</p>
                </div>
                <button onClick={downloadAll} disabled={bulkBusy || filtered.length === 0}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                        border: 'none', cursor: bulkBusy || filtered.length === 0 ? 'not-allowed' : 'pointer',
                        background: bulkBusy || filtered.length === 0 ? '#9CA3AF' : 'linear-gradient(135deg,#3B7FFF,#7C5FFF)',
                        color: 'white', fontSize: 14, fontWeight: 600, boxShadow: bulkBusy ? 'none' : '0 4px 14px rgba(59,127,255,0.35)',
                    }}>
                    {bulkBusy
                        ? <><Loader2 size={15} className="cert-spin" /> Generating {bulkProg.done}/{bulkProg.total}…</>
                        : <><Package size={15} /> Export All ({filtered.length})</>}
                </button>
            </div>

            {/* Filters + search */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['All', 'Paid', 'Unpaid'] as FilterKey[]).map(key => {
                        const active = filter === key;
                        const col = key === 'All' ? C.accent : key === 'Paid' ? C.green : C.amber;
                        return (
                            <button key={key} onClick={() => setFilter(key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8,
                                    border: `1px solid ${active ? col : C.border}`, background: active ? `${col}12` : C.surface,
                                    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: active ? col : C.textSec,
                                }}>
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
                        onBlur={e => e.target.style.borderColor = C.border} />
                </div>
            </div>

            {/* Table */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                        <thead>
                            <tr style={{ background: '#FAFBFC', borderBottom: `1px solid ${C.border}` }}>
                                {['Delegate', 'Country', 'Payment', 'Certificate', 'Actions'].map((h, i) => (
                                    <th key={h} style={{ padding: '11px 16px', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 3 ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '56px 20px', textAlign: 'center' }}>
                                        <Award size={36} style={{ color: C.border, margin: '0 auto 12px' }} />
                                        <p style={{ fontSize: 15, fontWeight: 500, color: C.textMuted }}>
                                            {eligible.length === 0 ? 'No accepted delegates yet.' : 'No matching delegates.'}
                                        </p>
                                        {eligible.length === 0 && <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Accept registrations to issue certificates.</p>}
                                    </td>
                                </tr>
                            ) : filtered.map((reg, idx) => (
                                <tr key={reg.id}
                                    style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                    {/* Delegate */}
                                    <td style={{ padding: '13px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: `${C.purple}18`, color: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                                                {reg.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{reg.fullName}</p>
                                                <p style={{ fontSize: 11, color: C.textMuted }}>{reg.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Country */}
                                    <td style={{ padding: '13px 16px' }}>
                                        <span style={{ fontSize: 13, color: C.text }}>{reg.country}</span>
                                    </td>
                                    {/* Payment */}
                                    <td style={{ padding: '13px 16px' }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: reg.paymentStatus === 'Paid' ? `${C.green}14` : C.bg, color: reg.paymentStatus === 'Paid' ? C.green : C.textMuted, whiteSpace: 'nowrap' }}>
                                            {reg.paymentStatus}
                                        </span>
                                    </td>
                                    {/* Certificate status */}
                                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.green, fontWeight: 600 }}>
                                            <CheckCircle2 size={13} /> Ready
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td style={{ padding: '13px 16px' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <button onClick={() => setPreview(reg.fullName)} title="Preview"
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer' }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.textSec; }}>
                                                <Eye size={14} />
                                            </button>
                                            <button onClick={() => downloadOne(reg.id, reg.fullName)} disabled={rowBusy === reg.id}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: rowBusy === reg.id ? '#9CA3AF' : C.accent, color: 'white', fontSize: 12.5, fontWeight: 600, cursor: rowBusy === reg.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                                                {rowBusy === reg.id ? <><Loader2 size={13} className="cert-spin" /> …</> : <><Download size={13} /> PDF</>}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Preview modal */}
            {preview && (
                <div onClick={() => setPreview(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 9999, background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(2px)' }}>
                    <div onClick={e => e.stopPropagation()}
                        style={{ background: C.surface, borderRadius: 16, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', maxWidth: '95vw', maxHeight: '92vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Certificate Preview</p>
                                <p style={{ fontSize: 12, color: C.textMuted }}>{preview}</p>
                            </div>
                            <button onClick={() => setPreview(null)}
                                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={16} />
                            </button>
                        </div>
                        <CertificatePreview delegateName={preview} eventDate={eventDate} location={certLocation} signatory={certSignatory} edition={certEdition} scale={0.62} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                            <button onClick={() => downloadOne(-1, preview)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#3B7FFF,#7C5FFF)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                <Download size={15} /> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes cert-spin-kf{to{transform:rotate(360deg)}}.cert-spin{animation:cert-spin-kf 1s linear infinite}`}</style>
        </div>
    );
}
