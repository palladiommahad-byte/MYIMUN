'use client';

import React, { ReactNode, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
    LayoutDashboard, FileText, Users, LogOut,
    User, CreditCard, Calendar, MessageSquare, Menu, X, Phone, ClipboardList, Star, CircleUserRound, Mic
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationProgress } from '@/components/NavigationProgress';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { label: 'Overview',        icon: LayoutDashboard, path: '/dashboard',              color: '#3B82F6' },
    { label: 'Events',          icon: Star,            path: '/dashboard/events',       color: '#F59E0B' },
    { label: 'Registration',    icon: ClipboardList,   path: '/dashboard/registration', color: '#8B5CF6' },
    { label: 'Position Papers', icon: FileText,        path: '/dashboard/papers',       color: '#06B6D4' },
    { label: 'Opening Speech',  icon: Mic,             path: '/dashboard/opening-speech', color: '#8B5CF6' },
    { label: 'My Committee',    icon: Users,           path: '/dashboard/committee',    color: '#10B981' },
    { label: 'Profile',         icon: User,            path: '/dashboard/profile',      color: '#6366F1' },
    { label: 'Payments',        icon: CreditCard,      path: '/dashboard/payments',     color: '#14B8A6' },
    { label: 'Schedule',        icon: Calendar,        path: '/dashboard/schedule',     color: '#F97316' },
    { label: 'Messages',        icon: MessageSquare,   path: '/dashboard/messages',     color: '#EC4899' },
    { label: 'Contact Support', icon: Phone,           path: '/dashboard/contact',      color: '#0EA5E9' },
];

const S = {
    bg:          '#F4F5F7',
    surface:     '#FFFFFF',
    border:      '#E4E8EF',
    text:        '#111827',
    textSec:     '#6B7280',
    textMuted:   '#9CA3AF',
    accent:      '#3B7FFF',
    activeNavBg: 'rgba(59,127,255,0.08)',
    hoverNavBg:  'rgba(59,127,255,0.05)',
};

export const DashboardLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { logout, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => { logout(); router.push('/'); };
    const isActive = (path: string) =>
        path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(path);

    const initials = user?.country ? user.country.substring(0, 2).toUpperCase() : 'DE';
    const profileButton = (
        <button type="button" onClick={() => router.push('/dashboard/profile')} title="My profile" aria-label="Open my profile"
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${S.border}`, background: S.surface, color: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
            {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="My profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <CircleUserRound size={19} />}
        </button>
    );

    return (
        <div className="light-ui min-h-screen flex" style={{ background: S.bg, fontFamily: '"Inter", system-ui, sans-serif' }}>
            <NavigationProgress />

            {/* ── Mobile top bar ── */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 h-16"
                style={{ background: '#FFFFFF', borderBottom: `1px solid ${S.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="flex min-w-0 flex-1 items-center">
                    <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN Logo" style={{ width: 190, height: 40, maxWidth: 'calc(100vw - 112px)', objectFit: 'contain', objectPosition: 'left center' }} />
                </div>
                <div className="flex items-center gap-1">
                    <NotificationBell />
                    {profileButton}
                    <motion.button
                        type="button"
                        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={sidebarOpen}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        initial={false}
                        animate={{ rotate: sidebarOpen ? 180 : 0, scale: 1 }}
                        whileTap={{ scale: 0.82 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                        style={{ width: 38, height: 38, color: sidebarOpen ? S.accent : S.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </motion.button>
                </div>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(0,0,0,0.25)' }}
                    onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed left-0 top-16 bottom-0 z-40 flex flex-col transition-transform duration-300 md:top-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
                style={{ width: 220, background: S.surface, borderRight: `1px solid ${S.border}` }}
            >
                {/* Logo */}
                <div className="hidden md:flex items-center justify-center px-4 border-b flex-shrink-0" style={{ borderColor: S.border, height: 72 }}>
                    <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN Logo" style={{ height: 'auto', width: '100%', maxWidth: 190, objectFit: 'contain' }} />
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-0.5 px-3 pt-4 flex-1 overflow-y-auto">
                    {NAV_ITEMS.map(({ label, icon: Icon, path, color }) => {
                        const active = isActive(path);
                        return (
                            <Link key={path} href={path} onClick={() => setSidebarOpen(false)}>
                                <div className={`sidebar-nav-item flex items-center gap-2.5 h-9 rounded-lg${active ? ' sidebar-nav-item-active' : ''}`}
                                    style={{
                                        padding: '0 10px',
                                        background: active ? S.activeNavBg : undefined,
                                        color: active ? S.accent : S.textSec,
                                        fontWeight: active ? 600 : 400,
                                        fontSize: 13,
                                    }}
                                >
                                    <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color, background: `${color}${active ? '20' : '12'}` }}>
                                        <Icon size={14} />
                                    </span>
                                    {label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User card */}
                <div className="p-3 border-t flex-shrink-0" style={{ borderColor: S.border }}>
                    <div className="sidebar-nav-item flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white overflow-hidden"
                            style={{ background: 'linear-gradient(135deg,#3B7FFF,#7C5FFF)' }}>
                            {user?.avatarUrl
                                ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: S.text }}>{user?.name || 'Delegate'}</p>
                            <p className="text-xs truncate" style={{ color: S.textMuted }}>{user?.country || 'Unassigned'}</p>
                        </div>
                        <button onClick={handleLogout} title="Sign out"
                            className="p-1 rounded-md transition-colors"
                            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                        >
                            <LogOut size={13} />
                        </button>
                    </div>
                    <div className="flex items-center justify-center gap-3" style={{ marginTop: 6 }}>
                        <Link href="/dashboard/terms" className="hover:underline" style={{ fontSize: 11, color: S.textMuted }}>Terms</Link>
                        <span style={{ color: S.border }}>·</span>
                        <Link href="/dashboard/privacy" className="hover:underline" style={{ fontSize: 11, color: S.textMuted }}>Privacy</Link>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 pt-16 md:pt-0 min-w-0" style={{ width: '100%' }}>
                <div className="md:ml-[220px]" style={{ minHeight: '100vh', boxSizing: 'border-box' }}>
                    {/* Desktop top bar — just the notification bell for now */}
                    <div className="hidden md:flex items-center justify-end gap-2 px-6"
                        style={{ height: 56, borderBottom: `1px solid ${S.border}`, background: S.surface, flexShrink: 0 }}>
                        <NotificationBell />
                        {profileButton}
                    </div>
                    <div className="px-4 py-5 md:px-6 md:py-7" style={{ boxSizing: 'border-box' }}>
                        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
