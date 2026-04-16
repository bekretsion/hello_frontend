import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('Backend API URL is not configured.');
    }

    // Call backend reset password endpoint
    const apiResponse = await fetch(`${backendUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred';
    return NextResponse.json({ message, success: false }, { status: 500 });
  }
}

