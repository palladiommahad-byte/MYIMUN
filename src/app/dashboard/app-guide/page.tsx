'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    FileText,
    HelpCircle,
    Mail,
    MessageSquare,
    Mic,
    MonitorCheck,
    Send,
    ShieldCheck,
    Star,
    Users,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useConference } from '@/context/ConferenceContext';

const C = {
    bg: '#F4F5F7',
    surface: '#FFFFFF',
    border: '#E4E8EF',
    text: '#111827',
    textSec: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#3B7FFF',
    green: '#10B981',
    amber: '#F59E0B',
    purple: '#7C5FFF',
    cyan: '#06B6D4',
    red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

type GuideStep = {
    number: string;
    title: string;
    description: string;
    href: string;
    cta: string;
    accent: string;
    Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
    status: 'done' | 'current' | 'locked' | 'open';
    preview: 'overview' | 'events' | 'registration' | 'payments' | 'committee' | 'papers' | 'messages';
};

function ScreenPreview({ type, title, accent }: { type: GuideStep['preview']; title: string; accent: string }) {
    const bar = (width: number, color = C.border) => (
        <span style={{ display: 'block', width: `${width}%`, height: 7, borderRadius: 999, background: color }} />
    );
    const miniCard = (label: string, color = accent) => (
        <div style={{ borderRadius: 7, background: `${color}10`, border: `1px solid ${color}24`, padding: 8, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            <span style={{ display: 'block', width: '64%', height: 5, borderRadius: 999, background: `${color}30`, marginTop: 7 }} />
        </div>
    );

    return (
        <div className="guide-screen" style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.surface, boxShadow: `inset 0 0 0 1px ${accent}08` }}>
            <div style={{ height: 22, background: '#FAFBFC', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 5, padding: '0 9px' }}>
                {[C.red, C.amber, C.green].map(color => <span key={color} style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />)}
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            </div>
            <div style={{ minHeight: 250, background: C.bg, padding: 12, display: 'grid', gap: 10 }}>
                {type === 'overview' && (
                    <>
                        <div style={{ borderRadius: 8, padding: 12, background: 'linear-gradient(135deg,#1A3A8F,#3B7FFF)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                            <span style={{ fontSize: 9, fontWeight: 900, background: 'rgba(255,255,255,0.18)', padding: '3px 7px', borderRadius: 999 }}>Overview</span>
                            <p style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.15, marginTop: 8 }}>Welcome, Delegate</p>
                            <p style={{ fontSize: 10, opacity: 0.8, marginTop: 5 }}>Status, country assignment, tasks, announcements</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 8 }}>
                            <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, padding: 9, textAlign: 'center' }}>
                                <span style={{ display: 'block', width: 38, height: 38, borderRadius: '50%', background: `${accent}16`, margin: '0 auto 7px' }} />
                                <span style={{ fontSize: 10, fontWeight: 900, color: C.text }}>Not Assigned</span>
                            </div>
                            <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, padding: 9, display: 'grid', gap: 7 }}>
                                {miniCard('Payment', C.green)}
                                {miniCard('Position Paper', C.red)}
                            </div>
                        </div>
                    </>
                )}
                {type === 'events' && (
                    <>
                        <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                            <div style={{ height: 58, background: `linear-gradient(135deg, ${accent}, #3B7FFF)`, padding: 10, color: '#fff' }}>
                                <p style={{ fontSize: 15, fontWeight: 900 }}>MYIMUN Conference</p>
                                <p style={{ fontSize: 10, opacity: 0.82, marginTop: 3 }}>Dates, venue, guide and agenda</p>
                            </div>
                            <div style={{ padding: 9, display: 'grid', gap: 6 }}>{bar(92)}{bar(64)}{bar(38, accent)}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                            {['Standard', 'Premium', 'VIP'].map((label, index) => (
                                <div key={label} style={{ borderRadius: 8, background: C.surface, border: `1px solid ${index === 1 ? accent : C.border}`, padding: 8 }}>
                                    <span style={{ fontSize: 9, fontWeight: 900, color: C.text }}>{label}</span>
                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 900, color: accent, marginTop: 5 }}>$ {index === 0 ? 150 : index === 1 ? 220 : 300}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {type === 'registration' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {['Full Name', 'Email', 'Country', 'Package'].map((label, index) => (
                                <div key={label} style={{ borderRadius: 7, background: C.surface, border: `1px solid ${index === 3 ? accent : C.border}`, padding: 8 }}>
                                    <span style={{ fontSize: 9, fontWeight: 900, color: C.textMuted }}>{label}</span>
                                    <span style={{ display: 'block', height: 7, borderRadius: 999, background: index === 3 ? `${accent}25` : C.bg, marginTop: 8 }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ borderRadius: 8, background: `${accent}10`, border: `1px solid ${accent}24`, padding: 10 }}>
                            <p style={{ fontSize: 11, fontWeight: 900, color: C.text }}>Choose Your Package</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
                                {[1, 2, 3].map(index => <span key={index} style={{ height: 32, borderRadius: 7, background: C.surface, border: `1px solid ${index === 2 ? accent : C.border}` }} />)}
                            </div>
                        </div>
                        <span style={{ justifySelf: 'end', borderRadius: 7, padding: '7px 12px', color: '#fff', background: accent, fontSize: 10, fontWeight: 900 }}>Submit Registration</span>
                    </>
                )}
                {type === 'payments' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {miniCard('Selected Package', accent)}
                            {miniCard('Payment Status', C.green)}
                        </div>
                        <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, padding: 10, display: 'grid', gap: 7 }}>
                            <p style={{ fontSize: 11, fontWeight: 900, color: C.text }}>Bank Transfer Details</p>
                            {bar(88)}{bar(70)}{bar(52)}
                        </div>
                        <div style={{ borderRadius: 8, background: C.surface, border: `1px dashed ${accent}`, padding: 12, textAlign: 'center' }}>
                            <CreditCard size={18} style={{ color: accent, margin: '0 auto 5px' }} />
                            <p style={{ fontSize: 10, fontWeight: 900, color: C.text }}>Upload receipt</p>
                        </div>
                    </>
                )}
                {type === 'committee' && (
                    <>
                        <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, padding: 10, display: 'grid', gridTemplateColumns: '44px 1fr', gap: 10, alignItems: 'center' }}>
                            <span style={{ width: 42, height: 42, borderRadius: 12, background: `${accent}18` }} />
                            <div style={{ display: 'grid', gap: 6 }}>
                                <p style={{ fontSize: 12, fontWeight: 900, color: C.text }}>Committee Application</p>
                                {bar(84)}{bar(56)}
                            </div>
                        </div>
                        <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, padding: 9, display: 'grid', gap: 7 }}>
                            {['Preferred committee', 'Why this committee?', 'Preferred country'].map(label => (
                                <div key={label} style={{ borderRadius: 6, background: C.bg, padding: 7 }}>
                                    <span style={{ fontSize: 9, fontWeight: 900, color: C.textMuted }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {type === 'papers' && (
                    <>
                        <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, padding: 10 }}>
                            <p style={{ fontSize: 12, fontWeight: 900, color: C.text }}>Position Paper</p>
                            <div style={{ marginTop: 9, height: 54, borderRadius: 8, border: `1px dashed ${accent}`, background: `${accent}08`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={18} style={{ color: accent }} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {miniCard('PDF Upload', accent)}
                            {miniCard('Opening Speech', C.purple)}
                        </div>
                        <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, padding: 8 }}>{bar(90)}{bar(65)}</div>
                    </>
                )}
                {type === 'messages' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '42% 1fr', gap: 8, minHeight: 162 }}>
                            <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                                <p style={{ fontSize: 9, fontWeight: 900, color: C.textMuted, padding: 8, borderBottom: `1px solid ${C.border}` }}>Recent</p>
                                {['Payment question', 'Committee update', 'Document help'].map((label, index) => (
                                    <div key={label} style={{ padding: 8, borderBottom: `1px solid ${C.border}`, background: index === 0 ? `${accent}08` : C.surface }}>
                                        <span style={{ fontSize: 9, fontWeight: 900, color: C.text, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                                        <span style={{ display: 'block', width: '70%', height: 5, borderRadius: 999, background: C.bg, marginTop: 5 }} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, padding: 9, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span style={{ alignSelf: 'flex-start', maxWidth: '78%', borderRadius: 8, padding: 8, background: C.bg, fontSize: 9, color: C.textSec }}>Check guide first...</span>
                                <span style={{ alignSelf: 'flex-end', maxWidth: '82%', borderRadius: 8, padding: 8, background: accent, fontSize: 9, color: '#fff' }}>One clear message</span>
                                <span style={{ marginTop: 'auto', height: 24, borderRadius: 7, background: C.bg, border: `1px solid ${C.border}` }} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function statusLabel(status: GuideStep['status']) {
    if (status === 'done') return 'Done';
    if (status === 'current') return 'Now';
    if (status === 'locked') return 'Later';
    return 'Open';
}

export default function AppGuidePage() {
    const { user } = useAuth();
    const { getRegistrationForDelegate, getApplicationForDelegate, getPaymentForDelegate, getPapersForDelegate, openingSpeeches } = useConference();

    const delegateId = user?.id ?? '';
    const registration = getRegistrationForDelegate(delegateId);
    const application = getApplicationForDelegate(delegateId);
    const payment = getPaymentForDelegate(delegateId);
    const papers = getPapersForDelegate(delegateId);
    const openingSpeech = application
        ? openingSpeeches.find(item => item.delegateId === delegateId && item.committee === application.committeeAbbr)
        : undefined;

    const registered = !!registration;
    const accepted = registration?.status === 'Accepted';
    const paid = registration?.paymentStatus === 'Paid';
    const applied = !!application;

    const steps: GuideStep[] = [
        {
            number: '01',
            title: 'Start With Overview',
            description: 'Check your current status, assigned committee, latest tasks, documents, and announcements from the secretariat.',
            href: '/dashboard',
            cta: 'Open Overview',
            accent: C.accent,
            Icon: MonitorCheck,
            status: 'open',
            preview: 'overview',
        },
        {
            number: '02',
            title: 'Review Event And Packages',
            description: 'Read the conference details, agenda, pricing table, package benefits, venue, hotel, and registration deadline before applying.',
            href: '/dashboard/events',
            cta: 'View Events',
            accent: C.amber,
            Icon: Star,
            status: 'open',
            preview: 'events',
        },
        {
            number: '03',
            title: 'Submit Registration',
            description: 'Complete the registration form, choose your package, add the required personal details, and wait for secretariat approval.',
            href: '/dashboard/registration',
            cta: registered ? 'View Registration' : 'Register',
            accent: C.purple,
            Icon: ClipboardList,
            status: registered ? 'done' : 'current',
            preview: 'registration',
        },
        {
            number: '04',
            title: 'Complete Payment',
            description: 'After approval, choose the matching package, follow the bank or payment instructions, and upload a clear receipt.',
            href: '/dashboard/payments',
            cta: paid ? 'View Payment' : 'Open Payments',
            accent: C.green,
            Icon: CreditCard,
            status: paid ? 'done' : accepted ? 'current' : 'locked',
            preview: 'payments',
        },
        {
            number: '05',
            title: 'Apply To Committee',
            description: 'Once payment unlocks the platform, submit your committee application and wait for country assignment.',
            href: '/dashboard/committee',
            cta: applied ? 'View Committee' : 'Apply',
            accent: C.cyan,
            Icon: Users,
            status: applied ? 'done' : paid ? 'current' : 'locked',
            preview: 'committee',
        },
        {
            number: '06',
            title: 'Prepare Documents',
            description: 'After committee approval, submit your position paper and opening speech from their dedicated pages before deadlines.',
            href: '/dashboard/papers',
            cta: papers.length > 0 ? 'View Papers' : 'Open Papers',
            accent: C.red,
            Icon: FileText,
            status: papers.length > 0 && openingSpeech ? 'done' : applied ? 'current' : 'locked',
            preview: 'papers',
        },
        {
            number: '07',
            title: 'Use Messages Last',
            description: 'Use Messages for personal questions after checking this guide, event details, payments, registration status, and announcements.',
            href: '/dashboard/messages',
            cta: 'Open Messages',
            accent: '#EC4899',
            Icon: MessageSquare,
            status: 'open',
            preview: 'messages',
        },
    ];

    const supportChecks = [
        { Icon: BookOpen, title: 'Check The Guide', text: 'Most questions are answered by the flow below.' },
        { Icon: CreditCard, title: 'Check Payments', text: 'Package prices, bank details, and receipt status live there.' },
        { Icon: Mail, title: 'Check Announcements', text: 'Deadline changes and broad updates appear on Overview.' },
        { Icon: Send, title: 'Then Message', text: 'Send one clear message if your case is personal or still unclear.' },
    ];

    return (
        <div style={{ fontFamily: '"Inter",system-ui,sans-serif', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <style jsx>{`
                .guide-hero {
                    display: grid;
                    grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
                    gap: 18px;
                    align-items: stretch;
                }
                .guide-flow {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                }
                .guide-support {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 10px;
                }
                .guide-step-card {
                    min-width: 0;
                    transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
                }
                .guide-step-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 22px rgba(17, 24, 39, 0.08);
                }
                .guide-screen {
                    aspect-ratio: 16 / 9;
                }
                @media (max-width: 860px) {
                    .guide-hero,
                    .guide-flow,
                    .guide-support {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 560px) {
                    .guide-title {
                        font-size: 24px !important;
                    }
                    .guide-hero-copy {
                        padding: 22px 18px !important;
                    }
                    .guide-step-card {
                        padding: 14px !important;
                    }
                }
            `}</style>

            <section className="guide-hero">
                <div className="guide-hero-copy" style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, padding: '28px 26px', color: '#fff', background: 'linear-gradient(135deg, #1A3A8F 0%, #3B7FFF 58%, #06B6D4 100%)', boxShadow: C.shadow }}>
                    <Image src="/assets/MYIMUN-BLUE-LOGO-VERTICAL.png" alt="" width={150} height={150} style={{ position: 'absolute', right: 24, bottom: -18, width: 150, height: 'auto', opacity: 0.16, filter: 'brightness(0) invert(1)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', zIndex: 1, maxWidth: 620 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                            <BookOpen size={14} /> Delegate App Guide
                        </span>
                        <h1 className="guide-title" style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 32, lineHeight: 1.18, fontWeight: 800, marginBottom: 10 }}>
                            Know what to do next, before messaging the secretariat.
                        </h1>
                        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.84)', maxWidth: 560 }}>
                            Follow the platform flow from account setup to registration, payment, committee application, documents, and support.
                        </p>
                    </div>
                </div>

                <div style={{ borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.green}16`, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <p style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Your Current Progress</p>
                            <p style={{ fontSize: 12.5, color: C.textSec, marginTop: 2 }}>{registered ? registration.status : 'Registration not submitted yet'}</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gap: 9 }}>
                        {[
                            ['Registration', registered],
                            ['Approval', accepted],
                            ['Payment', paid],
                            ['Committee Application', applied],
                        ].map(([label, done]) => (
                            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                                <CheckCircle2 size={17} style={{ color: done ? C.green : C.textMuted, flexShrink: 0 }} />
                                <span style={{ fontSize: 13.5, color: done ? C.text : C.textSec, fontWeight: done ? 700 : 500, flex: 1 }}>{label as string}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: done ? C.green : C.textMuted, background: done ? `${C.green}12` : C.bg, padding: '3px 8px', borderRadius: 999 }}>
                                    {done ? 'Done' : 'Next'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Step By Step</p>
                        <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 22, fontWeight: 800, color: C.text, marginTop: 3 }}>Platform Flow</h2>
                    </div>
                    <Link href="/dashboard/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.accent, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                        Start With Events <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="guide-flow">
                    {steps.map(step => {
                        const status = statusLabel(step.status);
                        return (
                            <article key={step.number} className="guide-step-card" style={{ borderRadius: 12, background: C.surface, border: `1px solid ${step.status === 'current' ? step.accent : C.border}`, boxShadow: C.shadow, padding: 16, display: 'grid', gap: 13 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 11, background: `${step.accent}14`, color: step.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <step.Icon size={20} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontSize: 11, fontWeight: 800, color: step.accent, letterSpacing: '0.06em' }}>{step.number}</p>
                                            <h3 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 16, fontWeight: 800, color: C.text }}>{step.title}</h3>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: step.status === 'done' ? C.green : step.status === 'locked' ? C.textMuted : step.accent, background: step.status === 'done' ? `${C.green}12` : step.status === 'locked' ? C.bg : `${step.accent}12`, padding: '4px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                                        {status}
                                    </span>
                                </div>
                                <ScreenPreview type={step.preview} title={step.title} accent={step.accent} />
                                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.textSec }}>{step.description}</p>
                                <Link href={step.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: step.accent, fontSize: 13, fontWeight: 800, textDecoration: 'none', width: 'fit-content' }}>
                                    {step.cta} <ArrowRight size={14} />
                                </Link>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section style={{ borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: `${C.amber}16`, color: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HelpCircle size={21} />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 18, fontWeight: 800, color: C.text }}>Before Sending A Message</h2>
                        <p style={{ fontSize: 12.5, color: C.textSec, marginTop: 2 }}>Use this checklist to reduce repeated support requests.</p>
                    </div>
                </div>
                <div className="guide-support">
                    {supportChecks.map(item => (
                        <div key={item.title} style={{ borderRadius: 10, border: `1px solid ${C.border}`, padding: 13, background: '#FAFBFC', minWidth: 0 }}>
                            <item.Icon size={18} style={{ color: C.accent, marginBottom: 10 }} />
                            <p style={{ fontSize: 13.5, fontWeight: 800, color: C.text, marginBottom: 4 }}>{item.title}</p>
                            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: C.textSec }}>{item.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'center', borderRadius: 12, background: '#111827', color: '#fff', padding: '18px 20px', overflow: 'hidden' }}>
                <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Still stuck?</p>
                    <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,0.72)' }}>Send one message with your full name, topic, and the exact page where you need help.</p>
                </div>
                <Link href="/dashboard/messages" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 8, background: '#fff', color: '#111827', textDecoration: 'none', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
                    Message Support <MessageSquare size={14} />
                </Link>
            </section>
        </div>
    );
}
