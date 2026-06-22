'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateCertificatePDF } from '@/lib/generateCertificate';
import { buildCertificateHTML, centerCertificateName, CertificateData } from '@/lib/buildCertificateHTML';

interface Props extends CertificateData {
    /** Accent gradient for the button (defaults to platform blue/purple). */
    className?: string;
}

/* ── Download button ── */
export function CertificateDownloadButton({ delegateName, eventDate, edition, signatory, location }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async () => {
        setLoading(true);
        setError(null);
        try {
            await generateCertificatePDF({
                delegateName, eventDate, edition, signatory, location,
                filename: `MYIMUN-Certificate-${delegateName.replace(/\s+/g, '-')}.pdf`,
            });
        } catch (err) {
            console.error('PDF generation failed:', err);
            setError('Failed to generate PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleDownload}
                disabled={loading}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '11px 24px',
                    background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#3B7FFF 0%,#7C5FFF 100%)',
                    color: '#FFFFFF', border: 'none', borderRadius: 10,
                    fontFamily: '"Inter",sans-serif', fontSize: 14, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(59,127,255,0.35)',
                    transition: 'all 0.2s ease',
                }}>
                {loading ? (
                    <><Loader2 size={16} className="cert-spin" /> Generating PDF…</>
                ) : (
                    <><Download size={16} /> Download Certificate</>
                )}
            </button>
            {error && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 8 }}>{error}</p>}
            <style>{`@keyframes cert-spin-kf{to{transform:rotate(360deg)}}.cert-spin{animation:cert-spin-kf 1s linear infinite}`}</style>
        </div>
    );
}

/* ── Scaled live preview (1200×849 → fits container) ── */
export function CertificatePreview({ delegateName, eventDate, edition, signatory, location, scale = 0.52 }: CertificateData & { scale?: number }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = buildCertificateHTML({ delegateName, eventDate, edition, signatory, location });
            centerCertificateName(ref.current);
        }
    }, [delegateName, eventDate, edition, signatory, location]);

    return (
        <div style={{
            width: 1200 * scale, height: 849 * scale, overflow: 'hidden',
            borderRadius: 12, border: '1px solid #E4E8EF', boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            background: '#fff',
        }}>
            <div ref={ref} style={{ width: 1200, height: 849, transform: `scale(${scale})`, transformOrigin: 'top left' }} />
        </div>
    );
}
