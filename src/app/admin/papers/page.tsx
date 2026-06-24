'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle, XCircle, ExternalLink, Download, Clock, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference } from '@/context/ConferenceContext';
import { Donut, BarRow, StatPanel } from '@/components/admin/StatWidgets';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444', purple: '#7C5FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    Approved: { bg: `${C.green}14`, color: C.green },
    Rejected: { bg: `${C.red}12`,   color: C.red   },
    Pending:  { bg: `${C.amber}14`, color: C.amber  },
};

type FilterKey = 'All' | 'Pending' | 'Approved' | 'Rejected';

export default function AdminPapersPage() {
    const { showToast } = useToast();
    const { papers, updatePaperStatus, registrations } = useConference();
    const [filter, setFilter] = useState<FilterKey>('All');

    const approve = (id: number, name: string) => {
        updatePaperStatus(id, 'Approved');
        showToast(`Paper by ${name} approved`, 'success');
    };

    const reject = (id: number, name: string) => {
        updatePaperStatus(id, 'Rejected');
        showToast(`Paper by ${name} rejected`, 'warning');
    };

    // Convert a base64 data URL → tab-local blob URL so the browser can render it.
    // (Data URLs stored in localStorage are strings; blob URLs are tab-specific handles.)
    const dataUrlToBlobUrl = (dataUrl: string): string => {
        const [meta, b64] = dataUrl.split(',');
        const mime = meta.match(/:(.*?);/)?.[1] ?? 'application/pdf';
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return URL.createObjectURL(new Blob([bytes], { type: mime }));
    };

    const openPDF = (url: string) => {
        try {
            const target = url.startsWith('data:') ? dataUrlToBlobUrl(url) : url;
            window.open(target, '_blank', 'noopener');
        } catch {
            showToast('Could not open PDF.', 'error');
        }
    };

    const downloadPDF = (url: string, name: string) => {
        const a = document.createElement('a');
        a.href = url.startsWith('data:') ? dataUrlToBlobUrl(url) : url;
        a.download = name;
        a.click();
    };

    const filtered = filter === 'All' ? papers : papers.filter(p => p.status === filter);

    const counts = {
        All: papers.length,
        Pending:  papers.filter(p => p.status === 'Pending').length,
        Approved: papers.filter(p => p.status === 'Approved').length,
        Rejected: papers.filter(p => p.status === 'Rejected').length,
    };

    const acceptedDelegates = registrations.filter(r => r.status === 'Accepted').length;
    const submittedCount    = new Set(papers.map(p => p.delegateId)).size;

    const byCommittee = papers.reduce<Record<string, number>>((acc, p) => {
        acc[p.committee] = (acc[p.committee] ?? 0) + 1;
        return acc;
    }, {});
    const committeeRows = Object.entries(byCommittee).sort((a, b) => b[1] - a[1]);
    const maxPerCommittee = committeeRows.length > 0 ? Math.max(...committeeRows.map(([, n]) => n)) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                    Position Papers
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Review, approve, or reject delegate submissions.</p>
            </div>

            {/* ── Breakdown ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
                <StatPanel title="Review Status" subtitle={`${papers.length} papers submitted`}>
                    <Donut centerLabel={String(papers.length)} centerSub="papers" segments={[
                        { value: counts.Approved, color: C.green, label: 'Approved' },
                        { value: counts.Pending, color: C.amber, label: 'Pending' },
                        { value: counts.Rejected, color: C.red, label: 'Rejected' },
                    ]} />
                </StatPanel>
                <StatPanel title="Submission Coverage" subtitle="Accepted delegates who have submitted">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
                        <BarRow label="Submitted" value={submittedCount} max={Math.max(acceptedDelegates, submittedCount, 1)} color={C.accent}
                            sublabel={`${submittedCount}/${acceptedDelegates} accepted delegates`} />
                    </div>
                </StatPanel>
                <StatPanel title="Papers by Committee" subtitle={committeeRows.length === 0 ? 'No submissions yet' : `${committeeRows.length} committees represented`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                        {committeeRows.length === 0 ? (
                            <p style={{ fontSize: 12.5, color: C.textMuted }}>—</p>
                        ) : committeeRows.slice(0, 4).map(([committee, n]) => (
                            <BarRow key={committee} label={committee} value={n} max={maxPerCommittee} color={C.purple} />
                        ))}
                    </div>
                </StatPanel>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['All', 'Pending', 'Approved', 'Rejected'] as FilterKey[]).map(key => {
                    const active = filter === key;
                    const col = key === 'All' ? C.accent : key === 'Pending' ? C.amber : key === 'Approved' ? C.green : C.red;
                    return (
                        <button key={key} onClick={() => setFilter(key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, border: `1px solid ${active ? col : C.border}`,
                                background: active ? `${col}12` : C.surface, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                color: active ? col : C.textSec, transition: 'all .15s',
                            }}
                        >
                            {key}
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: active ? `${col}20` : C.bg, color: active ? col : C.textMuted }}>{counts[key]}</span>
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#FAFBFC', borderBottom: `1px solid ${C.border}` }}>
                                {['Delegate', 'Committee / Country', 'File', 'Submitted', 'Status', 'Actions'].map((h, i) => (
                                    <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: i === 5 ? 'right' : 'left' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '56px 20px', textAlign: 'center' }}>
                                        <FileText size={36} style={{ color: C.border, margin: '0 auto 12px' }} />
                                        <p style={{ fontSize: 15, fontWeight: 500, color: C.textMuted }}>
                                            {papers.length === 0 ? 'No position papers submitted yet.' : `No ${filter.toLowerCase()} papers.`}
                                        </p>
                                        {papers.length === 0 && <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Papers will appear here once delegates upload them.</p>}
                                    </td>
                                </tr>
                            ) : filtered.map((p, idx) => {
                                const ss = STATUS_STYLE[p.status];
                                return (
                                    <tr key={p.id}
                                        style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                    >
                                        {/* Delegate */}
                                        <td style={{ padding: '14px 18px' }}>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.delegateName}</p>
                                            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{p.delegateId}</p>
                                        </td>
                                        {/* Committee/Country */}
                                        <td style={{ padding: '14px 18px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{p.country}</p>
                                            <p style={{ fontSize: 11, color: C.textMuted }}>{p.committee}</p>
                                        </td>
                                        {/* File */}
                                        <td style={{ padding: '14px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: 6, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <FileText size={13} style={{ color: C.red }} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 12, fontWeight: 500, color: C.text, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.fileName}</p>
                                                    <p style={{ fontSize: 11, color: C.textMuted }}>{(p.fileSize / 1024).toFixed(0)} KB · PDF</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Date */}
                                        <td style={{ padding: '14px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textSec }}>
                                                <Clock size={11} />
                                                {p.submittedAt}
                                            </div>
                                        </td>
                                        {/* Status */}
                                        <td style={{ padding: '14px 18px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: ss.bg, color: ss.color }}>
                                                {p.status}
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                                                {/* View PDF */}
                                                <button onClick={() => openPDF(p.fileUrl)} title="View PDF"
                                                    style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.accent; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                ><ExternalLink size={14} /></button>
                                                {/* Download */}
                                                <button onClick={() => downloadPDF(p.fileUrl, p.fileName)} title="Download"
                                                    style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                ><Download size={14} /></button>
                                                {/* Approve */}
                                                {p.status !== 'Approved' && (
                                                    <button onClick={() => approve(p.id, p.delegateName)} title="Approve"
                                                        style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.green}12`; (e.currentTarget as HTMLElement).style.color = C.green; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    ><CheckCircle size={15} /></button>
                                                )}
                                                {/* Reject */}
                                                {p.status !== 'Rejected' && (
                                                    <button onClick={() => reject(p.id, p.delegateName)} title="Reject"
                                                        style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}12`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    ><XCircle size={15} /></button>
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
        </div>
    );
}
