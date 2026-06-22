'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function GlobalBackground() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020617]">
            {/* Deep Ambient Gradient - Blue/Cyan Tint */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617]" />

            {/* Central Glow (similar to Pricing section) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-cyan-500/10 to-blue-600/10 blur-[120px] rounded-full opacity-60 pointer-events-none" />

            {/* Moving 3D Blobs (adjusted colors) */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[150px]"
            />

            <motion.div
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.3, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[150px]"
            />

            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, 100, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
                className="absolute bottom-[-10%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-indigo-900/10 blur-[120px]"
            />

            {/* Glass Frosted Overlay */}
            <div className="absolute inset-0 backdrop-blur-[1px] bg-white/[0.01]" />

            {/* Mesh Grid Pattern (Subtle) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-20" />
        </div>
    );
}
