// app/api/integrations/requests/all/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = `${process.env.BACKEND_API_URL}/api/integrations/requests/all`;

// Get all integration requests (Admin only)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(BACKEND_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionCookie.value}`
      },
      cache: 'no-store'
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API_INTEGRATIONS_REQUESTS_ALL_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}


