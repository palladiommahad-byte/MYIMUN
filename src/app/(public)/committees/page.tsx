'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { DEFAULT_COMMITTEE_PAGE, resolveCommitteePage, type CommitteePageData } from '@/lib/committeePage';
import styles from './committees.module.css';

export default function CommitteesPage() {
    const [content, setContent] = useState<CommitteePageData>(DEFAULT_COMMITTEE_PAGE);
    const listRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 82%'] });
    const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

    useEffect(() => {
        let alive = true;
        fetch('/api/settings/committees-page', { cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(json => {
                if (alive && json?.ok) setContent(resolveCommitteePage(json.data));
            })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    return (
        <div className={styles.page}>
            <motion.header
                className={styles.intro}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
                <span className={styles.tag}>{content.tag}</span>
                <h1>{content.heading}</h1>
                <p>{content.introduction}</p>
            </motion.header>

            <section className={styles.committeeList} ref={listRef}>
                <div className={styles.progressTrack} aria-hidden="true">
                    <motion.span style={{ scaleY: progress }} />
                </div>
                {content.committees.map((committee, index) => (
                    <motion.article
                        key={committee.id}
                        className={styles.committee}
                        initial={{ opacity: 0, y: 52 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-8% 0px' }}
                        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
                        <div className={styles.logoWrap}>
                            {committee.image ? (
                                <motion.img
                                    src={committee.image}
                                    alt={`${committee.name} logo`}
                                    whileHover={{ scale: 1.05, rotate: index % 2 ? 2 : -2 }}
                                    transition={{ duration: 0.35 }}
                                />
                            ) : (
                                <span>{committee.abbreviation}</span>
                            )}
                        </div>
                        <div className={styles.copy}>
                            <h2>{committee.name} <span>({committee.abbreviation})</span></h2>
                            <p>{committee.description}</p>
                        </div>
                    </motion.article>
                ))}
            </section>
        </div>
    );
}
