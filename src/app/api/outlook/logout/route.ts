// app/api/outlook/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const NODE_LOGOUT_URL = `${process.env.BACKEND_API_URL}/api/outlook/logout`;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(NODE_LOGOUT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to disconnect from Outlook' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API_OUTLOOK_LOGOUT_POST_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

