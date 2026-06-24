'use client';

import React, { useRef, useState } from 'react';
import {
    CreditCard, CheckCircle, Clock, AlertTriangle, Search, Eye, X, Check, XCircle,
    User, Users, FileText, Image as ImageIcon, ExternalLink, Download, Landmark,
    Settings2, Save, ChevronDown, ChevronUp, Package, Plus, Pencil, Trash2,
    EyeOff, Eye as EyeOn, Tag, Upload,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConference, PaymentSubmission, PaymentSettings, ConferencePackage } from '@/context/ConferenceContext';
import { fileUrl } from '@/lib/fileStore';
import { Donut, BarRow, StatPanel } from '@/components/admin/StatWidgets';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
    overlay: 'rgba(17,24,39,0.45)',
};

const PRESET_COLORS = ['#3B7FFF','#7C5FFF','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4','#8B5CF6'];
const PRESET_EMOJIS = ['📋','🏨','⭐','🌍','🎓','🏆','💎','🚀','🎯','🌟','🎪','✈️'];

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
    Approved: { bg: `${C.green}12`, color: C.green, border: `${C.green}30` },
    Pending:  { bg: `${C.amber}12`, color: C.amber, border: `${C.amber}30` },
    Declined: { bg: `${C.red}12`,   color: C.red,   border: `${C.red}30`   },
};

type FilterKey = 'All' | 'Pending' | 'Approved' | 'Declined';

const BLANK_PKG: Omit<ConferencePackage, 'id'> = {
    name: '', price: 0, currency: 'USD', description: '',
    features: [], emoji: '📋', logoUrl: '', badge: '', hidden: false, color: '#3B7FFF',
};

export default function AdminPaymentsPage() {
    const { showToast } = useToast();
    const {
        payments, updatePaymentStatus, paymentSettings, updatePaymentSettings,
        packages, addPackage, updatePackage, deletePackage,
    } = useConference();

    /* ── Submissions state ── */
    const [filter, setFilter]   = useState<FilterKey>('All');
    const [search, setSearch]   = useState('');
    const [viewPay, setViewPay] = useState<PaymentSubmission | null>(null);
    const [declineFor, setDeclineFor] = useState<PaymentSubmission | null>(null);
    const [declineMsg, setDeclineMsg] = useState('');

    /* ── Payment setup ── */
    const [setupOpen, setSetupOpen] = useState(false);
    const [setupForm, setSetupForm] = useState<PaymentSettings>(paymentSettings);
    const openSetup = () => { setSetupForm(paymentSettings); setSetupOpen(o => !o); };
    const saveSetup = () => {
        updatePaymentSettings({ ...setupForm, fee: Number(setupForm.fee) || 0 });
        showToast('Payment details updated.', 'success');
        setSetupOpen(false);
    };
    const setupField = (key: keyof PaymentSettings, v: string) => setSetupForm(f => ({ ...f, [key]: v }));

    /* ── Packages state ── */
    const [pkgsOpen, setPkgsOpen]     = useState(true);
    const [pkgModal, setPkgModal]     = useState(false);
    const [pkgEditing, setPkgEditing] = useState<ConferencePackage | null>(null);
    const [pkgForm, setPkgForm]       = useState<Omit<ConferencePackage, 'id'>>(BLANK_PKG);
    const [newFeature, setNewFeature] = useState('');
    const [deletePkg, setDeletePkg]   = useState<ConferencePackage | null>(null);
    const pkgLogoInputRef = useRef<HTMLInputElement>(null);

    const openAddPkg = () => {
        setPkgEditing(null);
        setPkgForm({ ...BLANK_PKG, features: [] });
        setNewFeature('');
        setPkgModal(true);
    };
    const openEditPkg = (pkg: ConferencePackage) => {
        setPkgEditing(pkg);
        setPkgForm({ name: pkg.name, price: pkg.price, currency: pkg.currency, description: pkg.description, features: [...pkg.features], emoji: pkg.emoji, logoUrl: pkg.logoUrl ?? '', badge: pkg.badge, hidden: pkg.hidden, color: pkg.color });
        setNewFeature('');
        setPkgModal(true);
    };
    const handlePkgLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setPkgForm(f => ({ ...f, logoUrl: ev.target?.result as string }));
        reader.readAsDataURL(file);
    };
    const savePkg = () => {
        if (!pkgForm.name.trim()) { showToast('Package name is required.', 'error'); return; }
        if (pkgEditing) {
            updatePackage(pkgEditing.id, pkgForm);
            showToast('Package updated.', 'success');
        } else {
            addPackage(pkgForm);
            showToast('Package added.', 'success');
        }
        setPkgModal(false);
    };
    const addFeature = () => {
        const f = newFeature.trim();
        if (!f) return;
        setPkgForm(p => ({ ...p, features: [...p.features, f] }));
        setNewFeature('');
    };
    const removeFeature = (i: number) =>
        setPkgForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));

    /* ── Submissions ── */
    const totalRevenue = payments.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0);
    const approve = (p: PaymentSubmission) => {
        updatePaymentStatus(p.id, 'Approved');
        showToast(`Payment from ${p.senderName} verified.`, 'success');
        setViewPay(null);
    };
    const openDecline = (p: PaymentSubmission) => { setDeclineFor(p); setDeclineMsg(''); };
    const confirmDecline = () => {
        if (!declineFor) return;
        updatePaymentStatus(declineFor.id, 'Declined', declineMsg.trim() || 'No reason provided.');
        showToast(`Payment from ${declineFor.senderName} declined.`, 'warning');
        setDeclineFor(null);
        setViewPay(null);
    };
    const viewReceipt = (key: string) => {
        window.open(fileUrl(key), '_blank', 'noopener');
    };
    const downloadReceipt = (key: string, name: string) => {
        const a = document.createElement('a'); a.href = fileUrl(key); a.download = name; a.target = '_blank'; a.click();
    };

    const counts = {
        All: payments.length,
        Pending: payments.filter(p => p.status === 'Pending').length,
        Approved: payments.filter(p => p.status === 'Approved').length,
        Declined: payments.filter(p => p.status === 'Declined').length,
    };

    const pendingAmount = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
    const revenueByPackage = payments.filter(p => p.status === 'Approved').reduce<Record<string, number>>((acc, p) => {
        const name = p.packageName || 'No package';
        acc[name] = (acc[name] ?? 0) + p.amount;
        return acc;
    }, {});
    const revenueRows = Object.entries(revenueByPackage).sort((a, b) => b[1] - a[1]);
    const maxRevenueRow = revenueRows.length > 0 ? Math.max(...revenueRows.map(([, n]) => n)) : 0;
    const filtered = payments
        .filter(p => filter === 'All' || p.status === filter)
        .filter(p =>
            p.senderName.toLowerCase().includes(search.toLowerCase()) ||
            p.participantName.toLowerCase().includes(search.toLowerCase()) ||
            p.method.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => b.id - a.id);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>Payments</h1>
                    <p style={{ fontSize: 14, color: C.textSec }}>Receive delegate fee receipts, verify them, and approve payments.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Total Revenue</p>
                    <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 800, fontSize: 28, color: C.text }}>${totalRevenue.toFixed(2)}</p>
                </div>
            </div>

            {/* ── Breakdown ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
                <StatPanel title="Payment Status" subtitle={`${payments.length} receipts submitted`}>
                    <Donut centerLabel={String(payments.length)} centerSub="receipts" segments={[
                        { value: counts.Approved, color: C.green, label: 'Approved' },
                        { value: counts.Pending, color: C.amber, label: 'Pending' },
                        { value: counts.Declined, color: C.red, label: 'Declined' },
                    ]} />
                </StatPanel>
                <StatPanel title="Revenue" subtitle="Approved vs. awaiting verification">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Confirmed</p>
                            <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 800, fontSize: 26, color: C.green }}>${totalRevenue.toFixed(2)}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Pending Verification</p>
                            <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 800, fontSize: 26, color: C.amber }}>${pendingAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </StatPanel>
                <StatPanel title="Revenue by Package" subtitle={revenueRows.length === 0 ? 'No approved payments yet' : 'Approved payments only'}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                        {revenueRows.length === 0 ? (
                            <p style={{ fontSize: 12.5, color: C.textMuted }}>—</p>
                        ) : revenueRows.slice(0, 4).map(([name, amount]) => (
                            <BarRow key={name} label={name} value={amount} max={maxRevenueRow} color={C.accent} sublabel={`$${amount.toFixed(2)}`} />
                        ))}
                    </div>
                </StatPanel>
            </div>

            {/* ── Payment details setup ── */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow, overflow: 'hidden' }}>
                <button onClick={openSetup} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Settings2 size={18} style={{ color: C.accent }} />
                        </div>
                        <div>
                            <p style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>Payment Details Setup</p>
                            <p style={{ fontSize: 12.5, color: C.textSec }}>Configure the bank/transfer details delegates use to pay the ${Number(paymentSettings.fee).toFixed(2)} fee.</p>
                        </div>
                    </div>
                    {setupOpen ? <ChevronUp size={18} style={{ color: C.textMuted }} /> : <ChevronDown size={18} style={{ color: C.textMuted }} />}
                </button>
                {setupOpen && (
                    <div style={{ padding: '4px 20px 20px', borderTop: `1px solid ${C.border}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 16 }}>
                            {([
                                ['fee', 'Registration Fee', 'e.g. 150', 'number'],
                                ['currency', 'Currency', 'e.g. USD', 'text'],
                                ['bankName', 'Bank Name', 'e.g. MYIMUN Bank', 'text'],
                                ['accountName', 'Account Name', 'e.g. MYIMUN Events Ltd.', 'text'],
                                ['accountNumber', 'Account Number', 'e.g. 0001234567', 'text'],
                                ['iban', 'IBAN', 'e.g. MA00 1234 …', 'text'],
                                ['swift', 'SWIFT / BIC', 'e.g. MYIMMAMC', 'text'],
                                ['paypalEmail', 'PayPal Email', 'e.g. payments@myimun.org', 'text'],
                            ] as [keyof PaymentSettings, string, string, string][]).map(([key, label, ph, type]) => (
                                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>{label}</label>
                                    <input type={type} value={String(setupForm[key] ?? '')} onChange={e => setupField(key, e.target.value)} placeholder={ph}
                                        style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = C.accent}
                                        onBlur={e => e.target.style.borderColor = C.border} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>Instructions / Other Methods</label>
                            <textarea value={setupForm.instructions} onChange={e => setupField('instructions', e.target.value)} rows={3}
                                placeholder="e.g. Include your full name as reference. Cash accepted at the front desk…"
                                style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = C.accent}
                                onBlur={e => e.target.style.borderColor = C.border} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                            <button onClick={() => setSetupOpen(false)} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={saveSetup} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                <Save size={14} /> Save Details
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Registration Packages ── */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: pkgsOpen ? `1px solid ${C.border}` : 'none' }}>
                    <button onClick={() => setPkgsOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 'none', cursor: 'pointer', flex: 1, textAlign: 'left' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${C.amber}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} style={{ color: C.amber }} />
                        </div>
                        <div>
                            <p style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>Registration Packages</p>
                            <p style={{ fontSize: 12.5, color: C.textSec }}>{packages.length} packages · {packages.filter(p => !p.hidden).length} visible to delegates</p>
                        </div>
                        {pkgsOpen ? <ChevronUp size={18} style={{ color: C.textMuted, marginLeft: 8 }} /> : <ChevronDown size={18} style={{ color: C.textMuted, marginLeft: 8 }} />}
                    </button>
                    <button onClick={openAddPkg} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                        <Plus size={15} /> Add Package
                    </button>
                </div>

                {pkgsOpen && (
                    <div style={{ padding: 20 }}>
                        {packages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textMuted }}>
                                <Package size={36} style={{ margin: '0 auto 12px', color: C.border }} />
                                <p style={{ fontSize: 14 }}>No packages yet. Click "Add Package" to create one.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                {packages.map(pkg => (
                                    <div key={pkg.id} style={{ borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow, opacity: pkg.hidden ? 0.6 : 1 }}>
                                        {/* Colored header */}
                                        <div style={{ background: pkg.color, padding: '18px 18px 14px', position: 'relative' }}>
                                            {pkg.badge && (
                                                <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.25)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                                                    {pkg.badge}
                                                </span>
                                            )}
                                            {pkg.logoUrl ? (
                                                <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', marginBottom: 10, background: 'rgba(255,255,255,0.2)' }}>
                                                    <img src={pkg.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 10 }}>{pkg.emoji}</div>
                                            )}
                                            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pkg.name}</p>
                                            <p style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                                                {pkg.currency === 'USD' ? '$' : pkg.currency + ' '}{Number(pkg.price).toFixed(2)}
                                                <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}> / person</span>
                                            </p>
                                        </div>
                                        {/* Body */}
                                        <div style={{ padding: '14px 16px', background: C.surface }}>
                                            <p style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.5, marginBottom: 10 }}>{pkg.description}</p>
                                            <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                                                {pkg.features.length} feature{pkg.features.length !== 1 ? 's' : ''} included
                                            </p>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {pkg.features.slice(0, 3).map((f, i) => (
                                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: C.text }}>
                                                        <span style={{ color: pkg.color, flexShrink: 0, fontWeight: 700 }}>✓</span>{f}
                                                    </li>
                                                ))}
                                                {pkg.features.length > 3 && (
                                                    <li style={{ fontSize: 11.5, color: C.textMuted }}>+{pkg.features.length - 3} more…</li>
                                                )}
                                            </ul>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                                            <button
                                                onClick={() => updatePackage(pkg.id, { hidden: !pkg.hidden })}
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: pkg.hidden ? C.amber : C.green }}
                                            >
                                                {pkg.hidden ? <><EyeOff size={13} /> Hidden</> : <><EyeOn size={13} /> Visible</>}
                                            </button>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => openEditPkg(pkg)}
                                                    style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.textSec, display: 'flex', alignItems: 'center', gap: 5 }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.accent}10`; (e.currentTarget as HTMLElement).style.color = C.accent; (e.currentTarget as HTMLElement).style.borderColor = `${C.accent}40`; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textSec; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                                                ><Pencil size={12} /> Edit</button>
                                                <button onClick={() => setDeletePkg(pkg)}
                                                    style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.textSec, display: 'flex', alignItems: 'center', gap: 5 }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; (e.currentTarget as HTMLElement).style.borderColor = `${C.red}40`; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textSec; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                                                ><Trash2 size={12} /> Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Filters + search */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['All', 'Pending', 'Approved', 'Declined'] as FilterKey[]).map(key => {
                        const active = filter === key;
                        const col = key === 'All' ? C.accent : key === 'Pending' ? C.amber : key === 'Approved' ? C.green : C.red;
                        return (
                            <button key={key} onClick={() => setFilter(key)}
                                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, border: `1px solid ${active ? col : C.border}`, background: active ? `${col}12` : C.surface, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: active ? col : C.textSec }}>
                                {key}
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: active ? `${col}20` : C.bg, color: active ? col : C.textMuted }}>{counts[key]}</span>
                            </button>
                        );
                    })}
                </div>
                <div style={{ position: 'relative', minWidth: 220 }}>
                    <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                    <input type="text" placeholder="Search sender, participant, method…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', paddingLeft: 33, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e => e.target.style.borderColor = C.border} />
                </div>
            </div>

            {/* Submissions table */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                            <tr style={{ background: '#FAFBFC', borderBottom: `1px solid ${C.border}` }}>
                                {['Sender', 'Participant', 'Package', 'Amount', 'Method', 'Receipt', 'Date', 'Status', 'Actions'].map((h, i) => (
                                    <th key={h} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 8 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ padding: '56px 20px', textAlign: 'center' }}>
                                        <CreditCard size={36} style={{ color: C.border, margin: '0 auto 12px' }} />
                                        <p style={{ fontSize: 15, fontWeight: 500, color: C.textMuted }}>
                                            {payments.length === 0 ? 'No payment receipts yet.' : `No ${filter.toLowerCase()} payments.`}
                                        </p>
                                    </td>
                                </tr>
                            ) : filtered.map((p, idx) => {
                                const ss = STATUS_STYLE[p.status];
                                const pkg = packages.find(pk => pk.id === p.packageId);
                                return (
                                    <tr key={p.id} style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                        <td style={{ padding: '13px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: `${C.accent}16`, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                                                    {p.senderName.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{p.senderName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '13px 14px', fontSize: 13, color: C.text }}>{p.participantName}</td>
                                        <td style={{ padding: '13px 14px' }}>
                                            {pkg ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 7, background: `${pkg.color}15`, fontSize: 12, fontWeight: 600, color: pkg.color }}>
                                                    {pkg.logoUrl
                                                        ? <img src={pkg.logoUrl} alt="" style={{ width: 14, height: 14, borderRadius: 4, objectFit: 'cover' }} />
                                                        : <span>{pkg.emoji}</span>} {pkg.name}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: 12, color: C.textMuted }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '13px 14px', fontSize: 13.5, fontWeight: 700, color: C.text }}>${p.amount.toFixed(2)}</td>
                                        <td style={{ padding: '13px 14px', fontSize: 13, color: C.textSec }}>{p.method}</td>
                                        <td style={{ padding: '13px 14px' }}>
                                            <button onClick={() => viewReceipt(p.receiptKey)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                                {p.receiptType === 'application/pdf' ? <FileText size={13} /> : <ImageIcon size={13} />} View
                                            </button>
                                        </td>
                                        <td style={{ padding: '13px 14px', fontSize: 12.5, color: C.textSec, whiteSpace: 'nowrap' }}>{p.submittedAt}</td>
                                        <td style={{ padding: '13px 14px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                                                {p.status === 'Approved' && <CheckCircle size={11} />}
                                                {p.status === 'Pending' && <Clock size={11} />}
                                                {p.status === 'Declined' && <AlertTriangle size={11} />}
                                                {p.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                                                <button onClick={() => setViewPay(p)} title="View details"
                                                    style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.color = C.accent; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                ><Eye size={15} /></button>
                                                {p.status !== 'Approved' && (
                                                    <button onClick={() => approve(p)} title="Approve"
                                                        style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.green}12`; (e.currentTarget as HTMLElement).style.color = C.green; }}
                                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                    ><CheckCircle size={16} /></button>
                                                )}
                                                <button onClick={() => openDecline(p)} title="Decline"
                                                    style={{ padding: 6, borderRadius: 6, color: C.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.red}10`; (e.currentTarget as HTMLElement).style.color = C.red; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}
                                                ><XCircle size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Detail modal ── */}
            {viewPay && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) setViewPay(null); }}>
                    <div style={{ background: C.surface, borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Payment Details</p>
                            <button onClick={() => setViewPay(null)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {viewPay.packageName && (
                                <div style={{ marginBottom: 8, padding: '10px 14px', borderRadius: 10, background: `${(packages.find(p => p.id === viewPay.packageId)?.color ?? C.accent)}12`, border: `1px solid ${(packages.find(p => p.id === viewPay.packageId)?.color ?? C.accent)}25` }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Package</p>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {packages.find(p => p.id === viewPay.packageId)?.logoUrl
                                            ? <img src={packages.find(p => p.id === viewPay.packageId)?.logoUrl} alt="" style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'cover' }} />
                                            : packages.find(p => p.id === viewPay.packageId)?.emoji}
                                        {viewPay.packageName}
                                    </p>
                                </div>
                            )}
                            {[
                                [User, 'Sender (who paid)', viewPay.senderName],
                                [Users, 'Participant', viewPay.participantName],
                                [CreditCard, 'Amount', `$${viewPay.amount.toFixed(2)}`],
                                [Landmark, 'Method', viewPay.method],
                                [Clock, 'Submitted', viewPay.submittedAt],
                            ].map(([Icon, label, val]: any) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={15} style={{ color: C.textSec }} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                                        <p style={{ fontSize: 13.5, color: C.text, fontWeight: 500 }}>{val}</p>
                                    </div>
                                </div>
                            ))}
                            <div style={{ paddingTop: 14 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Payment Receipt</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 9, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadow }}>
                                        {viewPay.receiptType === 'application/pdf' ? <FileText size={18} style={{ color: C.red }} /> : <ImageIcon size={18} style={{ color: C.accent }} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewPay.receiptName}</p>
                                        <p style={{ fontSize: 11.5, color: C.textMuted }}>{(viewPay.receiptSize / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                    <button onClick={() => viewReceipt(viewPay.receiptKey)} style={{ padding: 7, borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', color: C.accent, flexShrink: 0 }}><ExternalLink size={15} /></button>
                                    <button onClick={() => downloadReceipt(viewPay.receiptKey, viewPay.receiptName)} style={{ padding: 7, borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', color: C.textSec, flexShrink: 0 }}><Download size={15} /></button>
                                </div>
                            </div>
                            {viewPay.status === 'Declined' && viewPay.declineReason && (
                                <div style={{ marginTop: 12, padding: '12px 14px', background: `${C.red}08`, borderRadius: 10, border: `1px solid ${C.red}20` }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Decline Reason</p>
                                    <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{viewPay.declineReason}</p>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#FAFBFC' }}>
                            <button onClick={() => openDecline(viewPay)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.red}40`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.red, cursor: 'pointer' }}>
                                <XCircle size={15} /> Decline
                            </button>
                            {viewPay.status !== 'Approved' && (
                                <button onClick={() => approve(viewPay)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, border: 'none', background: C.green, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                    <Check size={15} /> Approve Payment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Decline modal ── */}
            {declineFor && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) setDeclineFor(null); }}>
                    <div style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 26 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <XCircle size={20} style={{ color: C.red }} />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>Decline payment from {declineFor.senderName}?</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5, marginBottom: 16 }}>
                            Add a reason — the delegate will see it and can resubmit a corrected receipt.
                        </p>
                        <textarea value={declineMsg} onChange={e => setDeclineMsg(e.target.value)} rows={3}
                            placeholder="e.g. The receipt amount doesn't match the registration fee. Please resend a valid receipt."
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', marginBottom: 20 }}
                            onFocus={e => e.target.style.borderColor = C.red}
                            onBlur={e => e.target.style.borderColor = C.border} />
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeclineFor(null)} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDecline} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Decline Payment</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Package Add/Edit modal ── */}
            {pkgModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) setPkgModal(false); }}>
                    <div style={{ background: C.surface, borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                        {/* Modal header */}
                        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{pkgEditing ? 'Edit Package' : 'Add New Package'}</p>
                            <button onClick={() => setPkgModal(false)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted }}><X size={18} /></button>
                        </div>

                        {/* Preview banner */}
                        <div style={{ background: pkgForm.color, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, overflow: 'hidden' }}>
                                {pkgForm.logoUrl
                                    ? <img src={pkgForm.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : (pkgForm.emoji || '📋')}
                            </div>
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{pkgForm.name || 'Package Name'}</p>
                                <p style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                                    {pkgForm.currency === 'USD' ? '$' : (pkgForm.currency || '$')}{Number(pkgForm.price || 0).toFixed(2)}
                                    {pkgForm.badge && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.25)' }}>{pkgForm.badge}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Form body */}
                        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Name + Badge */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 5 }}>Package Name *</label>
                                    <input value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Accommodation Plan"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                        onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 5 }}>Badge Label</label>
                                    <input value={pkgForm.badge} onChange={e => setPkgForm(f => ({ ...f, badge: e.target.value }))} placeholder="e.g. Most Popular"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                        onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
                                </div>
                            </div>

                            {/* Price + Currency */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 5 }}>Price *</label>
                                    <input type="number" value={pkgForm.price} onChange={e => setPkgForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                        onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 5 }}>Currency</label>
                                    <input value={pkgForm.currency} onChange={e => setPkgForm(f => ({ ...f, currency: e.target.value }))} placeholder="USD"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                        onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 5 }}>Description</label>
                                <textarea value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} rows={2}
                                    placeholder="Brief description shown on the package card…"
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
                            </div>

                            {/* Emoji picker */}
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 5 }}>Icon / Emoji</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    {PRESET_EMOJIS.map(em => (
                                        <button key={em} onClick={() => setPkgForm(f => ({ ...f, emoji: em }))}
                                            style={{ width: 38, height: 38, borderRadius: 9, border: `2px solid ${pkgForm.emoji === em ? pkgForm.color : C.border}`, background: pkgForm.emoji === em ? `${pkgForm.color}15` : C.bg, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {em}
                                        </button>
                                    ))}
                                    <input value={pkgForm.emoji} onChange={e => setPkgForm(f => ({ ...f, emoji: e.target.value }))}
                                        style={{ width: 60, padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 16, textAlign: 'center', outline: 'none', background: C.bg }}
                                        placeholder="✏️" onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
                                </div>
                            </div>

                            {/* Logo upload */}
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 5 }}>Logo Image <span style={{ fontWeight: 400, color: C.textMuted }}>(overrides emoji if set)</span></label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 10, border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, background: C.bg }}>
                                        {pkgForm.logoUrl
                                            ? <img src={pkgForm.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <ImageIcon size={20} style={{ color: C.textMuted }} />}
                                    </div>
                                    <button type="button" onClick={() => pkgLogoInputRef.current?.click()}
                                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, fontSize: 13, color: C.textSec, cursor: 'pointer' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.accent}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
                                    ><Upload size={14} /> Upload Logo</button>
                                    {pkgForm.logoUrl && (
                                        <button type="button" onClick={() => setPkgForm(f => ({ ...f, logoUrl: '' }))}
                                            style={{ fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                                    )}
                                    <input ref={pkgLogoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePkgLogoUpload} />
                                </div>
                            </div>

                            {/* Color picker */}
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 5 }}>Accent Color</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    {PRESET_COLORS.map(col => (
                                        <button key={col} onClick={() => setPkgForm(f => ({ ...f, color: col }))}
                                            style={{ width: 32, height: 32, borderRadius: '50%', background: col, border: `3px solid ${pkgForm.color === col ? C.text : 'transparent'}`, cursor: 'pointer', outline: 'none', boxShadow: pkgForm.color === col ? `0 0 0 2px ${C.surface}, 0 0 0 4px ${col}` : 'none' }} />
                                    ))}
                                    <input type="color" value={pkgForm.color} onChange={e => setPkgForm(f => ({ ...f, color: e.target.value }))}
                                        style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }} title="Custom color" />
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 8 }}>
                                    What's Included <span style={{ fontWeight: 400, color: C.textMuted }}>({pkgForm.features.length} items)</span>
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                    {pkgForm.features.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                                            <span style={{ color: pkgForm.color, fontWeight: 700, fontSize: 13 }}>✓</span>
                                            <span style={{ flex: 1, fontSize: 13, color: C.text }}>{f}</span>
                                            <button onClick={() => removeFeature(i)} style={{ padding: 4, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: C.textMuted, display: 'flex', alignItems: 'center' }}
                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.red}
                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMuted}>
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input value={newFeature} onChange={e => setNewFeature(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                        placeholder="Add a feature and press Enter or click +"
                                        style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: C.bg, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
                                    <button onClick={addFeature} style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: pkgForm.color, color: '#fff', fontWeight: 700, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>+</button>
                                </div>
                            </div>

                            {/* Hidden toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Hide from delegates</p>
                                    <p style={{ fontSize: 12, color: C.textMuted }}>When hidden, delegates cannot select this package</p>
                                </div>
                                <button onClick={() => setPkgForm(f => ({ ...f, hidden: !f.hidden }))}
                                    style={{ width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', background: pkgForm.hidden ? C.amber : C.green, position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                                    <span style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: pkgForm.hidden ? 20 : 2, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#FAFBFC' }}>
                            <button onClick={() => setPkgModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={savePkg} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 8, border: 'none', background: pkgForm.color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                <Save size={14} /> {pkgEditing ? 'Save Changes' : 'Create Package'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete package confirm ── */}
            {deletePkg && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) setDeletePkg(null); }}>
                    <div style={{ background: C.surface, borderRadius: 14, width: '100%', maxWidth: 400, padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <Trash2 size={22} style={{ color: C.red }} />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>Delete "{deletePkg.name}"?</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.55, marginBottom: 22 }}>
                            This package will be permanently removed. Delegates who selected it will keep their payment records.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeletePkg(null)} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => { deletePackage(deletePkg.id); showToast('Package deleted.', 'success'); setDeletePkg(null); }}
                                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
