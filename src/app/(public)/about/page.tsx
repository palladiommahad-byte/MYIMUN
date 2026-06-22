'use client';

import React, { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { Target, Users, Globe, Award } from "lucide-react";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { PageHeader } from "@/components/ui/PageHeader";

const Counter = ({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { damping: 40, stiffness: 60 });

    useEffect(() => {
        if (isInView) motionValue.set(value);
    }, [isInView, value, motionValue]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) ref.current.textContent = `${prefix}${Math.floor(latest).toLocaleString()}${suffix}`;
        });
    }, [springValue, prefix, suffix]);

    return <div ref={ref} className="text-4xl font-extrabold text-white mb-1">0</div>;
};

export default function AboutPage() {
    const stats = [
        { label: "Delegates", value: 5000, suffix: "+", icon: Users, color: "bg-blue-500/20 text-blue-400" },
        { label: "Countries", value: 120, suffix: "+", icon: Globe, color: "bg-emerald-500/20 text-emerald-400" },
        { label: "Committees", value: 45, suffix: "", icon: Target, color: "bg-purple-500/20 text-purple-400" },
        { label: "Awards", value: 10, prefix: "$", suffix: "k", icon: Award, color: "bg-orange-500/20 text-orange-400" },
    ];

    return (
        <main className="min-h-screen bg-transparent text-slate-200 pb-20 overflow-hidden">
            <PageHeader
                title="About MYIMUN"
                subtitle="Forging the Next Generation. MYIMUN isn't just a conference; it's a crucible for leadership."
                image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80"
                height="h-[50vh]"
            />

            <div className="max-w-7xl mx-auto px-6 mt-16">

                {/* Stats */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-32">
                    {stats.map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                            <div className="sphere-card text-center py-8 px-4">
                                <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                                    <stat.icon size={24} />
                                </div>
                                <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                                <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* Team */}
                <section>
                    <div className="text-center mb-12">
                        <SectionBadge>Leadership</SectionBadge>
                        <h2 className="text-3xl md:text-5xl font-extrabold mt-6 mb-4 tracking-tight">Meet the Secretariat</h2>
                        <p className="text-slate-500">The minds behind the simulation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Sarah Jenkins", role: "Secretary General", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
                            { name: "David Chen", role: "Director General", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" },
                            { name: "Amira Koury", role: "USG of Logistics", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400" },
                        ].map((member, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                                <div className="sphere-card overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-500">
                                    <div className="h-64 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60 z-10" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />

                                        {/* Social Icons Overlay (Example) */}
                                        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-3 translate-y-10 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100 delay-100">
                                            {/* Mock social icons, could use actual icons */}
                                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 cursor-pointer transition-colors">
                                                <Globe size={14} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                            <Award size={40} className="text-blue-500 rotate-12" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{member.name}</h3>
                                        <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mt-1">{member.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
