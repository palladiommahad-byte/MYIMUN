'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    KeyRound, Mail, Ban, ShieldCheck, Search, X, Copy, Check, RefreshCw,
    Loader2, Clock, UserX, AlertTriangle, Phone, UserPlus, UserRound, Globe2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference } from '@/context/ConferenceContext';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    purple: '#7C5FFF', pink: '#EC4899',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

interface DelegateAccount {
    id: string;
    fullName: string;
    email: string;
    status: 'active' | 'inactive';
    country: string | null;
    createdAt: string;
    accessReviewRequired?: boolean;
    loginLockUntil?: string | null;
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

function genPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function Avatar({ name, suspended }: { name: string; suspended?: boolean }) {
    const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const color = suspended ? C.red : C.accent;
    return (
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}18`, color, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {initials}
        </div>
    );
}

/* ── Reset-password target: either a delegate account directly, or a pending reset request ── */
type ResetTarget =
    | { kind: 'account'; id: string; name: string; email: string }
    | { kind: 'request'; id: number; userId: string | null; name: string; email: string };

export default function AdminAccountsPage() {
    const { showToast } = useToast();
    const { passwordResetRequests, refreshAccountsData } = useConference();

    const [accounts, setAccounts] = useState<DelegateAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ fullName: '', email: '', country: '', password: genPassword() });
    const [creating, setCreating] = useState(false);
    const [createdAccount, setCreatedAccount] = useState<DelegateAccount | null>(null);
    const [createdPassword, setCreatedPassword] = useState('');
    const [createCopied, setCreateCopied] = useState(false);

    useEffect(() => {
        let alive = true;
        getData('/api/accounts').then(rows => {
            if (!alive) return;
            setAccounts(rows ?? []);
            setLoading(false);
        });
        return () => { alive = false; };
    }, []);

    const pendingRequests = useMemo(
        () => passwordResetRequests.filter(r => r.status === 'pending'),
        [passwordResetRequests],
    );

    const openCreate = () => {
        setCreateForm({ fullName: '', email: '', country: '', password: genPassword() });
        setCreatedAccount(null);
        setCreatedPassword('');
        setCreateCopied(false);
        setCreateOpen(true);
    };
    const createDelegate = async () => {
        if (!createForm.fullName.trim() || !createForm.email.trim()) { showToast('Please enter a name and email', 'error'); return; }
        if (createForm.password.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
        setCreating(true);
        try {
            const row = await send('POST', '/api/accounts', {
                fullName: createForm.fullName.trim(),
                email: createForm.email.trim(),
                country: createForm.country.trim() || undefined,
                password: createForm.password,
            });
            setAccounts(prev => [row, ...prev]);
            setCreatedAccount(row);
            setCreatedPassword(createForm.password);
            showToast('Delegate account created', 'success');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not create delegate account', 'error');
        } finally {
            setCreating(false);
        }
    };
    const copyCreatedCredentials = async () => {
        if (!createdAccount) return;
        const text = `Email: ${createdAccount.email}\nPassword: ${createdPassword}`;
        try { await navigator.clipboard.writeText(text); setCreateCopied(true); setTimeout(() => setCreateCopied(false), 1800); } catch { /* ignore */ }
    };

    /* ── Reset-password modal ── */
    const [resetTarget, setResetTarget] = useState<ResetTarget | null>(null);
    const [newPass, setNewPass] = useState('');
    const [resetting, setResetting] = useState(false);
    const [resetAction, setResetAction] = useState<'set' | 'email' | null>(null);
    const [resetDone, setResetDone] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [resetEmailError, setResetEmailError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const openReset = (t: ResetTarget) => {
        setResetTarget(t); setNewPass(genPassword()); setResetDone(false); setResetEmailSent(false); setResetEmailError(null); setCopied(false);
    };
    const confirmReset = async (emailCredentials = false) => {
        if (!resetTarget || newPass.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
        setResetting(true);
        setResetAction(emailCredentials ? 'email' : 'set');
        try {
            let result: { credentialEmailSent?: boolean; credentialEmailError?: string | null } | null = null;
            if (resetTarget.kind === 'account') {
                const updated = await send('PATCH', `/api/accounts/${resetTarget.id}`, { action: 'resetPassword', newPassword: newPass, emailCredentials });
                result = updated;
                setAccounts(prev => prev.map(a => a.id === resetTarget.id ? { ...a, ...updated } : a));
            } else {
                if (!resetTarget.userId) { showToast('No account matches this email. Dismiss the request instead.', 'error'); setResetting(false); setResetAction(null); return; }
                result = await send('PATCH', `/api/password-reset/${resetTarget.id}`, { action: 'resolve', newPassword: newPass, emailCredentials });
                refreshAccountsData();
                setAccounts(prev => prev.map(a => a.id === resetTarget.userId ? { ...a, accessReviewRequired: false, loginLockUntil: null } : a));
            }
            setResetEmailSent(Boolean(result?.credentialEmailSent));
            setResetEmailError(result?.credentialEmailError ?? null);
            setResetDone(true);
            if (emailCredentials) {
                showToast(result?.credentialEmailError ? 'Password reset, but email could not be sent' : 'Password reset and credentials emailed', result?.credentialEmailError ? 'warning' : 'success');
            } else {
                showToast('Password reset', 'success');
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not reset password', 'error');
        } finally {
            setResetting(false);
            setResetAction(null);
        }
    };
    const copyPass = async () => {
        try { await navigator.clipboard.writeText(newPass); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
    };

    /* ── Edit-email modal ── */
    const [emailTarget, setEmailTarget] = useState<DelegateAccount | null>(null);
    const [emailValue, setEmailValue] = useState('');
    const [emailSaving, setEmailSaving] = useState(false);
    const openEmail = (a: DelegateAccount) => { setEmailTarget(a); setEmailValue(a.email); };
    const saveEmail = async () => {
        if (!emailTarget) return;
        setEmailSaving(true);
        try {
            const updated = await send('PATCH', `/api/accounts/${emailTarget.id}`, { action: 'updateEmail', email: emailValue.trim() });
            setAccounts(prev => prev.map(a => a.id === emailTarget.id ? { ...a, ...updated } : a));
            showToast('Login email updated', 'success');
            setEmailTarget(null);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not update email', 'error');
        } finally {
            setEmailSaving(false);
        }
    };

    /* ── Suspend/restore modal ── */
    const [statusTarget, setStatusTarget] = useState<{ id: string; name: string; suspend: boolean } | null>(null);
    const [statusSaving, setStatusSaving] = useState(false);
    const confirmStatus = async () => {
        if (!statusTarget) return;
        setStatusSaving(true);
        try {
            await send('PATCH', `/api/accounts/${statusTarget.id}`, { action: 'setStatus', status: statusTarget.suspend ? 'inactive' : 'active' });
            setAccounts(prev => prev.map(a => a.id === statusTarget.id ? { ...a, status: statusTarget.suspend ? 'inactive' : 'active' } : a));
            showToast(statusTarget.suspend ? `${statusTarget.name} has been suspended.` : `${statusTarget.name}'s access has been restored.`, statusTarget.suspend ? 'warning' : 'success');
            setStatusTarget(null);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not update access', 'error');
        } finally {
            setStatusSaving(false);
        }
    };

    /* ── Dismiss a reset request ── */
    const dismissRequest = async (id: number) => {
        try {
            await send('PATCH', `/api/password-reset/${id}`, { action: 'dismiss' });
            refreshAccountsData();
            showToast('Request dismissed', 'info');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not dismiss request', 'error');
        }
    };

    const filtered = accounts.filter(a =>
        [a.fullName, a.email, a.country ?? ''].some(v => v.toLowerCase().includes(search.toLowerCase())),
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 2 }}>
                    Accounts
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Manage delegate logins — reset passwords, change emails, and suspend access.</p>
                </div>
                <button onClick={openCreate}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 9, border: 'none', background: C.accent, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 16px ${C.accent}30` }}>
                    <UserPlus size={16} /> Create Account
                </button>
            </div>

            {/* ── Password reset requests ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${C.pink}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <KeyRound size={15} style={{ color: C.pink }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Password Reset Requests</h3>
                    {pendingRequests.length > 0 && (
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: `${C.pink}14`, color: C.pink }}>
                            {pendingRequests.length} pending
                        </span>
                    )}
                </div>

                {pendingRequests.length === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                        <Clock size={24} style={{ color: C.border, margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 13, color: C.textMuted }}>No pending requests. New ones appear here the moment a delegate submits the forgot-password form.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {pendingRequests.map((r, idx) => (
                            <div key={r.id}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '14px 20px', borderBottom: idx < pendingRequests.length - 1 ? `1px solid ${C.border}` : 'none', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                    <Avatar name={r.delegateName || r.email} />
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.delegateName || 'Unknown delegate'}</p>
                                            {!r.userId && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: `${C.amber}16`, color: C.amber }}>
                                                    <AlertTriangle size={10} /> No match
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 12, color: C.textSec, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Mail size={11} /> {r.email}</span>
                                            <span style={{ fontSize: 12, color: C.textSec, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {r.phone}</span>
                                            <span style={{ fontSize: 11.5, color: C.textMuted }}>{r.createdAt}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <button onClick={() => openReset({ kind: 'request', id: r.id, userId: r.userId, name: r.delegateName || r.email, email: r.email })}
                                        disabled={!r.userId}
                                        title={r.userId ? 'Generate a new password' : 'No matching account — dismiss instead'}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: r.userId ? C.accent : C.bg, color: r.userId ? '#fff' : C.textMuted, fontSize: 12.5, fontWeight: 600, cursor: r.userId ? 'pointer' : 'not-allowed' }}>
                                        <KeyRound size={13} /> Reset password
                                    </button>
                                    <button onClick={() => dismissRequest(r.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                                        <X size={13} /> Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Delegate accounts ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Delegate Accounts</h3>
                    <div className="flex w-full sm:w-auto items-center gap-2">
                        <button onClick={openCreate} title="Create delegate account"
                            className="h-9 w-9 rounded-lg flex items-center justify-center"
                            style={{ border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
                            <UserPlus size={15} />
                        </button>
                        <div className="relative w-full sm:w-64">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                        <input type="text" placeholder="Search name or email…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border}
                        />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 44, color: C.textMuted, gap: 8 }}>
                        <Loader2 size={16} className="animate-spin" /> <span style={{ fontSize: 13 }}>Loading accounts…</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#FAFBFC' }}>
                                    {['User', 'Status', 'Joined', 'Actions'].map((h, i) => (
                                        <th key={h} style={{ padding: '10px 20px', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: i === 3 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: '44px 20px', textAlign: 'center' }}>
                                        <p style={{ fontSize: 14, color: C.textMuted }}>{accounts.length === 0 ? 'No delegate accounts yet.' : 'No accounts match your search.'}</p>
                                    </td></tr>
                                ) : filtered.map((a, idx) => (
                                    <tr key={a.id}
                                        style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                        <td style={{ padding: '13px 20px' }}>
                                            <div className="flex items-center gap-3">
                                                <Avatar name={a.fullName} suspended={a.status === 'inactive'} />
                                                <div>
                                                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{a.fullName}</p>
                                                    <p style={{ fontSize: 12, color: C.textMuted }}>{a.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '13px 20px' }}>
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                padding: '3px 10px',
                                                borderRadius: 999,
                                                background: a.accessReviewRequired ? `${C.amber}16` : a.status === 'active' ? `${C.green}14` : `${C.red}12`,
                                                color: a.accessReviewRequired ? C.amber : a.status === 'active' ? C.green : C.red,
                                            }}>
                                                {a.accessReviewRequired ? 'Needs reset' : a.status === 'active' ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '13px 20px', fontSize: 13, color: C.textSec }}>
                                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                        </td>
                                        <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openReset({ kind: 'account', id: a.id, name: a.fullName, email: a.email })} title="Reset password"
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                                    style={{ color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.accent}12`; (e.currentTarget as HTMLElement).style.color = C.accent; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}>
                                                    <KeyRound size={15} />
                                                </button>
                                                <button onClick={() => openEmail(a)} title="Edit email"
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                                    style={{ color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.purple}12`; (e.currentTarget as HTMLElement).style.color = C.purple; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}>
                                                    <Mail size={15} />
                                                </button>
                                                {a.status === 'active' ? (
                                                    <button onClick={() => setStatusTarget({ id: a.id, name: a.fullName, suspend: true })} title="Suspend access"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                                        style={{ color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}>
                                                        <Ban size={15} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => setStatusTarget({ id: a.id, name: a.fullName, suspend: false })} title="Restore access"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                                        style={{ color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.green}12`; (e.currentTarget as HTMLElement).style.color = C.green; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}>
                                                        <ShieldCheck size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Reset-password modal ── */}
            {/* Create delegate modal */}
            {createOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(17,24,39,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget && !creating) setCreateOpen(false); }}>
                    <div style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 26 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserPlus size={18} style={{ color: C.accent }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{createdAccount ? 'Delegate account created' : 'Create delegate account'}</p>
                                    <p style={{ fontSize: 12.5, color: C.textMuted }}>Delegate can sign in at /login and enter the dashboard.</p>
                                </div>
                            </div>
                            <button onClick={() => !creating && setCreateOpen(false)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}><X size={18} /></button>
                        </div>

                        {!createdAccount ? (
                            <>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    <label style={{ display: 'block' }}>
                                        <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Full Name</span>
                                        <div style={{ position: 'relative' }}>
                                            <UserRound size={15} style={{ position: 'absolute', left: 12, top: 12, color: C.textMuted }} />
                                            <input type="text" value={createForm.fullName} onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
                                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    </label>
                                    <label style={{ display: 'block' }}>
                                        <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Email Address</span>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={15} style={{ position: 'absolute', left: 12, top: 12, color: C.textMuted }} />
                                            <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    </label>
                                    <label style={{ display: 'block' }}>
                                        <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Country</span>
                                        <div style={{ position: 'relative' }}>
                                            <Globe2 size={15} style={{ position: 'absolute', left: 12, top: 12, color: C.textMuted }} />
                                            <input type="text" value={createForm.country} onChange={e => setCreateForm(f => ({ ...f, country: e.target.value }))}
                                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    </label>
                                    <label style={{ display: 'block' }}>
                                        <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Temporary Password</span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input type="text" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                                                style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: 'none', fontFamily: 'monospace', letterSpacing: '0.04em' }} />
                                            <button onClick={() => setCreateForm(f => ({ ...f, password: genPassword() }))} title="Generate password"
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                                                <RefreshCw size={13} />
                                            </button>
                                        </div>
                                    </label>
                                </div>
                                <p style={{ fontSize: 12, color: C.textMuted, marginTop: 10, marginBottom: 20, lineHeight: 1.5 }}>Use at least 8 characters. Share this temporary password with the delegate after creation.</p>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    <button onClick={() => setCreateOpen(false)} disabled={creating}
                                        style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={createDelegate} disabled={creating}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: creating ? 'default' : 'pointer', opacity: creating ? 0.7 : 1 }}>
                                        {creating ? <><Loader2 size={14} className="animate-spin" /> Creating</> : <><UserPlus size={14} /> Create Account</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ background: `${C.green}0E`, border: `1px solid ${C.green}33`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                                    <p style={{ fontSize: 12, color: C.textSec, marginBottom: 8 }}>Share these login details with <strong style={{ color: C.text }}>{createdAccount.fullName}</strong>:</p>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <code style={{ fontSize: 13, color: C.text, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px' }}>Email: {createdAccount.email}</code>
                                        <code style={{ fontSize: 13, color: C.text, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px' }}>Password: {createdPassword}</code>
                                    </div>
                                </div>
                                <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 20, lineHeight: 1.5 }}>The delegate can now log in and access the delegate dashboard. This password will not be shown again after you close this dialog.</p>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    <button onClick={copyCreatedCredentials}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: 'none', background: createCopied ? C.green : C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                        {createCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                                    </button>
                                    <button onClick={() => setCreateOpen(false)}
                                        style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Done</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {resetTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(17,24,39,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget && !resetting) setResetTarget(null); }}>
                    <div style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 26 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <KeyRound size={18} style={{ color: C.accent }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{resetDone ? 'Password updated' : 'Reset password'}</p>
                                    <p style={{ fontSize: 12.5, color: C.textMuted }}>{resetTarget.name} · {resetTarget.email}</p>
                                </div>
                            </div>
                            <button onClick={() => !resetting && setResetTarget(null)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}><X size={18} /></button>
                        </div>

                        {!resetDone ? (
                            <>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>New Password</label>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                    <input type="text" value={newPass} onChange={e => setNewPass(e.target.value)}
                                        style={{ flex: 1, padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: 'none', fontFamily: 'monospace', letterSpacing: '0.04em' }}
                                        onFocus={e => e.target.style.borderColor = C.accent}
                                        onBlur={e => e.target.style.borderColor = C.border} />
                                    <button onClick={() => setNewPass(genPassword())} title="Generate new"
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                                        <RefreshCw size={13} />
                                    </button>
                                </div>
                                <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
                                    Generate or type a password, then either copy it manually or email the full credentials to the delegate.
                                </p>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button onClick={() => setResetTarget(null)} disabled={resetting}
                                        style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={() => confirmReset(false)} disabled={resetting}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: resetting ? 'default' : 'pointer', opacity: resetting ? 0.7 : 1 }}>
                                        {resetAction === 'set' ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                                        {resetAction === 'set' ? 'Setting...' : 'Set only'}
                                    </button>
                                    <button onClick={() => confirmReset(true)} disabled={resetting}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: resetting ? 'default' : 'pointer', opacity: resetting ? 0.7 : 1 }}>
                                        {resetAction === 'email' ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                        {resetAction === 'email' ? 'Sending...' : 'Set & email credentials'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ background: `${C.green}0E`, border: `1px solid ${C.green}33`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                                    <p style={{ fontSize: 12, color: C.textSec, marginBottom: 8 }}>
                                        {resetEmailSent ? 'These credentials were emailed to' : 'Share these login details with'} <strong style={{ color: C.text }}>{resetTarget.name}</strong>:
                                    </p>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <code style={{ fontSize: 13, color: C.text, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px' }}>Full name: {resetTarget.name}</code>
                                        <code style={{ fontSize: 13, color: C.text, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px' }}>Email: {resetTarget.email}</code>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <code style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: C.text, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', letterSpacing: '0.05em', overflowWrap: 'anywhere' }}>Password: {newPass}</code>
                                        <button onClick={copyPass}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 13px', borderRadius: 8, border: 'none', background: copied ? C.green : C.accent, color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                                            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                                        </button>
                                        </div>
                                    </div>
                                </div>
                                {resetEmailError && (
                                    <div style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: '11px 13px', marginBottom: 14, color: C.amber, fontSize: 12.5, lineHeight: 1.45 }}>
                                        Password was reset, but the email could not be sent: {resetEmailError}
                                    </div>
                                )}
                                <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
                                    For security, this password won&apos;t be shown again after you close this dialog.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setResetTarget(null)}
                                        style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Done</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Edit-email modal ── */}
            {emailTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(17,24,39,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget && !emailSaving) setEmailTarget(null); }}>
                    <div style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 26 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${C.purple}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Mail size={18} style={{ color: C.purple }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Change login email</p>
                                    <p style={{ fontSize: 12.5, color: C.textMuted }}>{emailTarget.fullName}</p>
                                </div>
                            </div>
                            <button onClick={() => !emailSaving && setEmailTarget(null)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}><X size={18} /></button>
                        </div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Email Address</label>
                        <input type="email" value={emailValue} onChange={e => setEmailValue(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 20 }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setEmailTarget(null)} disabled={emailSaving}
                                style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={saveEmail} disabled={emailSaving}
                                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.purple, color: '#fff', fontSize: 13, fontWeight: 600, cursor: emailSaving ? 'default' : 'pointer', opacity: emailSaving ? 0.7 : 1 }}>
                                {emailSaving ? 'Saving…' : 'Save email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Suspend/restore modal ── */}
            {statusTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(17,24,39,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget && !statusSaving) setStatusTarget(null); }}>
                    <div style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 26 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: statusTarget.suspend ? `${C.red}12` : `${C.green}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {statusTarget.suspend ? <UserX size={20} style={{ color: C.red }} /> : <ShieldCheck size={20} style={{ color: C.green }} />}
                            </div>
                            <button onClick={() => !statusSaving && setStatusTarget(null)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                            {statusTarget.suspend ? `Suspend ${statusTarget.name}?` : `Restore access for ${statusTarget.name}?`}
                        </p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55, marginBottom: 22 }}>
                            {statusTarget.suspend
                                ? 'They will be immediately logged out and blocked from logging back in or using any part of the platform until you restore their access.'
                                : 'They will be able to log in and use the platform again immediately.'}
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setStatusTarget(null)} disabled={statusSaving}
                                style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmStatus} disabled={statusSaving}
                                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: statusTarget.suspend ? C.red : C.green, color: '#fff', fontSize: 13, fontWeight: 600, cursor: statusSaving ? 'default' : 'pointer', opacity: statusSaving ? 0.7 : 1 }}>
                                {statusSaving ? 'Saving…' : statusTarget.suspend ? 'Suspend Access' : 'Restore Access'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
