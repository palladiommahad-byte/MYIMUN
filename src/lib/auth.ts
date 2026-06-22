import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User } from '@prisma/client';
import { prisma } from './prisma';

const COOKIE = 'myimun_session';
const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 7);

function secret(): Uint8Array {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error('JWT_SECRET is not set');
    return new TextEncoder().encode(s);
}

/* ── Passwords ── */
export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/* ── Session token (JWT in an httpOnly cookie) ── */
export async function createSession(user: Pick<User, 'id' | 'role'>) {
    const token = await new SignJWT({ role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DAYS}d`)
        .sign(secret());

    const jar = await cookies();
    jar.set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DAYS * 24 * 60 * 60,
    });
}

export async function destroySession() {
    const jar = await cookies();
    jar.delete(COOKIE);
}

/** Read + verify the current session token. Returns the userId/role or null. */
export async function getSession(): Promise<{ userId: string; role: string } | null> {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secret());
        if (!payload.sub) return null;
        return { userId: payload.sub, role: String(payload.role ?? 'delegate') };
    } catch {
        return null;
    }
}

/** Strip secrets before returning a user to the client. */
export function publicUser(u: User) {
    const { passwordHash, ...rest } = u;
    void passwordHash;
    return rest;
}

/** The full current user record, or null. */
export async function getCurrentUser() {
    const session = await getSession();
    if (!session) return null;
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    return user ?? null;
}

/** Throws a 401-style sentinel if not authenticated; returns the user otherwise. */
export class AuthError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export async function requireUser() {
    const user = await getCurrentUser();
    if (!user) throw new AuthError(401, 'Not authenticated');
    return user;
}

const STAFF_ROLES = ['admin', 'secretary', 'manager'];
export async function requireStaff() {
    const user = await requireUser();
    if (!STAFF_ROLES.includes(user.role)) throw new AuthError(403, 'Staff access required');
    return user;
}
