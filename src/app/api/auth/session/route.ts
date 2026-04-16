import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    // Set session cookie with longer expiration (7 days = 7 * 24 * 60 * 60 seconds)
    // This allows users to stay logged in for a week
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    
    (await cookies()).set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAge,
      path: '/',
      sameSite: 'lax'
    });

    return NextResponse.json(
      { message: 'Session created successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Session verification error
    return NextResponse.json(
      { message: 'Failed to create session' },  
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // To log out, we simply delete the session cookie.
    (await cookies()).delete('session');
    return NextResponse.json(
      { message: 'Session deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Session deletion error
    return NextResponse.json(
      { message: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
