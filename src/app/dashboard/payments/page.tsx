'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
    CreditCard, CheckCircle2, Clock, AlertCircle, Sparkles, Upload, FileText,
    Image as ImageIcon, X as XIcon, User, Users, ArrowRight, XCircle, Landmark,
    Check, ChevronRight, Package,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useConference, ConferencePackage } from '@/context/ConferenceContext';
import { useToast } from '@/components/ui/Toast';
import { uploadFile, fileUrl } from '@/lib/fileStore';
import { formatMoney } from '@/lib/currency';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const MAX_RECEIPT_MB = 20;
const PAYMENT_METHODS = ['Bank Transfer', 'Cash Transfer'];

function openStoredDoc(key: string) {
    window.open(fileUrl(key), '_blank', 'noopener');
}

export default function PaymentsPage() {
    const { user } = useAuth();
    const { getRegistrationForDelegate, getPaymentForDelegate, submitPayment, paymentSettings, packages } = useConference();
    const { showToast } = useToast();

    const delegateId = user?.id ?? 'unknown';
    const reg = getRegistrationForDelegate(delegateId);
    const payment = getPaymentForDelegate(delegateId);

    const accepted = reg?.status === 'Accepted';
    const paid = reg?.paymentStatus === 'Paid' && payment?.status !== 'Declined';

    const isMostPopular = (pkg: ConferencePackage) => pkg.badge.trim().toLowerCase() === 'most popular';
    const visiblePackages = packages
        .filter(p => !p.hidden)
        .sort((a, b) => Number(isMostPopular(b)) - Number(isMostPopular(a)));
    const currencyForPayment = () =>
        packages.find(pkg => pkg.id === payment?.packageId)?.currency ?? paymentSettings.currency;

    // Package selection state
    const [selectedPkg, setSelectedPkg] = useState<ConferencePackage | null>(null);
    const [showForm, setShowForm] = useState(false);

    const activePrice = selectedPkg ? selectedPkg.price : 0;

    // Form state
    const [senderName, setSenderName]         = useState(reg?.fullName ?? user?.name ?? '');
    const [participantName, setParticipantName] = useState(reg?.fullName ?? user?.name ?? '');
    const [method, setMethod]                  = useState('Bank Transfer');
    const [selectedBankId, setSelectedBankId]  = useState('');
    const [receipt, setReceipt]               = useState<File | null>(null);
    const [submitting, setSubmitting]          = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const banks = paymentSettings.banks;
    const selectedBank = banks.find(bank => bank.id === selectedBankId) ?? null;

    useEffect(() => {
        if (!selectedBankId || !banks.some(bank => bank.id === selectedBankId)) setSelectedBankId(banks[0]?.id ?? '');
    }, [banks, selectedBankId]);

    const pickFile = (file: File) => {
        const okType = file.type === 'application/pdf' || file.type.startsWith('image/');
        if (!okType) { showToast('Only PDF or image receipts are accepted.', 'error'); return; }
        if (file.size > MAX_RECEIPT_MB * 1024 * 1024) { showToast(`Receipt must be under ${MAX_RECEIPT_MB} MB.`, 'error'); return; }
        setReceipt(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!senderName.trim() || !participantName.trim()) { showToast('Please enter both sender and participant names.', 'error'); return; }
        if (method === 'Bank Transfer' && banks.length > 0 && !selectedBank) { showToast('Please choose the bank account you used.', 'error'); return; }
        if (!receipt) { showToast('Please upload your payment receipt.', 'error'); return; }

        setSubmitting(true);
        try {
            const up = await uploadFile(receipt);
            await submitPayment({
                delegateId,
                senderName: senderName.trim(),
                participantName: participantName.trim(),
                amount: activePrice,
                method,
                bankId: method === 'Bank Transfer' ? selectedBank?.id : undefined,
                bankName: method === 'Bank Transfer' ? selectedBank?.bankName : undefined,
                packageId: selectedPkg?.id,
                packageName: selectedPkg?.name,
                receiptName: receipt.name,
                receiptSize: receipt.size,
                receiptType: receipt.type,
                receiptKey: up.key,
            } as never);
            showToast('Receipt submitted! The admin team will verify your payment.', 'success');
            setReceipt(null);
        } catch {
            showToast('Could not submit your receipt. Please try a smaller file.', 'error');
        }
        setSubmitting(false);
    };

    const needsPackageSelection = accepted && !paid && (!payment || payment.status === 'Declined');
    const showSubmitForm = needsPackageSelection && showForm && selectedPkg;
    const showPending = accepted && !paid && payment?.status === 'Pending';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>Payments</h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Select your registration package and submit your payment receipt.</p>
            </div>

            {/* ── Paid confirmation ── */}
            {paid && (
                <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles size={20} style={{ color: C.green }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Payment verified - you&apos;re all set!</p>
                        <p style={{ fontSize: 13, color: C.textSec }}>Your registration fee has been confirmed. You now have full platform access.</p>
                    </div>
                </div>
            )}

            {/* ── Payment pending ── */}
            {showPending && payment && (
                <div style={{ background: `${C.amber}0E`, border: `1px solid ${C.amber}35`, borderRadius: 14, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow }}>
                            <Clock size={20} style={{ color: C.amber }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 15.5, fontWeight: 700, color: C.text, marginBottom: 3 }}>Payment Under Review</p>
                            <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55 }}>We&apos;ve received your receipt and our finance team is verifying it. Full access unlocks once approved.</p>
                            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {[
                                    ['Package', payment.packageName ?? '—'],
                                    ['Sender', payment.senderName],
                                    ['Amount', formatMoney(payment.amount, currencyForPayment())],
                                    ['Method', payment.method],
                                ].map(([l, v]) => (
                                    <div key={l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px 14px' }}>
                                        <p style={{ fontSize: 10.5, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => openStoredDoc(payment.receiptKey)} style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0 }}>
                                <FileText size={14} /> View submitted receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Declined notice ── */}
            {accepted && !paid && payment?.status === 'Declined' && (
                <div style={{ background: `${C.red}0A`, border: `1px solid ${C.red}30`, borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow }}>
                        <XCircle size={20} style={{ color: C.red }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>Payment Not Verified</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55 }}>Your previous receipt could not be verified. Please select a package and resubmit.</p>
                        {payment.declineReason && (
                            <div style={{ marginTop: 10, padding: '10px 14px', background: C.surface, borderRadius: 9, border: `1px solid ${C.red}22` }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Reason</p>
                                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{payment.declineReason}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Package selection ── */}
            {needsPackageSelection && !showForm && (
                <>
                    <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>Choose Your Registration Package</h2>
                        <p style={{ fontSize: 13, color: C.textSec }}>Select the plan that suits you best, then proceed to payment.</p>
                    </div>

                    {visiblePackages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 20px', background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
                            <Package size={36} style={{ color: C.border, margin: '0 auto 12px' }} />
                            <p style={{ fontSize: 14, color: C.textMuted }}>No packages available yet. Please contact the admin.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
                            {visiblePackages.map(pkg => {
                                const sel = selectedPkg?.id === pkg.id;
                                const popular = isMostPopular(pkg);
                                return (
                                    <div key={pkg.id} onClick={() => setSelectedPkg(pkg)}
                                        style={{
                                            borderRadius: 16,
                                            border: `${popular ? 3 : 2}px solid ${sel || popular ? pkg.color : C.border}`,
                                            overflow: 'hidden', cursor: 'pointer', position: 'relative',
                                            boxShadow: popular ? `0 12px 34px ${pkg.color}32` : sel ? `0 8px 28px ${pkg.color}28` : C.shadow,
                                            transform: popular ? 'translateY(-6px)' : 'none', transition: 'all 0.18s', background: C.surface,
                                        }}>

                                        {/* Colored header */}
                                        <div style={{ background: pkg.color, padding: popular ? '26px 20px 18px' : '22px 20px 18px', position: 'relative' }}>
                                            {pkg.badge && (
                                                <span style={{ position: 'absolute', top: popular ? 12 : 14, right: 14, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: popular ? '#FFFFFF' : 'rgba(255,255,255,0.3)', color: popular ? pkg.color : '#fff', boxShadow: popular ? '0 2px 8px rgba(0,0,0,0.12)' : 'none' }}>
                                                    {popular && <Sparkles size={11} />} {pkg.badge}
                                                </span>
                                            )}
                                            <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 10 }}>{pkg.emoji}</div>
                                            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{pkg.name}</p>
                                            <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                                {formatMoney(Number(pkg.price), pkg.currency)}
                                                <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}> / person</span>
                                            </p>
                                        </div>

                                        {/* Body */}
                                        <div style={{ padding: '16px 18px 18px' }}>
                                            {popular && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px', marginBottom: 14, borderRadius: 8, background: `${pkg.color}10`, border: `1px solid ${pkg.color}24`, color: pkg.color }}>
                                                    <Sparkles size={14} style={{ flexShrink: 0 }} />
                                                    <p style={{ fontSize: 12, fontWeight: 700 }}>Best value: stay, meals, and full conference support included.</p>
                                                </div>
                                            )}
                                            <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.55, marginBottom: 14 }}>{pkg.description}</p>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                                                {pkg.features.map((f, i) => (
                                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C.text }}>
                                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${pkg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                                            <Check size={11} style={{ color: pkg.color }} />
                                                        </div>
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelectedPkg(pkg); }}
                                                style={{ width: '100%', padding: '11px', borderRadius: 10, border: `2px solid ${sel || popular ? pkg.color : C.border}`, background: sel || popular ? pkg.color : 'transparent', color: sel || popular ? '#fff' : pkg.color, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: popular && !sel ? `0 4px 12px ${pkg.color}30` : 'none' }}>
                                                {sel ? <><CheckCircle2 size={15} /> Selected</> : popular ? 'Choose Most Popular' : 'Select This Plan'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Continue button */}
                    {selectedPkg && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowForm(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: 'none', background: selectedPkg.color, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px ${selectedPkg.color}45` }}>
                                Continue to Payment <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── Payment form (after package selected) ── */}
            {showSubmitForm && selectedPkg && (
                <>
                    {/* Selected package summary */}
                    <div style={{ background: 'linear-gradient(135deg, #1A3A8F, #3B7FFF)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: `0 8px 24px ${C.accent}40` }}>
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                            {selectedPkg.emoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Selected Package</p>
                                {selectedPkg.badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{selectedPkg.badge}</span>}
                            </div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{selectedPkg.name}</p>
                            <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                {formatMoney(Number(selectedPkg.price), selectedPkg.currency)}
                            </p>
                        </div>
                        <button onClick={() => { setShowForm(false); }}
                            style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Change Plan
                        </button>
                    </div>

                    {/* Admin-configured payment details */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', boxShadow: C.shadow }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <Landmark size={15} style={{ color: C.accent }} />
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>Payment Details</span>
                        </div>
                        {banks.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }} role="radiogroup" aria-label="Choose bank account">
                                {banks.map(bank => {
                                    const active = selectedBank?.id === bank.id;
                                    return (
                                        <button key={bank.id} type="button" onClick={() => setSelectedBankId(bank.id)} aria-checked={active} role="radio"
                                            style={{ padding: 14, borderRadius: 10, border: `1px solid ${active ? C.accent : C.border}`, background: active ? `${C.accent}08` : '#FAFBFC', textAlign: 'left', cursor: 'pointer', boxShadow: active ? `0 0 0 2px ${C.accent}12` : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                                                <div style={{ width: 38, height: 38, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                    {bank.logoKey ? <img src={fileUrl(bank.logoKey)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} /> : <Landmark size={18} style={{ color: C.accent }} />}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}><p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bank.bankName || 'Bank Account'}</p><p style={{ fontSize: 11.5, color: active ? C.accent : C.textMuted, marginTop: 2 }}>{active ? 'Selected for this payment' : 'Select this account'}</p></div>
                                                {active && <CheckCircle2 size={17} style={{ color: C.accent, flexShrink: 0 }} />}
                                            </div>
                                            {[['Account Name', bank.accountName], ['Account Number', bank.accountNumber], ['IBAN', bank.iban], ['SWIFT / BIC', bank.swift]].filter(([, value]) => value.trim()).map(([label, value]) => (
                                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 7, marginTop: 7, borderTop: `1px solid ${C.border}` }}><span style={{ fontSize: 10.5, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span><span style={{ fontSize: 12.5, color: C.text, fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span></div>
                                            ))}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {paymentSettings.paypalEmail?.trim() && (
                            <div style={{ marginTop: banks.length ? 14 : 0, display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 12px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}><span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PayPal</span><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{paymentSettings.paypalEmail}</span></div>
                        )}
                        {paymentSettings.instructions?.trim() && (
                            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
                                <AlertCircle size={15} style={{ color: C.accent, flexShrink: 0, marginTop: 1 }} />
                                <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.55 }}>{paymentSettings.instructions}</p>
                            </div>
                        )}
                    </div>

                    {/* Receipt form */}
                    <form onSubmit={handleSubmit} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Submit Payment Receipt</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSec }}>Sender Name<span style={{ color: C.red }}> *</span></label>
                                <div style={{ position: 'relative' }}>
                                    <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                                    <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Who made the payment"
                                        style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13.5, color: C.text, background: C.bg, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
                                </div>
                                <p style={{ fontSize: 11, color: C.textMuted }}>The name on the bank transfer / card.</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSec }}>Participant Name<span style={{ color: C.red }}> *</span></label>
                                <div style={{ position: 'relative' }}>
                                    <Users size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                                    <input value={participantName} onChange={e => setParticipantName(e.target.value)} placeholder="The delegate this payment is for"
                                        style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13.5, color: C.text, background: C.bg, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
                                </div>
                                <p style={{ fontSize: 11, color: C.textMuted }}>The delegate registered for the event.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSec }}>Payment Method<span style={{ color: C.red }}> *</span></label>
                            <select value={method} onChange={e => setMethod(e.target.value)}
                                style={{ padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13.5, color: C.text, background: C.bg, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSec }}>Payment Receipt<span style={{ color: C.red }}> *</span></label>
                            {!receipt ? (
                                <div onClick={() => fileRef.current?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
                                    style={{ border: `2px dashed ${C.border}`, borderRadius: 12, padding: '26px 20px', textAlign: 'center', cursor: 'pointer', background: C.bg }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                                    <div style={{ width: 46, height: 46, borderRadius: 12, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                        <Upload size={20} style={{ color: C.accent }} />
                                    </div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Click to upload or drag & drop</p>
                                    <p style={{ fontSize: 12.5, color: C.textMuted, marginTop: 5 }}>PDF or image · Max {MAX_RECEIPT_MB} MB</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: `${C.green}08`, border: `1px solid ${C.green}30` }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow }}>
                                        {receipt.type === 'application/pdf' ? <FileText size={20} style={{ color: C.red }} /> : <ImageIcon size={20} style={{ color: C.accent }} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13.5, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{receipt.name}</p>
                                        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>{(receipt.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                    <button type="button" onClick={() => { setReceipt(null); if (fileRef.current) fileRef.current.value = ''; }}
                                        style={{ padding: 7, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted, flexShrink: 0 }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                    ><XIcon size={16} /></button>
                                </div>
                            )}
                            <input ref={fileRef} type="file" accept=".pdf,application/pdf,image/*" style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" disabled={submitting} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 26px', borderRadius: 10, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                                background: selectedPkg.color, color: '#fff', fontSize: 14, fontWeight: 700,
                                boxShadow: `0 4px 14px ${selectedPkg.color}45`, opacity: submitting ? 0.6 : 1,
                            }}>
                                {submitting ? 'Submitting…' : 'Submit Receipt'} {!submitting && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </form>
                </>
            )}

            {/* Not yet accepted */}
            {!accepted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.textSec, padding: '14px 18px', background: `${C.amber}0A`, borderRadius: 10, border: `1px solid ${C.amber}28` }}>
                    <AlertCircle size={16} style={{ color: C.amber, flexShrink: 0 }} />
                    Your registration must be approved before you can select a package and submit a payment.
                </div>
            )}

            {/* Paid: package + payment summary */}
            {paid && payment && (() => {
                const paidPkg = packages.find(p => p.id === payment.packageId);
                return (
                    <>
                        {/* Package card */}
                        <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
                            {/* Colored header */}
                            <div style={{ background: paidPkg?.color ?? C.accent, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                                    {paidPkg?.emoji ?? '📋'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Package</p>
                                        {paidPkg?.badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.25)', color: '#fff' }}>{paidPkg.badge}</span>}
                                    </div>
                                    <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{payment.packageName ?? 'Registration Package'}</p>
                                    <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                        {formatMoney(payment.amount, paidPkg?.currency ?? paymentSettings.currency)} <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>paid</span>
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
                                    <CheckCircle2 size={14} style={{ color: '#fff' }} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Verified</span>
                                </div>
                            </div>

                            {/* Features list */}
                            {paidPkg && paidPkg.features.length > 0 && (
                                <div style={{ padding: '18px 24px', background: C.surface }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>What&apos;s included</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                                        {paidPkg.features.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C.text }}>
                                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${paidPkg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                                    <Check size={11} style={{ color: paidPkg.color }} />
                                                </div>
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment meta */}
                            <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, background: '#FAFBFC', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                {[
                                    ['Sender', payment.senderName],
                                    ['Participant', payment.participantName],
                                    ['Method', payment.method],
                                    ['Submitted', payment.submittedAt],
                                ].map(([l, v]) => (
                                    <div key={l}>
                                        <p style={{ fontSize: 10.5, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{l}</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );
            })()}

            {/* Help banner */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 10, background: `${C.accent}08`, border: `1px solid ${C.accent}25` }}>
                <AlertCircle size={18} style={{ color: C.accent, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55 }}>
                    Need help with payments? Contact our finance team at{' '}
                    <a href="mailto:contact@moroccanmun.org" style={{ color: C.accent, fontWeight: 500 }}>contact@moroccanmun.org</a>.
                </p>
            </div>
        </div>
    );
}
