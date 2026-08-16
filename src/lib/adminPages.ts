/** Canonical list of grantable /admin/* sections — shared by the admin sidebar
    (AdminLayout), the Staff Management permission picker, and route guarding. */
export const ADMIN_PAGES: { path: string; label: string }[] = [
    { path: '/admin',               label: 'Overview' },
    { path: '/admin/landing',       label: 'Landing Page' },
    { path: '/admin/events',        label: 'Events' },
    { path: '/admin/registration',  label: 'Registrations' },
    { path: '/admin/delegates',     label: 'Delegates' },
    { path: '/admin/accounts',      label: 'Accounts' },
    { path: '/admin/committees',    label: 'Committees' },
    { path: '/admin/papers',        label: 'Position Papers' },
    { path: '/admin/certificates',  label: 'Certificates' },
    { path: '/admin/payments',      label: 'Payments' },
    { path: '/admin/schedule',      label: 'Schedule' },
    { path: '/admin/messages',      label: 'Messages' },
    { path: '/admin/email',         label: 'Email' },
    { path: '/admin/live-users',    label: 'Live Users' },
    { path: '/admin/announcements', label: 'Broadcasts' },
    { path: '/admin/settings',      label: 'Settings' },
];

const STAFF_ROLES = new Set(['secretary', 'manager']);

/** Shared client/server permission check. Null permissions preserve full access
    for staff accounts created before page-level permissions were introduced. */
export function hasAdminPageAccess(
    user: { role: string; permissions?: string[] | null } | null | undefined,
    page: string,
) {
    if (user?.role === 'admin') return true;
    if (!user || !STAFF_ROLES.has(user.role)) return false;
    return user.permissions === null || user.permissions === undefined
        ? true
        : user.permissions.includes(page);
}

export function firstAllowedAdminPage(user: { role: string; permissions?: string[] | null }) {
    return ADMIN_PAGES.find(page => hasAdminPageAccess(user, page.path));
}
