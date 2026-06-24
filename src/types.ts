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
    passportUrl?: string;
    permissions?: string[] | null; // secretary/manager: allowed /admin/* page paths; admin: full access regardless
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
