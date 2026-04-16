// app/api/billing/fulfill/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This URL points to the existing endpoint on your Node.js backend
const NODE_FULFILL_URL = `${process.env.BACKEND_API_URL}/api/auth/users/update-plan`;

export async function POST(request: Request) {
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

    // Get the plan details from the success page client-side request
    const body = await request.json();
    const { sessionId, planId, addonIds } = body;

    if (!sessionId || !planId) {
      return NextResponse.json(
        { message: 'Session ID and Plan ID are required for fulfillment' },
        { status: 400 }
      );
    }

    // Forward the request to your Node.js backend to update the user
    const response = await fetch(NODE_FULFILL_URL, {
      method: 'POST', // Or PATCH
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ sessionId, planId, addonIds })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to update user plan' },
        { status: response.status }
      );
    }

    // Return success with plan details
    return NextResponse.json({
      success: true,
      planId,
      planName: data.planName || 'Service Plan',
      addonIds,
      message: 'Service subscription activated successfully',
      ...data
    }, { status: 200 });
  } catch (error) {
    console.error('[API_FULFILL_POST_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
