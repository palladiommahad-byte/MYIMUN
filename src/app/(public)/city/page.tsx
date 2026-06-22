'use client';

import { motion } from "framer-motion";
import { MapPin, Calendar, Star, Coffee } from "lucide-react";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { PageHeader } from "@/components/ui/PageHeader";

export default function CityPage() {




    return (
        <div className="min-h-screen bg-transparent text-slate-200 overflow-hidden pb-32">
            <PageHeader
                title="MARRAKECH"
                subtitle="Where tradition meets modern diplomacy. Experience the Red City."
                image="https://images.unsplash.com/photo-1539650116455-8ef075638d77?q=80&w=3000&auto=format&fit=crop"
                height="h-[50vh]"
            />

            {/* Content */}
            <div className="relative z-20 mt-12 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-8 pt-10">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight text-white">The Royal Conference Center</h2>
                        <p className="text-lg text-slate-400 leading-relaxed mb-8">
                            Located in the heart of the Hivernage district, our venue offers state-of-the-art auditoriums equipped for high-stakes negotiation.
                            Delegates will enjoy high-speed connectivity, simultaneous translation services, and lush garden breakout rooms.
                        </p>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10"><Calendar size={22} /></div>
                                <div>
                                    <div className="font-bold text-white">Oct 12-14</div>
                                    <div className="text-sm text-slate-500 font-medium">2026</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/10"><Star size={22} /></div>
                                <div>
                                    <div className="font-bold text-white">5-Star</div>
                                    <div className="text-sm text-slate-500 font-medium">Hospitality</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="space-y-6">
                    <div className="sphere-card p-0 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-500 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&q=80&w=800"
                            alt="Conference Venue"
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="p-8 relative">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                <MapPin size={80} className="text-blue-500 -rotate-12" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">The Venue</h3>
                            <p className="text-slate-400 mb-6">Palais des Congrès, Marrakech</p>
                        </div>
                    </div>

                    <div className="sphere-card p-0 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-500 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="https://images.unsplash.com/photo-1560625699-703d9b673295?auto=format&fit=crop&q=80&w=800"
                            alt="Luxury Accommodation"
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="p-8 relative">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                <Star size={80} className="text-blue-500 rotate-12" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Accommodations</h3>
                            <p className="text-slate-400 mt-2 text-sm leading-relaxed">Special rates available for delegates at the Kenzi Menara Palace. Experience world-class amenities just minutes from the venue.</p>
                        </div>
                    </div>

                    <div className="sphere-card p-8 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-blue-400 mb-2 group-hover:text-blue-300 transition-colors">Gala Night</h3>
                                <p className="text-slate-400 text-sm max-w-xl leading-relaxed">A traditional Moroccan dinner under the stars. Join us for an unforgettable evening of culture, music, and networking at a historic riad in the heart of the Medina.</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-xl shadow-purple-500/10 group-hover:scale-110 transition-transform duration-500">
                                <Coffee size={28} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
