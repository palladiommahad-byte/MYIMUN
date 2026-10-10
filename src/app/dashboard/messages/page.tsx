'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Shield, Users, ArrowLeft, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/auth/AuthContext';
import { useConference, Conversation } from '@/context/ConferenceContext';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', purple: '#7C5FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const AVATAR_COLORS = [C.accent, C.purple, '#10B981', '#EC4899', '#F59E0B'];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

/** 'direct' is the delegate's chat with the secretariat (it may not exist until the first message). */
type ChatKey = 'direct' | number;

export default function DelegateMessagesPage() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { conversations, messageSecretariat, sendChatMessage, markRead } = useConference();

    const directChat = conversations.find(c => c.type === 'direct' && c.delegateId === user?.id) ?? null;
    const groups = conversations.filter(c => c.type === 'group').sort((a, b) => b.lastActivity - a.lastActivity);

    const [selectedKey, setSelectedKey] = useState<ChatKey>('direct');
    const [replyText,  setReplyText]  = useState('');
    const [sending,    setSending]    = useState(false);
    const [search,     setSearch]     = useState('');
    const [mobilePane, setMobilePane] = useState<'list' | 'detail'>('list');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const selectedGroup = typeof selectedKey === 'number' ? groups.find(g => g.id === selectedKey) ?? null : null;
    const activeKey: ChatKey = selectedGroup ? selectedGroup.id : 'direct';
    const selected: Conversation | null = selectedGroup ?? directChat;

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeKey, selected?.messages.length]);

    // Mark as read while the chat is open
    useEffect(() => {
        if (selected && selected.delegateUnread > 0) markRead(selected.id);
    }, [selected?.id, selected?.delegateUnread]); // eslint-disable-line

    const q = search.trim().toLowerCase();
    const visibleGroups = groups.filter(g => !q || g.title.toLowerCase().includes(q) || g.messages.some(m => m.text.toLowerCase().includes(q)));
    const showDirect = !q || 'secretariat'.includes(q) || (directChat?.messages.some(m => m.text.toLowerCase().includes(q)) ?? false);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = replyText.trim();
        if (!text || sending) return;
        setSending(true);
        setReplyText('');
        try {
            if (selectedGroup) await sendChatMessage(selectedGroup.id, text);
            else await messageSecretariat(text);
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

    const selectChat = (key: ChatKey) => { setSelectedKey(key); setReplyText(''); setMobilePane('detail'); };
    const totalUnread = conversations.reduce((s, c) => s + c.delegateUnread, 0);

    const preview = (conv: Conversation | null, empty: string) => {
        const last = conv?.messages[conv.messages.length - 1];
        if (!last) return empty;
        const who = last.senderId === user?.id ? 'You: ' : conv?.type === 'group' ? `${last.sender === 'admin' ? 'Secretariat' : last.senderName.split(' ')[0] || 'Delegate'}: ` : '';
        return who + last.text.replace(/\s+/g, ' ');
    };

    const listItem = (key: ChatKey, conv: Conversation | null, name: string, icon: React.ReactNode, color: string, empty: string) => {
        const isActive = activeKey === key;
        const unread = conv?.delegateUnread ?? 0;
        const last = conv?.messages[conv.messages.length - 1];
        return (
            <button key={String(key)} type="button" onClick={() => selectChat(key)}
                style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px', cursor: 'pointer',
                    border: 'none', borderLeft: `3px solid ${isActive ? C.accent : 'transparent'}`,
                    borderBottom: `1px solid ${C.border}`,
                    background: isActive ? `${C.accent}08` : 'transparent',
                    display: 'flex', gap: 10, alignItems: 'center',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.bg; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
                <div style={{ width: 38, height: 38, borderRadius: key === 'direct' ? '50%' : 11, flexShrink: 0, background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                        {last && <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0 }}>{last.time}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ flex: 1, fontSize: 12, color: unread > 0 ? C.text : C.textSec, fontWeight: unread > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview(conv, empty)}</p>
                        {unread > 0 && (
                            <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: C.accent, color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{unread}</span>
                        )}
                    </div>
                </div>
            </button>
        );
    };

    const messages = selected?.messages ?? [];
    const isGroup = selected?.type === 'group';

    return (
        <div className="delegate-messages-shell" data-mobile-pane={mobilePane} style={{ fontFamily: '"Inter",system-ui,sans-serif' }}>
            <style jsx>{`
                .delegate-messages-shell {
                    height: calc(100vh - 140px);
                    min-height: 560px;
                    display: grid;
                    grid-template-columns: minmax(260px, 280px) minmax(0, 1fr);
                    gap: 16px;
                }
                .delegate-messages-sidebar,
                .delegate-messages-pane {
                    min-width: 0;
                    min-height: 0;
                }
                .delegate-mobile-back {
                    display: none;
                }
                @media (max-width: 720px) {
                    .delegate-messages-shell {
                        height: auto;
                        min-height: calc(100vh - 96px);
                        display: block;
                    }
                    .delegate-messages-sidebar,
                    .delegate-messages-pane {
                        width: 100% !important;
                        min-height: calc(100vh - 122px);
                    }
                    .delegate-messages-shell[data-mobile-pane="list"] .delegate-messages-pane,
                    .delegate-messages-shell[data-mobile-pane="detail"] .delegate-messages-sidebar {
                        display: none !important;
                    }
                    .delegate-mobile-back {
                        display: inline-flex;
                    }
                    .delegate-message-bubble {
                        max-width: 88% !important;
                    }
                }
            `}</style>

            {/* ── Sidebar ── */}
            <div className="delegate-messages-sidebar" style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 22, color: C.text }}>Messages</h1>
                    {totalUnread > 0 && (
                        <span style={{ background: C.accent, color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>{totalUnread}</span>
                    )}
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                    <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', paddingLeft: 33, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e => e.target.style.borderColor = C.border}
                    />
                </div>

                {/* Chat list */}
                <div style={{ flex: 1, minHeight: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: C.shadow }}>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {showDirect && listItem('direct', directChat, 'Secretariat', <Shield size={17} />, C.accent, 'Message the organizing team')}
                        {visibleGroups.length > 0 && (
                            <div style={{ padding: '10px 14px 6px', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Groups</div>
                        )}
                        {visibleGroups.map(g => listItem(g.id, g, g.title, <Users size={17} />, avatarColor(g.id), `${g.members.length} members`))}
                    </div>
                </div>
            </div>

            {/* ── Chat pane ── */}
            <div className="delegate-messages-pane" style={{ flex: 1, minHeight: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: C.shadow }}>
                {/* Header */}
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, background: '#FAFBFC' }}>
                    <button className="delegate-mobile-back" onClick={() => setMobilePane('list')} title="Back to messages"
                        style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, cursor: 'pointer', flexShrink: 0 }}>
                        <ArrowLeft size={16} />
                    </button>
                    {selectedGroup ? (
                        <>
                            <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: `${avatarColor(selectedGroup.id)}20`, color: avatarColor(selectedGroup.id), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={19} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 15, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGroup.title}</p>
                                <p style={{ fontSize: 12, color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Secretariat, {selectedGroup.members.map(m => m.delegateId === user?.id ? 'You' : m.name.split(' ')[0]).join(', ')}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: `${C.accent}20`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={19} />
                            </div>
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Secretariat</p>
                                <p style={{ fontSize: 12, color: C.textSec }}>MYIMUN organizing team</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Thread */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 20 }}>
                    {messages.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted, gap: 6, textAlign: 'center', padding: '0 18px' }}>
                            <MessageSquare size={40} style={{ opacity: 0.3 }} />
                            <p style={{ fontSize: 15, fontWeight: 600 }}>{isGroup ? 'No messages yet' : 'Need help?'}</p>
                            <p style={{ fontSize: 13 }}>{isGroup ? 'Messages in this group will appear here.' : 'Write your message below and the secretariat will reply here.'}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {messages.map((msg, i) => {
                                const mine = msg.sender === 'delegate' && msg.senderId === user?.id;
                                const prev = messages[i - 1];
                                const showName = isGroup && !mine && (!prev || prev.sender !== msg.sender || prev.senderId !== msg.senderId);
                                return (
                                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                                        {showName && (
                                            <span style={{ fontSize: 11, fontWeight: 600, color: msg.sender === 'admin' ? C.accent : C.textMuted, margin: '4px 4px 3px' }}>
                                                {msg.sender === 'admin' ? 'Secretariat' : msg.senderName || 'Delegate'}
                                            </span>
                                        )}
                                        <div className="delegate-message-bubble" style={{
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

                {/* Composer */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, background: '#FAFBFC' }}>
                    <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', background: C.surface }}>
                            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={handleKeyDown}
                                placeholder={selectedGroup ? `Message ${selectedGroup.title}…` : 'Message the secretariat…'}
                                style={{ width: '100%', padding: '10px 12px', minHeight: 52, maxHeight: 120, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.text, resize: 'none', fontFamily: 'inherit', display: 'block' }}
                            />
                            <div style={{ padding: '4px 12px 6px', display: 'flex', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: 11, color: C.textMuted }}>Enter to send</span>
                            </div>
                        </div>
                        <button type="submit" disabled={!replyText.trim() || sending}
                            style={{ padding: '13px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: C.accent, color: 'white', opacity: replyText.trim() && !sending ? 1 : 0.45, boxShadow: `0 2px 8px ${C.accent}40` }}
                        ><Send size={18} /></button>
                    </form>
                </div>
            </div>
        </div>
    );
}
