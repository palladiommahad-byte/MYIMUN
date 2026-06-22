import React from 'react';
import { motion } from 'framer-motion';

import VantaClouds from "@/components/ui/VantaClouds";
import { ScrollingBanner } from "@/components/sections/ScrollingBanner";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    image?: string;
    height?: string;
}

export function PageHeader({
    title,
    subtitle,
    image = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2000&q=80",
    height = "h-[40vh]"
}: PageHeaderProps) {
    return (
        <>
            <section className={`relative ${height} min-h-[300px] flex items-center justify-center overflow-hidden w-full bg-[#0A0F1E]`}>
                {/* Background Image & Vanta */}
                <div className="absolute inset-0 z-0">
                    <VantaClouds className="w-full h-full absolute inset-0 opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#020617]/60 to-[#020617]" />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4 drop-shadow-2xl">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md font-medium">
                                {subtitle}
                            </p>
                        )}
                    </motion.div>
                </div>
            </section>
            <ScrollingBanner />
        </>
    );
}
