import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required.', valid: false },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('Backend API URL is not configured.');
    }

    // Call backend verify token endpoint
    const apiResponse = await fetch(`${backendUrl}/api/auth/verify-reset-token/${token}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Invalid or expired token', valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Verify reset token error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred';
    return NextResponse.json({ message, valid: false }, { status: 500 });
  }
}

