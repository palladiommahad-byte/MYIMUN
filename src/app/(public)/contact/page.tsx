'use client';

import React from "react";
import { Mail, MapPin, Phone, Send, ArrowUpRight } from "lucide-react";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-transparent text-slate-200 pb-20">
            <PageHeader
                title="Get in Touch"
                subtitle="Have questions about registration, committee allocations, or partnership opportunities?"
                image="https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&w=2000&q=80"
                height="h-[50vh]"
            />

            <div className="max-w-6xl mx-auto px-6 mt-16">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Contact Cards */}
                    <div className="space-y-4">
                        {[
                            { icon: Mail, label: 'Email Us', value: 'secretariat@munglobal.org', color: 'bg-blue-500/20 text-blue-400' },
                            { icon: Phone, label: 'Call Us', value: '+212 524 000 000', color: 'bg-emerald-500/20 text-emerald-400' },
                            { icon: MapPin, label: 'Visit Us', value: 'Palais des Congrès, Marrakech', color: 'bg-purple-500/20 text-purple-400' },
                        ].map((item, i) => (
                            <div key={i} className="sphere-card flex items-center gap-5 p-6 group cursor-pointer">
                                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center`}>
                                    <item.icon size={22} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                                    <div className="font-semibold text-white">{item.value}</div>
                                </div>
                                <ArrowUpRight size={18} className="text-slate-300 group-hover:text-[#0055FF] transition-colors" />
                            </div>
                        ))}
                    </div>

                    {/* Form */}
                    <div className="sphere-card p-8 md:p-10">
                        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">First Name</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500 font-medium text-white" placeholder="Jane" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Last Name</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500 font-medium text-white" placeholder="Doe" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Email Address</label>
                                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500 font-medium text-white" placeholder="jane@university.edu" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Subject</label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-white appearance-none">
                                    <option>General Inquiry</option>
                                    <option>Delegate Registration</option>
                                    <option>Partnership Proposal</option>
                                    <option>Technical Support</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Message</label>
                                <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500 resize-none font-medium text-white" placeholder="How can we help you?" />
                            </div>
                            <button className="w-full bg-[#0A0F1E] hover:bg-[#1a2340] text-white font-semibold py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10">
                                Send Message <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
