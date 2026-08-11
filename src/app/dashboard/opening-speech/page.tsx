'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, FileText, Save } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useConference } from '@/context/ConferenceContext';
import { useToast } from '@/components/ui/Toast';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

export default function OpeningSpeechPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { getApplicationForDelegate, openingSpeeches, submitOpeningSpeech } = useConference();
    const delegateId = user?.id ?? '';
    const application = getApplicationForDelegate(delegateId);
    const approvedApplication = application?.status === 'Approved' ? application : null;
    const currentSpeech = approvedApplication
        ? openingSpeeches.find(speech => speech.delegateId === delegateId && speech.committee === approvedApplication.committeeAbbr) ?? null
        : null;
    const [speech, setSpeech] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const id = setTimeout(() => setSpeech(currentSpeech?.speech ?? ''), 0);
        return () => clearTimeout(id);
    }, [currentSpeech?.id, currentSpeech?.speech]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const value = speech.trim();
        if (value.length < 20) {
            showToast('Please write at least 20 characters for your opening speech.', 'error');
            return;
        }
        setSaving(true);
        try {
            await submitOpeningSpeech(value);
            showToast('Opening speech submitted successfully.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not submit your opening speech.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!approvedApplication) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', maxWidth: 760 }}>
                <div>
                    <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>Opening Speech</h1>
                    <p style={{ fontSize: 14, color: C.textSec }}>Prepare the speech you will deliver when your committee opens.</p>
                </div>
                <div style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}30`, borderRadius: 12, padding: '28px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <AlertCircle size={22} style={{ color: C.amber, flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>Committee Approval Required</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>Your opening speech can be submitted after the secretariat approves your committee application and assigns your delegation.</p>
                    </div>
                </div>
            </div>
        );
    }

    const country = approvedApplication.assignedCountry || application.country || 'your assigned country';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', maxWidth: 760 }}>
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>Opening Speech</h1>
                <p style={{ fontSize: 14, color: C.textSec }}>Submit your opening speech for <strong style={{ color: C.text }}>{approvedApplication.committeeAbbr}</strong> representing <strong style={{ color: C.text }}>{country}</strong>.</p>
            </div>

            {currentSpeech && (
                <div style={{ background: `${C.green}12`, border: `1px solid ${C.green}30`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 13 }}>
                    <CheckCircle size={20} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: C.green, marginBottom: 3 }}>Opening speech submitted</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>Your speech was saved on {currentSpeech.submittedAt}. You can update it any time before the conference.</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={17} style={{ color: C.accent }} /></div>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{currentSpeech ? 'Update Opening Speech' : 'Draft Your Opening Speech'}</p>
                        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>This is shared with the secretariat immediately. No approval is required.</p>
                    </div>
                </div>
                <div style={{ padding: 20 }}>
                    <label htmlFor="opening-speech" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Your speech</label>
                    <textarea id="opening-speech" value={speech} onChange={event => setSpeech(event.target.value)} maxLength={6000}
                        placeholder="Honorable Chair, distinguished delegates..."
                        style={{ width: '100%', minHeight: 260, resize: 'vertical', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, color: C.text, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.65, padding: '13px 14px', outline: 'none' }}
                        onFocus={event => { event.currentTarget.style.borderColor = C.accent; event.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}15`; }}
                        onBlur={event => { event.currentTarget.style.borderColor = C.border; event.currentTarget.style.boxShadow = 'none'; }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8, fontSize: 12, color: C.textMuted }}>
                        <span>Minimum 20 characters</span><span>{speech.length}/6000</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                        <button type="submit" disabled={saving || speech.trim().length < 20}
                            style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 8, padding: '0 18px', background: saving || speech.trim().length < 20 ? '#B9CDF9' : C.accent, color: '#fff', cursor: saving || speech.trim().length < 20 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                            <Save size={15} /> {saving ? 'Submitting...' : currentSpeech ? 'Update Speech' : 'Submit Opening Speech'}
                        </button>
                    </div>
                </div>
            </form>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, boxShadow: C.shadow }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Speech Guidance</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: C.textSec, fontSize: 13, lineHeight: 1.7 }}>
                    <li>Open with a formal greeting to the Chair and fellow delegates.</li>
                    <li>State your country&apos;s main position on the committee agenda.</li>
                    <li>Keep the speech focused, respectful, and suited to about one minute.</li>
                </ul>
            </div>
        </div>
    );
}
