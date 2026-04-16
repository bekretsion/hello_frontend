import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

/**
 * Proxy file force-download requests to the backend.
 *
 * Same as /api/files/view but forces the browser to download
 * instead of opening in-browser.
 */
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const queryString = searchParams.toString();

        const backendUrl = `${BACKEND_URL}/api/files/download?${queryString}`;

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${sessionCookie.value}`,
            },
            redirect: 'manual',
        });

        if (response.status === 302 || response.status === 301) {
            const location = response.headers.get('location');
            if (location) {
                return NextResponse.redirect(location);
            }
        }

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: (data as any).message || 'Failed to download file' },
                { status: response.status }
            );
        }

        const body = await response.arrayBuffer();
        return new NextResponse(body, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
            },
        });
    } catch (error: any) {
        console.error('Error proxying file download:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}


















