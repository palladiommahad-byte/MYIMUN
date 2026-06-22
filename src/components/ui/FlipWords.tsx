'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const FlipWords = ({
    words,
    duration = 3000,
    className,
}: {
    words: string[];
    duration?: number;
    className?: string;
}) => {
    const [currentWord, setCurrentWord] = useState(words[0]);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            i++;
            if (i === words.length) {
                i = 0;
            }
            setCurrentWord(words[i]);
        }, duration);

        return () => clearInterval(interval);
    }, [words, duration]);

    return (
        <span className="inline-flex relative items-center justify-start min-w-[100px]">
            <AnimatePresence mode="wait">
                <motion.span
                    key={currentWord}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className={className}
                >
                    {currentWord}
                </motion.span>
            </AnimatePresence>
        </span>
    );
};
