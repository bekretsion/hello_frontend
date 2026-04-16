import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // 1. Authenticate the request from the Next.js client
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    // 2. Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    // 3. Prepare and forward the request to your actual backend
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const backendResponse = await fetch(`${backendUrl}/api/auth/users`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: responseData.message || 'Failed to fetch users from backend.'
        },
        { status: backendResponse.status }
      );
    }

    // On success, forward the backend's success response
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('[API PROXY /api/users] Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
