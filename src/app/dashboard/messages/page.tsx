'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Send, MoreVertical, Mail, Shield, Paperclip, Plus, X, ChevronDown } from 'lucide-react';
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
const CATEGORIES = ['General', 'Logistics', 'Committee', 'Payments', 'Technical'];

function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

export default function DelegateMessagesPage() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { getConversationsForDelegate, startConversation, sendChatMessage, markRead } = useConference();

    const delegateId      = user?.id ?? 'unknown';
    const delegateName    = user?.name ?? 'Delegate';
    const delegateEmail   = user?.email ?? 'delegate@myimun.org';
    const delegateCountry = user?.country ?? '';

    const myConversations = getConversationsForDelegate(delegateId);

    const [selectedId, setSelectedId] = useState<number | null>(myConversations[0]?.id ?? null);
    const [replyText,  setReplyText]  = useState('');
    const [search,     setSearch]     = useState('');
    const [newOpen,    setNewOpen]    = useState(false);
    const [newForm,    setNewForm]    = useState({ subject: '', category: 'General', message: '' });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const selected = myConversations.find(c => c.id === selectedId) ?? null;

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selected?.messages.length]);

    // Mark as read when opened
    useEffect(() => {
        if (selectedId) markRead(selectedId, 'delegate');
    }, [selectedId]); // eslint-disable-line

    const filtered = myConversations.filter(c =>
        c.subject.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => b.id - a.id);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedId) return;
        sendChatMessage(selectedId, replyText.trim(), 'delegate');
        setReplyText('');
        showToast('Message sent', 'success');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
    };

    const handleStartNew = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newForm.subject.trim() || !newForm.message.trim()) { showToast('Please fill in all fields.', 'error'); return; }
        startConversation(delegateId, delegateName, delegateEmail, delegateCountry, newForm.subject.trim(), newForm.category, newForm.message.trim());
        setNewForm({ subject: '', category: 'General', message: '' });
        setNewOpen(false);
        showToast('Message sent to admin team.', 'success');
    };

    const totalUnread = myConversations.reduce((s, c) => s + c.delegateUnread, 0);

    return (
        <div style={{ height: 'calc(100vh - 140px)', display: 'flex', gap: 16, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* ── Sidebar ── */}
            <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 22, color: C.text }}>Messages</h1>
                        {totalUnread > 0 && (
                            <span style={{ background: C.accent, color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>{totalUnread}</span>
                        )}
                    </div>
                    <button onClick={() => setNewOpen(o => !o)}
                        title="New message"
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: `1px solid ${C.accent}`, background: newOpen ? C.accent : 'transparent', color: newOpen ? '#fff' : C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                        <Plus size={13} /> New
                    </button>
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

                {/* Conversation list */}
                <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: C.shadow }}>
                    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent</span>
                        <Filter size={13} style={{ color: C.textMuted }} />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                <Mail size={28} style={{ color: C.border, margin: '0 auto 8px' }} />
                                <p style={{ fontSize: 13, color: C.textMuted }}>No conversations yet.<br />Click "New" to message the admin team.</p>
                            </div>
                        ) : filtered.map(conv => {
                            const isActive = selectedId === conv.id;
                            const col = avatarColor(conv.id);
                            const lastMsg = conv.messages[conv.messages.length - 1];
                            return (
                                <div key={conv.id} onClick={() => setSelectedId(conv.id)}
                                    style={{
                                        padding: '12px 14px', cursor: 'pointer',
                                        borderLeft: `3px solid ${isActive ? C.accent : 'transparent'}`,
                                        borderBottom: `1px solid ${C.border}`,
                                        background: isActive ? `${C.accent}08` : 'transparent',
                                        display: 'flex', gap: 10,
                                    }}
                                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.bg; }}
                                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${col}20`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                                        S
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                            <span style={{ fontSize: 13, fontWeight: conv.delegateUnread > 0 ? 700 : 500, color: C.text }}>Secretariat</span>
                                            <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0, marginLeft: 4 }}>{conv.lastMessageAt}</span>
                                        </div>
                                        <p style={{ fontSize: 12, color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{conv.subject}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1px 6px', borderRadius: 4, background: C.bg, color: C.textSec }}>{conv.category}</span>
                                            {conv.delegateUnread > 0 && (
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Detail / New Message pane ── */}
            <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: C.shadow }}>

                {/* New Message form */}
                {newOpen && (
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: `${C.accent}04` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>New Message to Secretariat</p>
                            <button onClick={() => setNewOpen(false)} style={{ padding: 4, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleStartNew} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input value={newForm.subject} onChange={e => setNewForm(f => ({ ...f, subject: e.target.value }))}
                                    placeholder="Subject *"
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', fontFamily: 'inherit' }}
                                    onFocus={e => e.target.style.borderColor = C.accent}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                />
                                <div style={{ position: 'relative' }}>
                                    <select value={newForm.category} onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))}
                                        style={{ padding: '8px 30px 8px 12px', borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', cursor: 'pointer', appearance: 'none', fontFamily: 'inherit' }}
                                    >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                    <ChevronDown size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                                <textarea value={newForm.message} onChange={e => setNewForm(f => ({ ...f, message: e.target.value }))}
                                    placeholder="Type your message… *"
                                    rows={2}
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
                                    onFocus={e => e.target.style.borderColor = C.accent}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                />
                                <button type="submit" style={{ padding: '10px 12px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', boxShadow: `0 2px 8px ${C.accent}40` }}>
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {selected ? (
                    <>
                        {/* Header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: `${C.accent}20`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                                    S
                                </div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Secretariat</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.textSec }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} />secretariat@myimun.org</span>
                                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.border, display: 'inline-block' }} />
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Shield size={11} />Admin</span>
                                    </div>
                                </div>
                            </div>
                            <button style={{ padding: 7, borderRadius: 7, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.text; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                            ><MoreVertical size={18} /></button>
                        </div>

                        {/* Messages thread */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                            <div style={{ textAlign: 'center', marginBottom: 14 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, background: C.bg, padding: '3px 10px', borderRadius: 999 }}>{selected.createdAt}</span>
                            </div>
                            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, textAlign: 'center' }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Topic: </span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{selected.subject}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {selected.messages.map(msg => (
                                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'delegate' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '75%', borderRadius: 14, padding: '10px 14px',
                                            background: msg.sender === 'delegate' ? C.accent : C.bg,
                                            color: msg.sender === 'delegate' ? 'white' : C.text,
                                            borderTopRightRadius: msg.sender === 'delegate' ? 2 : 14,
                                            borderTopLeftRadius:  msg.sender === 'delegate' ? 14 : 2,
                                        }}>
                                            <p style={{ fontSize: 13, lineHeight: 1.55 }}>{msg.text}</p>
                                            <p style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: msg.sender === 'delegate' ? 'right' : 'left' }}>{msg.time}</p>
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
                                        placeholder="Type your message…"
                                        style={{ width: '100%', padding: '10px 12px', minHeight: 60, maxHeight: 120, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.text, resize: 'none', fontFamily: 'inherit' }}
                                    />
                                    <div style={{ padding: '6px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button type="button" style={{ color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><Paperclip size={16} /></button>
                                        <span style={{ fontSize: 11, color: C.textMuted }}>Enter to send</span>
                                    </div>
                                </div>
                                <button type="submit" disabled={!replyText.trim()}
                                    style={{ padding: '13px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: C.accent, color: 'white', opacity: replyText.trim() ? 1 : 0.45, boxShadow: `0 2px 8px ${C.accent}40` }}
                                ><Send size={18} /></button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted, gap: 8 }}>
                        <Mail size={44} style={{ opacity: 0.3 }} />
                        <p style={{ fontSize: 15, fontWeight: 500 }}>Select a conversation</p>
                        <p style={{ fontSize: 13 }}>Or click "New" to contact the admin team.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
