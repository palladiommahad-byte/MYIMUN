'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Send, MoreVertical, User, Mail, Paperclip, CheckCheck, Clock, Settings2, Save, X, ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference, Conversation } from '@/context/ConferenceContext';
import { DEFAULT_DELEGATE_SUPPORT, DelegateSupportData, resolveDelegateSupport } from '@/lib/delegateSupport';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const AVATAR_COLORS = ['#3B7FFF', '#7C5FFF', '#10B981', '#EC4899', '#F59E0B'];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

const SUPPORT_FIELDS: Array<{ key: keyof DelegateSupportData; label: string; placeholder: string; type?: string }> = [
    { key: 'email', label: 'Support Email', placeholder: 'secretariat@myimun.org', type: 'email' },
    { key: 'emailNote', label: 'Email Note', placeholder: 'Response time: < 24h' },
    { key: 'emergencyPhone', label: 'Emergency Phone', placeholder: '+212 555 0192', type: 'tel' },
    { key: 'emergencyNote', label: 'Emergency Note', placeholder: 'Available 24/7 during conference' },
    { key: 'office', label: 'Secretariat Office', placeholder: 'Room 102, 1st Floor' },
    { key: 'officeNote', label: 'Office Note', placeholder: 'Main Conference Hall' },
];
const CATEGORIES = ['General Inquiry', 'Logistics', 'Committee', 'Payments', 'Technical'];
type ComposeAudience = 'single' | 'all' | 'paid' | 'unpaid';
const EMPTY_COMPOSE = { audience: 'single' as ComposeAudience, delegateId: '', subject: '', category: 'General Inquiry', message: '' };

export default function AdminMessagesPage() {
    const { showToast } = useToast();
    const { conversations, registrations, startConversation, sendChatMessage, markRead } = useConference();

    const [selectedId, setSelectedId] = useState<number | null>(conversations[0]?.id ?? null);
    const [replyText,  setReplyText]  = useState('');
    const [search,     setSearch]     = useState('');
    const [supportOpen, setSupportOpen] = useState(false);
    const [supportSaving, setSupportSaving] = useState(false);
    const [support, setSupport] = useState<DelegateSupportData>(DEFAULT_DELEGATE_SUPPORT);
    const [mobilePane, setMobilePane] = useState<'list' | 'detail'>('list');
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeSaving, setComposeSaving] = useState(false);
    const [compose, setCompose] = useState(EMPTY_COMPOSE);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const selected = conversations.find(c => c.id === selectedId) ?? null;

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selected?.messages.length]);

    // Mark as read when admin opens a conversation
    useEffect(() => {
        if (selectedId) markRead(selectedId, 'admin');
    }, [selectedId]); // eslint-disable-line

    useEffect(() => {
        void fetch('/api/settings/delegate-support', { cache: 'no-store' })
            .then(res => res.ok ? res.json() : null)
            .then(json => { if (json?.ok) setSupport(resolveDelegateSupport(json.data)); })
            .catch(() => {});
    }, []);

    const totalUnread = conversations.reduce((s, c) => s + c.adminUnread, 0);

    const filtered = conversations.filter(c =>
        c.delegateName.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => b.id - a.id);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedId) return;
        sendChatMessage(selectedId, replyText.trim(), 'admin');
        setReplyText('');
        showToast('Reply sent', 'success');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
    };

    const saveSupport = async () => {
        setSupportSaving(true);
        try {
            const response = await fetch('/api/settings/delegate-support', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(support),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Could not save support contact details');
            setSupportOpen(false);
            showToast('Delegate support contact details updated.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not save support contact details', 'error');
        } finally {
            setSupportSaving(false);
        }
    };

    const lastMsg = (conv: Conversation) => conv.messages[conv.messages.length - 1];
    const registeredDelegates = registrations
        .filter(reg => reg.delegateId && reg.accountStatus !== 'inactive')
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
    const paidDelegates = registeredDelegates.filter(reg => reg.paymentStatus === 'Paid');
    const unpaidDelegates = registeredDelegates.filter(reg => reg.paymentStatus !== 'Paid');
    const targetDelegates = compose.audience === 'single'
        ? registeredDelegates.filter(reg => reg.delegateId === compose.delegateId)
        : compose.audience === 'paid'
            ? paidDelegates
            : compose.audience === 'unpaid'
                ? unpaidDelegates
                : registeredDelegates;

    const openCompose = () => {
        setComposeOpen(true);
        setCompose(current => ({
            ...current,
            delegateId: current.delegateId || registeredDelegates[0]?.delegateId || '',
        }));
        setMobilePane('detail');
    };

    const handleStartConversation = async (event: React.FormEvent) => {
        event.preventDefault();
        if (targetDelegates.length === 0) { showToast('No delegates match this recipient filter.', 'error'); return; }
        if (!compose.subject.trim() || !compose.message.trim()) { showToast('Add a subject and message.', 'error'); return; }

        setComposeSaving(true);
        try {
            const createdThreads = await Promise.all(targetDelegates.map(delegate =>
                startConversation(
                    delegate.delegateId,
                    delegate.fullName,
                    delegate.email,
                    delegate.country,
                    compose.subject.trim(),
                    compose.category,
                    compose.message.trim(),
                )
            ));
            const created = createdThreads[0];
            setSelectedId(created.id);
            setCompose(EMPTY_COMPOSE);
            setComposeOpen(false);
            setMobilePane('detail');
            showToast(
                targetDelegates.length === 1
                    ? `Message sent to ${targetDelegates[0].fullName}.`
                    : `Message sent to ${targetDelegates.length} delegates.`,
                'success',
            );
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not start conversation.', 'error');
        } finally {
            setComposeSaving(false);
        }
    };

    return (
        <>
        <style jsx>{`
            .admin-messages-shell {
                height: calc(100vh - 140px);
                min-height: 560px;
                display: grid;
                grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
                gap: 16px;
            }
            .admin-messages-sidebar,
            .admin-messages-pane {
                min-width: 0;
            }
            .admin-mobile-back {
                display: none;
            }
            @media (max-width: 720px) {
                .admin-messages-shell {
                    height: auto;
                    min-height: calc(100vh - 96px);
                    display: block;
                }
                .admin-messages-sidebar,
                .admin-messages-pane {
                    width: 100% !important;
                    min-height: calc(100vh - 122px);
                }
                .admin-messages-shell[data-mobile-pane="list"] .admin-messages-pane,
                .admin-messages-shell[data-mobile-pane="detail"] .admin-messages-sidebar {
                    display: none !important;
                }
                .admin-mobile-back {
                    display: inline-flex;
                }
                .admin-message-header {
                    align-items: flex-start !important;
                    gap: 10px !important;
                }
                .admin-message-meta {
                    flex-wrap: wrap;
                    gap: 5px !important;
                    line-height: 1.4;
                }
                .admin-message-bubble {
                    max-width: 88% !important;
                }
                .admin-support-grid {
                    grid-template-columns: 1fr !important;
                }
                .admin-compose-grid {
                    grid-template-columns: 1fr !important;
                }
            }
        `}</style>
        <div className="admin-messages-shell" data-mobile-pane={mobilePane} style={{ fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* ── Sidebar ── */}
            <div className="admin-messages-sidebar" style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 22, color: C.text }}>Inbox</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {totalUnread > 0 && (
                            <span style={{ background: C.accent, color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                                {totalUnread} New
                            </span>
                        )}
                        <button type="button" onClick={openCompose} title="Message registered delegates"
                            style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${composeOpen ? C.accent : C.border}`, background: composeOpen ? C.accent : C.surface, color: composeOpen ? '#fff' : C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={15} /></button>
                        <button type="button" onClick={() => setSupportOpen(true)} title="Edit delegate support contact details"
                            style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings2 size={14} /></button>
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                    <input type="text" placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', paddingLeft: 33, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e => e.target.style.borderColor = C.border}
                    />
                </div>

                {/* Message list */}
                <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: C.shadow }}>
                    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Messages</span>
                        <Filter size={13} style={{ color: C.textMuted }} />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                <Mail size={28} style={{ color: C.border, margin: '0 auto 8px' }} />
                                <p style={{ fontSize: 13, color: C.textMuted }}>No messages yet.<br />Delegates will appear here when they contact you.</p>
                            </div>
                        ) : filtered.map(conv => {
                            const isActive = selectedId === conv.id;
                            const col = avatarColor(conv.id);
                            const last = lastMsg(conv);
                            const hasUnread = conv.adminUnread > 0;
                            return (
                                <button key={conv.id} onClick={() => { setComposeOpen(false); setSelectedId(conv.id); setMobilePane('detail'); }}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '12px 14px',
                                        borderLeft: `3px solid ${isActive ? C.accent : 'transparent'}`,
                                        borderRight: 'none', borderTop: 'none',
                                        borderBottom: `1px solid ${C.border}`,
                                        background: isActive ? `${C.accent}08` : 'transparent',
                                        display: 'flex', gap: 10, cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.bg; }}
                                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${col}20`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                                        {conv.delegateName.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                                            <span style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                                {conv.delegateName}
                                            </span>
                                            <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0, marginLeft: 4 }}>{conv.lastMessageAt}</span>
                                        </div>
                                        <p style={{ fontSize: 12, color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                                            {conv.subject}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1px 6px', borderRadius: 4, background: C.bg, color: C.textSec }}>
                                                {conv.category}
                                            </span>
                                            {hasUnread
                                                ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
                                                : last?.sender === 'admin' && <CheckCheck size={11} style={{ color: C.accent }} />
                                            }
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Detail pane ── */}
            <div className="admin-messages-pane" style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: C.shadow }}>
                {composeOpen ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.surface }}>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                <button className="admin-mobile-back" onClick={() => setMobilePane('list')} title="Back to inbox"
                                    style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', flexShrink: 0 }}>
                                    <ArrowLeft size={16} />
                                </button>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.accent}12`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Message Delegates</p>
                                    <p style={{ fontSize: 12.5, color: C.textSec, marginTop: 2 }}>Secretariat outreach and delegate updates.</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setComposeOpen(false)} title="Close composer"
                                style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={17} />
                            </button>
                        </div>

                        <form onSubmit={handleStartConversation} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                            {registeredDelegates.length === 0 ? (
                                <div style={{ flex: 1, minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: C.textMuted, gap: 8 }}>
                                    <User size={42} style={{ opacity: 0.35 }} />
                                    <p style={{ fontSize: 15, fontWeight: 600 }}>No registered delegates yet</p>
                                    <p style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>Once delegates submit registration, they will appear here for direct outreach.</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recipients</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                                            {([
                                                ['single', 'One Delegate', compose.delegateId ? 1 : 0],
                                                ['all', 'All Delegates', registeredDelegates.length],
                                                ['paid', 'Paid Only', paidDelegates.length],
                                                ['unpaid', 'Unpaid Only', unpaidDelegates.length],
                                            ] as const).map(([value, label, count]) => {
                                                const active = compose.audience === value;
                                                return (
                                                    <button key={value} type="button" onClick={() => setCompose(current => ({ ...current, audience: value }))}
                                                        style={{ padding: '10px 11px', borderRadius: 9, border: `1.5px solid ${active ? C.accent : C.border}`, background: active ? `${C.accent}0D` : C.surface, color: active ? C.accent : C.textSec, cursor: 'pointer', textAlign: 'left' }}>
                                                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800 }}>{label}</span>
                                                        <span style={{ display: 'block', fontSize: 11, marginTop: 2 }}>{count} recipient{count === 1 ? '' : 's'}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="admin-compose-grid" style={{ display: 'grid', gridTemplateColumns: compose.audience === 'single' ? '1fr 180px' : '1fr', gap: 12 }}>
                                        {compose.audience === 'single' && (
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Delegate</span>
                                                <select value={compose.delegateId} onChange={event => setCompose(current => ({ ...current, delegateId: event.target.value }))}
                                                    style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }}>
                                                    {registeredDelegates.map(reg => (
                                                        <option key={reg.delegateId} value={reg.delegateId}>
                                                            {reg.fullName} - {reg.country}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        )}
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</span>
                                            <select value={compose.category} onChange={event => setCompose(current => ({ ...current, category: event.target.value }))}
                                                style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }}>
                                                {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                                            </select>
                                        </label>
                                    </div>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</span>
                                        <input value={compose.subject} onChange={event => setCompose(current => ({ ...current, subject: event.target.value }))}
                                            placeholder="e.g. Payment reminder, committee update, documents needed"
                                            style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }} />
                                    </label>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</span>
                                        <textarea value={compose.message} onChange={event => setCompose(current => ({ ...current, message: event.target.value }))}
                                            placeholder="Write the first message..."
                                            style={{ width: '100%', minHeight: 180, flex: 1, padding: '12px 14px', boxSizing: 'border-box', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13.5, lineHeight: 1.55, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                                    </label>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                                        <span style={{ marginRight: 'auto', alignSelf: 'center', fontSize: 12.5, color: C.textMuted }}>
                                            {targetDelegates.length} recipient{targetDelegates.length === 1 ? '' : 's'} selected
                                        </span>
                                        <button type="button" onClick={() => setComposeOpen(false)} disabled={composeSaving}
                                            style={{ padding: '10px 18px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                        <button type="submit" disabled={composeSaving || targetDelegates.length === 0}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: composeSaving ? 'wait' : targetDelegates.length === 0 ? 'not-allowed' : 'pointer', boxShadow: `0 3px 12px ${C.accent}35`, opacity: composeSaving || targetDelegates.length === 0 ? 0.65 : 1 }}>
                                            <Send size={15} /> {composeSaving ? 'Sending...' : targetDelegates.length > 1 ? 'Send Bulk Message' : 'Send Message'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                ) : selected ? (
                    <>
                        {/* Header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                            <div className="admin-message-header" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                <button className="admin-mobile-back" onClick={() => setMobilePane('list')} title="Back to inbox"
                                    style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', flexShrink: 0 }}>
                                    <ArrowLeft size={16} />
                                </button>
                                <div style={{
                                    width: 42, height: 42, borderRadius: '50%',
                                    background: `${avatarColor(selected.id)}20`,
                                    color: avatarColor(selected.id),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: 16, flexShrink: 0,
                                }}>{selected.delegateName.charAt(0)}</div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.delegateName}</p>
                                    <div className="admin-message-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.textSec }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} />{selected.delegateEmail}</span>
                                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.border, display: 'inline-block' }} />
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={11} />Delegate{selected.delegateCountry ? ` (${selected.delegateCountry})` : ''}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {[Clock, User, MoreVertical].map((Icon, i) => (
                                    <button key={i} style={{ padding: 7, borderRadius: 7, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                    ><Icon size={18} /></button>
                                ))}
                            </div>
                        </div>

                        {/* Thread */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, background: C.bg, padding: '3px 10px', borderRadius: 999 }}>
                                    {selected.createdAt}
                                </span>
                            </div>
                            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, textAlign: 'center' }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject: </span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{selected.subject}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {selected.messages.map(msg => (
                                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                                        <div className="admin-message-bubble" style={{
                                            maxWidth: '75%', borderRadius: 14, padding: '10px 14px',
                                            background: msg.sender === 'admin' ? C.accent : C.bg,
                                            color: msg.sender === 'admin' ? 'white' : C.text,
                                            borderTopRightRadius: msg.sender === 'admin' ? 2 : 14,
                                            borderTopLeftRadius:  msg.sender === 'admin' ? 14 : 2,
                                        }}>
                                            <p style={{ fontSize: 13, lineHeight: 1.55 }}>{msg.text}</p>
                                            <p style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>{msg.time}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Reply box */}
                        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, background: '#FAFBFC' }}>
                            <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                                <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', background: C.surface }}>
                                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={handleKeyDown}
                                        placeholder="Type your reply…"
                                        style={{ width: '100%', padding: '10px 12px', minHeight: 60, maxHeight: 120, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.text, resize: 'none', fontFamily: 'inherit' }}
                                    />
                                    <div style={{ padding: '6px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button type="button" style={{ color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><Paperclip size={16} /></button>
                                        <span style={{ fontSize: 11, color: C.textMuted }}>Enter to send</span>
                                    </div>
                                </div>
                                <button type="submit" disabled={!replyText.trim()}
                                    style={{ padding: '13px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: C.accent, color: 'white', opacity: replyText.trim() ? 1 : 0.45, boxShadow: `0 2px 8px ${C.accent}40` }}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted, gap: 8 }}>
                        <button className="admin-mobile-back" onClick={() => setMobilePane('list')} title="Back to inbox"
                            style={{ marginBottom: 8, alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            <ArrowLeft size={15} /> Back
                        </button>
                        <Mail size={44} style={{ opacity: 0.3 }} />
                        <p style={{ fontSize: 15, fontWeight: 500 }}>Select a message to view</p>
                        <p style={{ fontSize: 13 }}>Conversations from delegates will appear in your inbox.</p>
                    </div>
                )}
            </div>
            {supportOpen && (
                <div role="dialog" aria-modal="true" aria-label="Delegate support contact details" style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(17,24,39,0.42)' }}>
                    <div style={{ width: '100%', maxWidth: 620, background: C.surface, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                            <div><p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Delegate Support Contact Details</p><p style={{ fontSize: 12.5, color: C.textSec, marginTop: 3 }}>Shown on the delegate Contact Support page.</p></div>
                            <button type="button" onClick={() => setSupportOpen(false)} title="Close" style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                        </div>
                        <div className="admin-support-grid" style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {SUPPORT_FIELDS.map(field => <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{field.label}</span>
                                <input type={field.type ?? 'text'} value={support[field.key]} placeholder={field.placeholder} onChange={event => setSupport(current => ({ ...current, [field.key]: event.target.value }))}
                                    style={{ width: '100%', padding: '9px 11px', boxSizing: 'border-box', borderRadius: 8, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, outline: 'none' }} />
                            </label>)}
                        </div>
                        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#FAFBFC' }}>
                            <button type="button" onClick={() => setSupportOpen(false)} disabled={supportSaving} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button type="button" onClick={saveSupport} disabled={supportSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: C.accent, color: 'white', fontSize: 13, fontWeight: 700, cursor: supportSaving ? 'wait' : 'pointer' }}><Save size={14} /> {supportSaving ? 'Saving...' : 'Save Details'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
