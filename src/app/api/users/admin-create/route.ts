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

    // 2. Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    // 3. Get the user data from the request body
    const body = await request.json();
    const { username, email, password, role, AssistantId, apiKey } = body;

    // Basic validation before sending to the backend
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Missing required fields: username, email, password, role' },
        { status: 400 }
      );
    }

    // 4. Prepare and forward the request to your actual backend
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    console.log(role);

    const backendResponse = await fetch(`${backendUrl}/api/auth/users/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        username,
        email,
        password,
        role,
        apiKey,
        AssistantId
      }),
      cache: 'no-store'
    });

    // 5. Handle the response from the backend
    const responseData = await backendResponse.json();

    console.log(responseData);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: responseData.msg || 'An error occurred from the backend.' },
        { status: backendResponse.status }
      );
    }

    // On success, forward the backend's success response
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('[API PROXY /api/users/admin-create] Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
