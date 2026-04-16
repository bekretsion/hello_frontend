// /app/api/vapi/calls/schedule/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || cookieStore.get('access_token');
    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required.' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) throw new Error('BACKEND_API_URL is not configured.');

    const body = await request.json();

    const backendResponse = await fetch(
      `${backendUrl}/api/vapi/calls/schedule`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      }
    );

    const responseData = await backendResponse.json();

    return NextResponse.json(responseData, { status: backendResponse.status });
  } catch (error: any) {
    console.error('[API PROXY] Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || cookieStore.get('access_token');

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

    // 3. Extract search parameters (like 'status') from the incoming request.
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // 4. Construct the target URL for the backend, including any query parameters.
    const backendApiUrl = new URL(`${backendUrl}/api/vapi/scheduled-calls`);
    if (status) {
      backendApiUrl.searchParams.append('status', status);
    }

    // 5. Prepare the headers for the backend request.
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);

    console.log(`Forwarding GET request to: ${backendApiUrl.toString()}`);

    const backendResponse = await fetch(backendApiUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store' // Ensures the data is always fresh
    });

    // 6. Process the response from the backend.
    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
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
    console.error('[API PROXY /api/vapi/scheduled-calls] Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
