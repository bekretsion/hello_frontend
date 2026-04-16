import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionToken = (await cookies()).get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ message: 'No active session found' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) throw new Error('Backend API URL is not configured.');

    const apiResponse = await fetch(`${backendUrl}/api/auth/account-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = apiResponse.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { message: `Backend error (HTTP ${apiResponse.status})` },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json({ message: data.message || 'Failed to update account mode' }, { status: apiResponse.status });
    }

    // Update session cookie with new JWT
    (await cookies()).set('session', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60,
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ message: data.message, user: data.user }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An internal server error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
