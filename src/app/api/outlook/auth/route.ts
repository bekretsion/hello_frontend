// app/api/outlook/auth/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const NODE_AUTH_URL = `${process.env.BACKEND_API_URL}/api/outlook/auth`;

export async function GET() {
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

    // Make an authenticated server-to-server request to the backend
    const response = await fetch(NODE_AUTH_URL, {
      method: 'GET',
      headers: {
        // Attach the user's JWT token so verifyToken middleware passes
        Authorization: `Bearer ${token}`
      },
      // IMPORTANT: We must NOT redirect automatically on the backend.
      // We want to capture the Microsoft URL.
      redirect: 'manual'
    });

    // The backend's /api/outlook/auth endpoint responds with a 302 redirect or 200.
    // The Microsoft auth URL is in the 'Location' header of that response.
    if (response.status === 302 || response.status === 200) {
      const microsoftAuthUrl = response.headers.get('Location');
      if (microsoftAuthUrl) {
        // Send the Microsoft URL back to the client as JSON
        return NextResponse.json({ redirectUrl: microsoftAuthUrl });
      }
    }

    // If something went wrong
    const errorData = await response.text();
    console.error('Backend error when getting Microsoft Auth URL:', errorData);
    return NextResponse.json(
      { message: 'Could not retrieve Microsoft authentication URL from backend.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[API_OUTLOOK_AUTH_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

