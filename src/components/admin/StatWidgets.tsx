'use client';

import React from 'react';

const C = {
    surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

/** Card wrapper used to host a Donut / BarRow group with a consistent title. */
export function StatPanel({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</h3>
                    {subtitle && <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{subtitle}</p>}
                </div>
                {right}
            </div>
            {children}
        </div>
    );
}

/** CSS conic-gradient donut chart with a legend — no charting library needed. */
export function Donut({ segments, size = 116, thickness = 15, centerLabel, centerSub }: {
    segments: { value: number; color: string; label: string }[];
    size?: number; thickness?: number; centerLabel?: string; centerSub?: string;
}) {
    const total = segments.reduce((s, x) => s + x.value, 0);
    let acc = 0;
    const stops: string[] = [];
    if (total === 0) {
        stops.push(`${C.border} 0% 100%`);
    } else {
        segments.forEach(seg => {
            if (seg.value <= 0) return;
            const start = (acc / total) * 100;
            acc += seg.value;
            const end = (acc / total) * 100;
            stops.push(`${seg.color} ${start}% ${end}%`);
        });
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                <div style={{ width: size, height: size, borderRadius: '50%', background: `conic-gradient(${stops.join(', ')})` }} />
                <div style={{
                    position: 'absolute', inset: thickness, borderRadius: '50%', background: C.surface,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                    {centerLabel && <span style={{ fontSize: size * 0.19, fontWeight: 800, color: C.text, fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', lineHeight: 1 }}>{centerLabel}</span>}
                    {centerSub && <span style={{ fontSize: size * 0.085, color: C.textMuted, marginTop: 2 }}>{centerSub}</span>}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 110 }}>
                {segments.map(seg => (
                    <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: C.textSec, whiteSpace: 'nowrap' }}>{seg.label}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginLeft: 'auto' }}>{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** A single labelled horizontal progress bar — for capacity, fill rate, distributions, etc. */
export function BarRow({ label, value, max, color, sublabel }: { label: string; value: number; max: number; color: string; sublabel?: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5, gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{sublabel ?? `${value}/${max}`}</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: C.border, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width .3s' }} />
            </div>
        </div>
    );
}

/** Compact KPI tile — icon + label + big number + small trend line. Matches the Overview stat cards. */
export function StatCard({ label, value, trend, iconBg, iconColor, Icon }: {
    label: string; value: string; trend?: string; iconBg: string; iconColor: string; Icon: React.ElementType;
}) {
    return (
        <div className="flex items-center gap-4 rounded-xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, minWidth: 0 }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
                <Icon size={20} style={{ color: iconColor }} />
            </div>
            <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                <p style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 800, fontSize: 28, color: C.text, lineHeight: 1 }}>{value}</p>
                {trend && <p className="mt-1" style={{ fontSize: 12, color: C.textSec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trend}</p>}
            </div>
        </div>
    );
}
