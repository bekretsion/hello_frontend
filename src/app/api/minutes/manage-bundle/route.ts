import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force Node.js runtime (not Edge) for longer timeout support
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max duration

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

export async function PUT(req: NextRequest) {
    console.log('[MANAGE_BUNDLE] Starting request to backend:', BACKEND_URL);

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie) {
            console.log('[MANAGE_BUNDLE] No session cookie found');
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log('[MANAGE_BUNDLE] Request body:', JSON.stringify(body));

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('[MANAGE_BUNDLE] Request timeout after 25 seconds');
            controller.abort();
        }, 25000); // 25 second timeout

        const backendUrl = `${BACKEND_URL}/api/minutes/manage-bundle`;
        console.log('[MANAGE_BUNDLE] Calling backend:', backendUrl);

        const response = await fetch(backendUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionCookie.value}`,
                'Cache-Control': 'no-cache',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('[MANAGE_BUNDLE] Backend response status:', response.status);
        const data = await response.json();
        console.log('[MANAGE_BUNDLE] Backend response data:', JSON.stringify(data));

        if (!response.ok) {
            console.error('[MANAGE_BUNDLE] Backend error:', response.status, data);
            return NextResponse.json(
                { message: data.message || data.error || 'Failed to manage bundle', details: data },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[MANAGE_BUNDLE] Exception caught:', error);

        let errorMessage = 'Failed to manage bundle';
        let errorDetails = '';

        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = error.name;

            if (error.name === 'AbortError') {
                errorMessage = 'Request to backend timed out. Please try again.';
            } else if (error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Cannot connect to backend server. Please try again later.';
            } else if (error.message.includes('fetch failed')) {
                errorMessage = 'Network request failed. Backend may be starting up. Please try again in a moment.';
            }
        }

        console.error('[MANAGE_BUNDLE] Returning error:', errorMessage, errorDetails);
        return NextResponse.json(
            { message: errorMessage, error: errorDetails },
            { status: 500 }
        );
    }
}
