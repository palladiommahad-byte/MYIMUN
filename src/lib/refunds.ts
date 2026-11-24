import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { hasAnyPageAccess } from './auth';

/** Pages whose staff may review refund requests (same people who see delegates' payments). */
export const REFUND_STAFF_PAGES = ['/admin/delegates', '/admin/payments'];

const STAFF_ROLES = ['admin', 'secretary', 'manager'];

export function canManageRefunds(user: { role: string; permissions?: unknown; mustChangeCredentials?: boolean }) {
    return STAFF_ROLES.includes(user.role) && !user.mustChangeCredentials && hasAnyPageAccess(user, REFUND_STAFF_PAGES);
}

/** Admins see every refund. Other staff only see refunds tied to payments an admin
    has shared with staff — mirroring the payment visibility rule in /api/payments. */
export async function refundScopeForStaff(user: { role: string }): Promise<Prisma.RefundRequestWhereInput> {
    if (user.role === 'admin') return {};
    const shared = await prisma.paymentSubmission.findMany({ where: { visibleToStaff: true }, select: { id: true } });
    return { paymentId: { in: shared.map(p => p.id) } };
}
