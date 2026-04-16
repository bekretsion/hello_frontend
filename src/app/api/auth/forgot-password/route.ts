import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required.' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('Backend API URL is not configured.');
    }

    // Call backend forgot password endpoint
    const apiResponse = await fetch(`${backendUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await apiResponse.json();

    // Check if backend returned an error (e.g., email not found)
    if (!apiResponse.ok) {
      return NextResponse.json(
        { 
          message: data.message || 'Email not found. Please check your email address and try again.',
          success: false 
        },
        { status: apiResponse.status }
      );
    }

    // Success case
    return NextResponse.json(
      { 
        message: data.message || 'If an account with that email exists, a password reset link has been sent.',
        success: true 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}

