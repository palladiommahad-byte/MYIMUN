import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { role } = body;

        // Mock authentication - in production, validate against a database
        const mockUser = {
            id: '123',
            name: role === 'admin' ? 'Secretary General' : 'Honorable Delegate',
            role: role,
            country: role === 'delegate' ? 'France' : undefined,
        };

        return NextResponse.json({ user: mockUser }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Auth API is running. Use POST to login.' });
}
