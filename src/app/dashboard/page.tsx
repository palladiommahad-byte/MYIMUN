'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/auth/AuthContext';
import { useConference } from '@/context/ConferenceContext';
import { getFlagUrl } from '@/lib/countries';
import { FileText, Clock, CheckCircle, Flag, Download, Calendar, ArrowRight, Zap, Award } from 'lucide-react';
import { CertificateDownloadButton, CertificatePreview } from '@/components/CertificateDownloadButton';
import { AcceptanceLetterDownloadButton, AcceptanceLetterPreview } from '@/components/AcceptanceLetterButton';

/* ── Light-theme constants ── */
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
};

const PSTYLE: Record<string, { iconBg: string; iconColor: string; labelColor: string; label: string }> = {
    high:   { iconBg: `${C.amber}18`,  iconColor: C.amber,  labelColor: C.amber,  label: 'High Priority'   },
    medium: { iconBg: `${C.accent}15`, iconColor: C.accent, labelColor: C.accent, label: 'Medium Priority' },
    done:   { iconBg: `${C.green}18`,  iconColor: C.green,  labelColor: C.green,  label: 'Completed'       },
    closed: { iconBg: `${C.red}12`,    iconColor: C.red,    labelColor: C.red,    label: 'Closed'          },
};

export default function DashboardPage() {
    const { user } = useAuth();
    const { getApplicationForDelegate, getRegistrationForDelegate, getPapersForDelegate, landingPage, events } = useConference();

    const delegateId = user?.id ?? '';
    const application = getApplicationForDelegate(delegateId);
    const approvedApp = application?.status === 'Approved' ? application : undefined;
    const registration = getRegistrationForDelegate(delegateId);

    const country   = user?.country   || 'France';
    const committee = user?.committee || 'Security Council';

    const displayCountry = approvedApp?.assignedCountry || country;
    const flagUrl        = getFlagUrl(displayCountry);

    const activeEvent   = events[0];
    const certName      = registration?.fullName || user?.name || 'Honorable Delegate';
    const certDate      = activeEvent?.certDateDisplay || landingPage.conference.date || 'September 15–18, 2025';
    const certLocation  = activeEvent?.certLocation  || 'Marrakech';
    const certSignatory = activeEvent?.certSignatory || 'Mustapha Ait Mbark';
    const certEdition   = activeEvent?.certEditionNumber;

    const isAccepted = registration?.status === 'Accepted';

    /* Certificate available from the last day of the conference at 00:00 Morocco time (UTC+1) */
    const isCertAvailable = (() => {
        if (!activeEvent?.endDate) return false;
        const available = new Date(activeEvent.endDate + 'T00:00:00+01:00');
        return Date.now() >= available.getTime();
    })();
    const fmtDate = (iso: string) => {
        if (!iso) return iso;
        try { return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return iso; }
    };
    const letterEditionYear = activeEvent?.letterEditionYear || '8th Annual Edition 2026';
    const letterStart = fmtDate(activeEvent?.startDate || '');
    const letterEnd   = fmtDate(activeEvent?.endDate   || '');

    /* ── Position paper deadline: first day of conference at 00:00 Morocco time (UTC+1) ── */
    const papers        = getPapersForDelegate(delegateId);
    const latestPaper   = papers.length > 0 ? papers[papers.length - 1] : null;
    const isPaperDeadlinePassed = (() => {
        if (!activeEvent?.startDate) return false;
        const deadline = new Date(activeEvent.startDate + 'T00:00:00+01:00'); // midnight Morocco (UTC+1)
        return Date.now() > deadline.getTime();
    })();

    const TASKS = [
        {
            id: 1, title: 'Submit Position Paper', href: '/dashboard/papers',
            priority: latestPaper ? 'done' : isPaperDeadlinePassed ? 'closed' : 'high',
            due: latestPaper
                ? (latestPaper.status === 'Approved' ? 'Approved' : latestPaper.status === 'Rejected' ? 'Rejected' : 'Submitted')
                : isPaperDeadlinePassed ? 'Closed' : 'Open',
            done: !!latestPaper,
        },
        { id: 2, title: registration?.paymentStatus === 'Paid' ? 'Payment Successfully' : 'Waiting Payment', href: '/dashboard/payments',
            priority: registration?.paymentStatus === 'Paid' ? 'done' : 'high',
            due: registration?.paymentStatus === 'Paid' ? 'Confirmed' : 'Required',
            done: registration?.paymentStatus === 'Paid' },
        { id: 3, title: 'Opening Speech Draft',    href: null, priority: 'medium', due: '5 Days', done: false },
    ];

    return (
        <div style={{ fontFamily: '"Inter",system-ui,sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Hero banner ── */}
            <div className="relative overflow-hidden rounded-xl px-5 py-6 sm:px-7 sm:py-8"
                style={{
                    background: 'linear-gradient(135deg, #1A3A8F 0%, #3B7FFF 55%, #00D4FF 100%)',
                }}>
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 60% 80% at 90% 10%, rgba(255,255,255,0.12), transparent)' }} />
                {/* White logo — small, top-right on mobile */}
                <img src="/assets/MYIMUN-BLUE-LOGO-VERTICAL.png" alt="" className="block sm:hidden"
                    style={{
                        position: 'absolute', right: 14, top: 14,
                        width: 44, height: 'auto', opacity: 0.9,
                        filter: 'brightness(0) invert(1)', pointerEvents: 'none',
                    }} />
                {/* White logo — right center on larger screens */}
                <img src="/assets/MYIMUN-BLUE-LOGO-VERTICAL.png" alt="" className="hidden sm:block"
                    style={{
                        position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
                        width: 160, height: 'auto', opacity: 1,
                        filter: 'brightness(0) invert(1)', pointerEvents: 'none',
                    }} />
                <div className="relative z-10">
                    {/* Live pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-semibold"
                        style={{ background: 'rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(4px)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00D4FF', display: 'inline-block', boxShadow: '0 0 8px rgba(0,212,255,0.8)', animation: 'live-pulse 2s infinite' }} />
                        Live Session Active
                    </div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 800, fontSize: 'clamp(20px,5vw,32px)', color: 'white', lineHeight: 1.25, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {flagUrl && <img src={flagUrl} alt={displayCountry} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />}
                        Ready to lead, {displayCountry} Delegate?
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14, maxWidth: 460, lineHeight: 1.6, marginBottom: 22 }}>
                        You are representing <strong style={{ color: 'white' }}>{displayCountry}</strong> in the <strong style={{ color: 'white' }}>{committee}</strong>. Complete your tasks and prepare for the upcoming session.
                    </p>
                    <Link href="/dashboard/schedule" className="flex items-center gap-2 font-semibold text-sm transition-all w-fit"
                        style={{ background: 'white', color: '#1A3A8F', padding: '10px 22px', borderRadius: 8, textDecoration: 'none', display: 'inline-flex' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.92'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    >
                        View Agenda <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* ── Two-column ── */}
            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr]" style={{ gap: 16 }}>

                {/* Country card */}
                <div className="rounded-xl p-5 flex flex-col items-center text-center min-w-0"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                    {/* Avatar */}
                    <div className="relative mb-3">
                        {flagUrl ? (
                            <img src={flagUrl} alt={displayCountry}
                                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}`, display: 'block' }} />
                        ) : (
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: `${C.accent}15`, border: `2px solid ${C.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700,
                                fontSize: 22, color: C.accent,
                            }}>{displayCountry.substring(0, 2).toUpperCase()}</div>
                        )}
                        <span style={{
                            position: 'absolute', bottom: 2, right: 2,
                            width: 12, height: 12, borderRadius: '50%',
                            background: C.green, border: `2px solid white`,
                        }} />
                    </div>
                    <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 2 }}>{displayCountry}</h2>
                    <p style={{ fontSize: 13, color: C.accent, fontWeight: 500, marginBottom: 16 }}>{committee}</p>

                    {/* Chips */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', marginBottom: 12 }}>
                        <div className="rounded-lg p-2.5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Role</p>
                            <p style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Delegate</p>
                        </div>
                        <div className="rounded-lg p-2.5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Voting</p>
                            <p style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Present</p>
                        </div>
                    </div>

                    {/* Delegate name */}
                    <div className="w-full rounded-lg p-2.5"
                        style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Delegate</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Honorable Delegate'}</p>
                    </div>
                </div>

                {/* Priority tasks */}
                <div className="rounded-xl p-5 min-w-0"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'live-pulse 2s infinite' }} />
                            <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Priority Tasks</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: `${C.amber}15`, color: C.amber }}>
                            {TASKS.filter(t => !t.done).length} Pending
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {TASKS.map(task => {
                            const ps = PSTYLE[task.priority];
                            const inner = (
                                <>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: ps.iconBg }}>
                                        {task.done
                                            ? <CheckCircle size={14} style={{ color: ps.iconColor }} />
                                            : <Clock size={14} style={{ color: ps.iconColor }} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{task.title}</p>
                                        <div className="flex items-center gap-2">
                                            <span style={{ fontSize: 12, color: ps.labelColor, fontWeight: 500 }}>{ps.label}</span>
                                            <span style={{ color: C.border }}>·</span>
                                            <span style={{ fontSize: 12, color: C.textMuted }}>{task.due}</span>
                                        </div>
                                    </div>
                                    <ArrowRight size={13} style={{ color: C.textMuted, flexShrink: 0 }} />
                                </>
                            );
                            const sharedStyle = { padding: '12px 14px', border: `1px solid ${C.border}`, background: C.bg, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' };
                            return task.href ? (
                                <Link key={task.id} href={task.href} style={sharedStyle}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#CDD3DE'; (e.currentTarget as HTMLElement).style.background = '#F0F2F5'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.bg; }}>
                                    {inner}
                                </Link>
                            ) : (
                                <div key={task.id} style={sharedStyle}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#CDD3DE'; (e.currentTarget as HTMLElement).style.background = '#F0F2F5'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.bg; }}>
                                    {inner}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Acceptance Letter (when accepted) ── */}
            {isAccepted && (
                <div className="rounded-xl overflow-hidden"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] p-5 sm:p-6 lg:p-6" style={{ gap: 24, alignItems: 'center' }}>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: `${C.green}15`, color: C.green }}>
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Acceptance Letter</p>
                                    <p style={{ fontSize: 12, color: C.textMuted }}>Official MYIMUN delegate acceptance letter</p>
                                </div>
                            </div>
                            <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.65, marginBottom: 18, maxWidth: 440 }}>
                                Your official acceptance letter confirming your participation in{' '}
                                <strong style={{ color: C.text }}>MYIMUN {letterEditionYear}</strong>.
                                Download it as a PDF for your records or visa application.
                            </p>
                            <AcceptanceLetterDownloadButton
                                delegateName={certName}
                                editionYear={letterEditionYear}
                                startDate={letterStart}
                                endDate={letterEnd}
                            />
                        </div>
                        <div className="hidden lg:block">
                            <AcceptanceLetterPreview
                                delegateName={certName}
                                editionYear={letterEditionYear}
                                startDate={letterStart}
                                endDate={letterEnd}
                                scale={0.24}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Certificate of Participation ── */}
            <div className="rounded-xl overflow-hidden" style={{ position: 'relative', background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] p-5 sm:p-6 lg:p-6"
                    style={{ gap: 24, alignItems: 'center', filter: isCertAvailable ? 'none' : 'blur(3px)', pointerEvents: isCertAvailable ? 'auto' : 'none', userSelect: isCertAvailable ? 'auto' : 'none' }}>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: `${C.purple}15`, color: C.purple }}>
                                <Award size={18} />
                            </div>
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Certificate of Participation</p>
                                <p style={{ fontSize: 12, color: C.textMuted }}>Official MYIMUN delegate certificate</p>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.65, marginBottom: 18, maxWidth: 440 }}>
                            Download your personalized certificate as a high-resolution PDF. It is issued to{' '}
                            <strong style={{ color: C.text }}>{certName}</strong> for participation in MYIMUN {certDate}.
                        </p>
                        <CertificateDownloadButton
                            delegateName={certName}
                            eventDate={certDate}
                            location={certLocation}
                            signatory={certSignatory}
                            edition={certEdition}
                        />
                    </div>
                    <div className="hidden lg:block">
                        <CertificatePreview
                            delegateName={certName}
                            eventDate={certDate}
                            location={certLocation}
                            signatory={certSignatory}
                            edition={certEdition}
                            scale={0.34}
                        />
                    </div>
                </div>

                {/* Lock overlay when not yet available */}
                {!isCertAvailable && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(1px)' }}>
                        <div style={{ padding: '6px 18px', borderRadius: 999, background: `${C.purple}18`, color: C.purple, fontSize: 13, fontWeight: 700, border: `1px solid ${C.purple}30` }}>
                            Available from{' '}
                            {activeEvent?.endDate
                                ? new Date(activeEvent.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                : 'the last conference day'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
