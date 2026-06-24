'use client';

import React from 'react';
import Link from 'next/link';
import { ScrollText } from 'lucide-react';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
    {
        title: '1. Acceptance of Terms',
        body: 'By creating a delegate account, registering for a MYIMUN (Moroccan International Youth Model United Nations) event, or otherwise using this platform, you agree to be bound by these Terms & Conditions. If you do not agree, please do not register or use the platform.',
    },
    {
        title: '2. Eligibility & Registration',
        body: 'Registration requires accurate personal information (name, contact details, country, and a valid ID document for hotel reservation purposes). Submitting a registration does not guarantee a seat — all applications are reviewed and must be approved by the secretariat before payment and full platform access are unlocked.',
    },
    {
        title: '3. Conference Participation',
        body: 'Once accepted and your committee/country assignment is confirmed by the secretariat, you are expected to act in good faith as a delegate: submit required position papers by the published deadlines, attend sessions, and represent your assigned country professionally during committee proceedings.',
    },
    {
        title: '4. Payments & Packages',
        body: (
            <>
                Conference packages must be paid in full according to the chosen package. All payments must be made exclusively through the official channels provided on this platform — using the bank account details published on your Payments page, or as instructed directly by the treasury agent assigned to your registration. MYIMUN is not responsible for funds sent to any other account, intermediary, or unofficial channel.
                <br /><br />
                <strong style={{ color: C.text }}>All fees are strictly non-refundable.</strong> By submitting a payment, you authorize MYIMUN to immediately reserve your hotel room, prepare your conference materials (badge, delegate kit, country plate, printed documents, etc.), and commit the corresponding staffing, catering, and logistical resources on your behalf. Because these organizational commitments are made on the basis of your payment, no refund — partial or full — will be issued once a payment has been approved, regardless of cancellation, inability to attend, visa issues, or removal from the conference for any reason.
                <br /><br />
                Payment receipts are manually reviewed by our secretariat team; access to paid features and your package benefits unlock only once a receipt is approved. If you have any questions about a payment or the bank details before submitting, contact the secretariat through Contact Support.
            </>
        ),
    },
    {
        title: '5. Code of Conduct',
        body: 'Harassment, discrimination, plagiarism in position papers, or disruptive behavior during sessions will not be tolerated and may result in suspension from the conference without refund, at the sole discretion of the secretariat.',
    },
    {
        title: '6. Intellectual Property',
        body: 'Position papers, resolutions, and other materials you submit remain your intellectual property, but you grant MYIMUN a non-exclusive license to store, review, and use them for conference administration and archival purposes.',
    },
    {
        title: '7. Limitation of Liability',
        body: 'MYIMUN and its organizers are not liable for indirect, incidental, or consequential damages arising from your participation, travel, or accommodation arrangements related to the conference.',
    },
    {
        title: '8. Changes to These Terms',
        body: 'We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms.',
    },
    {
        title: '9. Contact',
        body: <>Questions about these Terms can be sent through <Link href="/dashboard/contact" style={{ color: C.accent, fontWeight: 600 }}>Contact Support</Link>.</>,
    },
];

export default function TermsPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', maxWidth: 760 }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ScrollText size={19} style={{ color: C.accent }} />
                    </div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text }}>
                        Terms &amp; Conditions
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
