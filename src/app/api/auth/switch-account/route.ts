import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST(request: Request) {
  try {
    const { accountType } = await request.json();

    if (!accountType) {
      return NextResponse.json(
        { message: 'Account type is required' },
        { status: 400 }
      );
    }

    // Validate accountType
    if (!['inbound', 'outbound'].includes(accountType)) {
      return NextResponse.json(
        { message: 'Invalid account type. Must be inbound or outbound.' },
        { status: 400 }
      );
    }

    // Get current session token
    const sessionToken = (await cookies()).get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { message: 'No active session found' },
        { status: 401 }
      );
    }

    // Verify current token to get user info
    const jwtSecret = (process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || '').trim();
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set.');
    }
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(sessionToken, secret);

    // Make request to backend API
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('Backend API URL is not configured.');
    }

    const apiResponse = await fetch(`${backendUrl}/api/auth/switch-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
        Accept: 'application/json'
      },
      body: JSON.stringify({ accountType })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Account switch failed' },
        { status: apiResponse.status }
      );
    }

    // Update session cookie with new token
    const { token, user } = data;
    (await cookies()).set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
      sameSite: 'lax'
    });

    return NextResponse.json({
      message: data.message,
      user: user
    }, { status: 200 });

  } catch (error) {
    console.error('Account switch error:', error);
    const message = error instanceof Error ? error.message : 'An internal server error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
