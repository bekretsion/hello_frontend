import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

/**
 * @handler POST - Permanently dismisses the welcome banner for the authenticated user
 * This action is idempotent - calling it multiple times has no effect.
 * Once dismissed, the banner will never appear again across all devices/sessions.
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const token = sessionCookie.value;

        const response = await fetch(`${BACKEND_URL}/api/auth/dismiss-welcome-banner`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || 'Failed to dismiss welcome banner' },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('[API_DISMISS_WELCOME_BANNER_ERROR]', error);
        return NextResponse.json(
            { message: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}
