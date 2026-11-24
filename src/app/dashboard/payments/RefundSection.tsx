'use client';

import React, { useState } from 'react';
import { RotateCcw, Clock, CalendarCheck, XCircle, CheckCircle2, Send } from 'lucide-react';
import type { RefundRequest } from '@/context/ConferenceContext';
import { useConference } from '@/context/ConferenceContext';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/lib/currency';
import { formatRefundDate } from '@/lib/refundDates';

const C = {
    surface: '#FFFFFF', border: '#E4E8EF', bg: '#F4F5F7',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const MIN_REASON = 10;
const MAX_REASON = 2000;

function IconBox({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow, color }}>
            {children}
        </div>
    );
}

function Detail({ label, children, tone = C.text }: { label: string; children: React.ReactNode; tone?: string }) {
    return (
        <div style={{ marginTop: 10, padding: '10px 14px', background: C.surface, borderRadius: 9, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: tone === C.text ? C.textMuted : tone, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</p>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{children}</div>
        </div>
    );
}

/** Refund request + status card shown on the delegate's Payments page once their payment is verified. */
export function RefundSection({ refund, currency }: { refund: RefundRequest | undefined; currency: string }) {
    const { requestRefund } = useConference();
    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [sending, setSending] = useState(false);

    const canRequest = !refund || refund.status === 'Declined';
    const trimmed = reason.trim();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (trimmed.length < MIN_REASON) { showToast(`Please explain your reason (at least ${MIN_REASON} characters).`, 'error'); return; }
        setSending(true);
        try {
            await requestRefund(trimmed);
            showToast('Refund request sent to the secretariat.', 'success');
            setReason('');
            setOpen(false);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not send your refund request.', 'error');
        }
        setSending(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {refund?.status === 'Pending' && (
                <div style={{ background: `${C.amber}0E`, border: `1px solid ${C.amber}35`, borderRadius: 14, padding: '18px 22px', display: 'flex', gap: 14 }}>
                    <IconBox color={C.amber}><Clock size={20} /></IconBox>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>Refund request under review</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55 }}>
                            You asked for a refund of {formatMoney(refund.amount, currency)} on {refund.createdAt}. The secretariat will review it and notify you.
                        </p>
                        <Detail label="Your reason">{refund.reason}</Detail>
                    </div>
                </div>
            )}

            {refund?.status === 'Approved' && (
                <div style={{ background: `${C.accent}0C`, border: `1px solid ${C.accent}30`, borderRadius: 14, padding: '18px 22px', display: 'flex', gap: 14 }}>
                    <IconBox color={C.accent}><CalendarCheck size={20} /></IconBox>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>Refund approved</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55 }}>
                            Your refund of {formatMoney(refund.amount, currency)} has been approved.
                        </p>
                        <Detail label="Refund date" tone={C.accent}>
                            {refund.scheduledDate
                                ? <strong>{formatRefundDate(refund.scheduledDate)}</strong>
                                : 'To be confirmed — you will be notified as soon as the date is set.'}
                        </Detail>
                    </div>
                </div>
            )}

            {refund?.status === 'Refunded' && (
                <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 14, padding: '18px 22px', display: 'flex', gap: 14 }}>
                    <IconBox color={C.green}><CheckCircle2 size={20} /></IconBox>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>Refund completed</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55 }}>
                            {formatMoney(refund.amount, currency)} was refunded{refund.refundedAt ? ` on ${refund.refundedAt}` : ''}. Please allow a few days for it to reach your account.
                        </p>
                    </div>
                </div>
            )}

            {refund?.status === 'Declined' && (
                <div style={{ background: `${C.red}0A`, border: `1px solid ${C.red}30`, borderRadius: 14, padding: '18px 22px', display: 'flex', gap: 14 }}>
                    <IconBox color={C.red}><XCircle size={20} /></IconBox>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>Refund request declined</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55 }}>Your request from {refund.createdAt} was not approved.</p>
                        {refund.declineReason && <Detail label="Reason" tone={C.red}>{refund.declineReason}</Detail>}
                    </div>
                </div>
            )}

            {canRequest && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 22px', boxShadow: C.shadow }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.textSec }}>
                            <RotateCcw size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <p style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>
                                {refund?.status === 'Declined' ? 'Request a refund again' : 'Need a refund?'}
                            </p>
                            <p style={{ fontSize: 13, color: C.textSec }}>Tell the secretariat why, and they will review your request.</p>
                        </div>
                        {!open && (
                            <button type="button" onClick={() => setOpen(true)}
                                style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer' }}>
                                Request a refund
                            </button>
                        )}
                    </div>

                    {open && (
                        <form onSubmit={submit} style={{ marginTop: 16 }}>
                            <label htmlFor="refund-reason" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                                Why do you want a refund?
                            </label>
                            <textarea id="refund-reason" value={reason} rows={4} maxLength={MAX_REASON} required
                                onChange={e => setReason(e.target.value)}
                                placeholder="For example: I can no longer attend the conference because…"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13.5, fontFamily: 'inherit', color: C.text, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 12, color: trimmed.length < MIN_REASON ? C.textMuted : C.green }}>
                                    {trimmed.length}/{MAX_REASON}{trimmed.length < MIN_REASON ? ` · at least ${MIN_REASON} characters` : ''}
                                </span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" onClick={() => { setOpen(false); setReason(''); }} disabled={sending}
                                        style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={sending || trimmed.length < MIN_REASON}
                                        style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: sending ? 'default' : 'pointer', opacity: sending || trimmed.length < MIN_REASON ? 0.6 : 1 }}>
                                        <Send size={14} /> {sending ? 'Sending…' : 'Send request'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
