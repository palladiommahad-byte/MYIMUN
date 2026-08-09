export type UserRole = 'admin' | 'delegate' | 'guest' | 'secretary' | 'manager';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    country?: string;
    email?: string;
    committee?: string;
    address?: string;
    joined?: string;
    passportUrl?: string;
    mustChangeCredentials?: boolean;
    permissions?: string[] | null; // secretary/manager: allowed /admin/* page paths; admin: full access regardless
}

export interface PresenceEntry {
    clientId: string;
    userId: string | null;
    name: string;
    role: string;
    path: string;
    device: 'Desktop' | 'Mobile' | 'Tablet';
    firstSeen: number;
    lastSeen: number;
}

export interface PresenceSnapshot {
    updatedAt: string;
    activeWindowSeconds: number;
    totalUsers: number;
    totalSessions: number;
    delegates: number;
    staff: number;
    visitors: number;
    entries: PresenceEntry[];
}

export interface Committee {
    id: string;
    name: string;
    description: string;
    iconName: string;
    topic: string;
}

export interface Task {
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate: string;
}

export interface Resource {
    id: string;
    title: string;
    type: 'pdf' | 'doc' | 'link';
    url: string;
}
