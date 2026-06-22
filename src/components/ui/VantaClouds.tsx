'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import CLOUDS from 'vanta/dist/vanta.clouds.min';

export default function VantaClouds({ children, className }: { children?: React.ReactNode, className?: string }) {
    const vantaRef = useRef<HTMLDivElement>(null);
    const [vantaEffect, setVantaEffect] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1 } // Trigger when 10% visible
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
                const effect = CLOUDS({
                    el: vantaRef.current,
                    THREE: THREE,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    skyColor: 0x6db3f2,
                    cloudColor: 0xadc1de,
                    cloudShadowColor: 0x183550,
                    sunColor: 0xff9919,
                    sunGlareColor: 0xff6633,
                    sunlightColor: 0xff9933,
                    speed: 1.5
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (vantaEffect) vantaEffect.destroy();
        }
    }, [vantaEffect]);

    return (
        <div ref={vantaRef} className={`relative w-full h-full ${className}`}>
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}
