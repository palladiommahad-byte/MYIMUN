'use client';

import React from 'react';
import { ScrollText } from 'lucide-react';
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from '@/components/legal/termsContent';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

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
                <p style={{ fontSize: 13, color: C.textMuted }}>Last updated: {TERMS_LAST_UPDATED}</p>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '28px 28px', boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 22 }}>
                {TERMS_SECTIONS.map(s => (
                    <section key={s.title}>
                        <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{s.title}</h2>
                        <p style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.7 }}>{s.body}</p>
                    </section>
                ))}
            </div>
        </div>
    );
}
