// src/app/api/phonenumbers/my-numbers/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// The backend URL for fetching the current user's numbers
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
const NODE_API_URL = `${BACKEND_URL}/api/phonenumbers/my-numbers`;

/**
 * @handler GET - Fetches the authenticated user's phone numbers from the Node.js backend.
 */
export async function GET(request: NextRequest) {
  try {
    // Use cookies for authentication (same as assistants endpoint)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      console.log('[PHONE_NUMBERS_PROXY] No session cookie found!');
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = sessionCookie.value;
    console.log('[PHONE_NUMBERS_PROXY] Token from cookie:', token ? `${token.substring(0, 20)}...` : 'null');

    console.log('[PHONE_NUMBERS_PROXY] BACKEND_URL:', BACKEND_URL);
    console.log('[PHONE_NUMBERS_PROXY] Full URL:', NODE_API_URL);
    console.log('[PHONE_NUMBERS_PROXY] Expected: http://localhost:3000/api/phonenumbers/my-numbers');
    
    const response = await fetch(NODE_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    console.log('[PHONE_NUMBERS_PROXY] Backend response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch your phone numbers' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_MY_PHONENUMBERS_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
