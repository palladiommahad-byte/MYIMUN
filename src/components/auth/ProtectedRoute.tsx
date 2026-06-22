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

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const allowedRoles = requiredRole ? (Array.isArray(requiredRole) ? requiredRole : [requiredRole]) : null;
    const hasRequiredRole = !allowedRoles || (!!user && allowedRoles.includes(user.role));

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
        if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
            const redirectPath = STAFF_ROLES.includes(user.role) ? '/admin' : '/dashboard';
            router.replace(redirectPath);
        }
    }, [user, isLoading, allowedRoles, router, pathname]);

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

    if (!hasRequiredRole) {
        return null;
    }

    return <>{children}</>;
};
