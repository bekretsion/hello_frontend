// src/app/api/google/logout/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 1. Get the user's session token from the browser cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    // 2. Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      console.error('BACKEND_API_URL is not configured in environment variables.');
      throw new Error('Server configuration error.');
    }

    // 3. Prepare and forward the logout request to your actual backend
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`); // Add the user's auth token

    // The backend endpoint for logging out from Google
    const backendResponse = await fetch(`${backendUrl}/api/auth/google/logout`, {
      method: 'POST',
      headers,
      cache: 'no-store' // Ensure the request is not cached
    });

    const responseData = await backendResponse.json();

    // 4. Forward the backend's response (both success and error) to the client
    return NextResponse.json(responseData, {
      status: backendResponse.status
    });

  } catch (error) {
    console.error('[API PROXY /api/google/logout] Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}