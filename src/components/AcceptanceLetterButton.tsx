'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateAcceptanceLetterPDF } from '@/lib/generateAcceptanceLetter';
import { buildAcceptanceLetterHTML, LetterData } from '@/lib/buildAcceptanceLetterHTML';

export function AcceptanceLetterDownloadButton({ delegateName, editionYear, startDate, endDate }: LetterData) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handle = async () => {
        setLoading(true); setError(null);
        try {
            await generateAcceptanceLetterPDF({ delegateName, editionYear, startDate, endDate });
        } catch (err) {
            console.error(err);
            setError('Failed to generate letter. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handle} disabled={loading}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 22px',
                    background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#10B981,#059669)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontFamily: '"Inter",sans-serif', fontSize: 14, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
                    transition: 'all 0.2s',
                }}>
                {loading
                    ? <><Loader2 size={15} className="letter-spin" /> Generating…</>
                    : <><Download size={15} /> Download Letter</>}
            </button>
            {error && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 8 }}>{error}</p>}
            <style>{`@keyframes letter-spin-kf{to{transform:rotate(360deg)}}.letter-spin{animation:letter-spin-kf 1s linear infinite}`}</style>
        </div>
    );
}

export function AcceptanceLetterPreview({ delegateName, editionYear, startDate, endDate, scale = 0.44 }: LetterData & { scale?: number }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = buildAcceptanceLetterHTML({ delegateName, editionYear, startDate, endDate });
        }
    }, [delegateName, editionYear, startDate, endDate]);

    return (
        <div style={{
            width: 794 * scale, height: 1123 * scale, overflow: 'hidden',
            borderRadius: 12, border: '1px solid #E4E8EF',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)', background: '#fff',
        }}>
            <div ref={ref} style={{ width: 794, height: 1123, transform: `scale(${scale})`, transformOrigin: 'top left' }} />
        </div>
    );
}
