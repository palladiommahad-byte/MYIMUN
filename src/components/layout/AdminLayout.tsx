'use client';

import React, { ReactNode, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
    LayoutDashboard, Users, Shield, FileText, CreditCard,
    Calendar, MessageSquare, Radio, Settings, LogOut, Menu, X,
    ClipboardList, Star, LayoutTemplate, BarChart2, Info,
    Image as ImageIcon, Zap, Award, Lock, KeyRound
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { NavigationProgress } from '@/components/NavigationProgress';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ADMIN_PAGES } from '@/lib/adminPages';

/* ── Landing-page section sub-nav items ── */
export const LANDING_SECTIONS = [
    { key: 'hero',         label: 'Hero',          icon: LayoutTemplate, color: '#3B7FFF' },
    { key: 'ticker',       label: 'Ticker Bar',    icon: Zap,            color: '#F59E0B' },
    { key: 'whoWeAre',     label: 'Who We Are',    icon: Info,           color: '#7C5FFF' },
    { key: 'partners',     label: 'Partners',      icon: Users,          color: '#10B981' },
    { key: 'announcement', label: 'Announcement',  icon: Calendar,       color: '#EF4444' },
    { key: 'getStarted',   label: 'Get Started',   icon: Star,           color: '#3B7FFF' },
    { key: 'gallery',      label: 'Gallery',       icon: ImageIcon,      color: '#EF4444' },
    { key: 'faq',          label: 'FAQ',           icon: MessageSquare,  color: '#10B981' },
    { key: 'footer',       label: 'Footer',        icon: Info,           color: '#F59E0B' },
] as const;

const NAV_ITEMS = [
    { label: 'Overview',        icon: LayoutDashboard, path: '/admin' },
    { label: 'Landing Page',    icon: LayoutTemplate,  path: '/admin/landing' },
    { label: 'Events',          icon: Star,            path: '/admin/events' },
    { label: 'Registrations',   icon: ClipboardList,   path: '/admin/registration' },
    { label: 'Delegates',       icon: Users,           path: '/admin/delegates' },
    { label: 'Accounts',        icon: KeyRound,        path: '/admin/accounts' },
    { label: 'Committees',      icon: Shield,          path: '/admin/committees' },
    { label: 'Position Papers', icon: FileText,        path: '/admin/papers' },
    { label: 'Certificates',    icon: Award,           path: '/admin/certificates' },
    { label: 'Payments',        icon: CreditCard,      path: '/admin/payments' },
    { label: 'Schedule',        icon: Calendar,        path: '/admin/schedule' },
    { label: 'Messages',        icon: MessageSquare,   path: '/admin/messages' },
    { label: 'Broadcasts',      icon: Radio,           path: '/admin/announcements' },
    { label: 'Settings',        icon: Settings,        path: '/admin/settings' },
];

const S = {
    sidebar:     { background: '#FFFFFF', borderRight: '1px solid #E4E8EF', width: 220 },
    bg:          '#F4F5F7',
    text:        '#111827',
    textSec:     '#6B7280',
    textMuted:   '#9CA3AF',
    border:      '#E4E8EF',
    accent:      '#3B7FFF',
    activeNavBg: 'rgba(59,127,255,0.08)',
};

/* ════════════════════════════════════════════════
   ADMIN LAYOUT
   ════════════════════════════════════════════════ */
export const AdminLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { logout, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => { logout(); router.push('/'); };
    const isActive = (path: string) =>
        path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);

    const isLandingPage = pathname.startsWith('/admin/landing');

    const isAdmin = user?.role === 'admin';
    const allowed = new Set(user?.permissions ?? []);
    const hasAccess = (path: string) => isAdmin || allowed.has(path);
    const visibleNavItems = NAV_ITEMS.filter(({ path }) => hasAccess(path));
    const currentPage = ADMIN_PAGES.find(p => p.path === '/admin' ? pathname === '/admin' : pathname.startsWith(p.path));
    const canViewCurrentPage = !currentPage || hasAccess(currentPage.path);
    const firstAllowedPage = ADMIN_PAGES.find(p => hasAccess(p.path));

    return (
        <div className="light-ui min-h-screen flex" style={{ background: S.bg, fontFamily: '"Inter", system-ui, sans-serif' }}>
            <NavigationProgress />

            {/* ── Mobile top bar ── */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
                style={{ background: '#FFFFFF', borderBottom: `1px solid ${S.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN Logo" style={{ height: 30, width: 'auto', maxWidth: 160, objectFit: 'contain' }} />
                <div className="flex items-center gap-1">
                    <NotificationBell />
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: S.textSec }}>
                        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(0,0,0,0.25)' }}
                    onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-transform duration-300
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
                style={{ ...S.sidebar, width: S.sidebar.width }}
            >
                {/* Logo */}
                <div className="flex items-center justify-center px-4 border-b" style={{ borderColor: S.border, height: 72, flexShrink: 0 }}>
                    <img src="/assets/MYIMUN-BLUE-LOGO.png" alt="MYIMUN Logo" style={{ height: 'auto', width: '100%', maxWidth: 190, objectFit: 'contain' }} />
                </div>

                {/* Nav */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
                    {visibleNavItems.map(({ label, icon: Icon, path }) => {
                        const active = isActive(path);

                        return (
                            <Link key={path} href={path} onClick={() => setSidebarOpen(false)} style={{ textDecoration: 'none' }}>
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
                                    <span style={{ flex: 1 }}>{label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User card */}
                <div style={{ padding: '10px', borderTop: `1px solid ${S.border}`, flexShrink: 0 }}>
                    <div className="sidebar-nav-item flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                            style={{ background: 'linear-gradient(135deg,#3B7FFF,#7C5FFF)' }}>
                            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: S.text }}>{user?.name || 'Admin'}</p>
                            <p className="text-xs truncate capitalize" style={{ color: S.textMuted }}>{user?.role || 'Administrator'}</p>
                        </div>
                        <button onClick={handleLogout} title="Sign out"
                            className="p-1 rounded-md transition-colors" style={{ color: S.textMuted }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.textMuted; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                            <LogOut size={13} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 pt-14 md:pt-0 min-w-0" style={{ width: '100%' }}>
                <div className="md:ml-[220px]" style={{ minHeight: '100vh' }}>
                    {/* Desktop top bar — just the notification bell for now */}
                    <div className="hidden md:flex items-center justify-end px-6"
                        style={{ height: 56, borderBottom: `1px solid ${S.border}`, background: '#FFFFFF', flexShrink: 0 }}>
                        <NotificationBell />
                    </div>
                    {!canViewCurrentPage ? (
                        <div className="px-4 py-5 md:px-7 md:py-8" style={{ boxSizing: 'border-box' }}>
                            <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '60vh', gap: 12 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Lock size={24} style={{ color: '#EF4444' }} />
                                </div>
                                <p style={{ fontSize: 17, fontWeight: 700, color: S.text }}>Access restricted</p>
                                <p style={{ fontSize: 13.5, color: S.textSec, maxWidth: 360 }}>
                                    Your account doesn&apos;t have permission to view this section. Contact an administrator if you need access.
                                </p>
                                {firstAllowedPage && (
                                    <button onClick={() => router.push(firstAllowedPage.path)}
                                        style={{ marginTop: 8, padding: '9px 18px', borderRadius: 10, border: 'none', background: S.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                        Go to {firstAllowedPage.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : isLandingPage ? (
                        /* Landing page editor: no padding, fills full width */
                        children
                    ) : (
                        /* All other admin pages: normal padded container */
                        <div className="px-4 py-5 md:px-7 md:py-8" style={{ boxSizing: 'border-box' }}>
                            <div style={{ maxWidth: 1140, margin: '0 auto' }}>
                                {children}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
