'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface SphereCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    variant?: 'white' | 'blue' | 'gradient';
}

export const SphereCard: React.FC<SphereCardProps> = ({
    children,
    className = "",
    variant = 'white',
    ...props
}) => {
    const baseClasses = "rounded-3xl p-6 relative overflow-hidden transition-all duration-400";

    const variants = {
        white: "bg-white border border-slate-200 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_-8px_rgba(0,85,255,0.08)] hover:border-blue-200 text-slate-900",
        blue: "bg-gradient-to-br from-[#0055FF] via-[#3b7dff] to-[#6fa8ff] text-white shadow-xl shadow-blue-500/20 border border-white/10",
        gradient: "bg-gradient-to-br from-[#0055FF] via-[#2b6dff] to-[#00D1FF] text-white shadow-xl shadow-blue-500/25 border border-white/10",
    };

    return (
        <motion.div
            className={`${baseClasses} ${variants[variant]} ${className}`}
            {...props}
        >
            {(variant === 'blue' || variant === 'gradient') && (
                <>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/8 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                </>
            )}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
