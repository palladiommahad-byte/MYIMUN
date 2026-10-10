'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, Users, Mail, CheckCheck, Settings2, Save, X, ArrowLeft, Plus, Trash2, Pencil, UserPlus, Check, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference, Conversation, Registration } from '@/context/ConferenceContext';
import { DEFAULT_DELEGATE_SUPPORT, DelegateSupportData, resolveDelegateSupport } from '@/lib/delegateSupport';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', purple: '#7C5FFF', red: '#EF4444',
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
type ListFilter = 'all' | 'direct' | 'group';
type ComposeMode = 'direct' | 'group';
const EMPTY_GROUP = { title: '', memberIds: [] as string[], message: '' };

const chatName = (conv: Conversation) => conv.type === 'group' ? conv.title : conv.delegateName;
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', boxSizing: 'border-box', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit' };

/** Searchable checklist of delegates with quick-select presets. */
function DelegatePicker({ delegates, selected, onChange, exclude = [] }: {
    delegates: Registration[]; selected: string[]; onChange: (ids: string[]) => void; exclude?: string[];
}) {
    const [query, setQuery] = useState('');
    const available = delegates.filter(d => !exclude.includes(d.delegateId));
    const q = query.trim().toLowerCase();
    const visible = available.filter(d => !q || d.fullName.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || (d.country ?? '').toLowerCase().includes(q));
    const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
    const presets: Array<[string, Registration[]]> = [
        ['All', available],
        ['Paid', available.filter(d => d.paymentStatus === 'Paid')],
        ['Unpaid', available.filter(d => d.paymentStatus !== 'Paid')],
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {presets.map(([label, list]) => (
                    <button key={label} type="button" onClick={() => onChange(Array.from(new Set([...selected, ...list.map(d => d.delegateId)])))}
                        style={{ padding: '5px 10px', borderRadius: 999, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        + {label} ({list.length})
                    </button>
                ))}
                {selected.length > 0 && (
                    <button type="button" onClick={() => onChange([])}
                        style={{ padding: '5px 10px', borderRadius: 999, border: 'none', background: 'transparent', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Clear
                    </button>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: C.textMuted }}>{selected.length} selected</span>
            </div>
            <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search delegates..." style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 9, maxHeight: 260, overflowY: 'auto' }}>
                {visible.length === 0 ? (
                    <p style={{ padding: 16, fontSize: 13, color: C.textMuted, textAlign: 'center' }}>No delegates found.</p>
                ) : visible.map(d => {
                    const checked = selected.includes(d.delegateId);
                    return (
                        <button key={d.delegateId} type="button" onClick={() => toggle(d.delegateId)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderBottom: `1px solid ${C.border}`, background: checked ? `${C.accent}0A` : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                            <span style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checked ? C.accent : C.border}`, background: checked ? C.accent : C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {checked && <Check size={12} color="#fff" />}
                            </span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fullName}</span>
                                <span style={{ display: 'block', fontSize: 11.5, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.country || d.email}</span>
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: d.paymentStatus === 'Paid' ? C.green : C.textMuted }}>{d.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function AdminMessagesPage() {
    const { showToast } = useToast();
    const {
        conversations, registrations, openDirectChat, createGroupChat, sendChatMessage, markRead,
        renameGroupChat, addGroupMembers, removeGroupMember, deleteConversation,
    } = useConference();

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [replyText,  setReplyText]  = useState('');
    const [sending,    setSending]    = useState(false);
    const [search,     setSearch]     = useState('');
    const [listFilter, setListFilter] = useState<ListFilter>('all');
    const [supportOpen, setSupportOpen] = useState(false);
    const [supportSaving, setSupportSaving] = useState(false);
    const [support, setSupport] = useState<DelegateSupportData>(DEFAULT_DELEGATE_SUPPORT);
    const [mobilePane, setMobilePane] = useState<'list' | 'detail'>('list');
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeMode, setComposeMode] = useState<ComposeMode>('direct');
    const [composeSaving, setComposeSaving] = useState(false);
    const [directQuery, setDirectQuery] = useState('');
    const [group, setGroup] = useState(EMPTY_GROUP);
    const [membersOpen, setMembersOpen] = useState(false);
    const [addingIds, setAddingIds] = useState<string[]>([]);
    const [renameText, setRenameText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const sorted = [...conversations].sort((a, b) => b.lastActivity - a.lastActivity);
    const currentSelectedId = selectedId !== null && conversations.some(c => c.id === selectedId)
        ? selectedId
        : sorted[0]?.id ?? null;
    const selected = conversations.find(c => c.id === currentSelectedId) ?? null;

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentSelectedId, selected?.messages.length]);

    // Mark as read when a chat is open and new messages arrive
    useEffect(() => {
        if (currentSelectedId && !composeOpen && selected && selected.adminUnread > 0) markRead(currentSelectedId);
    }, [currentSelectedId, composeOpen, selected?.adminUnread]); // eslint-disable-line

    useEffect(() => {
        void fetch('/api/settings/delegate-support', { cache: 'no-store' })
            .then(res => res.ok ? res.json() : null)
            .then(json => { if (json?.ok) setSupport(resolveDelegateSupport(json.data)); })
            .catch(() => {});
    }, []);

    const totalUnread = conversations.reduce((s, c) => s + c.adminUnread, 0);
    const q = search.trim().toLowerCase();
    const filtered = sorted.filter(c =>
        (listFilter === 'all' || c.type === listFilter) &&
        (!q || chatName(c).toLowerCase().includes(q) || c.delegateEmail.toLowerCase().includes(q) ||
            c.messages.some(m => m.text.toLowerCase().includes(q)))
    );

    const registeredDelegates = registrations
        .filter(reg => reg.delegateId && reg.accountStatus !== 'inactive')
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
    const dq = directQuery.trim().toLowerCase();
    const directMatches = registeredDelegates.filter(d => !dq || d.fullName.toLowerCase().includes(dq) || d.email.toLowerCase().includes(dq) || (d.country ?? '').toLowerCase().includes(dq));

    const selectChat = (id: number) => {
        setComposeOpen(false);
        setMembersOpen(false);
        setSelectedId(id);
        setReplyText('');
        setMobilePane('detail');
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = replyText.trim();
        if (!text || !currentSelectedId || sending) return;
        setSending(true);
        setReplyText('');
        try {
            await sendChatMessage(currentSelectedId, text);
        } catch (error) {
            setReplyText(text);
            showToast(error instanceof Error ? error.message : 'Could not send message', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
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

    const openCompose = () => {
        setComposeOpen(true);
        setMembersOpen(false);
        setMobilePane('detail');
    };

    const handleOpenDirect = async (delegateId: string) => {
        const existing = conversations.find(c => c.type === 'direct' && c.delegateId === delegateId);
        if (existing) { selectChat(existing.id); return; }
        setComposeSaving(true);
        try {
            const chat = await openDirectChat(delegateId);
            setDirectQuery('');
            selectChat(chat.id);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not open chat.', 'error');
        } finally {
            setComposeSaving(false);
        }
    };

    const handleCreateGroup = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!group.title.trim()) { showToast('Give the group a name.', 'error'); return; }
        if (group.memberIds.length === 0) { showToast('Add at least one delegate.', 'error'); return; }
        setComposeSaving(true);
        try {
            const chat = await createGroupChat(group.title.trim(), group.memberIds, group.message.trim() || undefined);
            setGroup(EMPTY_GROUP);
            selectChat(chat.id);
            showToast(`Group created with ${chat.members.length} delegate${chat.members.length === 1 ? '' : 's'}.`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not create group.', 'error');
        } finally {
            setComposeSaving(false);
        }
    };

    const openMembers = () => {
        if (!selected) return;
        setRenameText(selected.title);
        setAddingIds([]);
        setMembersOpen(true);
    };

    const runAction = async (action: () => Promise<void>, success: string) => {
        try {
            await action();
            showToast(success, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Something went wrong.', 'error');
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        const label = selected.type === 'group' ? `the group "${selected.title}"` : `the chat with ${selected.delegateName}`;
        if (!window.confirm(`Delete ${label} and all of its messages? This cannot be undone.`)) return;
        await runAction(() => deleteConversation(selected.id), 'Chat deleted.');
        setMembersOpen(false);
        setSelectedId(null);
        setMobilePane('list');
    };

    const lastMsg = (conv: Conversation) => conv.messages[conv.messages.length - 1];
    const previewText = (conv: Conversation) => {
        const last = lastMsg(conv);
        if (!last) return conv.type === 'group' ? `${conv.members.length} members` : 'No messages yet';
        const who = last.sender === 'admin' ? 'You: ' : conv.type === 'group' ? `${last.senderName.split(' ')[0] || 'Delegate'}: ` : '';
        return who + last.text.replace(/\s+/g, ' ');
    };

    return (
        <>
        <style jsx>{`
            .admin-messages-shell {
                width: 100%;
                height: calc(100dvh - 120px);
                max-height: calc(100dvh - 120px);
                min-height: 560px;
                display: grid;
                grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
                gap: 16px;
            }
            .admin-messages-sidebar,
            .admin-messages-pane {
                min-width: 0;
                min-height: 0;
            }
            .admin-mobile-back {
                display: none;
            }
            @media (max-width: 720px) {
                .admin-messages-shell {
                    height: auto;
                    max-height: none;
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
            }
        `}</style>
        <div className="admin-messages-shell" data-mobile-pane={mobilePane} style={{ fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* ── Sidebar ── */}
            <div className="admin-messages-sidebar" style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0, minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 22, color: C.text }}>Inbox</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {totalUnread > 0 && (
                            <span style={{ background: C.accent, color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                                {totalUnread} New
                            </span>
                        )}
                        <button type="button" onClick={openCompose} title="New chat or group"
                            style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${composeOpen ? C.accent : C.border}`, background: composeOpen ? C.accent : C.surface, color: composeOpen ? '#fff' : C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={15} /></button>
                        <button type="button" onClick={() => setSupportOpen(true)} title="Edit delegate support contact details"
                            style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings2 size={14} /></button>
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                    <input type="text" placeholder="Search chats…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', paddingLeft: 33, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e => e.target.style.borderColor = C.border}
                    />
                </div>

                {/* Chat list */}
                <div style={{ flex: 1, minHeight: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: C.shadow }}>
                    <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 4 }}>
                        {([['all', 'All'], ['direct', 'Delegates'], ['group', 'Groups']] as const).map(([value, label]) => {
                            const active = listFilter === value;
                            return (
                                <button key={value} type="button" onClick={() => setListFilter(value)}
                                    style={{ flex: 1, padding: '6px 8px', borderRadius: 7, border: 'none', background: active ? `${C.accent}12` : 'transparent', color: active ? C.accent : C.textSec, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                <Mail size={28} style={{ color: C.border, margin: '0 auto 8px' }} />
                                <p style={{ fontSize: 13, color: C.textMuted }}>No chats yet.<br />Delegates will appear here when they message you.</p>
                            </div>
                        ) : filtered.map(conv => {
                            const isActive = !composeOpen && currentSelectedId === conv.id;
                            const col = avatarColor(conv.id);
                            const last = lastMsg(conv);
                            const hasUnread = conv.adminUnread > 0;
                            return (
                                <button key={conv.id} onClick={() => selectChat(conv.id)}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '12px 14px',
                                        borderLeft: `3px solid ${isActive ? C.accent : 'transparent'}`,
                                        borderRight: 'none', borderTop: 'none',
                                        borderBottom: `1px solid ${C.border}`,
                                        background: isActive ? `${C.accent}08` : 'transparent',
                                        display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'center',
                                    }}
                                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.bg; }}
                                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <div style={{ width: 38, height: 38, borderRadius: conv.type === 'group' ? 11 : '50%', flexShrink: 0, background: `${col}20`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                                        {conv.type === 'group' ? <Users size={17} /> : chatName(conv).charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                                            <span style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {chatName(conv)}
                                            </span>
                                            <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0 }}>{last ? last.time : conv.createdAt}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {!hasUnread && last?.sender === 'admin' && <CheckCheck size={12} style={{ color: C.accent, flexShrink: 0 }} />}
                                            <p style={{ flex: 1, fontSize: 12, color: hasUnread ? C.text : C.textSec, fontWeight: hasUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {previewText(conv)}
                                            </p>
                                            {hasUnread && (
                                                <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: C.accent, color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {conv.adminUnread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Detail pane ── */}
            <div className="admin-messages-pane" style={{ flex: 1, minHeight: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: C.shadow }}>
                {composeOpen ? (
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.surface }}>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                <button className="admin-mobile-back" onClick={() => setMobilePane('list')} title="Back to inbox"
                                    style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', flexShrink: 0 }}>
                                    <ArrowLeft size={16} />
                                </button>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.accent}12`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>New Chat</p>
                                    <p style={{ fontSize: 12.5, color: C.textSec, marginTop: 2 }}>Message one delegate, or create a group chat.</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setComposeOpen(false)} title="Close"
                                style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={17} />
                            </button>
                        </div>

                        <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8 }}>
                            {([['direct', 'Direct Message', User], ['group', 'Group Chat', Users]] as const).map(([value, label, Icon]) => {
                                const active = composeMode === value;
                                return (
                                    <button key={value} type="button" onClick={() => setComposeMode(value)}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${active ? C.accent : C.border}`, background: active ? `${C.accent}0D` : C.surface, color: active ? C.accent : C.textSec, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                        <Icon size={15} /> {label}
                                    </button>
                                );
                            })}
                        </div>

                        {registeredDelegates.length === 0 ? (
                            <div style={{ flex: 1, minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: C.textMuted, gap: 8 }}>
                                <User size={42} style={{ opacity: 0.35 }} />
                                <p style={{ fontSize: 15, fontWeight: 600 }}>No registered delegates yet</p>
                                <p style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>Once delegates submit registration, they will appear here.</p>
                            </div>
                        ) : composeMode === 'direct' ? (
                            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                                    <input autoFocus value={directQuery} onChange={e => setDirectQuery(e.target.value)} placeholder="Search a delegate by name, email or country..." style={{ ...inputStyle, paddingLeft: 32 }} />
                                </div>
                                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 9 }}>
                                    {directMatches.length === 0 ? (
                                        <p style={{ padding: 16, fontSize: 13, color: C.textMuted, textAlign: 'center' }}>No delegates found.</p>
                                    ) : directMatches.map(d => {
                                        const hasChat = conversations.some(c => c.type === 'direct' && c.delegateId === d.delegateId);
                                        return (
                                            <button key={d.delegateId} type="button" disabled={composeSaving} onClick={() => handleOpenDirect(d.delegateId)}
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', borderBottom: `1px solid ${C.border}`, background: 'transparent', cursor: composeSaving ? 'wait' : 'pointer', textAlign: 'left' }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                                                <span style={{ width: 32, height: 32, borderRadius: '50%', background: `${C.accent}18`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{d.fullName.charAt(0).toUpperCase()}</span>
                                                <span style={{ flex: 1, minWidth: 0 }}>
                                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text }}>{d.fullName}</span>
                                                    <span style={{ display: 'block', fontSize: 11.5, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.email}{d.country ? ` · ${d.country}` : ''}</span>
                                                </span>
                                                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.accent }}>{hasChat ? 'Open chat' : 'Start chat'}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateGroup} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={labelStyle}>Group Name</span>
                                    <input value={group.title} onChange={e => setGroup(g => ({ ...g, title: e.target.value }))}
                                        placeholder="e.g. UNSC Delegates, Unpaid Registrations" style={inputStyle} />
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={labelStyle}>Members</span>
                                    <DelegatePicker delegates={registeredDelegates} selected={group.memberIds} onChange={ids => setGroup(g => ({ ...g, memberIds: ids }))} />
                                </div>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={labelStyle}>First Message (optional)</span>
                                    <textarea value={group.message} onChange={e => setGroup(g => ({ ...g, message: e.target.value }))}
                                        placeholder="Say hello to the group..."
                                        style={{ ...inputStyle, minHeight: 90, lineHeight: 1.55, resize: 'vertical' }} />
                                </label>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <button type="button" onClick={() => setComposeOpen(false)} disabled={composeSaving}
                                        style={{ padding: '10px 18px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" disabled={composeSaving || group.memberIds.length === 0 || !group.title.trim()}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: composeSaving ? 'wait' : 'pointer', boxShadow: `0 3px 12px ${C.accent}35`, opacity: composeSaving || group.memberIds.length === 0 || !group.title.trim() ? 0.65 : 1 }}>
                                        <Users size={15} /> {composeSaving ? 'Creating...' : `Create Group (${group.memberIds.length})`}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : selected ? (
                    <>
                        {/* Header */}
                        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC', gap: 12 }}>
                            <div className="admin-message-header" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                <button className="admin-mobile-back" onClick={() => setMobilePane('list')} title="Back to inbox"
                                    style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', flexShrink: 0 }}>
                                    <ArrowLeft size={16} />
                                </button>
                                <div style={{
                                    width: 42, height: 42, borderRadius: selected.type === 'group' ? 12 : '50%',
                                    background: `${avatarColor(selected.id)}20`,
                                    color: avatarColor(selected.id),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: 16, flexShrink: 0,
                                }}>{selected.type === 'group' ? <Users size={19} /> : chatName(selected).charAt(0).toUpperCase()}</div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chatName(selected)}</p>
                                    {selected.type === 'group' ? (
                                        <p style={{ fontSize: 12, color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selected.members.length} member{selected.members.length === 1 ? '' : 's'} · {selected.members.map(m => m.name.split(' ')[0]).join(', ')}
                                        </p>
                                    ) : (
                                        <div className="admin-message-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.textSec }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} />{selected.delegateEmail}</span>
                                            <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.border, display: 'inline-block' }} />
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={11} />Delegate{selected.delegateCountry ? ` (${selected.delegateCountry})` : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                {selected.type === 'group' && (
                                    <button type="button" onClick={openMembers} title="Manage group"
                                        style={{ padding: 7, borderRadius: 7, color: membersOpen ? C.accent : C.textMuted, background: membersOpen ? `${C.accent}12` : 'transparent', border: 'none', cursor: 'pointer' }}>
                                        <Users size={18} />
                                    </button>
                                )}
                                <button type="button" onClick={handleDelete} title="Delete chat"
                                    style={{ padding: 7, borderRadius: 7, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.red; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.textMuted; }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                            {/* Thread */}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px' }}>
                                    {selected.messages.length === 0 ? (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted, gap: 6, textAlign: 'center' }}>
                                            <MessageSquare size={36} style={{ opacity: 0.35 }} />
                                            <p style={{ fontSize: 14, fontWeight: 600 }}>No messages yet</p>
                                            <p style={{ fontSize: 12.5 }}>Send the first message below.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {selected.messages.map((msg, i) => {
                                                const mine = msg.sender === 'admin';
                                                const prev = selected.messages[i - 1];
                                                const showName = (selected.type === 'group' || mine) && (!prev || prev.sender !== msg.sender || prev.senderId !== msg.senderId);
                                                return (
                                                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                                                        {showName && (
                                                            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, margin: '4px 4px 3px' }}>
                                                                {mine ? (msg.senderName || 'Secretariat') : (msg.senderName || 'Delegate')}
                                                            </span>
                                                        )}
                                                        <div className="admin-message-bubble" style={{
                                                            maxWidth: '75%', borderRadius: 14, padding: '9px 13px',
                                                            background: mine ? C.accent : C.bg,
                                                            color: mine ? 'white' : C.text,
                                                            borderTopRightRadius: mine ? 3 : 14,
                                                            borderTopLeftRadius:  mine ? 14 : 3,
                                                        }}>
                                                            <p style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{msg.text}</p>
                                                            <p style={{ fontSize: 10, opacity: 0.65, marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{msg.time}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>

                                {/* Reply box */}
                                <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, background: '#FAFBFC', flexShrink: 0 }}>
                                    <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', background: C.surface }}>
                                            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={handleKeyDown}
                                                placeholder={selected.type === 'group' ? `Message ${selected.title}…` : `Message ${selected.delegateName}…`}
                                                style={{ width: '100%', padding: '10px 12px', minHeight: 52, maxHeight: 120, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.text, resize: 'none', fontFamily: 'inherit', display: 'block' }}
                                            />
                                            <div style={{ padding: '4px 12px 6px', display: 'flex', justifyContent: 'flex-end' }}>
                                                <span style={{ fontSize: 11, color: C.textMuted }}>Enter to send · Shift+Enter for new line</span>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={!replyText.trim() || sending}
                                            style={{ padding: '13px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: C.accent, color: 'white', opacity: replyText.trim() && !sending ? 1 : 0.45, boxShadow: `0 2px 8px ${C.accent}40` }}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Group management panel */}
                            {membersOpen && selected.type === 'group' && (
                                <div style={{ width: 300, maxWidth: '100%', borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', minHeight: 0, background: C.surface }}>
                                    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Group Settings</span>
                                        <button type="button" onClick={() => setMembersOpen(false)} title="Close" style={{ padding: 4, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer' }}><X size={16} /></button>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <span style={labelStyle}>Group Name</span>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <input value={renameText} onChange={e => setRenameText(e.target.value)} style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
                                                <button type="button" title="Rename" disabled={!renameText.trim() || renameText.trim() === selected.title}
                                                    onClick={() => runAction(() => renameGroupChat(selected.id, renameText.trim()), 'Group renamed.')}
                                                    style={{ padding: '0 10px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', opacity: !renameText.trim() || renameText.trim() === selected.title ? 0.5 : 1 }}>
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <span style={labelStyle}>Members ({selected.members.length})</span>
                                            <div style={{ border: `1px solid ${C.border}`, borderRadius: 9 }}>
                                                {selected.members.map(m => (
                                                    <div key={m.delegateId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
                                                        <span style={{ flex: 1, minWidth: 0 }}>
                                                            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                                                            <span style={{ display: 'block', fontSize: 11, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.country || m.email}</span>
                                                        </span>
                                                        <button type="button" title="Remove from group"
                                                            onClick={() => { if (window.confirm(`Remove ${m.name} from this group?`)) void runAction(() => removeGroupMember(selected.id, m.delegateId), `${m.name} removed.`); }}
                                                            style={{ padding: 4, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer' }}>
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <span style={labelStyle}>Add Members</span>
                                            <DelegatePicker delegates={registeredDelegates} selected={addingIds} onChange={setAddingIds} exclude={selected.members.map(m => m.delegateId)} />
                                            <button type="button" disabled={addingIds.length === 0}
                                                onClick={() => runAction(async () => { await addGroupMembers(selected.id, addingIds); setAddingIds([]); }, 'Members added.')}
                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', opacity: addingIds.length === 0 ? 0.5 : 1 }}>
                                                <UserPlus size={14} /> Add {addingIds.length > 0 ? addingIds.length : ''} to group
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted, gap: 8 }}>
                        <button className="admin-mobile-back" onClick={() => setMobilePane('list')} title="Back to inbox"
                            style={{ marginBottom: 8, alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            <ArrowLeft size={15} /> Back
                        </button>
                        <MessageSquare size={44} style={{ opacity: 0.3 }} />
                        <p style={{ fontSize: 15, fontWeight: 500 }}>Select a chat</p>
                        <p style={{ fontSize: 13 }}>Or press + to message a delegate or start a group.</p>
                    </div>
                )}
            </div>
            {supportOpen && (
                <div role="dialog" aria-modal="true" aria-label="Delegate support contact details" style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(17,24,39,0.42)' }}>
                    <div style={{ width: '100%', maxWidth: 620, background: C.surface, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                            <div><p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Delegate Support Contact Details</p><p style={{ fontSize: 12.5, color: C.textSec, marginTop: 3 }}>Shown on the delegate Contact Support page. WhatsApp is managed in Settings.</p></div>
                            <button type="button" onClick={() => setSupportOpen(false)} title="Close" style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                        </div>
                        <div className="admin-support-grid" style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {SUPPORT_FIELDS.map(field => <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={labelStyle}>{field.label}</span>
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
