'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { DEFAULT_ABOUT_PAGE, resolveAboutPage, type AboutPageData } from '@/lib/aboutPage';
import styles from './about.module.css';

const reveal = {
    initial: { opacity: 0, y: 36 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-10% 0px' },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export default function AboutPage() {
    const [content, setContent] = useState<AboutPageData>(DEFAULT_ABOUT_PAGE);
    const timelineRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: timelineRef, offset: ['start 70%', 'end 80%'] });
    const timelineProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

    useEffect(() => {
        let alive = true;
        fetch('/api/settings/about', { cache: 'no-store' })
            .then(res => res.ok ? res.json() : null)
            .then(json => {
                if (alive && json?.ok) setContent(resolveAboutPage(json.data));
            })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    return (
        <div className={styles.page}>
            <section className={styles.missionSection}>
                <motion.div className={styles.mission} {...reveal}>
                    <div className={styles.missionMedia}>
                        {content.missionImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={content.missionImage} alt="MYIMUN delegates collaborating" />
                        ) : <div className={styles.imagePlaceholder}>MYIMUN</div>}
                    </div>
                    <div className={styles.missionCopy}>
                        <span className={styles.tag}>{content.missionTag}</span>
                        <h1>{content.missionHeading}</h1>
                        <p>{content.missionBody}</p>
                    </div>
                </motion.div>
            </section>

            <motion.section className={styles.partners} {...reveal}>
                <h2>{content.partnersHeading}</h2>
                <div className={styles.partnerGrid}>
                    {content.partners.map((partner, index) => (
                        <motion.div
                            key={partner.id}
                            className={styles.partner}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08 }}
                        >
                            {partner.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={partner.image} alt={partner.name} />
                            ) : (
                                <span>{partner.name}</span>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            <section className={styles.whyBand}>
                <div className={styles.shell}>
                    <motion.div className={styles.whyHeading} {...reveal}>
                        <span className={styles.tag}>{content.whyTag}</span>
                        <h2>{content.whyHeading}</h2>
                    </motion.div>
                    <div className={styles.featureGrid}>
                        {content.features.map((feature, index) => (
                            <motion.article
                                key={feature.id}
                                className={styles.feature}
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-5% 0px' }}
                                transition={{ duration: 0.55, delay: (index % 3) * 0.09 }}
                            >
                                <span className={styles.featureNumber}>{String(index + 1).padStart(2, '0')}</span>
                                <h3>{feature.title}</h3>
                                <p>{feature.body}</p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.historyIntro}>
                <motion.div {...reveal}>
                    <span className={styles.tag}>{content.historyTag}</span>
                    <h2>{content.historyHeading}</h2>
                    <p>{content.historyIntro}</p>
                </motion.div>
            </section>

            <section className={styles.timelineSection} ref={timelineRef}>
                <div className={styles.timelineLine}>
                    <motion.span style={{ scaleY: timelineProgress }} />
                </div>
                {content.history.map((entry, index) => (
                    <motion.article
                        key={entry.id}
                        className={styles.timelineEntry}
                        initial={{ opacity: 0, y: 54 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-8% 0px' }}
                        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className={styles.yearColumn}>
                            <span>{entry.year}</span>
                            <i aria-hidden="true" />
                        </div>
                        <div className={styles.entryContent}>
                            <div className={styles.entryImage}>
                                {entry.image ? (
                                    <motion.img
                                        src={entry.image}
                                        alt={entry.title}
                                        whileHover={{ scale: 1.025 }}
                                        transition={{ duration: 0.45 }}
                                    />
                                ) : <div className={styles.imagePlaceholder}>MYIMUN {entry.year}</div>}
                                <span>{String(index + 1).padStart(2, '0')}</span>
                            </div>
                            <h3>{entry.title}</h3>
                            <div className={styles.meta}>
                                <MapPin size={14} />
                                <strong>{entry.location}</strong>
                                <span>{entry.date}</span>
                            </div>
                            <p>{entry.body}</p>
                        </div>
                    </motion.article>
                ))}
            </section>
        </div>
    );
}
