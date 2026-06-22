'use client';

import React from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowUpRight, Star, Coffee } from "lucide-react";

const PLACES = [
    {
        id: "venue",
        title: "Palais des Congrès",
        category: "Main Venue",
        desc: "A world-class convention center located in the heart of the Hivernage district, equipped with state-of-the-art auditoriums.",
        image: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?q=80&w=1200&auto=format&fit=crop",
        size: "large"
    },
    {
        id: "hotel",
        title: "Kenzi Menara Palace",
        category: "Accommodation",
        desc: "5-star luxury resort for all delegates.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
        size: "small"
    },
    {
        id: "gala",
        title: "Agafay Desert Camp",
        category: "Social Event",
        desc: "A magical gala dinner under the stars.",
        image: "https://images.unsplash.com/photo-1542665174-31db64d7e0e4?q=80&w=800&auto=format&fit=crop",
        size: "small"
    }
];

export const VenueSection: React.FC = () => {
    return (
        <section className="relative py-24 px-6 bg-slate-50 overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100 blur-[120px] rounded-full pointer-events-none opacity-60" />

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="h-px w-8 bg-blue-600"></span>
                            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm">Host City</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                            Where Diplomacy <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Meets Culture.</span>
                        </h2>
                    </div>

                    <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/20 group">
                        <MapPin size={18} /> View City Guide
                        <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px] md:auto-rows-auto md:h-[600px]">
                    {PLACES.map((place, i) => (
                        <motion.div
                            key={place.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`group relative rounded-[32px] overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 ${place.size === 'large' ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1 md:row-span-1'
                                }`}
                        >
                            <div className="absolute inset-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={place.image}
                                    alt={place.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80" />
                            </div>

                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                <div className="absolute top-6 left-6">
                                    <span className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-wider">
                                        {place.category}
                                    </span>
                                </div>

                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className={`font-bold text-white mb-2 ${place.size === 'large' ? 'text-3xl' : 'text-xl'}`}>
                                        {place.title}
                                    </h3>
                                    <p className="text-slate-300 text-sm md:text-base line-clamp-2 md:line-clamp-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                        {place.desc}
                                    </p>
                                </div>

                                <div className="absolute bottom-8 right-8 text-white/20 group-hover:text-white transition-colors duration-300">
                                    {place.id === 'hotel' ? <Star size={32} /> : place.id === 'gala' ? <Coffee size={32} /> : <MapPin size={40} />}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
