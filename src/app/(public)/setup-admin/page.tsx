'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react';

export default function SetupAdminPage() {
    const { user, isLoading, refresh } = useAuth();
    const router = useRouter();
    const isCredentialChange = !!user?.mustChangeCredentials;
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [setupToken, setSetupToken] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!isLoading && user && !user.mustChangeCredentials) router.replace('/admin');
        if (user?.email) setEmail(user.email);
    }, [isLoading, router, user]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const res = await fetch('/api/auth/bootstrap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: fullName.trim() || undefined, email: email.trim(), password, confirmPassword, setupToken: setupToken.trim() || undefined }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Could not complete setup');
            await refresh();
            router.replace('/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not complete setup');
        } finally {
            setBusy(false);
        }
    };

    if (isLoading) return null;

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-10 mesh-gradient-hero">
            <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-2xl md:p-10">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300"><ShieldCheck size={32} /></div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white">{isCredentialChange ? 'Secure your admin account' : 'Create the first admin account'}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        {isCredentialChange ? 'Choose a new email address and password to continue.' : 'Use the private setup token configured on the server. This page is disabled after the first admin is created.'}
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {!isCredentialChange && <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Full name</span><div className="relative"><UserRound className="absolute left-4 top-3.5 text-slate-500" size={19} /><input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" /></div></label>}
                    <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{isCredentialChange ? 'New email address' : 'Admin email address'}</span><div className="relative"><Mail className="absolute left-4 top-3.5 text-slate-500" size={19} /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" /></div></label>
                    {!isCredentialChange && <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Initial setup token</span><div className="relative"><KeyRound className="absolute left-4 top-3.5 text-slate-500" size={19} /><input type="password" required value={setupToken} onChange={e => setSetupToken(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" /></div></label>}
                    <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{isCredentialChange ? 'New password' : 'Password'}</span><div className="relative"><Lock className="absolute left-4 top-3.5 text-slate-500" size={19} /><input type="password" required minLength={12} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" /></div><p className="text-xs text-slate-500">Use at least 12 characters.</p></label>
                    <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm password</span><div className="relative"><Lock className="absolute left-4 top-3.5 text-slate-500" size={19} /><input type="password" required minLength={12} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" /></div></label>
                    {error && <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"><AlertCircle size={16} />{error}</p>}
                    <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-60">{busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><CheckCircle2 size={18} /> {isCredentialChange ? 'Save and continue' : 'Create admin account'}</>}</button>
                </form>
            </section>
        </main>
    );
}
