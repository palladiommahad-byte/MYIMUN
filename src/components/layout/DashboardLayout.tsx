'use client';

import React, { ReactNode, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
    LayoutDashboard, FileText, Users, LogOut,
    User, CreditCard, Calendar, MessageSquare, Menu, X, Phone, ClipboardList, Star
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationProgress } from '@/components/NavigationProgress';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const NAV_ITEMS = [
    { label: 'Overview',        icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Events',          icon: Star,            path: '/dashboard/events' },
    { label: 'Registration',    icon: ClipboardList,   path: '/dashboard/registration' },
    { label: 'Position Papers', icon: FileText,        path: '/dashboard/papers' },
    { label: 'My Committee',    icon: Users,           path: '/dashboard/committee' },
    { label: 'Profile',         icon: User,            path: '/dashboard/profile' },
    { label: 'Payments',        icon: CreditCard,      path: '/dashboard/payments' },
    { label: 'Schedule',        icon: Calendar,        path: '/dashboard/schedule' },
    { label: 'Messages',        icon: MessageSquare,   path: '/dashboard/messages' },
    { label: 'Contact Support', icon: Phone,           path: '/dashboard/contact' },
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

    return (
        <div className="light-ui min-h-screen flex" style={{ background: S.bg, fontFamily: '"Inter", system-ui, sans-serif' }}>
            <NavigationProgress />

            {/* ── Mobile top bar ── */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
                style={{ background: '#FFFFFF', borderBottom: `1px solid ${S.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center">
                    <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN Logo" style={{ height: 30, width: 'auto', maxWidth: 160, objectFit: 'contain' }} />
                </div>
                <div className="flex items-center gap-1">
                    <NotificationBell />
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: S.textSec }}>
                        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(0,0,0,0.25)' }}
                    onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-transform duration-300
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
                style={{ width: 220, background: S.surface, borderRight: `1px solid ${S.border}` }}
            >
                {/* Logo */}
                <div className="flex items-center justify-center px-4 border-b flex-shrink-0" style={{ borderColor: S.border, height: 72 }}>
                    <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN Logo" style={{ height: 'auto', width: '100%', maxWidth: 190, objectFit: 'contain' }} />
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-0.5 px-3 pt-4 flex-1 overflow-y-auto">
                    {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
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
                                    <Icon size={15} style={{ flexShrink: 0, color: active ? S.accent : S.textMuted }} />
                                    {label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User card */}
                <div className="p-3 border-t flex-shrink-0" style={{ borderColor: S.border }}>
                    <div className="sidebar-nav-item flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                            style={{ background: 'linear-gradient(135deg,#3B7FFF,#7C5FFF)' }}>
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: S.text }}>{user?.name || 'Delegate'}</p>
                            <p className="text-xs truncate" style={{ color: S.textMuted }}>{user?.country || 'Unassigned'}</p>
                        </div>
                        <button onClick={handleLogout} title="Sign out"
                            className="p-1 rounded-md transition-colors"
                            style={{ color: S.textMuted }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.textMuted; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
            <main className="flex-1 pt-14 md:pt-0 min-w-0" style={{ width: '100%' }}>
                <div className="md:ml-[220px]" style={{ minHeight: '100vh', boxSizing: 'border-box' }}>
                    {/* Desktop top bar — just the notification bell for now */}
                    <div className="hidden md:flex items-center justify-end px-6"
                        style={{ height: 56, borderBottom: `1px solid ${S.border}`, background: S.surface, flexShrink: 0 }}>
                        <NotificationBell />
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
