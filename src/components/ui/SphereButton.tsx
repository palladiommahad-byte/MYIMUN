'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface SphereButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    showArrow?: boolean;
    children: React.ReactNode;
}

export const SphereButton: React.FC<SphereButtonProps> = ({
    variant = 'primary',
    size = 'md',
    showArrow = false,
    children,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 cursor-pointer select-none';

    const variants = {
        primary: 'bg-[#0A0F1E] text-white hover:bg-[#1a2340] shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5',
        secondary: 'bg-white/10 text-white border border-white/20 backdrop-blur-xl hover:bg-white/20 hover:-translate-y-0.5',
        accent: 'bg-gradient-to-r from-[#0055FF] to-[#00D1FF] text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    };

    const sizes = {
        sm: 'px-5 py-2 text-sm',
        md: 'px-7 py-3 text-sm',
        lg: 'px-9 py-4 text-base',
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
            {showArrow && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 ml-1">
                    <ArrowUpRight size={14} />
                </span>
            )}
        </button>
    );
};
