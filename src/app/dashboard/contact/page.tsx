'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', purple: '#7C5FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`,
    borderRadius: 8, fontSize: 13, color: C.text, background: C.bg,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

export default function ContactPage() {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({ subject: '', category: 'General Inquiry', message: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) { showToast('Please fill in all fields', 'warning'); return; }
        showToast('Message sent to Secretariat', 'success');
        setFormData({ subject: '', category: 'General Inquiry', message: '' });
    };

    const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = C.accent; };
    const blurBorder  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = C.border; };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                    Contact Secretariat
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Need assistance? Reach out to the organizing team.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]" style={{ gap: 20 }}>

                {/* Form */}
                <div className="p-4 sm:p-6" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <MessageSquare size={16} style={{ color: C.accent }} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Send a Message</span>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.textSec, marginBottom: 6 }}>Category</label>
                                <select value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
                                    onFocus={focusBorder} onBlur={blurBorder}
                                >
                                    <option>General Inquiry</option>
                                    <option>Logistics & Venue</option>
                                    <option>Committee Issue</option>
                                    <option>Emergency</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.textSec, marginBottom: 6 }}>Subject</label>
                                <input type="text" value={formData.subject} placeholder="Brief topic…"
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    style={inputStyle} onFocus={focusBorder} onBlur={blurBorder}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.textSec, marginBottom: 6 }}>Message</label>
                            <textarea value={formData.message} placeholder="Describe your issue or question in detail…"
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                style={{ ...inputStyle, minHeight: 140, resize: 'vertical' } as React.CSSProperties}
                                onFocus={focusBorder} onBlur={blurBorder}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit"
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.accent, color: 'white', fontSize: 14, fontWeight: 600, boxShadow: `0 2px 8px ${C.accent}40` }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                            >
                                <Send size={14} /> Send Message
                            </button>
                        </div>
                    </form>
                </div>

                {/* Contact info */}
                <div className="p-4 sm:p-6" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Direct Contact</p>
                    {[
                        { Icon: Mail,   color: C.accent,  label: 'Email Us',            detail: 'secretariat@myimun.org', sub: 'Response time: < 24h', href: 'mailto:secretariat@myimun.org' },
                        { Icon: Phone,  color: C.green,   label: 'Emergency Line',      detail: '+212 555 0192',           sub: 'Available 24/7 during conference', href: 'tel:+2125550192' },
                        { Icon: MapPin, color: C.purple,  label: 'Secretariat Office',  detail: 'Room 102, 1st Floor',     sub: 'Main Conference Hall', href: undefined },
                    ].map(({ Icon, color, label, detail, sub, href }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={17} style={{ color }} />
                            </div>
                            <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</p>
                                {href ? (
                                    <a href={href} style={{ fontSize: 13, fontWeight: 500, color: C.text, textDecoration: 'none' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = color}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.text}
                                    >{detail}</a>
                                ) : (
                                    <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{detail}</p>
                                )}
                                <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
