'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";

const FAQS = [
    {
        question: "Who can register for the conference?",
        answer: "Registration is open to high school and university students worldwide. We welcome delegates from all experience levels, from first-timers to seasoned veterans."
    },
    {
        question: "Is accommodation included in the fee?",
        answer: "The standard Delegate Pass covers conference access and lunch. The 'Full Experience' package includes 3 nights at our partner 5-star hotel with breakfast and shuttle service."
    },
    {
        question: "Can I represent my own country?",
        answer: "To ensure a fair and unbiased simulation, delegates are assigned countries other than their own. Assignments are distributed based on experience and availability."
    },
    {
        question: "What is the refund policy?",
        answer: "We offer a full refund up to 30 days before the event. Cancellations within 30 days are eligible for a 50% refund or a full credit transfer to next year's conference."
    },
];

export const FaqSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="relative py-24 px-6 bg-white overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10 max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold uppercase tracking-wider mb-6">
                        <HelpCircle size={14} /> Support
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                        Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Questions</span>
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Everything you need to know about registration, logistics, and the conference experience.
                    </p>
                </div>

                <div className="space-y-6">
                    {FAQS.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className={`w-full text-left transition-all duration-300 rounded-[2rem] border overflow-hidden group ${openIndex === i
                                        ? "bg-white border-blue-200 shadow-sphere-card scale-[1.02]"
                                        : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm"
                                    }`}
                            >
                                <div className="p-6 md:p-8 flex justify-between items-center gap-6">
                                    <span className={`text-xl font-bold transition-colors ${openIndex === i ? "text-blue-600" : "text-slate-900"
                                        }`}>
                                        {faq.question}
                                    </span>
                                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${openIndex === i
                                            ? "bg-blue-600 text-white rotate-180 shadow-lg shadow-blue-500/30"
                                            : "bg-white text-slate-400 border border-slate-200 group-hover:border-blue-200 group-hover:text-blue-600"
                                        }`}>
                                        {openIndex === i ? <Minus size={20} /> : <Plus size={20} />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {openIndex === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-6 md:px-8 pb-8 pt-0">
                                                <div className="h-px w-full bg-slate-100 mb-6" />
                                                <p className="text-slate-500 leading-relaxed text-lg">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-slate-500 mb-4 font-medium">Still have questions?</p>
                    <button className="px-8 py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-xl shadow-slate-900/10">
                        Contact Support
                    </button>
                </div>
            </div>
        </section>
    );
};
