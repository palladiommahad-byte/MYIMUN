'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, LoaderCircle, ScrollText, X } from 'lucide-react';
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from './termsContent';
import { downloadContractPdf } from '@/lib/generateContractPdf';

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

export function contractFileName(name: string) {
    return `MYIMUN-Contract-${name.trim().replace(/[^p{L}p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'Delegate'}.pdf`;
}

/** Popup of the Terms & Conditions laid out as a signed agreement between the delegate
    and MYIMUN. View-only for delegates; staff can pass `allowDownload` for a PDF button,
    and `autoDownload` to save the PDF immediately and close. */
export function TermsContract({ delegate, onClose, allowDownload = false, autoDownload = false }: {
    delegate: ContractParty; onClose: () => void; allowDownload?: boolean; autoDownload?: boolean;
}) {
    const articleRef = useRef<HTMLElement>(null);
    const [downloading, setDownloading] = useState(false);

    const download = useCallback(async () => {
        if (!articleRef.current) return;
        setDownloading(true);
        try {
            await downloadContractPdf(articleRef.current, contractFileName(delegate.name));
        } finally {
            setDownloading(false);
        }
    }, [delegate.name]);

    useEffect(() => {
        if (!autoDownload) return;
        let cancelled = false;
        void download().finally(() => { if (!cancelled) onClose(); });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoDownload]);

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
                    .terms-contract-modal .terms-contract-paper { padding: 24px 18px 32px !important; }
                    .terms-contract-modal .terms-contract-sign-grid, .terms-contract-modal .terms-contract-parties { grid-template-columns: 1fr !important; }
                    .terms-contract-modal .terms-contract-sign-grid { gap: 28px !important; }
                    .terms-contract-modal .terms-contract-title { font-size: 18px !important; }
                    .terms-contract-modal .terms-contract-logo { height: 42px !important; }
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {allowDownload && (
                        <button type="button" onClick={() => void download()} disabled={downloading}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: downloading ? 'wait' : 'pointer', opacity: downloading ? 0.75 : 1, whiteSpace: 'nowrap' }}>
                            {downloading ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}
                            {downloading ? 'Preparing…' : 'Download PDF'}
                        </button>
                    )}
                    <button type="button" onClick={onClose} title="Close" aria-label="Close"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', color: C.textSec, cursor: 'pointer', flexShrink: 0 }}>
                        <X size={19} />
                    </button>
                    </div>
                </div>

                {/* Scrollable contract */}
                <div className="terms-contract-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <article ref={articleRef} className="terms-contract-paper"
                        style={{ padding: '40px 52px 48px', color: C.text }}>
                        <header data-pdf-block style={{ textAlign: 'center', borderBottom: `2px solid ${C.navy}`, paddingBottom: 20, marginBottom: 24 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN" className="terms-contract-logo" style={{ height: 54, width: 'auto', maxWidth: '100%', margin: '0 auto 14px', display: 'block' }} />
                            <h1 className="terms-contract-title" style={{ fontFamily: '"Cinzel",serif', fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: '0.04em', margin: 0 }}>
                                Delegate Participation Agreement
                            </h1>
                            <p style={{ fontSize: 13, color: C.textSec, marginTop: 6 }}>Terms &amp; Conditions · Last updated {TERMS_LAST_UPDATED}</p>
                        </header>

                        <div data-pdf-block className="terms-contract-parties" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: 13 }}>
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

                        <p data-pdf-block style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.7, marginBottom: 22 }}>
                            This agreement sets out the terms under which the Delegate named above participates in MYIMUN events and uses the MYIMUN platform. Both parties agree to the following:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {TERMS_SECTIONS.map(s => (
                                <section key={s.title} data-pdf-block>
                                    <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 5 }}>{s.title}</h2>
                                    <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>{s.body}</p>
                                </section>
                            ))}
                        </div>

                        {/* Signatures */}
                        <div data-pdf-block className="terms-contract-signatures" style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
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
