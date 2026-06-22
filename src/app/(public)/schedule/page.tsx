'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, List, LayoutList, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/auth/AuthContext";
import { useConference } from "@/context/ConferenceContext";

const SCHEDULE_DATA = [
    {
        day: "Day 1", date: "Friday, Oct 12",
        events: [
            { id: 1, time: "08:00 AM", title: "Registration & Kit Pickup", location: "Grand Foyer", type: "Logistics", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", description: "Pick up your delegate handbook, badges, and placards. Coffee and pastries provided." },
            { id: 2, time: "10:00 AM", title: "Opening Ceremony", location: "Royal Auditorium", type: "Keynote", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", description: "Keynote address by Secretary General Sarah Jenkins and guest speaker Dr. Amina J. Mohammed." },
            { id: 3, time: "12:00 PM", title: "Networking Lunch", location: "Gardens", type: "Break", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", description: "A casual lunch to meet fellow delegates and form alliances before sessions begin." },
            { id: 4, time: "01:30 PM", title: "Committee Session I", location: "Breakout Rooms", type: "Session", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", description: "Setting the agenda and opening speeches. First opportunity to make your stance clear." },
        ]
    },
    {
        day: "Day 2", date: "Saturday, Oct 13",
        events: [
            { id: 5, time: "09:00 AM", title: "Committee Session II", location: "Breakout Rooms", type: "Session", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", description: "Drafting working papers and forming blocs. Intense negotiations expected." },
            { id: 6, time: "12:00 PM", title: "Lunch Symposium", location: "Banquet Hall", type: "Special", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", description: "Panel discussion: 'The Future of Digital Diplomacy' with industry experts." },
            { id: 7, time: "02:00 PM", title: "Committee Session III", location: "Breakout Rooms", type: "Session", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", description: "Introduction of draft resolutions and amendment debates." },
            { id: 8, time: "08:00 PM", title: "Gala Night", location: "Poolside", type: "Social", color: "bg-pink-500/10 text-pink-400 border-pink-500/20", description: "A magical evening under the stars with live music, traditional food, and dancing." },
        ]
    },
    {
        day: "Day 3", date: "Sunday, Oct 14",
        events: [
            { id: 9, time: "09:30 AM", title: "Committee Session IV", location: "Breakout Rooms", type: "Session", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", description: "Voting on resolutions. Final chance to secure your country's interests." },
            { id: 10, time: "12:30 PM", title: "Closing Ceremony", location: "Royal Auditorium", type: "Keynote", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", description: "Awards presentation for Best Delegate and Outstanding Delegations." },
            { id: 11, time: "02:00 PM", title: "Farewell Tea", location: "Lobby Lounge", type: "Social", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", description: "Say goodbye to new friends and exchange contacts before departure." },
        ]
    },
    {
        day: "Day 4", date: "Monday, Oct 15",
        events: [
            { id: 12, time: "10:00 AM", title: "City Tour (Optional)", location: "Medina Entrance", type: "Excursion", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", description: "Guided tour of the historic Medina, Souks, and Bahia Palace." },
            { id: 13, time: "02:00 PM", title: "Airport Transfers", location: "Hotel Lobby", type: "Logistics", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", description: "Shuttles departing every hour for RAK Airport." },
        ]
    }
];

export default function SchedulePage() {
    const [view, setView] = useState<"timeline" | "table">("timeline");
    const { user } = useAuth();
    const { conferenceSettings } = useConference();

    if (!conferenceSettings.publicSchedule && !user) {
        return (
            <main className="min-h-screen bg-transparent text-slate-200 pb-20">
                <PageHeader
                    title="Conference Schedule"
                    subtitle="Explore the sessions, workshops, and networking events designed to elevate your diplomatic skills."
                    image="https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=2000&q=80"
                    height="h-[50vh]"
                />
                <div className="max-w-lg mx-auto mt-12 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-blue-400" size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Schedule Available to Delegates Only</h2>
                    <p className="text-slate-400 leading-relaxed mb-8">
                        The conference schedule is currently private. Please log in to your delegate account to view the full program.
                    </p>
                    <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all">
                        Log In <ArrowRight size={16} />
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-transparent text-slate-200 pb-20">
            <PageHeader
                title="Conference Schedule"
                subtitle="Explore the sessions, workshops, and networking events designed to elevate your diplomatic skills."
                image="https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=2000&q=80"
                height="h-[50vh]"
            />

            {/* View Toggle */}
            <div className="flex justify-center mt-8 relative z-20 mb-16">
                <div className="bg-[#0A0F1E]/80 backdrop-blur-md p-1.5 rounded-full inline-flex border border-white/10 shadow-xl">
                    <button onClick={() => setView("timeline")} className={`px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${view === "timeline" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
                        <LayoutList size={16} /> Timeline
                    </button>
                    <button onClick={() => setView("table")} className={`px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${view === "table" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
                        <List size={16} /> Table
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto space-y-16 px-4 md:px-8">
                {SCHEDULE_DATA.map((day, index) => (
                    <div key={index}>
                        {/* Day Header */}
                        <div className="sticky top-24 z-10 mb-10">
                            <div className="relative overflow-hidden bg-[#0A0F1E]/80 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl flex items-center gap-5 group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

                                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#00D1FF] flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-105 transition-transform duration-300">
                                    <span className="text-2xl font-extrabold text-white">{day.day.split(" ")[1]}</span>
                                </div>
                                <div className="relative">
                                    <h2 className="text-3xl font-extrabold text-white tracking-tight group-hover:text-blue-200 transition-colors">{day.day}</h2>
                                    <p className="text-slate-400 font-medium text-lg flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        {day.date}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <AnimatePresence mode="wait">
                            {view === "timeline" ? (
                                <div className="relative border-l-2 border-white/10 ml-5 space-y-10 pb-4">
                                    {day.events.map((event, i) => (
                                        <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative pl-8">
                                            <div className="absolute -left-[9px] top-6 h-4 w-4 rounded-full bg-white border-4 border-[#0055FF] shadow-sm" />
                                            <div className="sphere-card p-6 group hover:bg-white/10 transition-colors">
                                                <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap gap-3 items-center mb-3">
                                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${event.color} bg-opacity-20`}>{event.type}</span>
                                                            <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
                                                                <span className="flex items-center gap-1.5"><Clock size={16} className="text-[#0055FF]" /> {event.time}</span>
                                                                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[#0055FF]" /> {event.location}</span>
                                                            </div>
                                                        </div>
                                                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#0055FF] transition-colors">{event.title}</h3>
                                                        <p className="text-slate-300 leading-relaxed text-base border-t border-white/5 pt-3 mt-3">{event.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="sphere-card overflow-hidden p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#0A0F1E]/50 border-b border-white/10">
                                            <tr>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-300 uppercase tracking-wider w-32">Time</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-300 uppercase tracking-wider">Event Details</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-300 uppercase tracking-wider text-right w-32">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {day.events.map((event) => (
                                                <tr key={event.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-6 align-top">
                                                        <div className="font-bold text-white whitespace-nowrap text-lg">{event.time}</div>
                                                        <div className="text-slate-400 text-sm mt-1">{event.location}</div>
                                                    </td>
                                                    <td className="px-6 py-6 align-top">
                                                        <div className="font-bold text-xl text-white mb-2 group-hover:text-blue-400 transition-colors">{event.title}</div>
                                                        <div className="text-slate-300 leading-relaxed text-sm">{event.description}</div>
                                                    </td>
                                                    <td className="px-6 py-6 align-top text-right">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${event.color} bg-opacity-20`}>{event.type}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </main>
    );
}
