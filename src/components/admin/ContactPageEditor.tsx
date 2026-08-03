'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, Mail, Plus, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { DEFAULT_CONTACT_PAGE, resolveContactPage, type ContactPageData, type ContactSocialLink } from '@/lib/contactPage';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF', text: '#111827', textSec: '#6B7280',
    textMuted: '#9CA3AF', accent: '#3B7FFF', green: '#10B981', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8,
    background: C.bg, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
    return <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <input type={type} value={value} onChange={event => onChange(event.target.value)} style={inputStyle}
            onFocus={event => event.currentTarget.style.borderColor = C.accent}
            onBlur={event => event.currentTarget.style.borderColor = C.border} />
    </label>;
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
    return <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <textarea value={value} onChange={event => onChange(event.target.value)} rows={rows} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
            onFocus={event => event.currentTarget.style.borderColor = C.accent}
            onBlur={event => event.currentTarget.style.borderColor = C.border} />
    </label>;
}

function Section({ title, description, children, action }: { title: string; description: string; children: React.ReactNode; action?: React.ReactNode }) {
    return <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, boxShadow: C.shadow, overflow: 'hidden' }}>
        <header style={{ padding: '17px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div><h2 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h2><p style={{ marginTop: 3, fontSize: 12.5, color: C.textSec }}>{description}</p></div>
            {action}
        </header>
        <div style={{ padding: 20, display: 'grid', gap: 16 }}>{children}</div>
    </section>;
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

export function ContactPageEditor({ onBack }: { onBack: () => void }) {
    const { showToast } = useToast();
    const [draft, setDraft] = useState<ContactPageData>(DEFAULT_CONTACT_PAGE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch('/api/settings/contact-page', { cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(json => {
                if (!alive) return;
                setDraft(resolveContactPage(json?.ok ? json.data : null));
                setLoading(false);
            })
            .catch(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    const patch = (value: Partial<ContactPageData>) => setDraft(current => ({ ...current, ...value }));
    const updateSocial = (index: number, value: Partial<ContactSocialLink>) => patch({
        socials: draft.socials.map((social, itemIndex) => itemIndex === index ? { ...social, ...value } : social),
    });
    const save = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings/contact-page', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Could not save Contact page');
            showToast('Contact page saved', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not save Contact page', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.textMuted }}><Loader2 size={18} className="animate-spin" /> Loading Contact page...</div>;

    const iconButton: React.CSSProperties = { width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer' };
    const twoColumns: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 };

    return <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, fontFamily: '"Inter",system-ui,sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" title="Back to events" onClick={onBack} style={{ ...iconButton, width: 38, height: 38 }}><ArrowLeft size={17} /></button>
                <div><h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text }}>Contact Page</h1><p style={{ marginTop: 4, fontSize: 14, color: C.textSec }}>Manage public contact details, enquiry form copy, and social links.</p></div>
            </div>
            <button type="button" onClick={save} disabled={saving} style={{ minWidth: 150, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 16px', borderRadius: 8, border: 'none', background: C.accent, color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.65 : 1 }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Page
            </button>
        </div>

        <Section title="Contact Introduction" description="The left-side heading and welcome copy.">
            <div style={twoColumns}>
                <Field label="Section Label" value={draft.tag} onChange={tag => patch({ tag })} />
                <Field label="Main Heading" value={draft.heading} onChange={heading => patch({ heading })} />
            </div>
            <TextArea label="Introduction" value={draft.introduction} onChange={introduction => patch({ introduction })} rows={4} />
        </Section>

        <Section title="Contact Details" description="Phone, opening hours, and public email addresses.">
            <div style={twoColumns}>
                <Field label="Phone Number" value={draft.phone} onChange={phone => patch({ phone })} />
                <Field label="Opening Hours" value={draft.hours} onChange={hours => patch({ hours })} />
                <Field label="Primary Email" type="email" value={draft.primaryEmail} onChange={primaryEmail => patch({ primaryEmail })} />
                <Field label="Primary Email Note" value={draft.primaryEmailNote} onChange={primaryEmailNote => patch({ primaryEmailNote })} />
                <Field label="Support Email" type="email" value={draft.supportEmail} onChange={supportEmail => patch({ supportEmail })} />
                <Field label="Support Email Note" value={draft.supportEmailNote} onChange={supportEmailNote => patch({ supportEmailNote })} />
            </div>
        </Section>

        <Section title="Enquiry Form" description="All headings, labels, placeholders, and button text shown in the form.">
            <div style={twoColumns}>
                <Field label="Form Heading" value={draft.formHeading} onChange={formHeading => patch({ formHeading })} />
                <Field label="Form Introduction" value={draft.formIntroduction} onChange={formIntroduction => patch({ formIntroduction })} />
                <Field label="Name Label" value={draft.nameLabel} onChange={nameLabel => patch({ nameLabel })} />
                <Field label="Name Placeholder" value={draft.namePlaceholder} onChange={namePlaceholder => patch({ namePlaceholder })} />
                <Field label="Email Label" value={draft.emailLabel} onChange={emailLabel => patch({ emailLabel })} />
                <Field label="Email Placeholder" value={draft.emailPlaceholder} onChange={emailPlaceholder => patch({ emailPlaceholder })} />
                <Field label="Message Label" value={draft.messageLabel} onChange={messageLabel => patch({ messageLabel })} />
                <Field label="Message Placeholder" value={draft.messagePlaceholder} onChange={messagePlaceholder => patch({ messagePlaceholder })} />
                <Field label="Submit Button" value={draft.submitLabel} onChange={submitLabel => patch({ submitLabel })} />
            </div>
            <div style={twoColumns}>
                <TextArea label="Success Message" value={draft.successMessage} onChange={successMessage => patch({ successMessage })} rows={3} />
                <TextArea label="Error Message" value={draft.errorMessage} onChange={errorMessage => patch({ errorMessage })} rows={3} />
            </div>
        </Section>

        <Section
            title="Social Links"
            description="Circular social actions shown below the contact details."
            action={<button type="button" onClick={() => patch({ socials: [...draft.socials, { id: crypto.randomUUID(), platform: 'other', label: 'Social Link', url: '#' }] })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Plus size={14} /> Add Link</button>}
        >
            {draft.socials.map((social, index) => <div key={social.id} style={{ padding: 16, border: `1px solid ${C.border}`, borderRadius: 8, display: 'grid', gap: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ color: C.text, fontSize: 13 }}>{social.label || `Social Link ${index + 1}`}</strong>
                    <div style={{ display: 'flex', gap: 5 }}>
                        <button type="button" title="Move up" disabled={index === 0} onClick={() => patch({ socials: moveItem(draft.socials, index, -1) })} style={{ ...iconButton, opacity: index === 0 ? 0.35 : 1 }}><ArrowUp size={14} /></button>
                        <button type="button" title="Move down" disabled={index === draft.socials.length - 1} onClick={() => patch({ socials: moveItem(draft.socials, index, 1) })} style={{ ...iconButton, opacity: index === draft.socials.length - 1 ? 0.35 : 1 }}><ArrowDown size={14} /></button>
                        <button type="button" title="Remove" onClick={() => patch({ socials: draft.socials.filter((_, itemIndex) => itemIndex !== index) })} style={{ ...iconButton, color: C.red }}><Trash2 size={14} /></button>
                    </div>
                </div>
                <div style={twoColumns}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Platform</span><select value={social.platform} onChange={event => updateSocial(index, { platform: event.target.value as ContactSocialLink['platform'] })} style={inputStyle}><option value="youtube">YouTube</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option><option value="other">Other</option></select></label>
                    <Field label="Accessible Label" value={social.label} onChange={label => updateSocial(index, { label })} />
                    <div style={{ gridColumn: '1 / -1' }}><Field label="URL" value={social.url} onChange={url => updateSocial(index, { url })} /></div>
                </div>
            </div>)}
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" onClick={save} disabled={saving} style={{ minWidth: 170, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 18px', borderRadius: 8, border: 'none', background: C.green, color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.65 : 1 }}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Save Contact Page</button></div>
    </div>;
}
