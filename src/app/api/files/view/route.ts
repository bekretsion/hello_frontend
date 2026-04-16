import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

/**
 * Proxy file view/download requests to the backend.
 *
 * The backend generates a short-lived authenticated Cloudinary download URL
 * and returns a 302 redirect. We pass that redirect through to the browser.
 */
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        // Forward the full query string to the backend
        const { searchParams } = new URL(req.url);
        const queryString = searchParams.toString();

        const backendUrl = `${BACKEND_URL}/api/files/view?${queryString}`;

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${sessionCookie.value}`,
            },
            redirect: 'manual', // Don't follow redirects — we need the Location header
        });

        // The backend returns a 302 redirect to the authenticated Cloudinary URL.
        // Pass that redirect through to the browser.
        if (response.status === 302 || response.status === 301) {
            const location = response.headers.get('location');
            if (location) {
                return NextResponse.redirect(location);
            }
        }

        // If it wasn't a redirect, pass the response through
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: (data as any).message || 'Failed to fetch file' },
                { status: response.status }
            );
        }

        // Fallback: stream the body through
        const body = await response.arrayBuffer();
        return new NextResponse(body, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
            },
        });
    } catch (error: any) {
        console.error('Error proxying file view:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}


















