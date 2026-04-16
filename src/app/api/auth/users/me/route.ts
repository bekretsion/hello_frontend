import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5000';

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Unauthorized. Please login first.' },
        { status: 401 }
      );
    }

    const token = sessionCookie.value;

    const response = await fetch(`${BACKEND_URL}/api/auth/me/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to delete account' },
        { status: response.status }
      );
    }

    // Clear the session cookie
    cookieStore.delete('session');
    cookieStore.delete('refreshToken');

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { message: 'An error occurred while deleting your account' },
      { status: 500 }
    );
  }
}

