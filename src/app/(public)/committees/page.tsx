'use client';

import React from "react";
import { Search, Globe, Gavel, Zap, Scale, ArrowUpRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { PageHeader } from "@/components/ui/PageHeader";

const COMMITTEES = [
    {
        name: "DISEC",
        type: "General Assembly",
        level: "Beginner",
        icon: Globe,
        topic: "Cyber Warfare",
        color: "bg-blue-500/20 text-blue-400",
        description: "The Disarmament and International Security Committee (DISEC) deals with disarmament, global challenges, and threats to peace that affect theinternational community.",
        agenda: ["State-sponsored cyber attacks", "Protection of critical infrastructure", "Cyber espionage regulations"]
    },
    {
        name: "UNSC",
        type: "Crisis",
        level: "Advanced",
        icon: Gavel,
        topic: "Situation in Yemen",
        color: "bg-red-500/20 text-red-400",
        description: "The United Nations Security Council (UNSC) has primary responsibility for the maintenance of international peace and security.",
        agenda: ["Humanitarian aid access", "Ceasefire negotiations", "Foreign intervention policies"]
    },
    {
        name: "WHO",
        type: "Specialized",
        level: "Intermediate",
        icon: Zap,
        topic: "Pandemic Response",
        color: "bg-emerald-500/20 text-emerald-400",
        description: "The World Health Organization (WHO) is a specialized agency of the United Nations responsible for international public health.",
        agenda: ["Vaccine distribution equity", "Early warning systems", "Healthcare infrastructure resilience"]
    },
    {
        name: "ICJ",
        type: "Legal",
        level: "Expert",
        icon: Scale,
        topic: "Maritime Disputes",
        color: "bg-purple-500/20 text-purple-400",
        description: "The International Court of Justice (ICJ) is the principal judicial organ of the United Nations, settling legal disputes between states.",
        agenda: ["South China Sea territorial claims", "Freedom of navigation", "Exclusive Economic Zones (EEZ)"]
    },
    {
        name: "ECOSOC",
        type: "General Assembly",
        level: "Intermediate",
        icon: Globe,
        topic: "Crypto Regulation",
        color: "bg-orange-500/20 text-orange-400",
        description: "The Economic and Social Council (ECOSOC) is responsible for coordinating the economic and social fields of the organization.",
        agenda: ["Global cryptocurrency framework", "Combating money laundering", "Digital currency impact on developing economies"]
    },
    {
        name: "NATO",
        type: "Crisis",
        level: "Advanced",
        icon: Gavel,
        topic: "Arctic Security",
        color: "bg-indigo-500/20 text-indigo-400",
        description: "The North Atlantic Treaty Organization (NATO) is an intergovernmental military alliance between 30 European and North American countries.",
        agenda: ["Militarization of the Arctic", "Resource exploration rights", "Strategic defense cooperation"]
    },
];

export default function CommitteesPage() {
    const [selectedCommittee, setSelectedCommittee] = React.useState<(typeof COMMITTEES)[0] | null>(null);

    return (
        <div className="min-h-screen bg-transparent text-slate-200 pb-20">
            <PageHeader
                title="Our Committees"
                subtitle="From beginner-friendly General Assemblies to fast-paced Crisis cabinets. Find your arena."
                image="https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?auto=format&fit=crop&w=2000&q=80"
                height="h-[50vh]"
            />

            <div className="max-w-7xl mx-auto px-6 mt-12">

                {/* Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        {['All', 'General Assembly', 'Crisis', 'Specialized'].map((filter, i) => (
                            <button
                                key={filter}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${i === 0
                                    ? 'bg-blue-600 text-white border-transparent'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search committees..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium placeholder:text-slate-500 text-white"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {COMMITTEES.map((com, i) => (
                        <motion.div
                            key={com.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <div
                                onClick={() => setSelectedCommittee(com)}
                                className="sphere-card h-full flex flex-col p-7 group cursor-pointer relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30"
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${com.color.split(' ')[0].replace('/20', '')} to-transparent`} />

                                <div className="relative z-10 flex justify-between items-start mb-5">
                                    <div className={`w-14 h-14 rounded-2xl ${com.color} flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                                        <com.icon size={26} />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${com.level === 'Advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        com.level === 'Expert' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                        {com.level}
                                    </span>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">{com.name}</h3>
                                    <p className="text-sm text-slate-400 mb-6 font-medium">{com.type}</p>

                                    <div className="pt-4 border-t border-white/10 group-hover:border-white/20 transition-colors">
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Topic</div>
                                        <div className="font-semibold text-slate-200 flex items-center justify-between group-hover:text-white transition-colors">
                                            {com.topic}
                                            <div className="bg-white/5 p-1.5 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                                <ArrowUpRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            {/* Modal */}
            <AnimatePresence>
                {selectedCommittee && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCommittee(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                        >
                            <div className="w-full max-w-2xl bg-[#0A0F1E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative">
                                {/* Header / Hero */}
                                <div className={`h-32 ${selectedCommittee.color.split(' ')[0]} relative overflow-hidden flex items-center justify-center`}>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0F1E]" />
                                    <selectedCommittee.icon size={64} className="text-white/20 relative z-10" />
                                    <button
                                        onClick={() => setSelectedCommittee(null)}
                                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-md z-20"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 -mt-10 relative z-10">
                                    <div className={`w-16 h-16 rounded-2xl ${selectedCommittee.color} flex items-center justify-center shadow-lg shadow-black/30 mb-6 border border-white/10 bg-opacity-100`}>
                                        <selectedCommittee.icon size={32} />
                                    </div>

                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h2 className="text-3xl font-bold text-white mb-1">{selectedCommittee.name}</h2>
                                            <p className="text-slate-400 font-medium">{selectedCommittee.type}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${selectedCommittee.level === 'Advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            selectedCommittee.level === 'Expert' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            {selectedCommittee.level}
                                        </span>
                                    </div>

                                    <div className="space-y-6 mt-8">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Topic</h3>
                                            <p className="text-xl text-white font-semibold">{selectedCommittee.topic}</p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">About The Committee</h3>
                                            <p className="text-slate-300 leading-relaxed">
                                                {selectedCommittee.description}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Key Agenda Items</h3>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {selectedCommittee.agenda?.map((item, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5 text-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-3">
                                        <button
                                            onClick={() => setSelectedCommittee(null)}
                                            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors cursor-pointer"
                                        >
                                            Close
                                        </button>
                                        <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer">
                                            Apply for Committee
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
