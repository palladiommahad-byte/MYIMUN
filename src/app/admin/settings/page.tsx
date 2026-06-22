'use client';

import React, { useState } from 'react';
import { Save, Plus, Trash2, Mail, User, Shield, Edit2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { UserRole } from '@/types';
import { useConference, ConferenceSettings } from '@/context/ConferenceContext';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    purple: '#7C5FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const INITIAL_STAFF = [
    { id: 101, name: 'Sarah Jenkins',    email: 'sarah.j@mun.org',   role: 'secretary' as UserRole, status: 'active'   },
    { id: 102, name: 'Mike Ross',        email: 'mike.r@mun.org',    role: 'secretary' as UserRole, status: 'inactive' },
    { id: 201, name: 'Jessica Pearson', email: 'jessica.p@mun.org', role: 'manager'   as UserRole, status: 'active'   },
    { id: 202, name: 'Louis Litt',       email: 'louis.l@mun.org',   role: 'manager'   as UserRole, status: 'active'   },
];

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

function StaffTable({ members, onEdit, onDelete }: { members: typeof INITIAL_STAFF; onEdit: (m: any) => void; onDelete: (id: number) => void }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#FAFBFC', borderBottom: `1px solid ${C.border}` }}>
                        {['Name', 'Status', 'Action'].map((h, i) => (
                            <th key={h} style={{
                                padding: '9px 16px', fontSize: 11, fontWeight: 600, color: C.textMuted,
                                textTransform: 'uppercase', letterSpacing: '0.07em',
                                textAlign: i === 2 ? 'right' : 'left',
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
                                <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</p>
                                <p style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                                    <Mail size={10} /> {m.email}
                                </p>
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
                                    <button onClick={() => onDelete(m.id)}
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

export default function AdminSettingsPage() {
    const { showToast } = useToast();
    const { conferenceSettings, updateConferenceSettings } = useConference();
    const [staff, setStaff] = useState(INITIAL_STAFF);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'secretary' as UserRole, status: 'active' });

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

    const openAdd = () => {
        setEditingMember(null);
        setFormData({ name: '', email: '', role: 'secretary', status: 'active' });
        setIsModalOpen(true);
    };
    const openEdit = (m: any) => {
        setEditingMember(m);
        setFormData({ name: m.name, email: m.email, role: m.role, status: m.status });
        setIsModalOpen(true);
    };
    const handleSaveMember = () => {
        if (!formData.name || !formData.email) { showToast('Please fill in all fields', 'error'); return; }
        if (editingMember) {
            setStaff(staff.map(s => s.id === editingMember.id ? { ...s, ...formData } : s));
            showToast('Staff member updated', 'success');
        } else {
            setStaff([...staff, { id: Math.max(...staff.map(s => s.id)) + 1, ...formData }]);
            showToast(`Added new ${formData.role}`, 'success');
        }
        setIsModalOpen(false);
    };
    const handleDelete = (id: number) => {
        if (confirm('Remove this staff member?')) {
            setStaff(staff.filter(s => s.id !== id));
            showToast('Staff member removed', 'info');
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
                            While closed, delegates will see a "Registration Closed" notice and cannot submit new or repeat registrations.
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

            {/* Staff Management */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 4 }}>
                        Staff Management
                    </h2>
                    <p style={{ fontSize: 14, color: C.textSec }}>Manage executive and managerial roles.</p>
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

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.35)' }}>
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                            {editingMember ? 'Edit Staff Member' : 'Add Staff Member'}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Role */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Role</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(['secretary', 'manager'] as const).map(r => (
                                        <button key={r} onClick={() => setFormData({ ...formData, role: r })}
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
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
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

                            {/* Status */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Status</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[['active', C.green], ['inactive', C.textMuted]].map(([s, col]) => (
                                        <button key={s} onClick={() => setFormData({ ...formData, status: s })}
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
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button onClick={() => setIsModalOpen(false)}
                                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 14, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >Cancel</button>
                            <button onClick={handleSaveMember}
                                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: C.accent, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.accent}40` }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2C6FEF'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.accent}
                            >{editingMember ? 'Save Changes' : 'Add Member'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
