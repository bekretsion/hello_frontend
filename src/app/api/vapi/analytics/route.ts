// This file is perfect and does not need changes.
// It handles POST requests, adds the auth header, and calls your backend.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
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
    const body = await request.json();
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) throw new Error('BACKEND_API_URL not set');

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const backendResponse = await fetch(`${backendUrl}/api/vapi/analytics`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store' // Note: POST requests cannot be cached by Next.js fetch; caching is handled at the client level
    });

    if (!backendResponse.ok) {
      // Try to parse JSON response for error details (including error code)
      try {
        const errorData = await backendResponse.json();
        return NextResponse.json(
          {
            message: errorData.message || 'An error occurred from the backend.',
            code: errorData.code || null
          },
          { status: backendResponse.status }
        );
      } catch {
        const errorText = await backendResponse.text();
        return NextResponse.json(
          { message: `Error from backend: ${errorText}` },
          { status: backendResponse.status }
        );
      }
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API PROXY /api/vapi/analytics] Error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
