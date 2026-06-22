'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Send, MoreVertical, User, Mail, Paperclip, CheckCheck, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference, Conversation } from '@/context/ConferenceContext';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const AVATAR_COLORS = ['#3B7FFF', '#7C5FFF', '#10B981', '#EC4899', '#F59E0B'];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

export default function AdminMessagesPage() {
    const { showToast } = useToast();
    const { conversations, sendChatMessage, markRead } = useConference();

    const [selectedId, setSelectedId] = useState<number | null>(conversations[0]?.id ?? null);
    const [replyText,  setReplyText]  = useState('');
    const [search,     setSearch]     = useState('');
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

    const lastMsg = (conv: Conversation) => conv.messages[conv.messages.length - 1];

    return (
        <div style={{ height: 'calc(100vh - 140px)', display: 'flex', gap: 16, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* ── Sidebar ── */}
            <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 22, color: C.text }}>Inbox</h1>
                    {totalUnread > 0 && (
                        <span style={{ background: C.accent, color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                            {totalUnread} New
                        </span>
                    )}
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
                                <button key={conv.id} onClick={() => setSelectedId(conv.id)}
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
            <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: C.shadow }}>
                {selected ? (
                    <>
                        {/* Header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: '50%',
                                    background: `${avatarColor(selected.id)}20`,
                                    color: avatarColor(selected.id),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: 16, flexShrink: 0,
                                }}>{selected.delegateName.charAt(0)}</div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{selected.delegateName}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.textSec }}>
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
                                        <div style={{
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
                        <Mail size={44} style={{ opacity: 0.3 }} />
                        <p style={{ fontSize: 15, fontWeight: 500 }}>Select a message to view</p>
                        <p style={{ fontSize: 13 }}>Conversations from delegates will appear in your inbox.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
