'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [width, setWidth] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const rafRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        // Each pathname change = navigation complete — play finish animation
        setVisible(true);
        setWidth(100);

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setVisible(false);
            setWidth(0);
        }, 300);

        return () => clearTimeout(timerRef.current);
    }, [pathname]);

    // Kick off the "loading" animation on mount (covers the in-progress phase)
    useEffect(() => {
        setWidth(30);
        rafRef.current = requestAnimationFrame(() => setWidth(80));
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    if (!visible && width === 0) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            height: 2, pointerEvents: 'none',
        }}>
            <div style={{
                height: '100%',
                width: `${width}%`,
                background: 'linear-gradient(90deg, #3B7FFF, #7C5FFF)',
                borderRadius: '0 2px 2px 0',
                boxShadow: '0 0 8px rgba(59,127,255,0.6)',
                opacity: visible ? 1 : 0,
                transitionProperty: 'width, opacity',
                transitionDuration: `${width === 100 ? 0.15 : 0.4}s, 0.3s`,
                transitionTimingFunction: 'ease',
            }} />
        </div>
    );
}
