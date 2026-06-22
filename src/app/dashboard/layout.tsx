'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RegistrationGate } from '@/components/auth/RegistrationGate';
import { MaintenanceGate } from '@/components/auth/MaintenanceGate';

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="delegate">
            <MaintenanceGate>
                <DashboardLayout>
                    <RegistrationGate>{children}</RegistrationGate>
                </DashboardLayout>
            </MaintenanceGate>
        </ProtectedRoute>
    );
}
