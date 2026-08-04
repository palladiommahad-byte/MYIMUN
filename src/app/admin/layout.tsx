'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useConference } from '@/context/ConferenceContext';
import { LoaderCircle } from 'lucide-react';

function AdminDataGate({ children }: { children: React.ReactNode }) {
    const { isPublicLoading, isUserDataLoading } = useConference();

    if (!isPublicLoading && !isUserDataLoading) return <>{children}</>;

    return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#6B7280', fontFamily: '"Inter",system-ui,sans-serif' }}>
            <LoaderCircle size={28} style={{ color: '#3B7FFF', animation: 'spin 0.9s linear infinite' }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>Loading admin data...</p>
        </div>
    );
}

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole={['admin', 'secretary', 'manager']}>
            <AdminLayout><AdminDataGate>{children}</AdminDataGate></AdminLayout>
        </ProtectedRoute>
    );
}
