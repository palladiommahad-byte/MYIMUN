'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Link2, Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { DEFAULT_CONTACT_PAGE, resolveContactPage, type ContactPageData, type ContactSocialLink } from '@/lib/contactPage';
import styles from './contact.module.css';

function SocialIcon({ platform }: { platform: ContactSocialLink['platform'] }) {
    if (platform === 'youtube') return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.5 15.6V8.4L15.8 12l-6.3 3.6Z" /></svg>;
    if (platform === 'facebook') return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1c0 6 4.4 11 10.1 11.8v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18.1 24 12.1Z" /></svg>;
    if (platform === 'instagram') return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 4 4 2.4 7.2 2.3c1.2-.1 1.6-.1 4.8-.1Zm0-2.2C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0Zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9Z" /></svg>;
    if (platform === 'linkedin') return <span aria-hidden="true" style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>in</span>;
    return <Link2 size={17} />;
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
                            <a key={link.id} href={link.url || '#'} target={link.url?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" aria-label={link.label} title={link.label} data-platform={link.platform}>
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
