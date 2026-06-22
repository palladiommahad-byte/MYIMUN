'use client';

import React from 'react';

interface SectionBadgeProps {
    children: React.ReactNode;
    className?: string;
}

export const SectionBadge: React.FC<SectionBadgeProps> = ({ children, className = '' }) => {
    return (
        <span className={`inline-flex items-center px-5 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm ${className}`}>
            {children}
        </span>
    );
};
