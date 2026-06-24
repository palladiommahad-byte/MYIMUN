'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
    {
        title: '1. Information We Collect',
        body: 'When you register, we collect personal information you provide directly: full name, email, phone number, address, country, motivation/experience answers, and an ID card or passport (used solely for hotel reservation). When you submit a payment, we also collect payment receipt details (sender name, amount, method, and the uploaded receipt file).',
    },
    {
        title: '2. How We Use Your Information',
        body: 'Your information is used to process your registration, assign you to a committee and country, reserve accommodation, verify payments, issue acceptance letters and certificates, and communicate with you about the conference.',
    },
    {
        title: '3. Data Storage & Security',
        body: 'Your data, including uploaded documents, is stored on our servers and is only accessible to authorized secretariat staff (admins, secretaries, and managers) for the purposes described above. We take reasonable technical measures to protect your data from unauthorized access.',
    },
    {
        title: '4. Sharing of Information',
        body: 'We do not sell or share your personal information with third parties for marketing purposes. Information may be shared with the hotel/venue strictly for reservation purposes, or disclosed if required by law.',
    },
    {
        title: '5. Your Rights',
        body: 'You may review and update most of your personal details from your Profile page at any time. To request deletion of your account or data, contact the secretariat through Contact Support.',
    },
    {
        title: '6. Cookies & Sessions',
        body: 'We use a session cookie solely to keep you signed in to your delegate account. We do not use third-party tracking or advertising cookies.',
    },
    {
        title: "7. Children's Privacy",
        body: 'MYIMUN events are open to high-school and university-age participants. If a parent or guardian believes a minor has provided personal information without appropriate consent, please contact us so we can review and, if necessary, remove it.',
    },
    {
        title: '8. Changes to This Policy',
        body: 'We may update this Privacy Policy from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised policy.',
    },
    {
        title: '9. Contact',
        body: <>Questions about this Privacy Policy can be sent through <Link href="/dashboard/contact" style={{ color: C.accent, fontWeight: 600 }}>Contact Support</Link>.</>,
    },
];

export default function PrivacyPolicyPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', maxWidth: 760 }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={19} style={{ color: C.accent }} />
                    </div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text }}>
                        Privacy Policy
                    </h1>
                </div>
                <p style={{ fontSize: 13, color: C.textMuted }}>Last updated: June 24, 2026</p>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '28px 28px', boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 22 }}>
                {SECTIONS.map(s => (
                    <section key={s.title}>
                        <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{s.title}</h2>
                        <p style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.7 }}>{s.body}</p>
                    </section>
                ))}
            </div>
        </div>
    );
}
