import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    const token = sessionCookie.value;

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    // Forward all query params to the backend v2 endpoint
    const { searchParams } = new URL(request.url);

    // Construct the final backend URL, forwarding all relevant query params
    let finalBackendUrl = `${backendUrl}/api/vapi/calls/v2`;
    const forwardParams = new URLSearchParams();
    for (const key of ['assistantId', 'limit', 'cursor', 'filter', 'phoneNumberId']) {
      const val = searchParams.get(key);
      if (val) forwardParams.set(key, val);
    }
    const qs = forwardParams.toString();
    if (qs) finalBackendUrl += `?${qs}`;

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);

    console.log(`Forwarding GET request to: ${finalBackendUrl}`);

    const backendResponse = await fetch(finalBackendUrl, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      // User has no API key or service error — return empty data so UI shows "no calls"
      return NextResponse.json(
        { calls: [], pagination: { hasMore: false, nextCursor: null } },
        { status: 200 }
      );
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        // Allow browsers to serve from cache for 30s; revalidate in background for 60s
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('[API PROXY /api/vapi/calls] Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}