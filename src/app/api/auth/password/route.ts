// app/api/auth/password/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This function handles PUT requests to update the password
export async function PUT(request: Request) {
  try {
    // 1. Authenticate the request by retrieving the session cookie.
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required.' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    // 2. Get the backend URL from environment variables.
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    // 3. Get the password data from the request body.
    const body = await request.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // 4. Prepare and forward the request to your actual backend.
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const backendPayload = { oldPassword, newPassword, confirmPassword };
    const backendApiUrl = `${backendUrl}/api/auth/me/password`;

    // Forwarding password update to backend

    const backendResponse = await fetch(backendApiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(backendPayload),
      cache: 'no-store'
    });

    // 5. Process the response from the backend.
    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      // If the backend returned an error (e.g., wrong password), forward it.
      return NextResponse.json(
        {
          message: responseData.message || 'An error occurred from the backend.'
        },
        { status: backendResponse.status }
      );
    }

    // On success, forward the backend's data to the frontend.
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    // Password update error
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
