'use client';

import React from 'react';
import { Paperclip, Globe, ArrowUp } from 'lucide-react';

interface SphereInputProps {
    placeholder?: string;
    className?: string;
}

export const SphereInput: React.FC<SphereInputProps> = ({
    placeholder = 'Ask Anything',
    className = '',
}) => {
    return (
        <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
            <div className="relative rounded-3xl bg-slate-700/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 overflow-hidden">
                <div className="px-6 pt-5 pb-3">
                    <input
                        type="text"
                        placeholder={placeholder}
                        className="w-full bg-transparent text-white placeholder:text-slate-400 text-base focus:outline-none font-medium"
                    />
                </div>
                <div className="flex items-center justify-between px-4 pb-4">
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                            <Paperclip size={16} />
                        </button>
                        <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                            <Globe size={16} />
                        </button>
                    </div>
                    <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <ArrowUp size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
