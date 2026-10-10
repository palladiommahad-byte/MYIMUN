'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ScrollText, X } from 'lucide-react';
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from './termsContent';

const C = {
    text: '#111827', textSec: '#4B5563', textMuted: '#9CA3AF',
    border: '#E4E8EF', accent: '#3B7FFF', navy: '#0B2A5B',
};

export interface ContractParty {
    name: string;
    email?: string;
    country?: string;
    /** Date the delegate accepted the terms (registration date, or account creation). */
    signedOn?: string;
}

/** View-only popup of the Terms & Conditions laid out as a signed agreement between
    the delegate and MYIMUN. Rendered in a portal so it sits above the dashboard layout. */
export function TermsContract({ delegate, onClose }: { delegate: ContractParty; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
    }, [onClose]);

    const signedOn = delegate.signedOn || '—';

    return createPortal(
        <div className="terms-contract-overlay" role="dialog" aria-modal="true" aria-label="Terms and Conditions contract"
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(17,24,39,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '"Inter",system-ui,sans-serif' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <style>{`
                .terms-contract-body { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
                @media (max-width: 640px) {
                    .terms-contract-overlay { padding: 0 !important; align-items: stretch !important; }
                    .terms-contract-modal { max-height: none !important; height: 100% !important; border-radius: 0 !important; }
                    .terms-contract-paper { padding: 24px 18px 32px !important; }
                    .terms-contract-sign-grid, .terms-contract-parties { grid-template-columns: 1fr !important; }
                    .terms-contract-sign-grid { gap: 28px !important; }
                    .terms-contract-title { font-size: 18px !important; }
                    .terms-contract-logo { height: 42px !important; }
                }
            `}</style>

            <div className="terms-contract-modal"
                style={{ width: '100%', maxWidth: 820, maxHeight: 'calc(100dvh - 48px)', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Modal header */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <ScrollText size={17} style={{ color: C.accent, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Terms &amp; Conditions Agreement</span>
                    </div>
                    <button type="button" onClick={onClose} title="Close" aria-label="Close"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', color: C.textSec, cursor: 'pointer', flexShrink: 0 }}>
                        <X size={19} />
                    </button>
                </div>

                {/* Scrollable contract */}
                <div className="terms-contract-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <article className="terms-contract-paper"
                        style={{ padding: '40px 52px 48px', color: C.text }}>
                        <header style={{ textAlign: 'center', borderBottom: `2px solid ${C.navy}`, paddingBottom: 20, marginBottom: 24 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN" className="terms-contract-logo" style={{ height: 54, width: 'auto', maxWidth: '100%', margin: '0 auto 14px', display: 'block' }} />
                            <h1 className="terms-contract-title" style={{ fontFamily: '"Cinzel",serif', fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: '0.04em', margin: 0 }}>
                                Delegate Participation Agreement
                            </h1>
                            <p style={{ fontSize: 13, color: C.textSec, marginTop: 6 }}>Terms &amp; Conditions · Last updated {TERMS_LAST_UPDATED}</p>
                        </header>

                        <div className="terms-contract-parties" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: 13 }}>
                            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
                                <p style={{ fontSize: 10.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>The Organizer</p>
                                <p style={{ fontWeight: 700 }}>MYIMUN</p>
                                <p style={{ color: C.textSec }}>Moroccan International Youth Model United Nations</p>
                            </div>
                            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
                                <p style={{ fontSize: 10.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>The Delegate</p>
                                <p style={{ fontWeight: 700 }}>{delegate.name}</p>
                                <p style={{ color: C.textSec }}>{[delegate.email, delegate.country].filter(Boolean).join(' · ') || '—'}</p>
                            </div>
                        </div>

                        <p style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.7, marginBottom: 22 }}>
                            This agreement sets out the terms under which the Delegate named above participates in MYIMUN events and uses the MYIMUN platform. Both parties agree to the following:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {TERMS_SECTIONS.map(s => (
                                <section key={s.title}>
                                    <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 5 }}>{s.title}</h2>
                                    <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>{s.body}</p>
                                </section>
                            ))}
                        </div>

                        {/* Signatures */}
                        <div className="terms-contract-signatures" style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 12.5, color: C.textSec, marginBottom: 24 }}>
                                In witness whereof, the parties have accepted this agreement as of the dates indicated below.
                            </p>
                            <div className="terms-contract-sign-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                                <div>
                                    <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
                                        <span style={{ fontFamily: '"Great Vibes",cursive', fontSize: 'clamp(30px, 8vw, 40px)', color: C.navy, lineHeight: 1.1, textAlign: 'center', overflowWrap: 'anywhere', maxWidth: '100%' }}>
                                            {delegate.name}
                                        </span>
                                    </div>
                                    <div style={{ borderTop: `1.5px solid ${C.text}`, paddingTop: 8 }}>
                                        <p style={{ fontSize: 10.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Signature of the Delegate</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{delegate.name}</p>
                                        <p style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Date: {signedOn}</p>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/assets/certificate/seal.png" alt="MYIMUN seal and signature" style={{ height: 118, width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ borderTop: `1.5px solid ${C.text}`, paddingTop: 8 }}>
                                        <p style={{ fontSize: 10.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>For MYIMUN</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>MYIMUN Secretariat</p>
                                        <p style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Official seal &amp; signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </div>,
        document.body,
    );
}
