'use client';

import React, { useState } from 'react';
import { MessageSquare, Gavel, Users, BookOpen, CheckCircle, XCircle, Shield, UserPlus, Clock, X, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/auth/AuthContext';
import { useConference, CommitteeApplication } from '@/context/ConferenceContext';
import { useToast } from '@/components/ui/Toast';
import { getFlagUrl } from '@/lib/countries';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const APP_META = {
    Pending:  { color: C.amber, bg: `${C.amber}14`, Icon: Clock,       label: 'Pending Review' },
    Approved: { color: C.green, bg: `${C.green}12`, Icon: CheckCircle, label: 'Approved' },
    Rejected: { color: C.red,   bg: `${C.red}10`,   Icon: XCircle,     label: 'Rejected' },
};

const getFlag = getFlagUrl;

const EMPTY_APP_FORM = { whyThisCommittee: '', preferredCountry: '', whyShouldWePickYou: '' };

export default function CommitteePage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { committees, applyToCommittee, getApplicationForDelegate, withdrawApplication, getApplicationsForCommittee, waitingCounts } = useConference();

    const delegateId   = user?.id ?? 'unknown';
    const delegateName = user?.name ?? 'Delegate';
    // Home country typed into the application form — not the delegation country,
    // which only exists once the secretariat assigns one to an approved application.
    const homeCountry  = user?.country ?? 'Unknown';

    const application = getApplicationForDelegate(delegateId);
    const isActive    = application?.status === 'Pending' || application?.status === 'Approved';

    const [applyModal, setApplyModal] = useState<{ open: boolean; abbr: string }>({ open: false, abbr: '' });
    const [appForm, setAppForm]       = useState(EMPTY_APP_FORM);
    const [appErrors, setAppErrors]   = useState<Partial<typeof EMPTY_APP_FORM>>({});

    const openApplyModal = (abbr: string) => {
        if (isActive) return;
        setAppForm(EMPTY_APP_FORM);
        setAppErrors({});
        setApplyModal({ open: true, abbr });
    };

    const handleSubmitApplication = () => {
        const errors: Partial<typeof EMPTY_APP_FORM> = {};
        if (!appForm.whyThisCommittee.trim())   errors.whyThisCommittee   = 'This field is required.';
        if (!appForm.preferredCountry.trim())    errors.preferredCountry   = 'This field is required.';
        if (!appForm.whyShouldWePickYou.trim())  errors.whyShouldWePickYou = 'This field is required.';
        if (Object.keys(errors).length) { setAppErrors(errors); return; }
        applyToCommittee(delegateId, delegateName, homeCountry, applyModal.abbr, appForm.whyThisCommittee.trim(), appForm.preferredCountry.trim(), appForm.whyShouldWePickYou.trim());
        showToast(`Application submitted for ${applyModal.abbr}`, 'success');
        setApplyModal({ open: false, abbr: '' });
    };

    const handleApply = (abbr: string) => openApplyModal(abbr);

    const handleWithdraw = () => {
        if (!application) return;
        withdrawApplication(application.id);
        showToast('Application withdrawn — you can now apply to another committee.', 'info');
    };

    const approvedCommittee = application?.status === 'Approved'
        ? committees.find(c => c.abbr === application.committeeAbbr)
        : null;

    // Real approved delegates in this committee (from applications)
    const committeeMembers = approvedCommittee
        ? getApplicationsForCommittee(approvedCommittee.abbr).filter(a => a.status === 'Approved')
        : [];

    const capacity     = approvedCommittee?.delegates ?? 0;
    const memberCount  = committeeMembers.length;
    const remaining    = Math.max(capacity - memberCount, 0);
    const progressPct  = capacity > 0 ? Math.min((memberCount / capacity) * 100, 100) : 0;
    const isFull       = remaining === 0 && capacity > 0;
    const waitingCount = approvedCommittee ? (waitingCounts[approvedCommittee.abbr] ?? 0) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* ── APPROVED: Committee hub ── */}
            {approvedCommittee && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Banner */}
                    <div style={{
                        borderRadius: 12, padding: '28px 32px',
                        background: 'linear-gradient(135deg, #0055FF 0%, #3B7FFF 55%, #00D4FF 100%)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'rgba(255,255,255,0.10)', borderRadius: '50%', filter: 'blur(50px)', transform: 'translate(30%,-30%)' }} />
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                {approvedCommittee.logoUrl
                                    ? <img src={approvedCommittee.logoUrl} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 4 }} />
                                    : <div style={{ padding: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}><Gavel size={28} style={{ color: 'white' }} /></div>
                                }
                                <div>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{approvedCommittee.abbr}</p>
                                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 4 }}>{approvedCommittee.name}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Representing:</span>
                                        <img src={(application?.assignedCountry && getFlag(application.assignedCountry)) || '/assets/010-un.png'}
                                            alt={application?.assignedCountry || 'United Nations'}
                                            style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
                                        <strong style={{ color: application?.assignedCountry ? 'white' : 'rgba(255,255,255,0.6)', fontSize: 13, fontStyle: application?.assignedCountry ? 'normal' : 'italic' }}>
                                            {application?.assignedCountry || 'Country assignment pending'}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Committee Director</p>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{approvedCommittee.director || 'TBA'}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 14 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>Capacity</p>
                                        <p style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{capacity}</p>
                                    </div>
                                    <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>Topics</p>
                                        <p style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{approvedCommittee.topicList.filter(t => t).length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Delegate progress bar ── */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 22px', boxShadow: C.shadow }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Users size={15} style={{ color: C.accent }} />
                                <p style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Delegate Roster Progress</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 22, fontWeight: 800, color: isFull ? C.green : C.text }}>{memberCount}</span>
                                <span style={{ fontSize: 14, color: C.textMuted }}>/</span>
                                <span style={{ fontSize: 16, fontWeight: 600, color: C.textMuted }}>{capacity}</span>
                                <span style={{ fontSize: 12, color: C.textMuted }}>delegates</span>
                            </div>
                        </div>

                        {/* Bar */}
                        <div style={{ height: 10, borderRadius: 999, background: C.bg, overflow: 'hidden', marginBottom: 10 }}>
                            <div style={{
                                height: '100%', borderRadius: 999,
                                width: `${progressPct}%`,
                                background: isFull
                                    ? `linear-gradient(90deg, ${C.green}, #34D399)`
                                    : `linear-gradient(90deg, ${C.accent}, #60A5FA)`,
                                transition: 'width 0.6s ease',
                                minWidth: memberCount > 0 ? 6 : 0,
                            }} />
                        </div>

                        {/* Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 12, color: C.textSec }}>
                                    {isFull ? '✓ Committee is at full capacity' : `${memberCount} approved`}
                                </span>
                                {!isFull && remaining > 0 && (
                                    <span style={{ fontSize: 12, color: C.textMuted }}>·</span>
                                )}
                                {!isFull && remaining > 0 && (
                                    <span style={{ fontSize: 12, color: C.textMuted }}>
                                        {remaining} spot{remaining !== 1 ? 's' : ''} remaining
                                    </span>
                                )}
                                {waitingCount > 0 && (
                                    <>
                                        <span style={{ fontSize: 12, color: C.textMuted }}>·</span>
                                        <span style={{
                                            fontSize: 12, fontWeight: 700,
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            color: C.amber,
                                        }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, display: 'inline-block' }} />
                                            {waitingCount} waiting for approval
                                        </span>
                                    </>
                                )}
                            </div>
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                                background: isFull ? `${C.green}14` : `${C.accent}12`,
                                color: isFull ? C.green : C.accent,
                            }}>
                                {progressPct.toFixed(0)}% filled
                            </span>
                        </div>
                    </div>

                    {/* Topics */}
                    {approvedCommittee.topicList.filter(t => t).length > 0 && (
                        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BookOpen size={15} style={{ color: C.accent }} />
                                <p style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Topics on Agenda</p>
                            </div>
                            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {approvedCommittee.topicList.filter(t => t).map((topic, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${C.accent}12`, color: C.accent, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                                        <p style={{ fontSize: 14, color: C.text, lineHeight: 1.55 }}>{topic}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Delegate Roster — only members of THIS committee ── */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Users size={16} style={{ color: C.textSec }} />
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
                                    Delegate Roster
                                    <span style={{ fontSize: 13, fontWeight: 500, color: C.textMuted, marginLeft: 8 }}>({memberCount} member{memberCount !== 1 ? 's' : ''})</span>
                                </h3>
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 999, background: `${C.green}12`, border: `1px solid ${C.green}30` }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>Session Active</span>
                            </div>
                        </div>

                        {committeeMembers.length === 0 ? (
                            <div style={{ padding: 36, textAlign: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                                <Users size={28} style={{ color: C.border, margin: '0 auto 10px' }} />
                                <p style={{ fontSize: 14, color: C.textMuted }}>No other delegates yet. You are the first member!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                                {committeeMembers.map((member) => {
                                    const isMe = member.delegateId === delegateId;
                                    const displayCountry = member.assignedCountry || member.country;
                                    const flag = getFlag(displayCountry);
                                    return (
                                        <div key={member.id}
                                            style={{
                                                background: isMe ? `${C.accent}08` : C.surface,
                                                border: `1px solid ${isMe ? `${C.accent}30` : C.border}`,
                                                borderRadius: 10, padding: '12px 14px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                boxShadow: C.shadow, transition: 'border-color .15s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = isMe ? `${C.accent}50` : '#CDD3DE'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = isMe ? `${C.accent}30` : C.border}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {flag
                                                    ? <img src={flag} alt={displayCountry} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }} />
                                                    : <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.accent }}>{displayCountry.substring(0,2).toUpperCase()}</div>
                                                }
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{displayCountry}</p>
                                                    <p style={{ fontSize: 11, color: C.textMuted }}>
                                                        {member.delegateName}{isMe ? ' (You)' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                                                    background: isMe ? `${C.accent}15` : `${C.green}12`,
                                                    color: isMe ? C.accent : C.green,
                                                    border: `1px solid ${isMe ? `${C.accent}30` : `${C.green}30`}`,
                                                }}>
                                                    {isMe ? 'You' : 'Member'}
                                                </span>
                                                {!isMe && (
                                                    <button style={{ padding: 4, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.accent; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    ><MessageSquare size={14} /></button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── APPLICATION STATUS BANNER ── */}
            {application && <ApplicationBanner application={application} onWithdraw={handleWithdraw} />}

            {/* ── ALL COMMITTEES GRID — always visible ── */}
            <div>
                <div style={{ marginBottom: 16 }}>
                    <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: approvedCommittee ? 18 : 26, color: C.text, marginBottom: 4 }}>
                        {approvedCommittee ? 'All Committees' : 'Apply to a Committee'}
                    </h2>
                    {!approvedCommittee && (
                        <p style={{ fontSize: 14, color: C.textSec }}>
                            {isActive
                                ? 'Your application is under review. Withdraw to apply to a different committee.'
                                : application?.status === 'Rejected'
                                    ? 'Your previous application was rejected. You can apply to any committee below.'
                                    : 'Browse available committees and submit your application.'}
                        </p>
                    )}
                </div>

                {committees.length === 0 ? (
                    <div style={{ padding: 56, textAlign: 'center', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                        <Shield size={36} style={{ color: C.border, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 15, fontWeight: 500, color: C.textMuted }}>No committees available yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {committees.map((c, i) => {
                            const isApplied = application?.committeeAbbr === c.abbr;
                            const appStatus = isApplied ? application!.status : null;
                            const canApply  = !isActive && (!application || application.status === 'Rejected');
                            const meta      = appStatus ? APP_META[appStatus] : null;
                            const Icon      = meta?.Icon;

                            // Per-committee counts for mini progress bar
                            const cardMembers  = getApplicationsForCommittee(c.abbr).filter(a => a.status === 'Approved').length;
                            const cardCapacity = c.delegates;
                            const cardPct      = cardCapacity > 0 ? Math.min((cardMembers / cardCapacity) * 100, 100) : 0;
                            const cardWaiting  = waitingCounts[c.abbr] ?? 0;

                            return (
                                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div style={{
                                        background: C.surface,
                                        border: `1px solid ${isApplied && meta ? meta.color + '30' : C.border}`,
                                        borderRadius: 14, overflow: 'hidden', boxShadow: C.shadow,
                                        display: 'flex', flexDirection: 'column',
                                    }}>
                                        {/* Header */}
                                        <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {c.logoUrl
                                                    ? <img src={c.logoUrl} alt={c.abbr} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <Shield size={18} style={{ color: C.accent }} />
                                                }
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.08em', marginBottom: 2 }}>{c.abbr}</p>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                                            </div>
                                            {isApplied && meta && Icon && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: meta.bg, color: meta.color, flexShrink: 0 }}>
                                                    <Icon size={11} /> {meta.label}
                                                </span>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        <div style={{ padding: '0 20px', display: 'flex', gap: 18, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: '#FAFBFC' }}>
                                            {[
                                                { label: 'Capacity', val: c.delegates },
                                                { label: 'Topics',   val: c.topicList.filter(t => t).length },
                                                { label: 'Director', val: c.director || '—' },
                                            ].map(({ label, val }) => (
                                                <div key={label} style={{ padding: '9px 0', flex: 1 }}>
                                                    <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                                                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Mini progress bar */}
                                        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, flexWrap: 'wrap', gap: 4 }}>
                                                <span style={{ fontSize: 11, color: C.textMuted }}>
                                                    {cardMembers} / {cardCapacity} joined
                                                    {cardWaiting > 0 && (
                                                        <span style={{ marginLeft: 6, color: C.amber, fontWeight: 700 }}>
                                                            · {cardWaiting} waiting
                                                        </span>
                                                    )}
                                                </span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: cardPct >= 100 ? C.green : C.accent }}>
                                                    {cardPct.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div style={{ height: 5, borderRadius: 999, background: C.bg, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: 999,
                                                    width: `${cardPct}%`,
                                                    background: cardPct >= 100 ? C.green : C.accent,
                                                    minWidth: cardMembers > 0 ? 4 : 0,
                                                }} />
                                            </div>
                                        </div>

                                        {/* Topics */}
                                        {c.topicList.filter(t => t).length > 0 && (
                                            <div style={{ padding: '12px 20px' }}>
                                                <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Topics</p>
                                                {c.topicList.filter(t => t).map((t, j) => (
                                                    <div key={j} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 4 }}>
                                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${C.accent}12`, color: C.accent, flexShrink: 0, marginTop: 1 }}>{j + 1}</span>
                                                        <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.4 }}>{t}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Action */}
                                        <div style={{ padding: '12px 20px', marginTop: 'auto', borderTop: `1px solid ${C.border}` }}>
                                            {isApplied && appStatus === 'Pending' ? (
                                                <button onClick={handleWithdraw}
                                                    style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: `1px solid ${C.amber}40`, background: `${C.amber}10`, color: C.amber, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${C.amber}18`}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${C.amber}10`}
                                                >Withdraw Application</button>
                                            ) : isApplied && appStatus === 'Approved' ? (
                                                <div style={{ padding: '8px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <CheckCircle size={14} /> You are a member
                                                </div>
                                            ) : isApplied && appStatus === 'Rejected' ? (
                                                <button onClick={() => handleApply(c.abbr)}
                                                    style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                                                ><UserPlus size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Reapply to {c.abbr}</button>
                                            ) : canApply ? (
                                                <button onClick={() => handleApply(c.abbr)}
                                                    style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                                                ><UserPlus size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Apply to {c.abbr}</button>
                                            ) : (
                                                <div style={{ padding: '8px 0', textAlign: 'center', fontSize: 12, color: C.textMuted }}>
                                                    Application active for {application?.committeeAbbr}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Application Modal ── */}
            {applyModal.open && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
                        style={{ background: C.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ padding: 10, borderRadius: 10, background: `${C.accent}12` }}>
                                    <FileText size={20} style={{ color: C.accent }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 2 }}>Committee Application</h3>
                                    <p style={{ fontSize: 13, color: C.textSec }}>Applying for <strong style={{ color: C.accent }}>{applyModal.abbr}</strong> · Please answer all questions</p>
                                </div>
                            </div>
                            <button onClick={() => setApplyModal({ open: false, abbr: '' })}
                                style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            ><X size={18} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Q1 */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                                    Why did you choose this committee?
                                    <span style={{ color: C.red, marginLeft: 3 }}>*</span>
                                </label>
                                <textarea
                                    value={appForm.whyThisCommittee}
                                    onChange={e => { setAppForm(f => ({ ...f, whyThisCommittee: e.target.value })); setAppErrors(er => ({ ...er, whyThisCommittee: undefined })); }}
                                    placeholder="Explain your interest in this committee and why it aligns with your goals…"
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${appErrors.whyThisCommittee ? C.red : C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.55 }}
                                    onFocus={e => e.target.style.borderColor = appErrors.whyThisCommittee ? C.red : C.accent}
                                    onBlur={e => e.target.style.borderColor = appErrors.whyThisCommittee ? C.red : C.border}
                                />
                                {appErrors.whyThisCommittee && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{appErrors.whyThisCommittee}</p>}
                            </div>

                            {/* Q2 */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                                    What country do you prefer to represent?
                                    <span style={{ color: C.red, marginLeft: 3 }}>*</span>
                                </label>
                                <textarea
                                    value={appForm.preferredCountry}
                                    onChange={e => { setAppForm(f => ({ ...f, preferredCountry: e.target.value })); setAppErrors(er => ({ ...er, preferredCountry: undefined })); }}
                                    placeholder="Name the country and briefly explain why you want to represent it…"
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${appErrors.preferredCountry ? C.red : C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.55 }}
                                    onFocus={e => e.target.style.borderColor = appErrors.preferredCountry ? C.red : C.accent}
                                    onBlur={e => e.target.style.borderColor = appErrors.preferredCountry ? C.red : C.border}
                                />
                                {appErrors.preferredCountry && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{appErrors.preferredCountry}</p>}
                            </div>

                            {/* Q3 */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                                    Why should we select you for this committee?
                                    <span style={{ color: C.red, marginLeft: 3 }}>*</span>
                                </label>
                                <textarea
                                    value={appForm.whyShouldWePickYou}
                                    onChange={e => { setAppForm(f => ({ ...f, whyShouldWePickYou: e.target.value })); setAppErrors(er => ({ ...er, whyShouldWePickYou: undefined })); }}
                                    placeholder="Highlight your relevant experience, skills, or knowledge that makes you a strong candidate…"
                                    rows={4}
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${appErrors.whyShouldWePickYou ? C.red : C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.55 }}
                                    onFocus={e => e.target.style.borderColor = appErrors.whyShouldWePickYou ? C.red : C.accent}
                                    onBlur={e => e.target.style.borderColor = appErrors.whyShouldWePickYou ? C.red : C.border}
                                />
                                {appErrors.whyShouldWePickYou && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{appErrors.whyShouldWePickYou}</p>}
                            </div>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                            <button onClick={() => setApplyModal({ open: false, abbr: '' })}
                                style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 14, fontWeight: 500, color: C.textSec, cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >Cancel</button>
                            <button onClick={handleSubmitApplication}
                                style={{ flex: 2, padding: '11px 0', borderRadius: 8, border: 'none', background: C.accent, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                            >
                                <UserPlus size={15} /> Submit Application
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

/* ── Application status banner (Pending / Rejected only) ── */
function ApplicationBanner({ application, onWithdraw }: { application: CommitteeApplication; onWithdraw: () => void }) {
    if (application.status === 'Approved') return null;
    const meta = APP_META[application.status];
    const Icon = meta.Icon;
    return (
        <div style={{ background: meta.bg, border: `1px solid ${meta.color}28`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Icon size={20} style={{ color: meta.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>
                    {application.status === 'Pending'
                        ? `Application pending — ${application.committeeAbbr}`
                        : `Application rejected — ${application.committeeAbbr}`}
                </p>
                <p style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                    {application.status === 'Pending'
                        ? `Applied ${application.appliedAt} · Awaiting secretariat review.`
                        : 'Your application was not accepted. You can apply to any committee below.'}
                </p>
            </div>
            {application.status === 'Pending' && (
                <button onClick={onWithdraw}
                    style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 12, color: C.textSec, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.red; (e.currentTarget as HTMLElement).style.color = C.red; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textSec; }}
                >Withdraw</button>
            )}
        </div>
    );
}
