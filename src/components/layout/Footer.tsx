'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Youtube, Instagram, ArrowRight, Search } from 'lucide-react';
import { useConference } from '@/context/ConferenceContext';

const C = {
    blue:     '#2C74FF',
    heading:  '#0B1220',
    body:     '#4A5568',
    bodyLight:'#6B7280',
    bg:       '#F5F6F7',
    border:   '#E5E7EB',
    muted:    '#9CA3AF',
};
const FONT = '"Outfit", -apple-system, sans-serif';

function WhatsAppIcon({ size = 20, color = C.heading }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.55 5.318l-.999 3.648 3.738-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/>
        </svg>
    );
}

export const Footer: React.FC = () => {
    const { landingPage } = useConference();
    const fd = landingPage.footerData;
    const linkStyle: React.CSSProperties = { fontSize: 18, fontWeight: 400, color: C.body, textDecoration: 'none' };

    return (
        <footer style={{ background: C.bg, padding: '80px 64px 32px', fontFamily: FONT }} className="lp-footer">
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr', gap: 40 }} className="lp-footer-grid">

                    {/* Col 1 — Logo & contact */}
                    <div>
                        <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN" style={{ height: 52, width: 'auto', objectFit: 'contain', display: 'block' }} />
                        <p style={{ fontWeight: 700, fontSize: 28, color: C.heading, marginTop: 32 }}>{fd.phone}</p>
                        <p style={{ fontWeight: 400, fontSize: 18, color: C.bodyLight, marginTop: 4 }}>{fd.hours}</p>
                        <Link href="/contact" style={{ textDecoration: 'none' }}>
                            <button style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, background: C.blue, color: '#fff', border: 'none', borderRadius: 9999, padding: '12px 26px', fontWeight: 600, fontSize: 18, cursor: 'pointer', fontFamily: FONT }}>
                                Contact Us <ArrowRight size={16} />
                            </button>
                        </Link>
                    </div>

                    {/* Col 2 — Myimun */}
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 20, color: C.heading, marginBottom: 16 }}>Myimun</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Link href="/" style={{ ...linkStyle, color: C.blue, fontWeight: 500 }}>Home</Link>
                            <Link href="/committees" style={linkStyle}>Committees</Link>
                            <Link href="/about" style={linkStyle}>Terms &amp; conditions</Link>
                        </div>
                    </div>

                    {/* Col 3 — Info */}
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 20, color: C.heading, marginBottom: 16 }}>Info</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Link href="/about" style={linkStyle}>About</Link>
                            <Link href="/schedule" style={linkStyle}>Plans</Link>
                            <Link href="/contact" style={linkStyle}>Contact</Link>
                        </div>
                    </div>

                    {/* Col 4 — Connect */}
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 20, color: C.heading, marginBottom: 16 }}>Connect</p>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                            {[Facebook, null, Youtube, Instagram].map((Icon, i) => (
                                <a key={i} href="#" aria-label="social" style={{ color: C.heading, lineHeight: 0 }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.blue}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.heading}>
                                    {Icon ? <Icon size={22} /> : <WhatsAppIcon size={22} />}
                                </a>
                            ))}
                        </div>
                        <div style={{ position: 'relative', maxWidth: 220 }}>
                            <input placeholder="Search..."
                                style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 36px 10px 14px', fontSize: 18, fontFamily: FONT, color: C.heading, outline: 'none', background: '#fff' }} />
                            <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 56, paddingTop: 24 }}>
                    <p style={{ fontWeight: 400, fontSize: 16, color: C.bodyLight }}>{fd.copyright}</p>
                </div>
            </div>
        </footer>
    );
};
