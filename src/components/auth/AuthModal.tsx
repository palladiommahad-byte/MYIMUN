'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, AlertCircle, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth/AuthContext';
import { ADMIN_PAGES } from '@/lib/adminPages';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
}

type Mode = 'login' | 'register' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState<Mode>(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [forgotPhone, setForgotPhone] = useState('');
    const [forgotSent, setForgotSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, register } = useAuth();
    const router = useRouter();

    // Reset mode + fields when opening
    React.useEffect(() => {
        if (isOpen) { setMode(initialMode); setError(null); setForgotSent(false); }
    }, [isOpen, initialMode]);

    const switchMode = (m: Mode) => { setMode(m); setError(null); setForgotSent(false); };

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const res = await fetch('/api/password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), phone: forgotPhone.trim() }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Could not send your request');
            setForgotSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (mode === 'forgot') return handleForgot(e);
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const user = mode === 'register'
                ? await register(fullName.trim(), email.trim(), password)
                : await login(email.trim(), password);
            setFullName(''); setEmail(''); setPassword('');
            onClose();
            if (!['admin', 'secretary', 'manager'].includes(user.role)) {
                router.push('/dashboard');
            } else if (user.role === 'admin') {
                router.push('/admin');
            } else {
                const firstAllowed = ADMIN_PAGES.find(p => user.permissions?.includes(p.path));
                router.push(firstAllowed?.path ?? '/admin');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-[500px] p-6"
                    >
                        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0F1E]/90 backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                            {/* Decorative Gradients */}
                            <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none mix-blend-screen opacity-50" />
                            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none mix-blend-screen opacity-50" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all z-20"
                            >
                                <X size={20} />
                            </button>

                            <div className="relative z-10 px-8 py-10 md:px-10">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-extrabold text-white tracking-tight">
                                        {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join Next Gen' : 'Reset Password'}
                                    </h2>
                                    <p className="text-slate-400 mt-3 font-medium">
                                        {mode === 'login'
                                            ? 'Enter your credentials to access your account'
                                            : mode === 'register'
                                            ? 'Start your journey as a delegate today'
                                            : 'Send a reset request to the organizers'}
                                    </p>
                                </div>

                                {/* Tabs (hidden while resetting) */}
                                {mode !== 'forgot' && (
                                    <div className="flex p-1.5 mb-8 bg-black/40 rounded-2xl border border-white/5">
                                        <button
                                            onClick={() => switchMode('login')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'login'
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10'
                                                : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            Log In
                                        </button>
                                        <button
                                            onClick={() => switchMode('register')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'register'
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10'
                                                : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            Register
                                        </button>
                                    </div>
                                )}

                                {/* Forgot-password success */}
                                {mode === 'forgot' && forgotSent ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-5">
                                            <CheckCircle2 className="text-green-400" size={32} />
                                        </div>
                                        <p className="text-white font-bold text-lg mb-2">Request sent</p>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                            The organizers have received your password reset request. They&apos;ll verify your details and contact you with a new password using the phone or email you provided.
                                        </p>
                                        <button
                                            onClick={() => switchMode('login')}
                                            className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft size={18} /> Back to Login
                                        </button>
                                    </div>
                                ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {mode === 'register' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="John Doe"
                                                    required
                                                    value={fullName}
                                                    onChange={e => setFullName(e.target.value)}
                                                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white placeholder:text-slate-600"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                            <input
                                                type="email"
                                                placeholder="you@example.com"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white placeholder:text-slate-600"
                                            />
                                        </div>
                                    </div>

                                    {mode === 'forgot' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Phone Number</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                                <input
                                                    type="tel"
                                                    placeholder="+212 6 00 00 00 00"
                                                    required
                                                    value={forgotPhone}
                                                    onChange={e => setForgotPhone(e.target.value)}
                                                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white placeholder:text-slate-600"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 ml-1">We use these to verify it&apos;s really you before resetting.</p>
                                        </div>
                                    )}

                                    {mode !== 'forgot' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                                                {mode === 'login' && (
                                                    <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline">Forgot password?</button>
                                                )}
                                            </div>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                                <input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    required
                                                    minLength={mode === 'register' ? 6 : undefined}
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white placeholder:text-slate-600"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        disabled={isLoading}
                                        type="submit"
                                        className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl shadow-lg hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 text-base disabled:opacity-60"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {mode === 'login' ? 'Sign In to Account' : mode === 'register' ? 'Create Free Account' : 'Send Reset Request'}
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>

                                    {mode === 'forgot' && (
                                        <button type="button" onClick={() => switchMode('login')}
                                            className="w-full text-center text-sm font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5">
                                            <ArrowLeft size={15} /> Back to login
                                        </button>
                                    )}
                                </form>
                                )}

                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
