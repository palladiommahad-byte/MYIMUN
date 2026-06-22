'use client';

import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { User } from '../../../types';
import { useToast } from '@/components/ui/Toast';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const inputStyle = (focused?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '9px 12px',
    border: `1px solid ${focused ? C.accent : C.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: C.text,
    background: C.bg,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
});

interface SecuritySettingsProps {
    user: User;
}

export function SecuritySettings({ user }: SecuritySettingsProps) {
    const { showToast } = useToast();

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [focusedPw, setFocusedPw]   = useState<string | null>(null);

    const [email, setEmail]             = useState(user.email || '');
    const [isEmailEditing, setIsEmailEditing] = useState(false);
    const [emailFocused, setEmailFocused]     = useState(false);

    const handlePasswordChange = () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            showToast('Please fill in all fields', 'warning');
            return;
        }
        if (passwords.new !== passwords.confirm) {
            showToast('New passwords do not match', 'error');
            return;
        }
        showToast('Password updated successfully', 'success');
        setPasswords({ current: '', new: '', confirm: '' });
    };

    const handleEmailUpdate = () => {
        user.email = email;
        showToast('Email updated successfully', 'success');
        setIsEmailEditing(false);
    };

    const sectionStyle: React.CSSProperties = {
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '24px 28px',
        boxShadow: C.shadow,
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 12,
        color: C.textMuted,
        marginBottom: 6,
        fontWeight: 500,
    };

    const sectionTitle = (icon: React.ReactNode, title: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ color: C.accent }}>{icon}</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 4 }}>

            {/* Email Section */}
            <div style={sectionStyle}>
                {sectionTitle(<Mail size={18} />, 'Email Settings')}
                <div style={{ maxWidth: 480 }}>
                    <label style={labelStyle}>Email Address</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="email"
                            value={email}
                            disabled={!isEmailEditing}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            style={{
                                ...inputStyle(emailFocused && isEmailEditing),
                                opacity: isEmailEditing ? 1 : 0.7,
                                cursor: isEmailEditing ? 'text' : 'not-allowed',
                            }}
                        />
                        {isEmailEditing ? (
                            <button
                                onClick={handleEmailUpdate}
                                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.green, color: 'white', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0DA271'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.green}
                            >Save</button>
                        ) : (
                            <button
                                onClick={() => setIsEmailEditing(true)}
                                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.accent, color: 'white', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                            >Edit</button>
                        )}
                    </div>
                    {isEmailEditing && (
                        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                            Changing your email will require re-verification.
                        </p>
                    )}
                </div>
            </div>

            {/* Password Section */}
            <div style={sectionStyle}>
                {sectionTitle(<Lock size={18} />, 'Change Password')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {([
                        { key: 'current', label: 'Current Password' },
                        { key: 'new',     label: 'New Password' },
                        { key: 'confirm', label: 'Confirm New Password' },
                    ] as const).map(({ key, label }) => (
                        <div key={key}>
                            <label style={labelStyle}>{label}</label>
                            <input
                                type="password"
                                value={passwords[key]}
                                placeholder="••••••••"
                                onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                                onFocus={() => setFocusedPw(key)}
                                onBlur={() => setFocusedPw(null)}
                                style={inputStyle(focusedPw === key)}
                            />
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handlePasswordChange}
                        style={{ padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.text, color: 'white', fontSize: 14, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1F2937'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.text}
                    >Update Password</button>
                </div>
            </div>
        </div>
    );
}
