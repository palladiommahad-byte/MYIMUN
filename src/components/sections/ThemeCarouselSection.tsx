'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const themes = [
    {
        id: 1,
        title: "Security Council",
        image: "https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=800&q=80", // Intense/Serious
        color: "from-blue-600 to-slate-800"
    },
    {
        id: 2,
        title: "General Assembly",
        image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80", // Large Hall / Abstract
        color: "from-blue-400 to-indigo-500"
    },
    {
        id: 3,
        title: "Human Rights",
        image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80", // People/Hands (Abstract)
        color: "from-orange-400 to-red-400"
    },
    {
        id: 4,
        title: "ECOSOC",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", // Economic/Graph (Abstract)
        color: "from-emerald-400 to-teal-500"
    },
    {
        id: 5,
        title: "World Health",
        image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80", // Health/Science
        color: "from-cyan-400 to-blue-500"
    },
    {
        id: 6,
        title: "International Court",
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80", // Legal/Scales
        color: "from-slate-400 to-gray-500"
    },
    {
        id: 7,
        title: "Crisis Committee",
        image: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=800&q=80", // Red/Action
        color: "from-red-600 to-slate-900"
    }
];

export function ThemeCarouselSection() {
    const [currentIndex, setCurrentIndex] = useState(1); // Start with middle item

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % themes.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + themes.length) % themes.length);
    };

    const getSlideStyle = (index: number) => {
        const diff = (index - currentIndex + themes.length) % themes.length;

        // Center item
        if (diff === 0) {
            return {
                scale: 1.1,
                opacity: 1,
                zIndex: 20,
                x: 0,
                rotateY: 0
            };
        }

        // Immediate Right (1 or -length+1)
        if (diff === 1 || diff === -themes.length + 1) {
            return {
                scale: 0.85,
                opacity: 0.7,
                zIndex: 10,
                x: 180, // push right
                rotateY: -15
            };
        }

        // Immediate Left (-1 or length-1)
        if (diff === themes.length - 1 || diff === -1) {
            return {
                scale: 0.85,
                opacity: 0.7,
                zIndex: 10,
                x: -180, // push left
                rotateY: 15
            };
        }

        // Others hidden/behind
        return {
            scale: 0.5,
            opacity: 0,
            zIndex: 0,
            x: 0,
            rotateY: 0
        };
    };

    // Helper to get visible items for simpler logic if needed, but absolute positioning with transform is easier for this effect.
    // We will render ALL items but animate their positions based on current index.

    return (
        <section className="py-24 relative overflow-hidden">


            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header Line */}
                <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-light text-slate-300">Committees</h2>
                    <div className="text-xl font-mono text-slate-500">
                        <span className="text-white font-bold">0{currentIndex + 1}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-600">0{themes.length}</span>
                    </div>
                </div>

                {/* Carousel Area */}
                <div className="relative h-[500px] flex items-center justify-center perspective-[1000px]">

                    {/* Navigation Buttons - Absolute for better placement */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 md:left-20 z-30 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md transition-all text-white"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-4 md:right-20 z-30 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md transition-all text-white"
                    >
                        <ChevronRight size={24} />
                    </button>


                    <div className="relative w-full max-w-lg h-[400px] flex items-center justify-center">
                        <AnimatePresence mode='popLayout'>
                            {themes.map((theme, index) => {
                                // Calculate position relative to current
                                let position = (index - currentIndex);
                                if (position < -1) position += themes.length; // Wrapped around left
                                if (position > 1) position -= themes.length;  // Wrapped around right

                                // Fix specific wrapping edge cases for smooth loop of 5
                                // If current is 0, index 4 should be -1 (Left)
                                // If current is 4, index 0 should be 1 (Right)

                                const isCenter = index === currentIndex;
                                const isRight = (index === (currentIndex + 1) % themes.length);
                                const isLeft = (index === (currentIndex - 1 + themes.length) % themes.length);

                                // We only render the 3 visible ones for simplicity or render all with opacity 0? 
                                // Let's render all but control variants.

                                let variant = "hidden";
                                if (isCenter) variant = "center";
                                else if (isRight) variant = "right";
                                else if (isLeft) variant = "left";

                                return (
                                    <motion.div
                                        key={theme.id}
                                        layout
                                        initial={false}
                                        animate={variant}
                                        variants={{
                                            center: { x: 0, scale: 1.2, opacity: 1, zIndex: 20, rotateY: 0, filter: 'blur(0px)' },
                                            left: { x: -280, scale: 0.85, opacity: 0.6, zIndex: 10, rotateY: 15, filter: 'blur(2px)' },
                                            right: { x: 280, scale: 0.85, opacity: 0.6, zIndex: 10, rotateY: -15, filter: 'blur(2px)' },
                                            hidden: { x: 0, scale: 0, opacity: 0, zIndex: -1 } // Hide others
                                        }}
                                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                        className="absolute top-0 w-64 h-80 md:w-72 md:h-96 rounded-[2rem] overflow-hidden shadow-2xl origin-center cursor-pointer"
                                        onClick={() => {
                                            if (isLeft) prevSlide();
                                            if (isRight) nextSlide();
                                        }}
                                    >
                                        <div className="w-full h-full relative">
                                            <img
                                                src={theme.image}
                                                alt={theme.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                            {/* Content */}
                                            <div className="absolute bottom-0 inset-x-0 p-6 text-center">
                                                <h3 className="text-3xl font-light text-white tracking-widest lowercase drop-shadow-lg font-mono">
                                                    {theme.title}
                                                </h3>
                                            </div>

                                            {/* Glass overlay for texture */}
                                            <div className="absolute inset-0 ring-1 ring-white/20 rounded-[2rem] pointer-events-none" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        {themes.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                                    ? "w-8 bg-white"
                                    : "w-2 bg-white/20 hover:bg-white/40"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
