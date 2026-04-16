// src/app/api/phonenumbers/admin/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

/**
 * GET - Fetch all phone numbers (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header first (for client-side requests)
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fall back to cookies (for server-side requests)
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session');
      token = sessionCookie?.value;
    }

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/phonenumbers/admin`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch phone numbers' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_PHONENUMBERS_ADMIN_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new phone number (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get token from Authorization header first (for client-side requests)
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fall back to cookies (for server-side requests)
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session');
      token = sessionCookie?.value;
    }

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/phonenumbers/admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to create phone number' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API_PHONENUMBERS_ADMIN_POST_ERROR]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

