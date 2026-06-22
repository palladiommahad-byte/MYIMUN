'use client';

import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/auth/AuthContext';
import { useConference } from '@/context/ConferenceContext';
import { uploadFile, fileUrl } from '@/lib/fileStore';

const C = {
    bg: '#F4F5F7', surface: '#FFFFFF', border: '#E4E8EF',
    text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF',
    accent: '#3B7FFF', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const STATUS_META = {
    Pending:  { Icon: Clock,       color: C.amber, bg: `${C.amber}14`, label: 'Under Review', desc: 'Your paper has been received and is awaiting review by the admin team.' },
    Approved: { Icon: CheckCircle, color: C.green, bg: `${C.green}14`, label: 'Approved',     desc: 'Your position paper has been approved. You are cleared to participate in debate.' },
    Rejected: { Icon: XCircle,     color: C.red,   bg: `${C.red}12`,   label: 'Rejected',     desc: 'Your position paper was not accepted. Please revise and resubmit.' },
};

export default function DelegatePapersPage() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { papers, submitPaper, getApplicationForDelegate, conferenceSettings } = useConference();
    const fileRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const delegateId   = user?.id ?? 'unknown';
    const country      = user?.country ?? 'Unknown';
    const delegateName = user?.name ?? 'Delegate';
    // Derive committee from approved application, then user.committee, then fallback
    const approvedApp = getApplicationForDelegate(delegateId);
    const committee   = (approvedApp?.status === 'Approved' ? approvedApp.committeeAbbr : null) ?? user?.committee ?? 'UNSC';

    const myPaper = papers.find(p => p.delegateId === delegateId && p.committee === committee) ?? null;
    const sm = myPaper ? STATUS_META[myPaper.status] : null;

    const handleFile = async (file: File) => {
        if (!conferenceSettings.allowPaperUploads) { showToast('Position paper submissions are currently closed.', 'error'); return; }
        if (file.type !== 'application/pdf') { showToast('Only PDF files are accepted.', 'error'); return; }
        if (file.size > 20 * 1024 * 1024) { showToast('File must be under 20 MB.', 'error'); return; }

        setUploading(true);
        try {
            const up = await uploadFile(file);
            await submitPaper({ delegateId, delegateName, committee, country, fileName: file.name, fileUrl: fileUrl(up.key), fileSize: file.size });
            showToast('Position paper submitted successfully!', 'success');
        } catch {
            showToast('Failed to upload your paper. Please try again.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const hasApprovedCommittee = approvedApp?.status === 'Approved' || user?.committee;

    if (!hasApprovedCommittee) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', maxWidth: 760 }}>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text }}>Position Paper</h1>
                <div style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}30`, borderRadius: 12, padding: '28px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <AlertCircle size={22} style={{ color: C.amber, flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>Committee Approval Required</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
                            You must be approved to a committee before submitting a position paper.
                            Please go to <strong style={{ color: C.text }}>My Committee</strong> and apply to a committee. Once approved, you can return here to upload your paper.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: '"Inter",system-ui,sans-serif', maxWidth: 760 }}>

            {/* Header */}
            <div>
                <h1 style={{ fontFamily: '"Plus Jakarta Sans",Inter,sans-serif', fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>
                    Position Paper
                </h1>
                <p style={{ fontSize: 14, color: C.textSec }}>
                    Submit your position paper for <strong style={{ color: C.text }}>{committee}</strong> representing <strong style={{ color: C.text }}>{country}</strong>.
                </p>
            </div>

            {/* Status banner */}
            {myPaper && sm && (
                <div style={{ background: sm.bg, border: `1px solid ${sm.color}28`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <sm.Icon size={20} style={{ color: sm.color, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: sm.color, marginBottom: 3 }}>{sm.label}</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>{sm.desc}</p>
                    </div>
                    <span style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap', marginTop: 2 }}>{myPaper.submittedAt}</span>
                </div>
            )}

            {/* Current submission card */}
            {myPaper && sm && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, boxShadow: C.shadow }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Current Submission</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={20} style={{ color: C.red }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{myPaper.fileName}</p>
                            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                                {(myPaper.fileSize / 1024).toFixed(0)} KB · PDF · {myPaper.submittedAt}
                            </p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: sm.bg, color: sm.color }}>{myPaper.status}</span>
                    </div>
                </div>
            )}

            {/* Upload zone */}
            {!conferenceSettings.allowPaperUploads ? (
                <div style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}30`, borderRadius: 12, padding: '24px 22px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <AlertCircle size={20} style={{ color: C.amber, flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 14.5, color: C.text, marginBottom: 4 }}>Submissions Closed</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
                            Position paper submissions have been closed by the organizers. {myPaper ? 'Your existing submission above is still on file.' : 'Please check back later or contact the secretariat.'}
                        </p>
                    </div>
                </div>
            ) : (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ fontWeight: 600, fontSize: 15, color: C.text }}>
                        {myPaper ? 'Resubmit Position Paper' : 'Upload Position Paper'}
                    </p>
                    {myPaper && (
                        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <AlertCircle size={11} style={{ flexShrink: 0 }} />
                            Resubmitting replaces your current paper and resets status to Pending.
                        </p>
                    )}
                </div>

                <div style={{ padding: 24 }}>
                    <div
                        onClick={() => !uploading && fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        style={{
                            border: `2px dashed ${dragging ? C.accent : C.border}`,
                            borderRadius: 12, padding: '44px 24px', textAlign: 'center',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            background: dragging ? `${C.accent}06` : C.bg,
                            transition: 'all .2s',
                        }}
                    >
                        {uploading ? (
                            <>
                                <RefreshCw size={36} style={{ color: C.accent, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                                <p style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Uploading...</p>
                                <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Please wait while your paper is being submitted.</p>
                            </>
                        ) : (
                            <>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                    <Upload size={22} style={{ color: C.accent }} />
                                </div>
                                <p style={{ fontWeight: 600, fontSize: 15, color: C.text }}>
                                    {dragging ? 'Drop your PDF here' : 'Click to upload or drag & drop'}
                                </p>
                                <p style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>PDF only · Max 3 MB</p>
                                <button
                                    onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                                    style={{ marginTop: 18, padding: '9px 22px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                                >
                                    Browse Files
                                </button>
                            </>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={onInputChange} />
                </div>
            </div>
            )}

            {/* Guidelines */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, boxShadow: C.shadow }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Submission Guidelines</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                        ['Format',    'PDF only — max 3 MB for real-time admin sync.'],
                        ['Length',    '1–2 pages per topic on your committee agenda.'],
                        ['Structure', 'Country stance, proposed solutions, and bloc strategy.'],
                        ['Deadline',  'Papers must be submitted 48 hours before opening.'],
                        ['Revisions', 'You may resubmit — the latest paper replaces the previous one.'],
                    ].map(([t, d]) => (
                        <li key={t} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                            <span style={{ fontWeight: 600, color: C.text, minWidth: 76 }}>{t}:</span>
                            <span style={{ color: C.textSec }}>{d}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
