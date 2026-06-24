'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, ChevronDown, UserCircle } from "lucide-react";
import { useAuth } from '../../auth/AuthContext';
import { AuthModal } from '../auth/AuthModal';

const BLUE = '#2C74FF';
const CYAN = '#06BAD3';
const HEADING = '#0B1220';
const FONT = '"Outfit", -apple-system, sans-serif';

const NAV_LINKS = [
    { label: 'Home',    href: '/' },
    { label: 'About',   href: '/about', dropdown: true },
    { label: 'Contact', href: '/contact' },
];

export const Navbar: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
    const [scrolled, setScrolled] = useState(false);

    const { user, logout } = useAuth();
    const pathname = usePathname();

    // On the homepage, the nav floats transparent over the hero photo until scrolled.
    const isHome = pathname === '/';
    const transparent = isHome && !scrolled;

    useEffect(() => { document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset"; }, [isMobileMenuOpen]);
    useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);
    useEffect(() => {
        if (!isHome) { setScrolled(false); return; }
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isHome]);

    const openAuthModal = (mode: 'login' | 'register') => {
        setAuthModalMode(mode);
        setIsAuthModalOpen(true);
        setIsMobileMenuOpen(false);
    };

    const txt = transparent ? '#FFFFFF' : HEADING;

    return (
        <>
            <nav
                className="fixed top-0 left-0 w-full z-50"
                style={{
                    height: 80,
                    background: transparent ? 'transparent' : '#FFFFFF',
                    boxShadow: transparent ? 'none' : '0 2px 12px rgba(0,0,0,0.10)',
                    fontFamily: FONT,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background .25s, box-shadow .25s',
                }}
            >
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 64px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }} className="nav-inner">

                    {/* Logo */}
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <img
                            src={transparent ? '/assets/MYIMUN-LOGO-WHITE-.png' : '/assets/MYIMUN-BLUE-LOGO.png'}
                            alt="MYIMUN Logo"
                            style={{ height: 48, width: 'auto', maxWidth: 260, objectFit: 'contain', display: 'block' }}
                        />
                    </Link>

                    {/* Center nav links */}
                    <div className="hidden md:flex" style={{ alignItems: 'center', gap: 36 }}>
                        {NAV_LINKS.map(link => {
                            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                            return (
                                <Link key={link.label} href={link.href}
                                    style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 19, fontWeight: 500, textDecoration: 'none', color: isActive ? (transparent ? '#FFFFFF' : BLUE) : txt, paddingBottom: 6 }}
                                >
                                    {link.label}
                                    {link.dropdown && <ChevronDown size={12} />}
                                    {isActive && <span style={{ position: 'absolute', left: 0, bottom: 0, width: 36, height: 2, background: CYAN, borderRadius: 2 }} />}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right actions */}
                    <div className="hidden md:flex" style={{ alignItems: 'center', gap: 14 }}>
                        {!user ? (
                            <>
                                <button onClick={() => openAuthModal('login')}
                                    style={{ padding: '9px 20px', borderRadius: 9999, fontSize: 16, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${transparent ? 'rgba(255,255,255,0.55)' : '#E5E7EB'}`, background: 'transparent', color: txt, fontFamily: FONT }}>
                                    Log In
                                </button>
                                <button id="register-trigger" onClick={() => openAuthModal('register')}
                                    style={{ padding: '9px 22px', borderRadius: 9999, fontSize: 16, fontWeight: 600, cursor: 'pointer', border: 'none', background: BLUE, color: 'white', fontFamily: FONT }}>
                                    Register
                                </button>
                            </>
                        ) : (
                            <Link href={user.role === 'delegate' ? '/dashboard' : '/admin'} style={{ textDecoration: 'none' }}>
                                <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9999, fontSize: 18, fontWeight: 600, cursor: 'pointer', border: 'none', background: BLUE, color: 'white', fontFamily: FONT }}>
                                    <UserCircle size={15} /> Dashboard
                                </button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: txt, lineHeight: 0 }}>
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </nav>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authModalMode} />

            {/* Mobile menu drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ position: 'fixed', inset: 0, zIndex: 40, background: '#FFFFFF', display: 'flex', flexDirection: 'column', paddingTop: 80, fontFamily: FONT }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', marginTop: 8 }}>
                            {NAV_LINKS.map(link => (
                                <Link key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', fontSize: 21, fontWeight: 600, borderBottom: '1px solid #F3F4F6', color: HEADING, textDecoration: 'none' }}>
                                    {link.label}
                                    <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
                                </Link>
                            ))}
                        </div>
                        <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {!user ? (
                                <>
                                    <button onClick={() => openAuthModal('register')} style={{ width: '100%', padding: '14px 0', borderRadius: 9999, fontWeight: 700, fontSize: 19, border: 'none', background: BLUE, color: 'white', cursor: 'pointer', fontFamily: FONT }}>Register Now</button>
                                    <button onClick={() => openAuthModal('login')} style={{ width: '100%', padding: '14px 0', borderRadius: 9999, fontWeight: 600, fontSize: 19, border: '1px solid #E5E7EB', background: 'transparent', color: HEADING, cursor: 'pointer', fontFamily: FONT }}>Log In</button>
                                </>
                            ) : (
                                <>
                                    <Link href={user.role === 'delegate' ? '/dashboard' : '/admin'} onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
                                        <button style={{ width: '100%', padding: '14px 0', borderRadius: 9999, fontWeight: 700, fontSize: 19, border: 'none', background: BLUE, color: 'white', cursor: 'pointer', fontFamily: FONT }}>Dashboard</button>
                                    </Link>
                                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} style={{ width: '100%', padding: '14px 0', borderRadius: 9999, fontWeight: 600, fontSize: 19, border: '1px solid #E5E7EB', background: 'transparent', color: '#6B7280', cursor: 'pointer', fontFamily: FONT }}>Sign Out</button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
