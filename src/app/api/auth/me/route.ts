import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

/**
 * @handler GET - Fetches the current authenticated user's data from backend
 * This endpoint is used to refresh user state after purchases or updates
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = sessionCookie.value;

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch user data' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_AUTH_ME_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @handler PATCH - Updates the current authenticated user's profile
 * This endpoint allows users to update their profile information
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = sessionCookie.value;
    const body = await request.json();

    console.log('[API_AUTH_ME_PATCH] Sending PATCH request to backend:', `${BACKEND_URL}/api/auth/me`);

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    console.log('[API_AUTH_ME_PATCH] Backend response status:', response.status);
    console.log('[API_AUTH_ME_PATCH] Backend response content-type:', response.headers.get('content-type'));

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('[API_AUTH_ME_PATCH_ERROR] Non-JSON response from backend:', textResponse.substring(0, 200));
      return NextResponse.json(
        { message: 'Backend server error. Please ensure the backend is running and the PATCH /api/auth/me route is registered.' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('[API_AUTH_ME_PATCH] Backend error response:', {
        status: response.status,
        data: data
      });
      
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update user profile' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_AUTH_ME_PATCH_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
