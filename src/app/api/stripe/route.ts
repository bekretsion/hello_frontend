// app/api/stripe/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const NODE_API_URL = `${process.env.BACKEND_API_URL}/api/billing/create-checkout-session`;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session'); // Or whatever your cookie is named

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    // Get the plan and addon IDs from the client-side request
    const body = await request.json();
    const { planId, addonIds, totalDueToday, planName, minuteItems, assistantSetup } = body;

    // Support unified checkout with all item types
    // If minuteItems or assistantSetup are provided, include them in the payload
    const payload: any = {
      planId: planId || 'unified-checkout',
      addonIds: addonIds || [],
      totalDueToday: totalDueToday || 0,
      planName: planName || 'Unified Checkout'
    };

    // Transform minuteItems to minutePackages format that backend expects
    // Frontend sends: [{ packageId, quantity, price, name, minutes }]
    // Backend expects: [{ packageId, quantity }]
    if (minuteItems && Array.isArray(minuteItems) && minuteItems.length > 0) {
      payload.minutePackages = minuteItems.map((item: any) => ({
        packageId: item.packageId,
        quantity: item.quantity
      }));
    }

    // Add assistant setup if provided
    if (assistantSetup) {
      payload.assistantSetup = assistantSetup;
    }

    // Only require planId if we don't have minuteItems or assistantSetup
    if (!planId && (!minuteItems || minuteItems.length === 0) && !assistantSetup && (!addonIds || addonIds.length === 0)) {
      return NextResponse.json(
        { message: 'At least one item (plan, addons, minute items, or assistant setup) is required' },
        { status: 400 }
      );
    }

    // Forward the request to your Node.js backend
    const response = await fetch(NODE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to create checkout session' },
        { status: response.status }
      );
    }

    // Return the checkout session URL to the client
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_STRIPE_POST_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
