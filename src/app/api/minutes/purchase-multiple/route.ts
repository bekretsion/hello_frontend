// app/api/minutes/purchase-multiple/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = `${process.env.BACKEND_API_URL}/api/minutes/purchase-multiple`;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Items array is required' },
        { status: 400 }
      );
    }

    console.log('[API_PURCHASE_MULTIPLE] Items:', items);

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items })
    });

    console.log('[API_PURCHASE_MULTIPLE] Response status:', response.status);
    console.log('[API_PURCHASE_MULTIPLE] Response headers:', Object.fromEntries(response.headers.entries()));

    // Try to parse JSON, but handle non-JSON responses gracefully
    let data;
    const contentType = response.headers.get('content-type');
    console.log('[API_PURCHASE_MULTIPLE] Content-Type:', contentType);

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('[API_PURCHASE_MULTIPLE] Non-JSON response:', text.substring(0, 500));
      return NextResponse.json(
        { message: 'Backend returned non-JSON response. Check backend logs.' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('[API_PURCHASE_MULTIPLE] Backend error:', data);
      return NextResponse.json(
        { message: data.message || 'Failed to create checkout session' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_PURCHASE_MULTIPLE_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

