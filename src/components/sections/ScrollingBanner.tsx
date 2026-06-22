'use client';

import { useRef } from "react";
import {
    motion,
    useScroll,
    useSpring,
    useTransform,
    useMotionValue,
    useVelocity,
    useAnimationFrame
} from "framer-motion";
import { wrap } from "@motionone/utils";

interface ParallaxProps {
    children: React.ReactNode;
    baseVelocity: number;
}

function ParallaxText({ children, baseVelocity = 100 }: ParallaxProps) {
    const baseX = useMotionValue(0);
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 400
    });
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
        clamp: false
    });

    /**
     * This is a magic wrapping for the length of the text - you
     * have to replace for wrapping that works for you or dynamically
     * calculate
     */
    const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

    const directionFactor = useRef<number>(1);
    useAnimationFrame((t, delta) => {
        let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

        /**
         * This is what changes the direction of the scroll once we
         * switch scrolling directions.
         */
        if (velocityFactor.get() < 0) {
            directionFactor.current = -1;
        } else if (velocityFactor.get() > 0) {
            directionFactor.current = 1;
        }

        moveBy += directionFactor.current * moveBy * velocityFactor.get();

        baseX.set(baseX.get() + moveBy);
    });

    /**
     * The number of times to repeat the child text should be dynamically calculated
     * based on the size of the text and viewport. Element duplication methods
     * is strictly for ensuring there is no gap.
     */
    return (
        <div className="flex flex-nowrap overflow-hidden whitespace-nowrap">
            <motion.div className="flex flex-nowrap items-center gap-8 pr-8" style={{ x }}>
                {children}
                {children}
                {children}
                {children}
            </motion.div>
        </div>
    );
}

export function ScrollingBanner() {
    return (
        <section className="bg-white py-4 border-y border-white/10 relative z-20 overflow-hidden">
            <ParallaxText baseVelocity={-2}>
                <BannerContent />
            </ParallaxText>
        </section>
    );
}

function BannerContent() {
    return (
        <div className="flex items-center gap-8">
            <span className="text-slate-900 font-bold text-sm md:text-base uppercase tracking-widest">Registration Open 2024</span>
            <span className="text-blue-600 font-bold">•</span>
            <span className="text-slate-900 font-bold text-sm md:text-base uppercase tracking-widest">Shape The World</span>
            <span className="text-blue-600 font-bold">•</span>
            <span className="text-slate-900 font-bold text-sm md:text-base uppercase tracking-widest">Join The Legacy</span>
            <span className="text-blue-600 font-bold">•</span>
            <span className="text-slate-900 font-bold text-sm md:text-base uppercase tracking-widest">Royal Model United Nations</span>
            <span className="text-blue-600 font-bold">•</span>
        </div>
    );
}
