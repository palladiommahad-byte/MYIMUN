'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useConference } from '@/context/ConferenceContext';
import { useRouter } from 'next/navigation';
import { User, Mail, MapPin, Calendar, X, Save, Trash2, AlertTriangle, Camera, LoaderCircle } from 'lucide-react';
import { SecuritySettings } from './SecuritySettings';
import { useToast } from '@/components/ui/Toast';
import { fileUrl, uploadFile } from '@/lib/fileStore';

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
    const { refresh } = useAuth();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [formData, setFormData] = useState({
        email: user.email || '',
        address: user.address || '',
        country: user.country || '',
        avatarUrl: user.avatarUrl || '',
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Could not update your profile');
            await refresh();
            setIsEditing(false);
            showToast('Profile updated successfully', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not update your profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            email: user.email || '',
            address: user.address || '',
            country: user.country || '',
            avatarUrl: user.avatarUrl || '',
        });
        setIsEditing(false);
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Choose a JPG, PNG, GIF, or WebP image.', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Profile images must be 5 MB or smaller.', 'error');
            return;
        }
        setUploadingAvatar(true);
        try {
            const uploaded = await uploadFile(file);
            setFormData(current => ({ ...current, avatarUrl: fileUrl(uploaded.key) }));
            showToast('Profile photo ready. Save your changes to use it.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not upload your profile photo', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`,
        borderRadius: 8, fontSize: 14, color: C.text, background: C.bg,
        outline: 'none', boxSizing: 'border-box',
    };

    const EDITABLE_FIELDS: Array<{ icon: any; label: string; key: 'email' | 'address' | 'country'; type: string; placeholder: string; display: string; fullWidth?: boolean }> = [
        { icon: MapPin,    label: 'Country / Delegation', key: 'country', type: 'text',  placeholder: 'Enter country / delegation', display: user.country || 'Unassigned' },
        { icon: Mail,      label: 'Email Address',        key: 'email',   type: 'email', placeholder: 'Enter your email',           display: user.email || 'Not set' },
        { icon: MapPin,    label: 'Address',               key: 'address', type: 'text',  placeholder: 'Enter your address',          display: user.address || 'Not set', fullWidth: true },
    ];

    return (
        <div className="p-5 sm:p-7" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow }}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left" style={{ gap: 24 }}>

                {/* Avatar */}
                <div style={{ position: 'relative', width: 80, flexShrink: 0 }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                        background: 'linear-gradient(135deg, #3B7FFF, #00D4FF)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, fontWeight: 700, color: 'white',
                        boxShadow: '0 4px 16px rgba(59,127,255,0.35)',
                    }}>
                        {(isEditing ? formData.avatarUrl : user.avatarUrl)
                            ? <img src={isEditing ? formData.avatarUrl : user.avatarUrl} alt="Profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                    </div>
                    {isEditing && (
                        <button type="button" onClick={() => avatarInputRef.current?.click()} title="Change profile photo"
                            style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: '50%', border: '2px solid white', background: C.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploadingAvatar ? 'wait' : 'pointer' }}
                            disabled={uploadingAvatar}>
                            {uploadingAvatar ? <LoaderCircle size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> : <Camera size={15} />}
                        </button>
                    )}
                    <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    {isEditing && formData.avatarUrl && (
                        <button type="button" onClick={() => setFormData(current => ({ ...current, avatarUrl: '' }))}
                            style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                            Remove photo
                        </button>
                    )}
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

                        <div style={{ minWidth: 0 }}>
                            <div className="flex items-center justify-center sm:justify-start" style={{ gap: 5, marginBottom: 4 }}>
                                <Calendar size={13} style={{ color: C.textMuted }} />
                                <span style={{ fontSize: 12, color: C.textMuted }}>Joined</span>
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 500, color: C.text, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                                {user.joined ? new Date(user.joined).toLocaleDateString() : 'Not available'}
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
                                <button onClick={handleSave} disabled={saving || uploadingAvatar}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: saving || uploadingAvatar ? 'wait' : 'pointer', background: C.green, color: 'white', fontSize: 14, fontWeight: 600, boxShadow: `0 2px 8px ${C.green}40`, opacity: saving || uploadingAvatar ? 0.7 : 1 }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0DA271'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.green}
                                >{saving ? <LoaderCircle size={14} style={{ animation: 'spin 0.9s linear infinite' }} /> : <Save size={14} />} Save Changes</button>
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
