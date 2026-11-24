'use client';

import React, { useState } from 'react';
import { X, RotateCcw, Check, Ban, CalendarClock, BadgeCheck } from 'lucide-react';
import { useConference, type RefundRequest, type RefundReviewAction } from '@/context/ConferenceContext';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/lib/currency';
import { formatRefundDate } from '@/lib/refundDates';

const C = {
    surface: '#FFFFFF', border: '#E4E8EF', bg: '#F4F5F7',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
};

export const REFUND_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    Pending:  { bg: `${C.amber}14`, color: C.amber, label: 'Requested' },
    Approved: { bg: `${C.accent}14`, color: C.accent, label: 'Approved' },
    Declined: { bg: `${C.red}12`, color: C.red, label: 'Declined' },
    Refunded: { bg: `${C.green}14`, color: C.green, label: 'Refunded' },
};

const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
    fontSize: 13.5, fontFamily: 'inherit', color: C.text, outline: 'none', boxSizing: 'border-box', background: C.surface,
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12.5, color: C.textMuted }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{children}</span>
        </div>
    );
}

/** Staff view of one refund request: details plus approve / decline / schedule / mark-refunded actions. */
export function RefundReviewModal({ refund, onClose }: { refund: RefundRequest; onClose: () => void }) {
    const { reviewRefund, payments, packages, paymentSettings } = useConference();
    const { showToast } = useToast();
    const [date, setDate] = useState(refund.scheduledDate ?? '');
    const [declining, setDeclining] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [busy, setBusy] = useState(false);

    const payment = payments.find(p => p.id === refund.paymentId);
    const currency = packages.find(p => p.id === payment?.packageId)?.currency ?? paymentSettings.currency;
    const style = REFUND_STATUS_STYLE[refund.status] ?? REFUND_STATUS_STYLE.Pending;
    const isOpen = refund.status === 'Pending' || refund.status === 'Approved';

    const act = async (review: RefundReviewAction, success: string) => {
        setBusy(true);
        try {
            await reviewRefund(refund.id, review);
            showToast(success, 'success');
            setDeclining(false);
            setDeclineReason('');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not update the refund request.', 'error');
        }
        setBusy(false);
    };

    const btn = (bg: string, color = '#fff', border = 'none'): React.CSSProperties => ({
        padding: '9px 16px', borderRadius: 8, border, background: bg, color, fontSize: 13, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.65 : 1,
    });

    return (
        <div role="dialog" aria-modal="true" aria-label={`Refund request from ${refund.delegateName}`}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(17,24,39,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
            <div style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RotateCcw size={19} />
                        </div>
                        <div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Refund request</p>
                            <p style={{ fontSize: 13, color: C.textSec }}>{refund.delegateName}</p>
                        </div>
                    </div>
                    <button onClick={() => !busy && onClose()} aria-label="Close"
                        style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <Row label="Status">
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: style.bg, color: style.color }}>{style.label}</span>
                    </Row>
                    <Row label="Amount">{formatMoney(refund.amount, currency)}</Row>
                    {refund.packageName && <Row label="Package">{refund.packageName}</Row>}
                    {payment && <Row label="Paid via">{payment.method}{payment.bankName ? ` · ${payment.bankName}` : ''}</Row>}
                    <Row label="Requested">{refund.createdAt}</Row>
                    {refund.scheduledDate && <Row label="Refund date">{formatRefundDate(refund.scheduledDate)}</Row>}
                    {refund.refundedAt && <Row label="Refunded">{refund.refundedAt}</Row>}
                    {refund.reviewedBy && <Row label="Last action by">{refund.reviewedBy}{refund.reviewedAt ? ` · ${refund.reviewedAt}` : ''}</Row>}
                </div>

                <div style={{ padding: '12px 14px', background: C.bg, borderRadius: 10, marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Delegate&apos;s reason</p>
                    <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{refund.reason}</p>
                </div>

                {refund.status === 'Declined' && refund.declineReason && (
                    <div style={{ padding: '12px 14px', background: `${C.red}0A`, border: `1px solid ${C.red}25`, borderRadius: 10, marginBottom: 16 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Decline reason</p>
                        <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{refund.declineReason}</p>
                    </div>
                )}

                {isOpen && !declining && (
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="refund-date" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                            <CalendarClock size={14} /> Refund date {refund.status === 'Pending' && <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span>}
                        </label>
                        <input id="refund-date" type="date" value={date} min={todayIso()} onChange={e => setDate(e.target.value)} style={inputStyle} />
                    </div>
                )}

                {declining && (
                    <div style={{ marginBottom: 16 }}>
                        <label htmlFor="refund-decline" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                            Reason for declining <span style={{ fontWeight: 400, color: C.textMuted }}>(shown to the delegate)</span>
                        </label>
                        <textarea id="refund-decline" rows={3} value={declineReason} maxLength={2000} autoFocus
                            onChange={e => setDeclineReason(e.target.value)}
                            placeholder="For example: Refunds are not available within 14 days of the conference."
                            style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {declining ? (
                        <>
                            <button onClick={() => { setDeclining(false); setDeclineReason(''); }} disabled={busy} style={btn(C.surface, C.textSec, `1px solid ${C.border}`)}>Back</button>
                            <button disabled={busy || declineReason.trim().length < 3}
                                onClick={() => act({ action: 'decline', declineReason: declineReason.trim() }, 'Refund request declined.')}
                                style={{ ...btn(C.red), opacity: busy || declineReason.trim().length < 3 ? 0.6 : 1 }}>
                                <Ban size={14} /> Confirm decline
                            </button>
                        </>
                    ) : refund.status === 'Pending' ? (
                        <>
                            <button onClick={() => setDeclining(true)} disabled={busy} style={btn(C.surface, C.red, `1px solid ${C.red}55`)}>
                                <Ban size={14} /> Decline
                            </button>
                            <button disabled={busy}
                                onClick={() => act(date ? { action: 'approve', scheduledDate: date } : { action: 'approve' }, date ? 'Refund approved and scheduled.' : 'Refund approved.')}
                                style={btn(C.green)}>
                                <Check size={14} /> {date ? 'Approve & schedule' : 'Approve'}
                            </button>
                        </>
                    ) : refund.status === 'Approved' ? (
                        <>
                            <button onClick={() => setDeclining(true)} disabled={busy} style={btn(C.surface, C.red, `1px solid ${C.red}55`)}>
                                <Ban size={14} /> Decline
                            </button>
                            <button disabled={busy || !date || date === refund.scheduledDate}
                                onClick={() => act({ action: 'schedule', scheduledDate: date }, 'Refund date saved.')}
                                style={{ ...btn(C.surface, C.accent, `1px solid ${C.accent}55`), opacity: busy || !date || date === refund.scheduledDate ? 0.5 : 1 }}>
                                <CalendarClock size={14} /> Save date
                            </button>
                            <button disabled={busy} onClick={() => act({ action: 'markRefunded' }, 'Marked as refunded.')} style={btn(C.green)}>
                                <BadgeCheck size={14} /> Mark as refunded
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} style={btn(C.surface, C.textSec, `1px solid ${C.border}`)}>Close</button>
                    )}
                </div>
            </div>
        </div>
    );
}
