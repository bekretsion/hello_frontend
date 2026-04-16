// Frontend proxy for the new GET /api/vapi/analytics/summary endpoint.
// Passes through query params (start, end, step, timezone) to the backend.
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

        const backendUrl = process.env.BACKEND_API_URL;
        if (!backendUrl) throw new Error('BACKEND_API_URL not set');

        // Forward all query params (start, end, step, timezone) to the backend
        const { searchParams } = request.nextUrl;
        const queryString = searchParams.toString();

        const backendResponse = await fetch(
            `${backendUrl}/api/vapi/analytics/summary${queryString ? `?${queryString}` : ''}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                // No Next.js caching here — the backend does its own 60s in-process cache
                cache: 'no-store',
            }
        );

        if (!backendResponse.ok) {
            try {
                const errorData = await backendResponse.json();
                return NextResponse.json(
                    { message: errorData.message || 'Backend error', code: errorData.code || null },
                    { status: backendResponse.status }
                );
            } catch {
                const errorText = await backendResponse.text();
                return NextResponse.json(
                    { message: `Backend error: ${errorText}` },
                    { status: backendResponse.status }
                );
            }
        }

        const data = await backendResponse.json();

        // Propagate cache indicator header for debugging
        const cacheHeader = backendResponse.headers.get('X-Cache');
        const response = NextResponse.json(data, { status: 200 });
        if (cacheHeader) response.headers.set('X-Cache', cacheHeader);
        return response;
    } catch (error) {
        console.error('[API PROXY /api/vapi/analytics/summary] Error:', error);
        return NextResponse.json(
            { message: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}
