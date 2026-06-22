'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import GLOBE from 'vanta/dist/vanta.globe.min';

export default function VantaGlobe({ children, className }: { children?: React.ReactNode, className?: string }) {
    const vantaRef = useRef<HTMLDivElement>(null);
    const [vantaEffect, setVantaEffect] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (vantaRef.current) {
            observer.observe(vantaRef.current);
        }

        return () => {
            if (vantaRef.current) {
                observer.unobserve(vantaRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isVisible && !vantaEffect && vantaRef.current) {
            try {
                const effect = GLOBE({
                    el: vantaRef.current,
                    THREE: THREE,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    scaleMobile: 1.00,
                    color: 0x2c82fc,
                    backgroundColor: 0x181818
                });
                setVantaEffect(effect);
            } catch (error) {
                console.error("Vanta error:", error);
            }
        } else if (!isVisible && vantaEffect) {
            vantaEffect.destroy();
            setVantaEffect(null);
        }
    }, [isVisible, vantaEffect]);

    useEffect(() => {
        return () => {
            if (vantaEffect) vantaEffect.destroy();
        };
    }, [vantaEffect]);

    return (
        <div ref={vantaRef} className={`relative w-full h-full ${className}`}>
            <div className="relative z-10 w-full h-full pointer-events-none">
                <div className="pointer-events-auto h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
