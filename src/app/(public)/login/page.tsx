'use client';

import React, { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const STAFF = ['admin', 'secretary', 'manager'];

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const user = await login(email.trim(), password);
            router.replace(STAFF.includes(user.role) ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            setBusy(false);
        }
    };

    const fillDemo = (e: string, p: string) => { setEmail(e); setPassword(p); setError(null); };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden mesh-gradient-hero">
            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/20 p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="text-center mb-8 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 mx-auto mb-6 shadow-lg shadow-blue-500/20">
                            <div className="w-full h-full bg-[#0A0F1E] rounded-2xl flex items-center justify-center">
                                <Globe className="text-white w-8 h-8" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
                        <p className="text-slate-400 mt-2 text-sm">Sign in to the MYIMUN Portal</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <AlertCircle size={16} className="shrink-0" /><span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit" disabled={busy}
                            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {busy ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 text-center">Demo accounts — click to fill</p>
                        <div className="flex gap-2.5">
                            <button type="button" onClick={() => fillDemo('admin@myimun.org', 'admin123')}
                                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all">
                                Admin
                            </button>
                            <button type="button" onClick={() => fillDemo('delegate@myimun.org', 'delegate123')}
                                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all">
                                Delegate
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-5 text-center">
                            New here?{' '}
                            <Link href="/" className="text-blue-400 hover:text-blue-300 font-semibold">Register on the home page</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
