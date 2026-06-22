'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';

const pricingData = [
    {
        title: "Standard",
        price: 10,
        originalPrice: 12,
        description: "Efficiently organize your transactions, accounts, reports, and books",
        features: [
            "Progress invoicing",
            "Connect bank feeds",
            "Setup recurring expenses",
            "Early payment discount",
            "Create custom reports"
        ],
        cta: "Get Started",
        popular: false
    },
    {
        title: "Premium",
        price: 20,
        originalPrice: 24,
        description: "Confidently take on projects, track your inventory, and handle purchases.",
        features: [
            "Manage vendor bills and payments",
            "Track sales and purchase orders",
            "Record multi-currency transactions",
            "Analyze project profitability",
            "Customize business workflows"
        ],
        cta: "Get Started",
        popular: true
    },
    {
        title: "Advanced",
        price: 35,
        originalPrice: 40,
        description: "Designed for teams requiring deeper insights and advanced financial automation.",
        features: [
            "Advanced cash-flow forecasting",
            "Automated approval workflows",
            "Multi-department cost tracking",
            "Custom analytics dashboards",
            "Priority customer support"
        ],
        cta: "Get Started",
        popular: false
    }
];

export function PricingSection() {
    const [isYearly, setIsYearly] = useState(true);

    return (
        <section className="relative py-24 overflow-hidden" id="pricing">


            <div className="relative z-10 max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-medium text-white tracking-tight font-sans">
                        Choose the Perfect Plan for You
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
                        Each plan offers essential tools and powerful automation with transparent pricing, no hidden fees, only efficient, accurate features for sustainable business growth.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center mt-8">
                        <div className="bg-white/5 backdrop-blur-sm p-1 rounded-full border border-white/10 flex relative">
                            <motion.div
                                className="absolute top-1 bottom-1 bg-white/10 rounded-full"
                                initial={false}
                                animate={{
                                    x: isYearly ? 0 : "100%",
                                    width: "50%"
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors z-10 ${isYearly ? "text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                Yearly
                            </button>
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors z-10 ${!isYearly ? "text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {pricingData.map((plan, index) => (
                        <motion.div
                            key={plan.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className={`group relative p-8 rounded-[2rem] border backdrop-blur-md transition-all duration-300 h-full flex flex-col ${plan.popular
                                ? "bg-white/[0.07] border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.15)] z-20 scale-105"
                                : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20 z-10"
                                }`}
                        >
                            {/* Most Popular Badge */}
                            {plan.popular && (
                                <div className="absolute top-6 right-6">
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Title & Description */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-semibold text-white mb-3">{plan.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed min-h-[40px]">
                                    {plan.description}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mb-8 flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-white tracking-tight">
                                    ${isYearly ? plan.price : Math.round(plan.price * 1.2)}
                                </span>
                                <span className="text-xl text-slate-500 line-through decoration-slate-600">
                                    ${isYearly ? plan.originalPrice : Math.round(plan.originalPrice * 1.2)}
                                </span>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => document.getElementById('register-trigger')?.click()}
                                className={`w-full py-4 rounded-xl font-semibold text-sm transition-all mb-8 ${plan.popular
                                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 hover:shadow-blue-600/30"
                                    : "bg-transparent border border-white/20 text-white hover:bg-white/10"
                                    }`}
                            >
                                {plan.cta}
                            </button>

                            {/* Features */}
                            <div className="mt-auto">
                                <p className="text-sm text-slate-400 font-medium mb-4">
                                    Everything in {plan.title} includes:
                                </p>
                                <ul className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                                            <Check className="w-5 h-5 text-blue-400 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="mt-6 text-sm text-slate-500 hover:text-white underline decoration-slate-700 underline-offset-4 transition-colors">
                                    and a lot more
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
