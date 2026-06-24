'use client';

import React, { useMemo, useState } from 'react';
import {
    Search, Eye, Filter,
    Download, ChevronLeft, ChevronRight,
    Users, Shield, FileText, CreditCard, Ban, ShieldCheck, X,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { useConference } from '@/context/ConferenceContext';
import { Donut, StatPanel } from '@/components/admin/StatWidgets';

/* ── Style constants ── */
const C = {
    bg:       '#F4F5F7',
    surface:  '#FFFFFF',
    border:   '#E4E8EF',
    text:     '#111827',
    textSec:  '#6B7280',
    textMuted:'#9CA3AF',
    accent:   '#3B7FFF',
    green:    '#10B981',
    amber:    '#F59E0B',
    red:      '#EF4444',
    purple:   '#7C5FFF',
    cyan:     '#00D4FF',
    shadow:   '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
    shadowHov:'0 4px 16px rgba(0,0,0,0.08)',
};

const PAGE_SIZE = 8;

const REG_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    Accepted: { bg: `${C.green}14`, color: C.green },
    Declined: { bg: `${C.red}12`,   color: C.red   },
    Pending:  { bg: `${C.amber}14`, color: C.amber },
};

const PAPER_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    Approved: { bg: `${C.green}14`, color: C.green },
    Rejected: { bg: `${C.red}12`,   color: C.red   },
    Pending:  { bg: `${C.amber}14`, color: C.amber },
};

/* ── Avatar initials ── */
function Avatar({ name, size = 36, color = C.accent }: { name: string; size?: number; color?: string }) {
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `${color}18`,
            color, fontSize: size * 0.35, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
        }}>{initials}</div>
    );
}

export default function AdminDashboardPage() {
    const { showToast } = useToast();
    const { registrations, payments, papers, committees, applications, suspendDelegate } = useConference();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [suspendTarget, setSuspendTarget] = useState<{ delegateId: string; name: string; suspended: boolean } | null>(null);
    const [suspending, setSuspending] = useState(false);

    /* ── Derived roster: one row per registered delegate, enriched with their
       committee assignment, registration status, payment status, and paper status ── */
    const roster = useMemo(() => registrations.map(r => {
        const application = applications.find(a => a.delegateId === r.delegateId);
        const paper = papers.find(p => p.delegateId === r.delegateId);
        const country = (application?.status === 'Approved' && application.assignedCountry)
            ? application.assignedCountry
            : r.country;
        return {
            id: r.id,
            delegateId: r.delegateId,
            name: r.fullName,
            email: r.email,
            country,
            committee: application?.committeeAbbr || 'Unassigned',
            regStatus: r.status,
            paymentStatus: r.paymentStatus,
            paperStatus: paper?.status || null,
            accountStatus: r.accountStatus,
        };
    }), [registrations, applications, papers]);

    const confirmSuspend = async () => {
        if (!suspendTarget) return;
        setSuspending(true);
        try {
            await suspendDelegate(suspendTarget.delegateId, suspendTarget.suspended);
            showToast(suspendTarget.suspended ? `${suspendTarget.name} has been suspended.` : `${suspendTarget.name}'s access has been restored.`, suspendTarget.suspended ? 'warning' : 'success');
            setSuspendTarget(null);
        } catch {
            showToast('Could not update this delegate\'s access. Please try again.', 'error');
        } finally {
            setSuspending(false);
        }
    };

    const filtered = roster.filter(d =>
        [d.name, d.email, d.country, d.committee].some(v => v.toLowerCase().includes(search.toLowerCase()))
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    /* ── Stats ── */
    const totalRegistered = registrations.length;
    const acceptedCount   = registrations.filter(r => r.status === 'Accepted').length;
    const pendingRegCount = registrations.filter(r => r.status === 'Pending').length;
    const declinedRegCount = registrations.filter(r => r.status === 'Declined').length;

    const paidCount   = registrations.filter(r => r.paymentStatus === 'Paid').length;
    const unpaidCount = totalRegistered - paidCount;

    const delegatesWithPapers = new Set(papers.map(p => p.delegateId)).size;
    const pendingPapers       = papers.filter(p => p.status === 'Pending').length;
    const approvedPapers      = papers.filter(p => p.status === 'Approved').length;
    const rejectedPapers      = papers.filter(p => p.status === 'Rejected').length;

    const approvedApplications = applications.filter(a => a.status === 'Approved').length;

    const STATS = [
        {
            label: 'REGISTERED DELEGATES', value: String(totalRegistered),
            trend: `${acceptedCount} accepted · ${pendingRegCount} pending`,
            iconBg: `${C.accent}15`, iconColor: C.accent, Icon: Users,
        },
        {
            label: 'PAID DELEGATES', value: String(paidCount),
            trend: `${unpaidCount} unpaid`,
            iconBg: `${C.green}18`, iconColor: C.green, Icon: CreditCard,
        },
        {
            label: 'POSITION PAPERS', value: String(delegatesWithPapers),
            trend: `${pendingPapers} pending review`,
            iconBg: `${C.purple}15`, iconColor: C.purple, Icon: FileText,
        },
        {
            label: 'COMMITTEES', value: String(committees.length),
            trend: `${approvedApplications} delegates assigned`,
            iconBg: `${C.cyan}18`, iconColor: '#00A8CC', Icon: Shield,
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 2 }}>
                        Overview
                    </h1>
                    <p style={{ fontSize: 14, color: C.textSec }}>Manage your conference settings and delegates.</p>
                </div>
                <div className="flex gap-2.5">
                    <button onClick={() => showToast('Exporting…', 'info')}
                        className="flex items-center gap-2 font-medium text-sm transition-all"
                        style={{ border: `1px solid ${C.border}`, color: C.textSec, background: C.surface, padding: '9px 16px', borderRadius: 8, boxShadow: C.shadow }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#CDD3DE'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
                {STATS.map(({ label, value, trend, iconBg, iconColor, Icon }) => (
                    <div key={label} className="flex items-center gap-4 rounded-xl p-5"
                        style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, minWidth: 0 }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: iconBg }}>
                            <Icon size={20} style={{ color: iconColor }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>
                                {label}
                            </p>
                            <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 800, fontSize: 32, color: C.text, lineHeight: 1 }}>
                                {value}
                            </p>
                            <p className="mt-1" style={{ fontSize: 12, color: C.textSec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {trend}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Breakdown donuts ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
                <StatPanel title="Registration Status" subtitle={`${totalRegistered} total registrations`}>
                    <Donut centerLabel={String(totalRegistered)} centerSub="total" segments={[
                        { value: acceptedCount, color: C.green, label: 'Accepted' },
                        { value: pendingRegCount, color: C.amber, label: 'Pending' },
                        { value: declinedRegCount, color: C.red, label: 'Declined' },
                    ]} />
                </StatPanel>
                <StatPanel title="Payment Status" subtitle={`${unpaidCount} unpaid delegate${unpaidCount !== 1 ? 's' : ''}`}>
                    <Donut centerLabel={totalRegistered > 0 ? `${Math.round((paidCount / totalRegistered) * 100)}%` : '0%'} centerSub="paid" segments={[
                        { value: paidCount, color: C.green, label: 'Paid' },
                        { value: unpaidCount, color: C.textMuted, label: 'Unpaid' },
                    ]} />
                </StatPanel>
                <StatPanel title="Position Papers" subtitle={`${papers.length} submitted`}>
                    <Donut centerLabel={String(papers.length)} centerSub="papers" segments={[
                        { value: approvedPapers, color: C.green, label: 'Approved' },
                        { value: pendingPapers, color: C.amber, label: 'Pending' },
                        { value: rejectedPapers, color: C.red, label: 'Rejected' },
                    ]} />
                </StatPanel>
            </div>

            {/* ── Delegates per Committee ── */}
            <div className="rounded-xl p-5"
                style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 14 }}>Delegates per Committee</h3>
                {committees.length === 0 ? (
                    <p style={{ fontSize: 13, color: C.textMuted }}>No committees created yet.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                        {committees.map(c => {
                            const approved = applications.filter(a => a.committeeAbbr === c.abbr && a.status === 'Approved').length;
                            const pct = c.delegates > 0 ? Math.min(100, Math.round((approved / c.delegates) * 100)) : 0;
                            return (
                                <div key={c.id} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }}>
                                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                                        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{c.abbr}</span>
                                        <span style={{ fontSize: 12, color: C.textMuted }}>{approved}/{c.delegates}</span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 999, background: C.border, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: C.accent, borderRadius: 999 }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Delegate Roster ── */}
            <div className="rounded-xl overflow-hidden"
                style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4"
                    style={{ borderBottom: `1px solid ${C.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Delegate Roster</h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-56">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                            <input type="text" placeholder="Search…" value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                style={{
                                    width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                                    border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13,
                                    color: C.text, background: C.bg, outline: 'none',
                                }}
                                onFocus={e => e.target.style.borderColor = C.accent}
                                onBlur={e  => e.target.style.borderColor = C.border}
                            />
                        </div>
                        <button className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                            style={{ border: `1px solid ${C.border}`, color: C.textMuted, background: C.surface }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.surface}
                        >
                            <Filter size={13} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#FAFBFC' }}>
                                {['USER', 'COUNTRY', 'COMMITTEE', 'REGISTRATION', 'PAYMENT', 'PAPER', 'ACTIONS'].map((h, i) => (
                                    <th key={h} style={{
                                        padding: '10px 20px',
                                        fontSize: 11, fontWeight: 600, color: C.textMuted,
                                        textTransform: 'uppercase', letterSpacing: '0.07em',
                                        textAlign: i === 6 ? 'right' : 'left',
                                        whiteSpace: 'nowrap',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                                        <p style={{ fontSize: 14, color: C.textMuted }}>
                                            {registrations.length === 0 ? 'No delegates registered yet.' : 'No delegates match your search.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : pageRows.map((d, idx) => {
                                const rs = REG_STATUS_STYLE[d.regStatus] || REG_STATUS_STYLE.Pending;
                                const ps = d.paperStatus ? (PAPER_STATUS_STYLE[d.paperStatus] || PAPER_STATUS_STYLE.Pending) : null;
                                return (
                                    <tr key={d.id}
                                        style={{ borderBottom: idx < pageRows.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background .12s' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                    >
                                        {/* User */}
                                        <td style={{ padding: '13px 20px' }}>
                                            <div className="flex items-center gap-3">
                                                <Avatar name={d.name} color={d.accountStatus === 'inactive' ? C.red : C.accent} />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.name}</p>
                                                        {d.accountStatus === 'inactive' && (
                                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: `${C.red}14`, color: C.red, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suspended</span>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: 12, color: C.textMuted }}>{d.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Country */}
                                        <td style={{ padding: '13px 20px', fontSize: 14, color: C.text }}>{d.country}</td>
                                        {/* Committee */}
                                        <td style={{ padding: '13px 20px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: d.committee === 'Unassigned' ? C.bg : `${C.accent}14`, color: d.committee === 'Unassigned' ? C.textMuted : C.accent }}>
                                                {d.committee}
                                            </span>
                                        </td>
                                        {/* Registration status */}
                                        <td style={{ padding: '13px 20px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: rs.bg, color: rs.color }}>{d.regStatus}</span>
                                        </td>
                                        {/* Payment */}
                                        <td style={{ padding: '13px 20px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: d.paymentStatus === 'Paid' ? `${C.green}14` : C.bg, color: d.paymentStatus === 'Paid' ? C.green : C.textMuted }}>
                                                {d.paymentStatus}
                                            </span>
                                        </td>
                                        {/* Paper */}
                                        <td style={{ padding: '13px 20px' }}>
                                            {ps ? (
                                                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: ps.bg, color: ps.color }}>{d.paperStatus}</span>
                                            ) : (
                                                <span style={{ fontSize: 12, color: C.textMuted }}>Not submitted</span>
                                            )}
                                        </td>
                                        {/* Actions */}
                                        <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link href="/admin/registration" title="View registration"
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                    style={{ color: C.textMuted }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.accent; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                >
                                                    <Eye size={15} />
                                                </Link>
                                                {d.accountStatus === 'inactive' ? (
                                                    <button onClick={() => setSuspendTarget({ delegateId: d.delegateId, name: d.name, suspended: false })} title="Restore access"
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                        style={{ color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.green}12`; (e.currentTarget as HTMLElement).style.color = C.green; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    >
                                                        <ShieldCheck size={15} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => setSuspendTarget({ delegateId: d.delegateId, name: d.name, suspended: true })} title="Suspend access"
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                        style={{ color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    >
                                                        <Ban size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: `1px solid ${C.border}`, background: '#FAFBFC' }}>
                    <p style={{ fontSize: 13, color: C.textMuted }}>
                        Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} delegates
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="flex items-center justify-center text-sm font-medium transition-colors"
                            style={{ width: 30, height: 30, borderRadius: 6, background: 'transparent', color: page === 1 ? C.textMuted : C.textSec, border: `1px solid ${C.border}`, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'default' : 'pointer' }}
                        ><ChevronLeft size={13} /></button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                            <button key={n} onClick={() => setPage(n)}
                                className="flex items-center justify-center text-sm font-medium transition-colors"
                                style={{
                                    width: 30, height: 30, borderRadius: 6,
                                    background: n === page ? C.accent : 'transparent',
                                    color: n === page ? 'white' : C.textSec,
                                    border: n === page ? 'none' : `1px solid ${C.border}`,
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={e => { if (n !== page) (e.currentTarget as HTMLElement).style.background = C.bg; }}
                                onMouseLeave={e => { if (n !== page) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >{n}</button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="flex items-center justify-center text-sm font-medium transition-colors"
                            style={{ width: 30, height: 30, borderRadius: 6, background: 'transparent', color: page === totalPages ? C.textMuted : C.textSec, border: `1px solid ${C.border}`, opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'default' : 'pointer' }}
                        ><ChevronRight size={13} /></button>
                    </div>
                </div>
            </div>

            {/* ── Suspend / restore confirmation ── */}
            {suspendTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(17,24,39,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget && !suspending) setSuspendTarget(null); }}>
                    <div style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 26 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: suspendTarget.suspended ? `${C.red}12` : `${C.green}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {suspendTarget.suspended ? <Ban size={20} style={{ color: C.red }} /> : <ShieldCheck size={20} style={{ color: C.green }} />}
                            </div>
                            <button onClick={() => !suspending && setSuspendTarget(null)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                            {suspendTarget.suspended ? `Suspend ${suspendTarget.name}?` : `Restore access for ${suspendTarget.name}?`}
                        </p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55, marginBottom: 22 }}>
                            {suspendTarget.suspended
                                ? 'They will be immediately logged out and blocked from logging back in or using any part of the platform until you restore their access.'
                                : 'They will be able to log in and use the platform again immediately.'}
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setSuspendTarget(null)} disabled={suspending}
                                style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: suspending ? 'default' : 'pointer' }}>Cancel</button>
                            <button onClick={confirmSuspend} disabled={suspending}
                                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: suspendTarget.suspended ? C.red : C.green, color: '#fff', fontSize: 13, fontWeight: 600, cursor: suspending ? 'default' : 'pointer', opacity: suspending ? 0.7 : 1 }}>
                                {suspending ? 'Saving…' : suspendTarget.suspended ? 'Suspend Access' : 'Restore Access'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
