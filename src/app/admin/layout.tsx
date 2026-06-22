'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole={['admin', 'secretary', 'manager']}>
            <AdminLayout>{children}</AdminLayout>
        </ProtectedRoute>
    );
}
