'use client';

import { AuthProvider } from '@/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ConferenceProvider } from '@/context/ConferenceContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <AuthProvider>
                <ConferenceProvider>
                    {children}
                </ConferenceProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
