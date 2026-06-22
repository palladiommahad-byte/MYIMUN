'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AnnouncementSection() {
    return (
        <section className="relative py-24 overflow-hidden">


            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        viewport={{ once: true }}
                    >
                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-full mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-xs font-bold text-blue-300 tracking-wider uppercase">
                                Registration Closed. We'll be back soon.
                            </span>
                        </div>

                        {/* Heading */}
                        <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-8 font-sans">
                            MYIMUN Marrakech 2025 – <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                Official Event Announcement
                            </span>
                        </h2>

                        {/* Subtitle */}
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                            <div className="w-8 h-[2px] bg-blue-500 rounded-full" />
                            About the Conference
                        </h3>

                        {/* Body Text */}
                        <p className="text-slate-400 text-lg leading-relaxed mb-6">
                            We are thrilled to announce the next edition of the <span className="text-slate-200 font-medium">Moroccan Youth International Model United Nations</span> will take place in the vibrant city of <span className="text-white font-medium">Marrakech October 2025!</span>
                        </p>
                        <p className="text-slate-400 leading-relaxed mb-8">
                            Join passionate youth leaders, aspiring diplomats, and changemakers from around the world for four days of intense debate, cultural exchange, and unforgettable experiences.
                        </p>

                        {/* Feature Grid */}
                        <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8 mb-10">
                            {[
                                "Opening & Closing Ceremonies",
                                "Gala Night & Cultural Exchange",
                                "Public Speaking & Workshops",
                                "Guided Tour of Marrakech",
                                "International Committees",
                                "Diplomatic Dinner"
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                    <div className="p-1 rounded-full bg-white/5 group-hover:bg-blue-500/20 transition-colors">
                                        <ChevronRight size={16} className="text-blue-400" />
                                    </div>
                                    <span className="text-slate-300 text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Column: Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
                            {/* Glass Overlay/Glow on border */}
                            <div className="absolute inset-0 border border-white/10 rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-20" />

                            {/* Image */}
                            <div className="aspect-[4/5] relative bg-slate-800">
                                <img
                                    src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1200&q=80"
                                    alt="Conference Session"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                                {/* Inner Gradient Overlay for text readability (optional style) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent opacity-60" />

                                {/* Button Container - Always Visible, Bottom Center */}
                                <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-lg">
                                        <button
                                            className="px-8 py-3 bg-white rounded-full text-blue-900 font-bold flex items-center gap-2 shadow-sm hover:scale-105 transition-transform"
                                            onClick={() => document.getElementById('register-trigger')?.click()}
                                        >
                                            Register Now
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative floating element */}
                        <div className="absolute -bottom-10 -right-10 -z-10 w-full h-full bg-blue-500/5 rounded-[3rem] blur-xl" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
