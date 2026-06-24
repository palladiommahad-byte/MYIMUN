/** Canonical list of grantable /admin/* sections — shared by the admin sidebar
    (AdminLayout), the Staff Management permission picker, and route guarding. */
export const ADMIN_PAGES: { path: string; label: string }[] = [
    { path: '/admin',               label: 'Overview' },
    { path: '/admin/landing',       label: 'Landing Page' },
    { path: '/admin/events',        label: 'Events' },
    { path: '/admin/registration',  label: 'Registrations' },
    { path: '/admin/delegates',     label: 'Delegates' },
    { path: '/admin/committees',    label: 'Committees' },
    { path: '/admin/papers',        label: 'Position Papers' },
    { path: '/admin/certificates',  label: 'Certificates' },
    { path: '/admin/payments',      label: 'Payments' },
    { path: '/admin/schedule',      label: 'Schedule' },
    { path: '/admin/messages',      label: 'Messages' },
    { path: '/admin/announcements', label: 'Broadcasts' },
    { path: '/admin/settings',      label: 'Settings' },
];
