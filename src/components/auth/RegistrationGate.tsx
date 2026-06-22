'use client';

import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useConference } from '@/context/ConferenceContext';
import { usePathname, useRouter } from 'next/navigation';
import { Lock, ArrowRight, ClipboardList, CreditCard } from 'lucide-react';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

// Pages always reachable regardless of registration/payment status.
const ALWAYS_ALLOWED = ['/dashboard/registration'];
// Reachable once registration is Accepted (even if unpaid).
const AFTER_ACCEPTED = ['/dashboard/payments'];

/**
 * Enforces the onboarding flow for delegates:
 *   1. Register            → /dashboard/registration
 *   2. Wait for approval   → locked until status === 'Accepted'
 *   3. Pay                 → /dashboard/payments unlocks
 *   4. Full platform       → everything unlocks once paymentStatus === 'Paid'
 */
export const RegistrationGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { getRegistrationForDelegate } = useConference();
    const pathname = usePathname();
    const router = useRouter();

    // Admins and non-delegates are unaffected.
    if (!user || user.role !== 'delegate') return <>{children}</>;

    const reg = getRegistrationForDelegate(user.id);
    const accepted = reg?.status === 'Accepted';
    const paid = reg?.paymentStatus === 'Paid';

    // Full access — nothing to gate.
    if (accepted && paid) return <>{children}</>;

    // The registration page itself is always open.
    if (ALWAYS_ALLOWED.includes(pathname)) return <>{children}</>;

    // Payment page opens once accepted.
    if (accepted && AFTER_ACCEPTED.includes(pathname)) return <>{children}</>;

    // Otherwise show a lock screen explaining the next step.
    let step: 'register' | 'review' | 'declined' | 'pay';
    if (!reg) step = 'register';
    else if (reg.status === 'Pending') step = 'review';
    else if (reg.status === 'Declined') step = 'declined';
    else step = 'pay'; // accepted but not paid

    const cfg = {
        register: {
            Icon: ClipboardList, color: C.accent,
            title: 'Complete Your Registration',
            desc: 'Before you can access the platform, please complete your event registration. It only takes a minute.',
            cta: 'Go to Registration', to: '/dashboard/registration',
        },
        review: {
            Icon: Lock, color: C.amber,
            title: 'Registration Under Review',
            desc: 'Your registration has been submitted and is awaiting approval from our team. This area unlocks once you are accepted.',
            cta: 'View Registration Status', to: '/dashboard/registration',
        },
        declined: {
            Icon: Lock, color: '#EF4444',
            title: 'Registration Not Approved',
            desc: 'Your registration was not approved. Please review the organizers\' note and submit a new registration.',
            cta: 'View & Reapply', to: '/dashboard/registration',
        },
        pay: {
            Icon: CreditCard, color: C.green,
            title: 'Payment Required',
            desc: 'Your registration is approved! Complete your payment to unlock committees, position papers, schedule, and more.',
            cta: 'Go to Payment', to: '/dashboard/payments',
        },
    }[step];

    return (
        <div style={{ fontFamily: '"Inter",system-ui,sans-serif', display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{ maxWidth: 480, width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '40px 32px', textAlign: 'center', boxShadow: C.shadow }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: `${cfg.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <cfg.Icon size={30} style={{ color: cfg.color }} />
                </div>
                <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 21, fontWeight: 700, color: C.text, marginBottom: 10 }}>{cfg.title}</h2>
                <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, marginBottom: 26 }}>{cfg.desc}</p>
                <button onClick={() => router.push(cfg.to)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 26px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: cfg.color, color: '#fff', fontSize: 14, fontWeight: 700,
                    boxShadow: `0 4px 14px ${cfg.color}45`,
                }}>
                    {cfg.cta} <ArrowRight size={16} />
                </button>

                {/* Mini step tracker */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 30 }}>
                    {['register', 'review', 'pay'].map((s, i) => {
                        const order = ['register', 'review', 'pay'];
                        const curIdx = step === 'declined' ? 0 : order.indexOf(step);
                        const done = i < curIdx;
                        const active = i === curIdx;
                        return (
                            <div key={s} style={{
                                width: active ? 22 : 7, height: 7, borderRadius: 999,
                                background: done || active ? cfg.color : C.border, transition: 'all .2s',
                            }} />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
