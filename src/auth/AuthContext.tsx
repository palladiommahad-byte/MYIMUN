'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (fullName: string, email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Map a server user record onto the app's `User` shape (`fullName` → `name`). */
function mapUser(raw: any): User | null {
    if (!raw) return null;
    return {
        id: raw.id,
        name: raw.fullName ?? raw.name ?? '',
        role: raw.role,
        email: raw.email ?? undefined,
        country: raw.country ?? undefined,
        committee: raw.committee ?? undefined,
        address: raw.address ?? undefined,
        avatarUrl: raw.avatarUrl ?? undefined,
        permissions: raw.permissions ?? null,
    };
}

async function postJSON(url: string, body?: unknown) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || 'Request failed');
    }
    return json.data;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            const json = await res.json();
            setUser(mapUser(json?.data));
        } catch {
            setUser(null);
        }
    }, []);

    // Restore the session on first load.
    useEffect(() => {
        (async () => {
            await refresh();
            setIsLoading(false);
        })();
    }, [refresh]);

    const login = useCallback(async (email: string, password: string) => {
        const data = await postJSON('/api/auth/login', { email, password });
        const u = mapUser(data)!;
        setUser(u);
        return u;
    }, []);

    const register = useCallback(async (fullName: string, email: string, password: string) => {
        const data = await postJSON('/api/auth/register', { fullName, email, password });
        const u = mapUser(data)!;
        setUser(u);
        return u;
    }, []);

    const logout = useCallback(async () => {
        try { await postJSON('/api/auth/logout'); } catch { /* ignore */ }
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
