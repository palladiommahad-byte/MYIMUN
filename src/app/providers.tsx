'use client';

import { AuthProvider } from '@/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ConferenceProvider } from '@/context/ConferenceContext';
import { PresenceTracker } from '@/components/presence/PresenceTracker';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <AuthProvider>
                <PresenceTracker />
                <ConferenceProvider>
                    {children}
                </ConferenceProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
