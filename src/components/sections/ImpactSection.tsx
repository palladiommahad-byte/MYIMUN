'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Globe, Users, Layers, TrendingUp, Calendar, ArrowRight, ShieldCheck, PieChart } from 'lucide-react';

export function ImpactSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Our Impact <span className="text-blue-500">By The Numbers</span>
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                            Tracking our growth and global footprint in real-time.
                        </p>
                    </motion.div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">

                    {/* Card 1: Applicant Growth (Chart) - Spans 2 cols */}
                    <div className="md:col-span-2 p-8 rounded-[2rem] bg-slate-50 border border-slate-200 relative overflow-hidden group hover:border-blue-500/20 transition-colors">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-start gap-4 mb-8">
                                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Applicant Growth</h3>
                                    <p className="text-slate-500 text-sm">Target: 500+ Qualified Delegates</p>
                                </div>
                            </div>

                            {/* Main Stat */}
                            <div className="mb-6">
                                <div className="text-4xl font-bold text-blue-600">350+</div>
                                <div className="text-sm text-emerald-600 flex items-center gap-1 mt-1">
                                    <TrendingUp size={14} />
                                    <span>+12.5% this week</span>
                                </div>
                            </div>

                            {/* Chart Visual */}
                            <div className="mt-auto h-48 w-full relative">
                                <DashboardChart />

                                {/* Floating Tooltip */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                    className="absolute top-[30%] left-[60%] bg-white border border-slate-200 p-3 rounded-lg shadow-xl shadow-blue-900/5 z-20 backdrop-blur-md"
                                >
                                    <div className="text-xs text-slate-500 mb-1">Feb 17</div>
                                    <div className="text-sm font-bold text-slate-900 flex gap-2">
                                        42 Applications
                                        <span className="text-emerald-600 text-xs self-end">+8%</span>
                                    </div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white border-r border-b border-slate-200 rotate-45" />
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75" />
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full" />
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: 100% Satisfaction (Circle) */}
                    <div className="md:col-span-1 p-8 rounded-[2rem] bg-slate-50 border border-slate-200 relative overflow-hidden group hover:border-blue-500/20 transition-colors flex flex-col items-center justify-center">
                        <div className="w-full mb-6 flex items-center gap-3">
                            <ShieldCheck className="text-slate-400" size={20} />
                            <span className="text-slate-900 font-semibold">Delegate Satisfaction</span>
                        </div>

                        <div className="relative w-48 h-48 flex items-center justify-center">
                            {/* Outer Ring */}
                            <div className="absolute inset-0 rounded-full border-[12px] border-slate-200" />

                            {/* Progress Ring */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <motion.circle
                                    cx="96" cy="96" r="82"
                                    stroke="url(#blue-gradient)"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 0.98 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    viewport={{ once: true }}
                                    className="drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                />
                                <defs>
                                    <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#60A5FA" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Inner Content */}
                            <div className="text-center z-10">
                                <div className="text-4xl font-bold text-slate-900">98%</div>
                                <div className="text-xs text-slate-500 mt-1">Satisfaction Rate</div>
                            </div>

                            {/* Floating Coins/Badges */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-4 -right-2 p-2 bg-white rounded-full border border-slate-200 shadow-lg"
                            >
                                <Users size={16} className="text-blue-600" />
                            </motion.div>
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute bottom-4 -left-2 p-2 bg-white rounded-full border border-slate-200 shadow-lg"
                            >
                                <Globe size={16} className="text-purple-600" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Card 3: Global Reach (List Style) */}
                    <div className="md:col-span-1 p-8 rounded-[2rem] bg-slate-50 border border-slate-200 relative overflow-hidden group hover:border-blue-500/20 transition-colors">
                        <div className="flex items-center gap-3 mb-8">
                            <Calendar className="text-blue-600" size={24} />
                            <h3 className="text-xl font-bold text-slate-900">Global Reach</h3>
                        </div>

                        {/* Floating List UI */}
                        <div className="space-y-4 relative">
                            {[
                                { label: "Istanbul", count: "120 Delegates", status: "Completed", color: "text-emerald-600", bg: "bg-emerald-100" },
                                { label: "London", count: "80 Delegates", status: "Completed", color: "text-emerald-600", bg: "bg-emerald-100" },
                                { label: "Marrakech", count: "350+ Targeted", status: "Upcoming", color: "text-blue-600", bg: "bg-blue-100" }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.2 }}
                                    viewport={{ once: true }}
                                    className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between group/item hover:border-blue-500/30 transition-colors"
                                >
                                    <div>
                                        <div className="text-slate-900 font-medium text-sm">{item.label}</div>
                                        <div className="text-xs text-slate-500">{item.count}</div>
                                    </div>
                                    <div className={`text-xs font-bold ${item.color} ${item.bg} px-2 py-1 rounded-lg`}>
                                        {item.status}
                                    </div>
                                </motion.div>
                            ))}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 pointer-events-none" />
                        </div>
                    </div>

                    {/* Card 4: Academic Committees (Grid/Visual) */}
                    <div className="md:col-span-2 p-8 rounded-[2rem] bg-slate-50 border border-slate-200 relative overflow-hidden group hover:border-blue-500/20 transition-colors">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <Layers size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Diverse Committees</h3>
                                </div>
                                <h4 className="text-3xl font-bold text-slate-900 mb-2">5+ Committees</h4>
                                <p className="text-slate-600 text-sm mb-6 max-w-sm">From intense Crisis cabinets to large-scale General Assemblies. Simulate the real UN experience.</p>

                                <div className="flex gap-4">
                                    <div className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                                        Crisis
                                    </div>
                                    <div className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                                        General Assembly
                                    </div>
                                    <div className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                                        Specialized
                                    </div>
                                </div>
                            </div>

                            {/* Abstract Visual - Glowing Stack */}
                            <div className="relative w-full md:w-1/2 h-40 flex items-center justify-center">
                                <motion.div
                                    className="absolute w-40 h-24 bg-blue-600 rounded-xl shadow-2xl z-30 flex items-center justify-center border border-white/10"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <span className="font-bold text-white">ECOSOC</span>
                                </motion.div>
                                <motion.div
                                    className="absolute w-36 h-24 bg-indigo-600 rounded-xl shadow-2xl z-20 -translate-x-4 translate-y-4 opacity-80 flex items-center justify-center border border-white/10"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                >
                                </motion.div>
                                <motion.div
                                    className="absolute w-32 h-24 bg-purple-600 rounded-xl shadow-2xl z-10 -translate-x-8 translate-y-8 opacity-60 flex items-center justify-center border border-white/10"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                >
                                </motion.div>

                                {/* Glow */}
                                <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full z-0" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

function DashboardChart() {
    return (
        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 200" preserveAspectRatio="none">
            <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Grid */}
            <line x1="0" y1="50" x2="400" y2="50" stroke="#E2E8F0" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="400" y2="100" stroke="#E2E8F0" strokeDasharray="4 4" />
            <line x1="0" y1="150" x2="400" y2="150" stroke="#E2E8F0" strokeDasharray="4 4" />

            {/* Smooth Curve */}
            <motion.path
                d="M0,180 C40,170 80,160 120,130 C160,100 200,110 240,60 C280,10 320,40 360,30 L400,20 L400,200 L0,200 Z"
                fill="url(#chartFill)"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
            />
            <motion.path
                d="M0,180 C40,170 80,160 120,130 C160,100 200,110 240,60 C280,10 320,40 360,30 L400,20"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 0 10px rgba(59,130,246,0.6))" }}
            />
        </svg>
    );
}
