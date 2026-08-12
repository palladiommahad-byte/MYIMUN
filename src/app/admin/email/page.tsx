'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Archive, ArrowLeft, CheckCircle2, Circle, Code2, Inbox, LoaderCircle, Mail,
    Paperclip, Plus, RefreshCw, Search, Send, UserPlus, Users, X
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

type Recipient = { name?: string; email: string; delivery?: 'to' | 'bcc'; delegateId?: string };
type ComposeMode = 'plain' | 'html';
type DelegateContact = {
    delegateId: string;
    fullName: string;
    email: string;
    country: string;
    paymentStatus: string;
    status: string;
};
type EmailMessage = {
    id: number;
    direction: 'inbound' | 'outbound';
    fromName: string;
    fromAddress: string;
    to: Recipient[];
    cc: Recipient[];
    bcc: Recipient[];
    subject: string;
    text: string;
    html?: string | null;
    snippet: string;
    attachments: Array<{ filename: string; contentType: string; size: number }>;
    sentAt: string;
};
type OutboundAttachment = {
    filename: string;
    contentType: string;
    contentBase64: string;
    size: number;
};
type EmailThread = {
    id: number;
    subject: string;
    externalName: string;
    externalEmail: string;
    mailbox: 'inbox' | 'sent';
    status: 'open' | 'resolved';
    unread: boolean;
    lastMessageAt: string;
    messages: EmailMessage[];
};

const emptyCompose = { subject: '', text: '', manualName: '', manualEmail: '', delegateId: '', mode: 'plain' as ComposeMode };
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const MAX_RECIPIENTS_PER_EMAIL = 20;

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Request failed');
    return json.data as T;
}

function recipientLabel(recipient: Recipient) {
    return recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email;
}

function textFromHtml(html: string) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<\/(p|div|h[1-6]|li|tr|table|section|article|br)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToAttachment(file: File): Promise<OutboundAttachment> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
        reader.onload = () => {
            const result = String(reader.result || '');
            const contentBase64 = result.includes(',') ? result.split(',').pop() || '' : result;
            resolve({
                filename: file.name,
                contentType: file.type || 'application/octet-stream',
                contentBase64,
                size: file.size,
            });
        };
        reader.readAsDataURL(file);
    });
}

export default function AdminEmailPage() {
    const { showToast } = useToast();
    const [threads, setThreads] = useState<EmailThread[]>([]);
    const [contacts, setContacts] = useState<DelegateContact[]>([]);
    const [configured, setConfigured] = useState<boolean | null>(null);
    const [fromAddress, setFromAddress] = useState('contact@moroccanmun.org');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [mailbox, setMailbox] = useState<'all' | 'inbox' | 'sent'>('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeSaving, setComposeSaving] = useState(false);
    const [compose, setCompose] = useState(emptyCompose);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [unpaidPickerOpen, setUnpaidPickerOpen] = useState(false);
    const [unpaidSearch, setUnpaidSearch] = useState('');
    const [sentDelegateIds, setSentDelegateIds] = useState<string[]>([]);
    const [composeAttachments, setComposeAttachments] = useState<OutboundAttachment[]>([]);
    const [replyText, setReplyText] = useState('');
    const [replyAttachments, setReplyAttachments] = useState<OutboundAttachment[]>([]);
    const [replySaving, setReplySaving] = useState(false);
    const [mobilePane, setMobilePane] = useState<'list' | 'detail'>('list');

    const selected = threads.find(thread => thread.id === selectedId) ?? null;

    const loadThreads = async () => {
        const params = new URLSearchParams();
        if (mailbox !== 'all') params.set('mailbox', mailbox);
        if (search.trim()) params.set('search', search.trim());
        const data = await api<EmailThread[]>(`/api/email/threads?${params}`);
        setThreads(data);
        setSelectedId(current => current ?? data[0]?.id ?? null);
    };

    useEffect(() => {
        let alive = true;
        Promise.all([
            api<{ configured: boolean; fromAddress: string }>('/api/email/config'),
            api<DelegateContact[]>('/api/email/contacts'),
        ])
            .then(([config, delegateRows]) => {
                if (!alive) return;
                setConfigured(config.configured);
                setFromAddress(config.fromAddress);
                setContacts(delegateRows);
            })
            .catch(error => showToast(error instanceof Error ? error.message : 'Could not load email settings', 'error'))
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [showToast]);

    useEffect(() => {
        let alive = true;
        Promise.resolve().then(loadThreads)
            .catch(error => { if (alive) showToast(error instanceof Error ? error.message : 'Could not load email threads', 'error'); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mailbox]);

    const filteredThreads = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return threads;
        return threads.filter(thread =>
            [thread.subject, thread.externalName, thread.externalEmail, thread.messages.at(-1)?.snippet ?? '']
                .some(value => value.toLowerCase().includes(q)),
        );
    }, [threads, search]);
    const unpaidContacts = useMemo(
        () => contacts.filter(contact => contact.paymentStatus !== 'Paid'),
        [contacts],
    );
    const filteredUnpaidContacts = useMemo(() => {
        const query = unpaidSearch.trim().toLowerCase();
        if (!query) return unpaidContacts;
        return unpaidContacts.filter(contact =>
            [contact.fullName, contact.email, contact.country]
                .some(value => value.toLowerCase().includes(query)),
        );
    }, [unpaidContacts, unpaidSearch]);
    const selectedUnpaidIds = useMemo(
        () => new Set(recipients
            .filter(recipient => recipient.delivery === 'bcc' && recipient.delegateId)
            .map(recipient => recipient.delegateId as string)),
        [recipients],
    );
    const sentDelegateIdSet = useMemo(() => new Set(sentDelegateIds), [sentDelegateIds]);

    const addRecipient = (recipient: Recipient) => {
        const email = recipient.email.trim().toLowerCase();
        if (!email) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Enter a valid email address.', 'error');
            return;
        }
        if (recipients.length >= MAX_RECIPIENTS_PER_EMAIL) {
            showToast(`Send no more than ${MAX_RECIPIENTS_PER_EMAIL} recipients in one email.`, 'error');
            return;
        }
        setRecipients(current => current.some(item => item.email === email)
            ? current
            : [...current, { ...recipient, name: recipient.name?.trim() || undefined, email }]);
    };

    const addFiles = async (files: FileList | null, target: 'compose' | 'reply') => {
        if (!files?.length) return;
        const current = target === 'compose' ? composeAttachments : replyAttachments;
        const incoming = Array.from(files);
        if (current.length + incoming.length > 5) {
            showToast('You can attach up to 5 files.', 'error');
            return;
        }
        if (incoming.some(file => file.size > MAX_ATTACHMENT_BYTES)) {
            showToast('Each attachment must be 8 MB or less.', 'error');
            return;
        }
        const total = [...current, ...incoming].reduce((sum, item) => sum + ('size' in item ? item.size : 0), 0);
        if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
            showToast('Attachments must be 15 MB or less in total.', 'error');
            return;
        }
        try {
            const parsed = await Promise.all(incoming.map(fileToAttachment));
            if (target === 'compose') setComposeAttachments(prev => [...prev, ...parsed]);
            else setReplyAttachments(prev => [...prev, ...parsed]);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not read attachment', 'error');
        }
    };

    const addManualRecipient = () => {
        addRecipient({ name: compose.manualName, email: compose.manualEmail });
        setCompose(current => ({ ...current, manualName: '', manualEmail: '' }));
    };

    const addDelegateRecipient = () => {
        const contact = contacts.find(item => item.delegateId === compose.delegateId);
        if (!contact) {
            showToast('Choose a delegate first.', 'error');
            return;
        }
        addRecipient({ name: contact.fullName, email: contact.email, delegateId: contact.delegateId });
    };

    const toggleUnpaidRecipient = (contact: DelegateContact) => {
        const selected = selectedUnpaidIds.has(contact.delegateId);
        if (selected) {
            setRecipients(current => current.filter(recipient => recipient.delegateId !== contact.delegateId));
            return;
        }
        if (sentDelegateIdSet.has(contact.delegateId)) return;
        addRecipient({
            name: contact.fullName,
            email: contact.email,
            delivery: 'bcc',
            delegateId: contact.delegateId,
        });
    };

    const selectNextUnpaidBatch = () => {
        if (unpaidContacts.length === 0) {
            showToast('No unpaid delegates found.', 'error');
            return;
        }

        const existingEmails = new Set(recipients.map(recipient => recipient.email.toLowerCase()));
        const availableSlots = MAX_RECIPIENTS_PER_EMAIL - recipients.length;
        if (availableSlots <= 0) {
            showToast(`This email already has ${MAX_RECIPIENTS_PER_EMAIL} recipients.`, 'error');
            return;
        }
        const additions = unpaidContacts
            .filter(contact => !sentDelegateIdSet.has(contact.delegateId))
            .map(contact => ({ name: contact.fullName, email: contact.email.trim().toLowerCase(), delivery: 'bcc' as const, delegateId: contact.delegateId }))
            .filter(recipient => recipient.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))
            .filter(recipient => !existingEmails.has(recipient.email))
            .slice(0, availableSlots);

        if (additions.length === 0) {
            showToast('There are no more unpaid delegates in this session.', 'success');
            return;
        }

        setRecipients(current => [...current, ...additions]);
        setUnpaidPickerOpen(true);
    };

    const refreshCurrentThread = (updated: EmailThread | null) => {
        if (!updated) return;
        setThreads(current => [updated, ...current.filter(thread => thread.id !== updated.id)]
            .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
        setSelectedId(updated.id);
    };

    const syncInbox = async () => {
        setSyncing(true);
        try {
            const result = await api<{ imported: number }>('/api/email/sync', { method: 'POST', body: '{}' });
            const data = await api<EmailThread[]>('/api/email/threads?mailbox=inbox');
            setMailbox('inbox');
            setThreads(data);
            setSelectedId(data[0]?.id ?? null);
            setComposeOpen(false);
            showToast(result.imported === 1 ? 'Imported 1 email.' : `Imported ${result.imported} emails.`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not sync inbox', 'error');
        } finally {
            setSyncing(false);
        }
    };

    const openThread = async (thread: EmailThread) => {
        setSelectedId(thread.id);
        setComposeOpen(false);
        setMobilePane('detail');
        if (!thread.unread) return;
        try {
            const updated = await api<EmailThread>(`/api/email/threads/${thread.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ action: 'markRead' }),
            });
            refreshCurrentThread(updated);
        } catch {
            setThreads(current => current.map(item => item.id === thread.id ? { ...item, unread: false } : item));
        }
    };

    const toggleStatus = async () => {
        if (!selected) return;
        const next = selected.status === 'open' ? 'resolved' : 'open';
        const updated = await api<EmailThread>(`/api/email/threads/${selected.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'setStatus', status: next }),
        });
        refreshCurrentThread(updated);
        showToast(next === 'resolved' ? 'Thread resolved.' : 'Thread reopened.', 'success');
    };

    const sendCompose = async (event: React.FormEvent) => {
        event.preventDefault();
        if (recipients.length === 0) { showToast('Add at least one recipient.', 'error'); return; }
        if (!compose.subject.trim() || !compose.text.trim()) { showToast('Add a subject and message.', 'error'); return; }
        const isHtmlMode = compose.mode === 'html';
        const bodyText = isHtmlMode
            ? textFromHtml(compose.text) || `${compose.subject.trim()}\n\nThis email contains HTML content.`
            : compose.text.trim();
        const visibleRecipients = recipients
            .filter(recipient => recipient.delivery !== 'bcc')
            .map(({ name, email }) => ({ name, email }));
        const bccRecipients = recipients
            .filter(recipient => recipient.delivery === 'bcc')
            .map(({ name, email }) => ({ name, email }));
        const sentBatchDelegateIds = recipients
            .filter(recipient => recipient.delivery === 'bcc' && recipient.delegateId)
            .map(recipient => recipient.delegateId as string);
        const toRecipients = visibleRecipients.length > 0
            ? visibleRecipients
            : [];
        setComposeSaving(true);
        try {
            const row = await api<EmailThread>('/api/email/threads', {
                method: 'POST',
                body: JSON.stringify({
                    to: toRecipients,
                    bcc: bccRecipients,
                    subject: compose.subject.trim(),
                    text: bodyText,
                    html: isHtmlMode ? compose.text.trim() : undefined,
                    attachments: composeAttachments,
                }),
            });
            refreshCurrentThread(row);
            setRecipients([]);
            if (sentBatchDelegateIds.length > 0 && visibleRecipients.length === 0) {
                setSentDelegateIds(current => Array.from(new Set([...current, ...sentBatchDelegateIds])));
                setUnpaidPickerOpen(true);
                showToast(`Email sent to ${sentBatchDelegateIds.length}. Select the next batch.`, 'success');
            } else {
                setComposeAttachments([]);
                setCompose(emptyCompose);
                setComposeOpen(false);
                setMobilePane('detail');
                showToast('Email sent.', 'success');
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not send email', 'error');
        } finally {
            setComposeSaving(false);
        }
    };

    const sendReply = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selected || !replyText.trim()) return;
        setReplySaving(true);
        try {
            const row = await api<EmailThread>(`/api/email/threads/${selected.id}/reply`, {
                method: 'POST',
                body: JSON.stringify({ text: replyText.trim(), attachments: replyAttachments }),
            });
            refreshCurrentThread(row);
            setReplyText('');
            setReplyAttachments([]);
            showToast('Reply sent.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not send reply', 'error');
        } finally {
            setReplySaving(false);
        }
    };

    return (
        <div className="admin-email-shell" data-mobile-pane={mobilePane} style={{ fontFamily: '"Inter",system-ui,sans-serif' }}>
            <style jsx>{`
                .admin-email-shell {
                    height: 100%;
                    min-height: 0;
                    display: grid;
                    grid-template-columns: minmax(300px, 340px) minmax(0, 1fr);
                    gap: 16px;
                }
                .admin-email-sidebar, .admin-email-pane { min-height: 0; }
                .admin-email-mobile-back { display: none; }
                @media (max-width: 767px) {
                    .admin-email-shell { display: block; height: auto; min-height: calc(100vh - 96px); }
                    .admin-email-sidebar, .admin-email-pane { width: 100% !important; min-height: calc(100vh - 122px); }
                    .admin-email-shell[data-mobile-pane="list"] .admin-email-pane,
                    .admin-email-shell[data-mobile-pane="detail"] .admin-email-sidebar { display: none !important; }
                    .admin-email-mobile-back { display: inline-flex; }
                    .admin-email-actions, .admin-email-compose-grid, .admin-email-html-grid { grid-template-columns: 1fr !important; }
                    .admin-email-batch-toolbar { align-items: stretch !important; flex-direction: column; }
                    .admin-email-batch-actions { width: 100%; }
                    .admin-email-batch-actions button { flex: 1; }
                    .admin-email-message { max-width: 92% !important; }
                }
            `}</style>

            <aside className="admin-email-sidebar" style={{ width: 330, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 800, fontSize: 23, color: C.text }}>Email</h1>
                        <p style={{ fontSize: 12.5, color: C.textSec, marginTop: 2 }}>{fromAddress}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button type="button" onClick={syncInbox} disabled={syncing || configured === false} title="Sync inbox"
                            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: syncing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: configured === false ? 0.45 : 1 }}>
                            {syncing ? <LoaderCircle size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> : <RefreshCw size={15} />}
                        </button>
                        <button type="button" onClick={() => { setComposeOpen(true); setMobilePane('detail'); setSentDelegateIds([]); setUnpaidSearch(''); }} title="New email"
                            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${composeOpen ? C.accent : C.border}`, background: composeOpen ? C.accent : C.surface, color: composeOpen ? '#fff' : C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {configured === false && (
                    <div style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.red}30`, background: `${C.red}08`, color: C.red, fontSize: 12.5, lineHeight: 1.45 }}>
                        Add the Namecheap mailbox password to `.env` before syncing or sending.
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {(['all', 'inbox', 'sent'] as const).map(tab => {
                        const active = mailbox === tab;
                        return (
                            <button key={tab} type="button" onClick={() => setMailbox(tab)}
                                style={{ padding: '8px 9px', borderRadius: 8, border: `1px solid ${active ? C.accent : C.border}`, background: active ? `${C.accent}0D` : C.surface, color: active ? C.accent : C.textSec, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                                {tab}
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={(event) => { event.preventDefault(); loadThreads().catch(error => showToast(error.message, 'error')); }} style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                    <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search email..."
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, fontSize: 13, outline: 'none' }} />
                </form>

                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: C.shadow }}>
                    {loading && threads.length === 0 ? (
                        <div style={{ padding: 28, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                            <LoaderCircle size={24} style={{ margin: '0 auto 8px', color: C.accent, animation: 'spin 0.9s linear infinite' }} />
                            Loading email...
                        </div>
                    ) : filteredThreads.length === 0 ? (
                        <div style={{ padding: 28, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                            <Mail size={30} style={{ margin: '0 auto 8px', opacity: 0.35 }} />
                            No email threads yet.
                        </div>
                    ) : filteredThreads.map(thread => {
                        const active = thread.id === selectedId && !composeOpen;
                        const last = thread.messages.at(-1);
                        return (
                            <button key={thread.id} type="button" onClick={() => openThread(thread)}
                                style={{ width: '100%', textAlign: 'left', padding: '13px 14px', border: 'none', borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${active ? C.accent : 'transparent'}`, background: active ? `${C.accent}08` : C.surface, cursor: 'pointer', display: 'flex', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 9, background: thread.mailbox === 'sent' ? `${C.green}16` : `${C.accent}14`, color: thread.mailbox === 'sent' ? C.green : C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {thread.mailbox === 'sent' ? <Send size={16} /> : <Inbox size={16} />}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                                        <p style={{ fontSize: 13, fontWeight: thread.unread ? 800 : 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.externalName || thread.externalEmail}</p>
                                        <span style={{ fontSize: 10.5, color: C.textMuted, flexShrink: 0 }}>{formatDate(thread.lastMessageAt)}</span>
                                    </div>
                                    <p style={{ marginTop: 3, fontSize: 12.5, color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: thread.unread ? 700 : 500 }}>{thread.subject}</p>
                                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 7 }}>
                                        {thread.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent }} />}
                                        <span style={{ fontSize: 11, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last?.snippet || thread.externalEmail}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <section className="admin-email-pane" style={{ minWidth: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: C.shadow, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {composeOpen ? (
                    <form onSubmit={sendCompose} style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                <button type="button" className="admin-email-mobile-back" onClick={() => setMobilePane('list')} title="Back to email"
                                    style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', flexShrink: 0 }}>
                                    <ArrowLeft size={16} />
                                </button>
                                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${C.accent}12`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Send size={19} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 800, color: C.text }}>New Email</p>
                                    <p style={{ fontSize: 12.5, color: C.textSec, marginTop: 2 }}>Sending as {fromAddress}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setComposeOpen(false)} title="Close composer"
                                style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={17} />
                            </button>
                        </div>

                        <div style={{ padding: 20, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>
                            <div className="admin-email-compose-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase' }}>Registered Delegate</span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <select value={compose.delegateId} onChange={event => setCompose(current => ({ ...current, delegateId: event.target.value }))}
                                            style={{ flex: 1, minWidth: 0, padding: '10px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: 'none' }}>
                                            <option value="">Choose delegate...</option>
                                            {contacts.map(contact => (
                                                <option key={contact.delegateId} value={contact.delegateId}>{contact.fullName} - {contact.email}</option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={addDelegateRecipient} title="Add delegate"
                                            style={{ width: 40, borderRadius: 8, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <UserPlus size={16} />
                                        </button>
                                    </div>
                                    <button type="button" onClick={() => setUnpaidPickerOpen(current => !current)} title="Choose unpaid registered delegates as BCC"
                                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 36, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.accent}30`, background: `${C.accent}08`, color: C.accent, fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                                        <Users size={15} /> Choose Unpaid BCC ({selectedUnpaidIds.size}/{MAX_RECIPIENTS_PER_EMAIL})
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase' }}>Manual Recipient</span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 40px', gap: 8 }}>
                                        <input value={compose.manualName} onChange={event => setCompose(current => ({ ...current, manualName: event.target.value }))} placeholder="Name"
                                            style={{ minWidth: 0, padding: '10px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: 'none' }} />
                                        <input type="email" value={compose.manualEmail} onChange={event => setCompose(current => ({ ...current, manualEmail: event.target.value }))} placeholder="email@example.com"
                                            style={{ minWidth: 0, padding: '10px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: 'none' }} />
                                        <button type="button" onClick={addManualRecipient} title="Add recipient"
                                            style={{ borderRadius: 8, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {unpaidPickerOpen && createPortal(
                                <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setUnpaidPickerOpen(false); }}
                                    style={{ position: 'fixed', inset: 0, zIndex: 1200, padding: 16, background: 'rgba(17,24,39,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <section role="dialog" aria-modal="true" aria-labelledby="unpaid-picker-title"
                                        style={{ width: '100%', maxWidth: 680, maxHeight: 'min(720px, calc(100vh - 32px))', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', background: C.surface, boxShadow: '0 24px 70px rgba(17,24,39,0.22)', display: 'flex', flexDirection: 'column' }}>
                                        <div className="admin-email-batch-toolbar" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${C.border}`, background: '#FAFBFC' }}>
                                            <div>
                                                <p id="unpaid-picker-title" style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Choose unpaid delegates</p>
                                                <p style={{ fontSize: 11.5, color: C.textSec, marginTop: 2 }}>
                                                    {selectedUnpaidIds.size}/{MAX_RECIPIENTS_PER_EMAIL} selected · {sentDelegateIds.length} sent this session · {Math.max(0, unpaidContacts.length - sentDelegateIds.length)} remaining
                                                </p>
                                            </div>
                                            <button type="button" onClick={() => setUnpaidPickerOpen(false)} title="Close delegate selector"
                                                style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 7, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <X size={17} />
                                            </button>
                                        </div>
                                        <div className="admin-email-batch-toolbar" style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.border}` }}>
                                            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                                                <Search size={14} style={{ position: 'absolute', left: 11, top: 11, color: C.textMuted }} />
                                                <input autoFocus value={unpaidSearch} onChange={event => setUnpaidSearch(event.target.value)} placeholder="Search by name, email, or country..."
                                                    style={{ width: '100%', minWidth: 0, padding: '9px 11px 9px 33px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12.5, outline: 'none' }} />
                                            </div>
                                            <div className="admin-email-batch-actions" style={{ display: 'flex', gap: 8 }}>
                                                <button type="button" onClick={() => setRecipients(current => current.filter(recipient => recipient.delivery !== 'bcc'))}
                                                    disabled={selectedUnpaidIds.size === 0}
                                                    style={{ minHeight: 36, padding: '7px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 12, fontWeight: 800, cursor: selectedUnpaidIds.size === 0 ? 'default' : 'pointer', opacity: selectedUnpaidIds.size === 0 ? 0.5 : 1 }}>
                                                    Clear
                                                </button>
                                                <button type="button" onClick={selectNextUnpaidBatch}
                                                    style={{ minHeight: 36, padding: '7px 12px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                    Select Next 20
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ minHeight: 180, overflowY: 'auto', flex: 1 }}>
                                            {filteredUnpaidContacts.length === 0 ? (
                                                <p style={{ padding: 28, color: C.textMuted, fontSize: 12.5, textAlign: 'center' }}>No unpaid delegates match this search.</p>
                                            ) : filteredUnpaidContacts.map(contact => {
                                                const checked = selectedUnpaidIds.has(contact.delegateId);
                                                const sent = sentDelegateIdSet.has(contact.delegateId);
                                                const atLimit = recipients.length >= MAX_RECIPIENTS_PER_EMAIL && !checked;
                                                const disabled = sent || atLimit;
                                                return (
                                                    <label key={contact.delegateId} style={{ minHeight: 56, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: `1px solid ${C.border}`, cursor: disabled ? 'default' : 'pointer', opacity: sent ? 0.55 : 1, background: checked ? `${C.accent}08` : C.surface }}>
                                                        <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleUnpaidRecipient(contact)}
                                                            style={{ width: 16, height: 16, accentColor: C.accent, flexShrink: 0 }} />
                                                        <span style={{ minWidth: 0, flex: 1 }}>
                                                            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.fullName}</span>
                                                            <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email}{contact.country ? ` · ${contact.country}` : ''}</span>
                                                        </span>
                                                        <span style={{ flexShrink: 0, padding: '4px 7px', borderRadius: 6, background: sent ? `${C.green}12` : C.bg, color: sent ? C.green : C.textMuted, fontSize: 10.5, fontWeight: 800 }}>
                                                            {sent ? 'Sent' : checked ? 'Selected' : 'Unpaid'}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                            <span style={{ fontSize: 12, color: C.textSec }}>{selectedUnpaidIds.size} delegate{selectedUnpaidIds.size === 1 ? '' : 's'} ready as BCC</span>
                                            <button type="button" onClick={() => setUnpaidPickerOpen(false)}
                                                style={{ minHeight: 36, padding: '8px 16px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                                                Done
                                            </button>
                                        </div>
                                    </section>
                                </div>,
                                document.body,
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 32, maxHeight: 104, overflowY: 'auto', paddingRight: 4 }}>
                                {recipients.length === 0 ? (
                                    <span style={{ color: C.textMuted, fontSize: 12.5 }}>No recipients added yet.</span>
                                ) : (
                                    <>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 9px', borderRadius: 8, background: C.bg, color: C.textSec, border: `1px solid ${C.border}`, fontSize: 12.5, fontWeight: 800 }}>
                                            {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
                                        </span>
                                        {recipients.map(recipient => (
                                            <span key={recipient.email} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 8, background: `${C.accent}0D`, color: C.accent, border: `1px solid ${C.accent}22`, fontSize: 12.5, fontWeight: 700 }}>
                                                {recipient.delivery === 'bcc' ? `BCC: ${recipientLabel(recipient)}` : recipientLabel(recipient)}
                                                <button type="button" onClick={() => setRecipients(current => current.filter(item => item.email !== recipient.email))} title="Remove recipient"
                                                    style={{ border: 'none', background: 'transparent', color: C.accent, cursor: 'pointer', padding: 0, display: 'flex' }}>
                                                    <X size={13} />
                                                </button>
                                            </span>
                                        ))}
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase' }}>Attachments</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                    <label title="Attach files"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 11px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                                        <Paperclip size={14} /> Attach
                                        <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={event => { void addFiles(event.target.files, 'compose'); event.currentTarget.value = ''; }} style={{ display: 'none' }} />
                                    </label>
                                    {composeAttachments.length === 0 ? (
                                        <span style={{ fontSize: 12.5, color: C.textMuted }}>Images, PDFs, and documents up to 15 MB total.</span>
                                    ) : composeAttachments.map(attachment => (
                                        <span key={`${attachment.filename}-${attachment.size}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 8, background: C.bg, color: C.textSec, border: `1px solid ${C.border}`, fontSize: 12.5, fontWeight: 700 }}>
                                            <Paperclip size={13} /> {attachment.filename} <span style={{ color: C.textMuted }}>{formatBytes(attachment.size)}</span>
                                            <button type="button" onClick={() => setComposeAttachments(current => current.filter(item => item !== attachment))} title="Remove attachment"
                                                style={{ border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', padding: 0, display: 'flex' }}>
                                                <X size={13} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase' }}>Subject</span>
                                <input value={compose.subject} onChange={event => setCompose(current => ({ ...current, subject: event.target.value }))} placeholder="Subject"
                                    style={{ padding: '11px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13.5, outline: 'none' }} />
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase' }}>{compose.mode === 'html' ? 'HTML Code' : 'Message'}</span>
                                    <div style={{ display: 'inline-flex', padding: 3, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, gap: 3 }}>
                                        {(['plain', 'html'] as ComposeMode[]).map(mode => {
                                            const active = compose.mode === mode;
                                            const Icon = mode === 'html' ? Code2 : Mail;
                                            return (
                                                <button key={mode} type="button" onClick={() => setCompose(current => ({ ...current, mode }))}
                                                    title={mode === 'html' ? 'HTML code mode' : 'Plain message mode'}
                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 30, padding: '6px 10px', borderRadius: 7, border: 'none', background: active ? C.accent : 'transparent', color: active ? '#fff' : C.textSec, fontSize: 12, fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize' }}>
                                                    <Icon size={13} /> {mode}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {compose.mode === 'html' ? (
                                    <div className="admin-email-html-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 300 }}>
                                        <textarea value={compose.text} onChange={event => setCompose(current => ({ ...current, text: event.target.value }))}
                                            placeholder="<!doctype html>..."
                                            spellCheck={false}
                                            style={{ minHeight: 300, padding: '12px 13px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#0F1629', color: '#F0F4FF', fontSize: 13, lineHeight: 1.55, outline: 'none', resize: 'vertical', fontFamily: '"JetBrains Mono", monospace' }} />
                                        <iframe title="HTML email preview" srcDoc={compose.text} sandbox=""
                                            style={{ width: '100%', minHeight: 300, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface }} />
                                    </div>
                                ) : (
                                    <textarea value={compose.text} onChange={event => setCompose(current => ({ ...current, text: event.target.value }))} placeholder="Write your email..."
                                        style={{ minHeight: 260, flex: 1, padding: '12px 13px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13.5, lineHeight: 1.55, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: '#FAFBFC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button type="button" onClick={() => setComposeOpen(false)} disabled={composeSaving}
                                style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" disabled={composeSaving || configured === false}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 800, cursor: composeSaving ? 'wait' : 'pointer', opacity: configured === false ? 0.5 : 1 }}>
                                {composeSaving ? <LoaderCircle size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> : <Send size={15} />}
                                {composeSaving ? 'Sending...' : recipients.length > 0 ? `Send to ${recipients.length}` : 'Send Email'}
                            </button>
                        </div>
                    </form>
                ) : selected ? (
                    <>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                <button type="button" className="admin-email-mobile-back" onClick={() => setMobilePane('list')} title="Back to email"
                                    style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', flexShrink: 0 }}>
                                    <ArrowLeft size={16} />
                                </button>
                                <div style={{ width: 42, height: 42, borderRadius: 10, background: selected.mailbox === 'sent' ? `${C.green}16` : `${C.accent}12`, color: selected.mailbox === 'sent' ? C.green : C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Mail size={19} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 15, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.subject}</p>
                                    <p style={{ fontSize: 12.5, color: C.textSec, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.externalName} - {selected.externalEmail}</p>
                                </div>
                            </div>
                            <button type="button" onClick={toggleStatus} title={selected.status === 'open' ? 'Resolve thread' : 'Reopen thread'}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 11px', borderRadius: 8, border: `1px solid ${selected.status === 'open' ? C.green : C.border}`, background: selected.status === 'open' ? `${C.green}10` : C.surface, color: selected.status === 'open' ? C.green : C.textSec, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                {selected.status === 'open' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                {selected.status === 'open' ? 'Resolve' : 'Reopen'}
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {selected.messages.map(message => {
                                const outbound = message.direction === 'outbound';
                                return (
                                    <div key={message.id} style={{ display: 'flex', justifyContent: outbound ? 'flex-end' : 'flex-start' }}>
                                        <div className="admin-email-message" style={{ maxWidth: '76%', padding: '12px 14px', borderRadius: 12, borderTopRightRadius: outbound ? 3 : 12, borderTopLeftRadius: outbound ? 12 : 3, background: outbound ? C.accent : C.bg, color: outbound ? '#fff' : C.text, border: outbound ? 'none' : `1px solid ${C.border}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, marginBottom: 7, alignItems: 'center' }}>
                                                <span style={{ fontSize: 11.5, fontWeight: 800, opacity: 0.78 }}>{outbound ? `You to ${message.to.length > 0 ? message.to.map(recipientLabel).join(', ') : `BCC: ${message.bcc.map(recipientLabel).join(', ')}`}` : `${message.fromName || message.fromAddress}`}</span>
                                                <span style={{ fontSize: 10.5, opacity: 0.65, flexShrink: 0 }}>{formatDate(message.sentAt)}</span>
                                            </div>
                                            <p style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.58 }}>{message.text || message.snippet}</p>
                                            {message.attachments?.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                                                    {message.attachments.map(attachment => (
                                                        <span key={`${message.id}-${attachment.filename}`} style={{ fontSize: 11, fontWeight: 700, padding: '4px 7px', borderRadius: 7, background: outbound ? 'rgba(255,255,255,0.16)' : C.surface, border: outbound ? '1px solid rgba(255,255,255,0.22)' : `1px solid ${C.border}` }}>
                                                            {attachment.filename}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={sendReply} style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, background: '#FAFBFC', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {replyAttachments.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                        {replyAttachments.map(attachment => (
                                            <span key={`${attachment.filename}-${attachment.size}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 7, background: C.surface, color: C.textSec, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700 }}>
                                                <Paperclip size={12} /> {attachment.filename} <span style={{ color: C.textMuted }}>{formatBytes(attachment.size)}</span>
                                                <button type="button" onClick={() => setReplyAttachments(current => current.filter(item => item !== attachment))} title="Remove attachment"
                                                    style={{ border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', padding: 0, display: 'flex' }}>
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <textarea value={replyText} onChange={event => setReplyText(event.target.value)} placeholder={`Reply to ${selected.externalEmail}...`}
                                    style={{ minHeight: 72, maxHeight: 150, padding: '11px 12px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13.5, lineHeight: 1.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                            <label title="Attach files"
                                style={{ width: 46, height: 46, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Paperclip size={18} />
                                <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={event => { void addFiles(event.target.files, 'reply'); event.currentTarget.value = ''; }} style={{ display: 'none' }} />
                            </label>
                            <button type="submit" disabled={(!replyText.trim() && replyAttachments.length === 0) || replySaving || configured === false}
                                style={{ width: 46, height: 46, borderRadius: 9, border: 'none', background: C.accent, color: '#fff', cursor: replySaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!replyText.trim() && replyAttachments.length === 0) || configured === false ? 0.45 : 1 }}>
                                {replySaving ? <LoaderCircle size={18} style={{ animation: 'spin 0.9s linear infinite' }} /> : <Send size={18} />}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: C.textMuted, textAlign: 'center', padding: 20 }}>
                        <Archive size={42} style={{ opacity: 0.35 }} />
                        <p style={{ fontSize: 15, fontWeight: 700 }}>No email selected</p>
                        <p style={{ fontSize: 13 }}>Sync the Namecheap inbox or compose a new email.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
