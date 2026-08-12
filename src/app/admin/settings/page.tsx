'use client';

import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Mail, User, Shield, Edit2, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/auth/AuthContext';
import { useConference, ConferenceSettings } from '@/context/ConferenceContext';
import { ADMIN_PAGES } from '@/lib/adminPages';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    purple: '#7C5FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

interface StaffMember {
    id: string;
    fullName: string;
    email: string;
    role: 'secretary' | 'manager';
    status: 'active' | 'inactive';
    permissions: string[] | null;
}

async function getData(url: string) {
    try { const res = await fetch(url); if (!res.ok) return null; const j = await res.json(); return j?.ok ? j.data : null; } catch { return null; }
}
async function send(method: string, url: string, body?: unknown) {
    const res = await fetch(url, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j?.ok === false) throw new Error(j?.error || 'Request failed');
    return j.data;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} role="switch" aria-checked={on} style={{
            width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer', flexShrink: 0,
            background: on ? C.green : C.border, transition: 'background .2s', border: 'none', padding: 0,
        }}>
            <div style={{
                position: 'absolute', top: 3, bottom: 3, width: 18, borderRadius: '50%', background: 'white',
                left: on ? 'calc(100% - 21px)' : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
        </button>
    );
}

function SettingRow({ title, sub, on, onToggle }: { title: string; sub: string; on: boolean; onToggle: () => void }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{title}</p>
                <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{sub}</p>
            </div>
            <Toggle on={on} onClick={onToggle} />
        </div>
    );
}

function StaffTable({ members, onEdit, onDelete }: { members: StaffMember[]; onEdit: (m: StaffMember) => void; onDelete: (m: StaffMember) => void }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#FAFBFC', borderBottom: `1px solid ${C.border}` }}>
                        {['Name', 'Access', 'Status', 'Action'].map((h, i) => (
                            <th key={h} style={{
                                padding: '9px 16px', fontSize: 11, fontWeight: 600, color: C.textMuted,
                                textTransform: 'uppercase', letterSpacing: '0.07em',
                                textAlign: i === 3 ? 'right' : 'left',
                            }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {members.map((m, idx) => (
                        <tr key={m.id}
                            style={{ borderBottom: idx < members.length - 1 ? `1px solid ${C.border}` : 'none' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                            <td style={{ padding: '12px 16px' }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.fullName}</p>
                                <p style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                                    <Mail size={10} /> {m.email}
                                </p>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: `${C.green}14`, color: C.green, whiteSpace: 'nowrap' }}>
                                    Full access
                                </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                                    background: m.status === 'active' ? `${C.green}14` : `${C.textMuted}14`,
                                    color: m.status === 'active' ? C.green : C.textMuted,
                                }}>{m.status === 'active' ? 'Active' : 'Inactive'}</span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                    <button onClick={() => onEdit(m)}
                                        style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                    ><Edit2 size={14} /></button>
                                    <button onClick={() => onDelete(m)}
                                        style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                    ><Trash2 size={14} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const EMPTY_FORM = {
    fullName: '', email: '', password: '',
    role: 'secretary' as 'secretary' | 'manager',
    status: 'active' as 'active' | 'inactive',
    permissions: ADMIN_PAGES.map(p => p.path),
};

export default function AdminSettingsPage() {
    const { showToast } = useToast();
    const { user, refresh } = useAuth();
    const isAdmin = user?.role === 'admin';
    const { conferenceSettings, updateConferenceSettings } = useConference();

    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const loadStaff = async () => {
        const rows = await getData('/api/staff');
        setStaff(rows ?? []);
        setLoadingStaff(false);
    };
    useEffect(() => {
        let alive = true;
        if (!isAdmin) {
            queueMicrotask(() => { if (alive) setLoadingStaff(false); });
            return () => { alive = false; };
        }
        getData('/api/staff').then(rows => {
            if (!alive) return;
            setStaff(rows ?? []);
            setLoadingStaff(false);
        });
        return () => { alive = false; };
    }, [isAdmin]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const [accountForm, setAccountForm] = useState({
        email: user?.email ?? '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [savingAccount, setSavingAccount] = useState(false);
    useEffect(() => {
        const email = user?.email;
        if (email) queueMicrotask(() => setAccountForm(f => ({ ...f, email })));
    }, [user?.email]);

    const [settingsForm, setSettingsForm] = useState<ConferenceSettings>(conferenceSettings);
    const toggleSetting = (key: keyof ConferenceSettings) =>
        setSettingsForm(f => ({ ...f, [key]: !f[key] }));
    const isDirty = JSON.stringify(settingsForm) !== JSON.stringify(conferenceSettings);

    const saveSettings = () => {
        updateConferenceSettings(settingsForm);
        if (settingsForm.registrationOpen !== conferenceSettings.registrationOpen) {
            showToast(settingsForm.registrationOpen
                ? 'Registration is now open. Delegates can submit new registrations.'
                : 'Registration is now closed. Delegates will see a closed notice.', 'info');
        }
        showToast('Conference settings saved', 'success');
    };

    const saveAdminAccount = async (event: React.FormEvent) => {
        event.preventDefault();
        const emailChanged = accountForm.email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase();
        if (!emailChanged && !accountForm.newPassword) {
            showToast('Enter a new email or password', 'error');
            return;
        }
        if (!accountForm.currentPassword) {
            showToast('Enter your current password', 'error');
            return;
        }
        if (accountForm.newPassword && accountForm.newPassword.length < 12) {
            showToast('New password must be at least 12 characters', 'error');
            return;
        }
        if (accountForm.newPassword !== accountForm.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        setSavingAccount(true);
        try {
            const updated = await send('PATCH', '/api/auth/account', {
                currentPassword: accountForm.currentPassword,
                ...(emailChanged ? { email: accountForm.email.trim() } : {}),
                ...(accountForm.newPassword ? {
                    newPassword: accountForm.newPassword,
                    confirmPassword: accountForm.confirmPassword,
                } : {}),
            });
            setAccountForm({
                email: updated.email,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            await refresh();
            showToast('Admin login credentials updated', 'success');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not update credentials', 'error');
        } finally {
            setSavingAccount(false);
        }
    };

    const openAdd = () => { setEditingMember(null); setFormData(EMPTY_FORM); setIsModalOpen(true); };
    const openEdit = (m: StaffMember) => {
        setEditingMember(m);
        setFormData({ fullName: m.fullName, email: m.email, password: '', role: m.role, status: m.status, permissions: ADMIN_PAGES.map(p => p.path) });
        setIsModalOpen(true);
    };

    const handleSaveMember = async () => {
        if (!formData.fullName.trim() || !formData.email.trim()) { showToast('Please fill in name and email', 'error'); return; }
        if (!editingMember && formData.password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
        if (formData.password && formData.password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

        setSaving(true);
        try {
            if (editingMember) {
                const body: Record<string, unknown> = {
                    fullName: formData.fullName, email: formData.email,
                    role: formData.role, status: formData.status, permissions: formData.permissions,
                };
                if (formData.password) body.password = formData.password;
                await send('PATCH', `/api/staff/${editingMember.id}`, body);
                showToast('Staff member updated', 'success');
            } else {
                await send('POST', '/api/staff', {
                    fullName: formData.fullName, email: formData.email, password: formData.password,
                    role: formData.role, status: formData.status, permissions: formData.permissions,
                });
                showToast(`Added new ${formData.role}`, 'success');
            }
            setIsModalOpen(false);
            await loadStaff();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Something went wrong', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (m: StaffMember) => {
        if (!confirm(`Remove ${m.fullName}? This cannot be undone.`)) return;
        try {
            await send('DELETE', `/api/staff/${m.id}`);
            showToast('Staff member removed', 'info');
            await loadStaff();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Something went wrong', 'error');
        }
    };

    const secretaries = staff.filter(s => s.role === 'secretary');
    const managers    = staff.filter(s => s.role === 'manager');

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', paddingBottom: 48 }}>

            {/* Header */}
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                    Conference Settings
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>General configuration and master switches.</p>
            </div>

            {isAdmin && (
                <form onSubmit={saveAdminAccount} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${C.accent}12`, color: C.accent }}>
                            <KeyRound size={18} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>My Admin Account</h2>
                            <p style={{ fontSize: 12.5, color: C.textSec, marginTop: 2 }}>Update the credentials used to sign in.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Login Email</span>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={accountForm.email}
                                onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = C.accent}
                                onBlur={e => e.target.style.borderColor = C.border}
                            />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Current Password</span>
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                value={accountForm.currentPassword}
                                onChange={e => setAccountForm(f => ({ ...f, currentPassword: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = C.accent}
                                onBlur={e => e.target.style.borderColor = C.border}
                            />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>New Password</span>
                            <input
                                type="password"
                                minLength={12}
                                autoComplete="new-password"
                                placeholder="Leave blank to keep current"
                                value={accountForm.newPassword}
                                onChange={e => setAccountForm(f => ({ ...f, newPassword: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = C.accent}
                                onBlur={e => e.target.style.borderColor = C.border}
                            />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Confirm New Password</span>
                            <input
                                type="password"
                                minLength={12}
                                autoComplete="new-password"
                                value={accountForm.confirmPassword}
                                onChange={e => setAccountForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = C.accent}
                                onBlur={e => e.target.style.borderColor = C.border}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={savingAccount}
                        style={{ alignSelf: 'flex-end', minWidth: 170, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: savingAccount ? 'default' : 'pointer', background: C.accent, color: 'white', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: savingAccount ? 0.65 : 1 }}
                    >
                        {savingAccount ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        Save Credentials
                    </button>
                </form>
            )}

            {/* Config card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Registration status */}
                <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Registration Status</p>
                    <div style={{ display: 'flex', gap: 12, padding: 14, background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                        {([['Open', true], ['Closed', false]] as const).map(([s, val]) => {
                            const selected = settingsForm.registrationOpen === val;
                            const col = val ? C.green : C.red;
                            return (
                                <button type="button" key={s} onClick={() => setSettingsForm(f => ({ ...f, registrationOpen: val }))}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'none', border: 'none', padding: 0, opacity: selected ? 1 : 0.5 }}
                                >
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? col : C.border}`, background: selected ? col : 'transparent' }} />
                                    <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{s}</span>
                                </button>
                            );
                        })}
                    </div>
                    {!settingsForm.registrationOpen && (
                        <p style={{ fontSize: 12, color: C.red, marginTop: 8 }}>
                            While closed, delegates will see a &quot;Registration Closed&quot; notice and cannot submit new or repeat registrations.
                        </p>
                    )}
                </div>

                <div style={{ height: 1, background: C.border }} />

                {/* Toggle settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <SettingRow title="Allow Position Paper Uploads" sub="Delegates can submit their papers." on={settingsForm.allowPaperUploads} onToggle={() => toggleSetting('allowPaperUploads')} />
                    <SettingRow title="Public Schedule" sub="Visible to non-logged in users." on={settingsForm.publicSchedule} onToggle={() => toggleSetting('publicSchedule')} />
                    <SettingRow title="System Maintenance Mode" sub="Disable access for standard users." on={settingsForm.maintenanceMode} onToggle={() => toggleSetting('maintenanceMode')} />
                    <SettingRow title="Secretary Access" sub="Allow secretaries to access the admin dashboard." on={settingsForm.secretaryAccess} onToggle={() => toggleSetting('secretaryAccess')} />
                    <SettingRow title="Manager Access" sub="Allow managers to access the admin dashboard." on={settingsForm.managerAccess} onToggle={() => toggleSetting('managerAccess')} />
                </div>

                <div style={{ height: 1, background: C.border }} />

                <button
                    onClick={saveSettings}
                    disabled={!isDirty}
                    style={{
                        width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', cursor: isDirty ? 'pointer' : 'default',
                        background: C.accent, color: 'white', fontSize: 14, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: `0 2px 8px ${C.accent}40`, opacity: isDirty ? 1 : 0.5,
                    }}
                    onMouseEnter={e => { if (isDirty) (e.currentTarget as HTMLElement).style.background = '#2C6FEF'; }}
                    onMouseLeave={e => { if (isDirty) (e.currentTarget as HTMLElement).style.background = C.accent; }}
                >
                    <Save size={15} /> Save Configuration
                </button>
            </div>

            {/* Staff Management — admin only: secretaries/managers can't grant themselves or others access */}
            {isAdmin && (
                <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 4 }}>
                                Staff Management
                            </h2>
                            <p style={{ fontSize: 14, color: C.textSec }}>Create secretary/manager accounts. Staff accounts have full admin-page access.</p>
                        </div>
                        <button onClick={openAdd}
                            className="flex items-center gap-2 font-semibold text-sm text-white"
                            style={{ background: C.green, padding: '9px 18px', borderRadius: 8, boxShadow: `0 2px 8px ${C.green}40` }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0DA271'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.green}
                        >
                            <Plus size={14} /> Add Member
                        </button>
                    </div>

                    {loadingStaff ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: C.textMuted, gap: 8 }}>
                            <Loader2 size={16} className="animate-spin" /> <span style={{ fontSize: 13 }}>Loading staff…</span>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* Secretaries */}
                            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <User size={15} style={{ color: C.accent }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Secretaries</span>
                                </div>
                                {secretaries.length === 0
                                    ? <p style={{ padding: 24, textAlign: 'center', fontSize: 13, color: C.textMuted }}>No secretaries found.</p>
                                    : <StaffTable members={secretaries} onEdit={openEdit} onDelete={handleDelete} />
                                }
                            </div>

                            {/* Managers */}
                            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Shield size={15} style={{ color: C.purple }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Managers</span>
                                </div>
                                {managers.length === 0
                                    ? <p style={{ padding: 24, textAlign: 'center', fontSize: 13, color: C.textMuted }}>No managers found.</p>
                                    : <StaffTable members={managers} onEdit={openEdit} onDelete={handleDelete} />
                                }
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.35)' }}>
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, maxWidth: 520, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                            {editingMember ? 'Edit Staff Member' : 'Add Staff Member'}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Role */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Role</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(['secretary', 'manager'] as const).map(r => (
                                        <button key={r} type="button" onClick={() => setFormData({ ...formData, role: r })}
                                            style={{
                                                flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                border: `1px solid ${formData.role === r ? (r === 'secretary' ? C.accent : C.purple) : C.border}`,
                                                background: formData.role === r ? (r === 'secretary' ? `${C.accent}12` : `${C.purple}12`) : C.bg,
                                                color: formData.role === r ? (r === 'secretary' ? C.accent : C.purple) : C.textSec,
                                            }}
                                        >{r.charAt(0).toUpperCase() + r.slice(1)}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Name</label>
                                <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Enter full name"
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = C.accent}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Enter email address"
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = C.accent}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                                    Password {editingMember && <span style={{ textTransform: 'none', fontWeight: 400 }}>(leave blank to keep current)</span>}
                                </label>
                                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingMember ? 'Enter new password' : 'Enter a password (min. 6 characters)'}
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = C.accent}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Status</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {([['active', C.green], ['inactive', C.textMuted]] as const).map(([s, col]) => (
                                        <button key={s} type="button" onClick={() => setFormData({ ...formData, status: s })}
                                            style={{
                                                flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                border: `1px solid ${formData.status === s ? col : C.border}`,
                                                background: formData.status === s ? `${col}14` : C.bg,
                                                color: formData.status === s ? col : C.textSec,
                                            }}
                                        >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.green}25`, background: `${C.green}08` }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 3 }}>Full access</p>
                                <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.45 }}>
                                    Secretary and manager accounts can access every admin page. Only administrators can create, edit, or remove staff accounts.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button onClick={() => setIsModalOpen(false)} disabled={saving}
                                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 14, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >Cancel</button>
                            <button onClick={handleSaveMember} disabled={saving}
                                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: C.accent, color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: `0 2px 8px ${C.accent}40` }}
                                onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = '#2C6FEF'; }}
                                onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = C.accent; }}
                            >{saving ? 'Saving…' : editingMember ? 'Save Changes' : 'Add Member'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
