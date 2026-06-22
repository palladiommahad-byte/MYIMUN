'use client';

import React from 'react';
import { useConference } from '@/context/ConferenceContext';
import { Wrench } from 'lucide-react';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

/**
 * Blocks standard delegate access to the dashboard while the organizers
 * have System Maintenance Mode switched on (Admin → Settings).
 */
export const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { conferenceSettings } = useConference();

    if (!conferenceSettings.maintenanceMode) return <>{children}</>;

    return (
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",system-ui,sans-serif', padding: 20 }}>
            <div style={{ maxWidth: 460, width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '40px 32px', textAlign: 'center', boxShadow: C.shadow }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Wrench size={30} style={{ color: C.accent }} />
                </div>
                <h2 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontSize: 21, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                    Platform Under Maintenance
                </h2>
                <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6 }}>
                    The delegate dashboard is temporarily unavailable while we perform scheduled maintenance. Please check back shortly.
                </p>
            </div>
        </div>
    );
};
