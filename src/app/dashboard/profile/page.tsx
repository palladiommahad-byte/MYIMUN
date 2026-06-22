'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useConference } from '@/context/ConferenceContext';
import { useRouter } from 'next/navigation';
import { User, Mail, MapPin, Calendar, X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { SecuritySettings } from './SecuritySettings';
import { useToast } from '@/components/ui/Toast';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', purple: '#7C5FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { deleteDelegate } = useConference();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteAccount = () => {
        if (user) deleteDelegate(user.id);
        logout();
        router.replace('/login');
    };

    if (!user) return <p style={{ fontSize: 14, color: C.textSec }}>Loading profile…</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                    My Profile
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Manage your personal information and delegate settings.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, gap: 24 }}>
                {(['personal', 'security'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        style={{
                            paddingBottom: 12, paddingTop: 4, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                            color: activeTab === tab ? C.accent : C.textSec,
                            background: 'transparent', border: 'none',
                            borderBottom: `2px solid ${activeTab === tab ? C.accent : 'transparent'}`,
                            marginBottom: -1,
                        }}
                    >
                        {tab === 'personal' ? 'Personal Information' : 'Security Settings'}
                    </button>
                ))}
            </div>

            {activeTab === 'personal' ? <ProfileContent user={user} /> : <SecuritySettings user={user} />}

            {/* Danger Zone */}
            <div style={{ background: C.surface, border: `1px solid #FCA5A5`, borderRadius: 12, padding: '24px 28px', boxShadow: C.shadow }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>Danger Zone</h3>
                <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16 }}>
                    Permanently delete your account data including registration, payment history, and messages. You will be logged out immediately.
                </p>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: '1px solid #FCA5A5', cursor: 'pointer', background: '#FFF5F5', color: '#DC2626', fontSize: 14, fontWeight: 600 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#DC2626'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFF5F5'; (e.currentTarget as HTMLElement).style.color = '#DC2626'; }}
                >
                    <Trash2 size={15} /> Delete Account
                </button>
            </div>

            {/* Confirmation Modal */}
            {showDeleteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: C.surface, borderRadius: 16, padding: '32px 28px', width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={24} style={{ color: '#DC2626' }} />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Delete Account?</h3>
                            <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, margin: 0 }}>
                                This will permanently erase your registration, payment submissions, messages, and committee applications. You will be logged out and cannot undo this action.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, cursor: 'pointer', background: 'transparent', color: C.textSec, fontSize: 14, fontWeight: 500 }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >Cancel</button>
                            <button
                                onClick={handleDeleteAccount}
                                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#DC2626', color: 'white', fontSize: 14, fontWeight: 600 }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#B91C1C'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#DC2626'}
                            >Yes, Delete Account</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileContent({ user }: { user: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        email: user.email || '',
        address: user.address || '',
        country: user.country || '',
        joined: user.joined || new Date().toISOString().slice(0, 10),
    });

    const handleSave = () => {
        user.email = formData.email;
        user.address = formData.address;
        user.country = formData.country;
        user.joined = formData.joined;
        setIsEditing(false);
        showToast('Profile updated successfully', 'success');
    };

    const handleCancel = () => {
        setFormData({
            email: user.email || '',
            address: user.address || '',
            country: user.country || '',
            joined: user.joined || new Date().toISOString().slice(0, 10),
        });
        setIsEditing(false);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`,
        borderRadius: 8, fontSize: 14, color: C.text, background: C.bg,
        outline: 'none', boxSizing: 'border-box',
    };

    const EDITABLE_FIELDS: Array<{ icon: any; label: string; key: 'email' | 'address' | 'country' | 'joined'; type: string; placeholder: string; display: string; fullWidth?: boolean }> = [
        { icon: MapPin,    label: 'Country / Delegation', key: 'country', type: 'text',  placeholder: 'Enter country / delegation', display: user.country || 'Unassigned' },
        { icon: Mail,      label: 'Email Address',        key: 'email',   type: 'email', placeholder: 'Enter your email',           display: user.email || 'Not set' },
        { icon: Calendar,  label: 'Joined',                key: 'joined',  type: 'date',  placeholder: '',                            display: user.joined ? new Date(user.joined).toLocaleDateString() : new Date().toLocaleDateString() },
        { icon: MapPin,    label: 'Address',               key: 'address', type: 'text',  placeholder: 'Enter your address',          display: user.address || 'Not set', fullWidth: true },
    ];

    return (
        <div className="p-5 sm:p-7" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow }}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left" style={{ gap: 24 }}>

                {/* Avatar */}
                <div style={{
                    width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #3B7FFF, #00D4FF)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 700, color: 'white',
                    boxShadow: '0 4px 16px rgba(59,127,255,0.35)',
                }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="w-full" style={{ flex: 1, minWidth: 0 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '16px 24px', marginBottom: 20 }}>

                        {/* Full Name — always read-only */}
                        <div style={{ minWidth: 0 }}>
                            <div className="flex items-center justify-center sm:justify-start" style={{ gap: 5, marginBottom: 4 }}>
                                <User size={13} style={{ color: C.textMuted }} />
                                <span style={{ fontSize: 12, color: C.textMuted }}>Full Name</span>
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 500, color: C.text, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, overflowWrap: 'anywhere' }}>
                                {user.name || 'Not set'}
                            </p>
                        </div>

                        {/* Editable fields */}
                        {EDITABLE_FIELDS.map(({ icon: Icon, label, key, type, placeholder, display, fullWidth }) => (
                            <div key={key} className={fullWidth ? 'sm:col-span-2' : undefined} style={{ minWidth: 0 }}>
                                <div className="flex items-center justify-center sm:justify-start" style={{ gap: 5, marginBottom: 4 }}>
                                    <Icon size={13} style={{ color: C.textMuted }} />
                                    <span style={{ fontSize: 12, color: C.textMuted }}>{label}</span>
                                </div>
                                {isEditing ? (
                                    <input type={type} value={formData[key]}
                                        onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = C.accent}
                                        onBlur={e => e.target.style.borderColor = C.border}
                                    />
                                ) : (
                                    <p style={{ fontSize: 15, fontWeight: 500, color: C.text, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, overflowWrap: 'anywhere' }}>
                                        {display}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        {isEditing ? (
                            <>
                                <button onClick={handleSave}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.green, color: 'white', fontSize: 14, fontWeight: 600, boxShadow: `0 2px 8px ${C.green}40` }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0DA271'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.green}
                                ><Save size={14} /> Save Changes</button>
                                <button onClick={handleCancel}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, cursor: 'pointer', background: 'transparent', color: C.textSec, fontSize: 14, fontWeight: 500 }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                ><X size={14} /> Cancel</button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)}
                                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.accent, color: 'white', fontSize: 14, fontWeight: 600, boxShadow: `0 2px 8px ${C.accent}40` }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                            >Edit Profile</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
