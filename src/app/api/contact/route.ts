import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firstName, lastName, email, subject, message } = body;

        // In production, send an email or save to database
        console.log('Contact form submission:', { firstName, lastName, email, subject, message });

        return NextResponse.json({
            success: true,
            message: 'Your message has been received. We will get back to you shortly.'
        }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Contact API is running. Use POST to submit a message.' });
}
