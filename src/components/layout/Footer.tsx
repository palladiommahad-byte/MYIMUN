'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Search } from 'lucide-react';
import { useConference } from '@/context/ConferenceContext';
import { whatsappHref } from '@/lib/contactLinks';

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

// Brand/social glyphs as inline SVGs because lucide-react does not ship them.
type IconProps = { size?: number; color?: string };

function FacebookIcon({ size = 20, color = C.heading }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
    );
}

function YoutubeIcon({ size = 20, color = C.heading }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
    );
}

function InstagramIcon({ size = 20, color = C.heading }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
    );
}

export const Footer: React.FC = () => {
    const { landingPage, conferenceSettings } = useConference();
    const fd = landingPage.footerData;
    const whatsappPhone = fd.whatsappPhone || fd.phone;
    const linkStyle: React.CSSProperties = { fontSize: 18, fontWeight: 400, color: C.body, textDecoration: 'none' };
    const socialLinks = [
        { label: 'Facebook', href: fd.facebookUrl, Icon: FacebookIcon },
        { label: 'YouTube', href: fd.youtubeUrl, Icon: YoutubeIcon },
        { label: 'Instagram', href: fd.instagramUrl, Icon: InstagramIcon },
    ].filter(link => link.href.trim());

    return (
        <footer style={{ background: C.bg, padding: '80px 64px 32px', fontFamily: FONT }} className="lp-footer">
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr', gap: 40 }} className="lp-footer-grid">

                    {/* Col 1 — Logo & contact */}
                    <div>
                        <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN" style={{ height: 52, width: 'auto', objectFit: 'contain', display: 'block' }} />
                        {conferenceSettings.whatsappSupportEnabled ? (
                            <a href={whatsappHref(whatsappPhone, 'Hello MYIMUN Secretariat, I would like more information.')} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 28, color: C.heading, marginTop: 32, textDecoration: 'none' }}>
                                <MessageCircle size={24} color={C.blue} />
                                {whatsappPhone}
                            </a>
                        ) : (
                            <p style={{ fontWeight: 700, fontSize: 28, color: C.heading, marginTop: 32 }}>{fd.phone}</p>
                        )}
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
                            <Link href="/terms" style={linkStyle}>Terms &amp; conditions</Link>
                        </div>
                    </div>

                    {/* Col 3 — Info */}
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 20, color: C.heading, marginBottom: 16 }}>Info</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Link href="/about" style={linkStyle}>About</Link>
                            <Link href="/contact" style={linkStyle}>Contact</Link>
                        </div>
                    </div>

                    {/* Col 4 — Connect */}
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 20, color: C.heading, marginBottom: 16 }}>Connect</p>
                        {socialLinks.length > 0 && <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                            {socialLinks.map(({ label, href, Icon }) => (
                                <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer" style={{ color: C.heading, lineHeight: 0 }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.blue}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.heading}>
                                    <Icon size={22} color="currentColor" />
                                </a>
                            ))}
                        </div>}
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
