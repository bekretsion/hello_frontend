// app/api/user/subscription/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const NODE_USER_URL = `${process.env.BACKEND_API_URL}/api/auth/me`;

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
    const token = sessionCookie.value;

    // Forward the request to your Node.js backend to get user data
    const response = await fetch(NODE_USER_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch user data' },
        { status: response.status }
      );
    }

    // Extract subscription information
    const user = data.user;
    let currentAddons = [];
    
    try {
      if (user.current_addons) {
        // Handle both string and array formats
        if (typeof user.current_addons === 'string') {
          currentAddons = JSON.parse(user.current_addons);
        } else if (Array.isArray(user.current_addons)) {
          currentAddons = user.current_addons;
        }
      }
    } catch (e) {
      console.warn('Failed to parse current_addons:', user.current_addons);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        planId: user.current_plan_id,
        addonIds: currentAddons,
        status: user.subscription_status || 'inactive',
        isActive: user.subscription_status === 'active'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[API_USER_SUBSCRIPTION_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
