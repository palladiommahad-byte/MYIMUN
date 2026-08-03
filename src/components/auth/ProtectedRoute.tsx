'use client';

import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../types';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole | UserRole[];
}

const STAFF_ROLES: UserRole[] = ['admin', 'secretary', 'manager'];

function roleMatches(role: UserRole, allowedRoleKey: string) {
    return !allowedRoleKey || allowedRoleKey.split('|').includes(role);
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const allowedRoleKey = Array.isArray(requiredRole) ? requiredRole.join('|') : requiredRole ?? '';
    const hasRequiredRole = !allowedRoleKey || (!!user && roleMatches(user.role, allowedRoleKey));

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
        if (!isLoading && user?.mustChangeCredentials) {
            router.replace('/setup-admin');
        }
        if (!isLoading && user && !roleMatches(user.role, allowedRoleKey)) {
            const redirectPath = STAFF_ROLES.includes(user.role) ? '/admin' : '/dashboard/events';
            router.replace(redirectPath);
        }
    }, [user, isLoading, allowedRoleKey, router, pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="w-10 h-10 border-4 border-royal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="w-10 h-10 border-4 border-royal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!hasRequiredRole || user.mustChangeCredentials) {
        return null;
    }

    return <>{children}</>;
};
