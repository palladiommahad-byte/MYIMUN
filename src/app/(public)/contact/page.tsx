'use client';

import React, { useEffect, useState } from 'react';
import { Camera, CheckCircle2, Loader2, MessageCircle, Play, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { DEFAULT_CONTACT_PAGE, resolveContactPage, type ContactPageData, type ContactSocialLink } from '@/lib/contactPage';
import styles from './contact.module.css';

function SocialIcon({ platform }: { platform: ContactSocialLink['platform'] }) {
    if (platform === 'youtube') return <Play size={16} fill="currentColor" />;
    if (platform === 'instagram') return <Camera size={17} />;
    return <MessageCircle size={16} />;
}

export default function ContactPage() {
    const [content, setContent] = useState<ContactPageData>(DEFAULT_CONTACT_PAGE);
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        let alive = true;
        fetch('/api/settings/contact-page', { cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(json => {
                if (alive && json?.ok) setContent(resolveContactPage(json.data));
            })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSending(true);
        setStatus('idle');
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok || json?.ok === false) throw new Error('Request failed');
            setForm({ name: '', email: '', message: '' });
            setStatus('success');
        } catch {
            setStatus('error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.layout}>
                <motion.section
                    className={styles.contactInfo}
                    initial={{ opacity: 0, x: -38 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    <span className={styles.tag}>{content.tag}</span>
                    <h1>{content.heading}</h1>
                    <p className={styles.introduction}>{content.introduction}</p>

                    <div className={styles.details}>
                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <a className={styles.phone} href={`tel:${content.phone.replace(/\s/g, '')}`}>{content.phone}</a>
                            <p>{content.hours}</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <a href={`mailto:${content.primaryEmail}`}>{content.primaryEmail}</a>
                            <p>{content.primaryEmailNote}</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <a href={`mailto:${content.supportEmail}`}>{content.supportEmail}</a>
                            <p>{content.supportEmailNote}</p>
                        </motion.div>
                    </div>

                    <div className={styles.socials}>
                        {content.socials.map(link => (
                            <a key={link.id} href={link.url || '#'} target={link.url?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" aria-label={link.label} title={link.label}>
                                <SocialIcon platform={link.platform} />
                            </a>
                        ))}
                    </div>
                </motion.section>

                <motion.section
                    className={styles.formPanel}
                    initial={{ opacity: 0, x: 38 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h2>{content.formHeading}</h2>
                    <p className={styles.formIntro}>{content.formIntroduction}</p>
                    <form onSubmit={submit}>
                        <div className={styles.inputGrid}>
                            <label>
                                <span>{content.nameLabel} <i>*</i></span>
                                <input required autoComplete="name" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder={content.namePlaceholder} />
                            </label>
                            <label>
                                <span>{content.emailLabel} <i>*</i></span>
                                <input required type="email" autoComplete="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} placeholder={content.emailPlaceholder} />
                            </label>
                        </div>
                        <label>
                            <span>{content.messageLabel}</span>
                            <textarea required rows={8} value={form.message} onChange={event => setForm(current => ({ ...current, message: event.target.value }))} placeholder={content.messagePlaceholder} />
                        </label>

                        {status === 'success' && <p className={styles.success}><CheckCircle2 size={17} />{content.successMessage}</p>}
                        {status === 'error' && <p className={styles.error}>{content.errorMessage}</p>}

                        <button type="submit" disabled={sending}>
                            {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
                            {sending ? 'Sending...' : content.submitLabel}
                        </button>
                    </form>
                </motion.section>
            </div>
        </div>
    );
}
