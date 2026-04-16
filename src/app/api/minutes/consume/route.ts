// app/api/minutes/consume/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = `${process.env.BACKEND_API_URL}/api/minutes/consume`;

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
    const { minutesToConsume, callId, description } = body;

    if (!minutesToConsume || minutesToConsume <= 0) {
      return NextResponse.json(
        { message: 'Minutes to consume must be a positive number' },
        { status: 400 }
      );
    }

    // The backend can extract userId from the token, but we can also pass it explicitly
    const { userId } = body;

    const payload = {
      ...(userId && { userId: parseInt(userId) }),
      minutesToConsume: parseFloat(minutesToConsume),
      callId: callId || `test-${Date.now()}`,
      description: description || 'Test consumption from frontend'
    };

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to consume minutes' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_CONSUME_MINUTES_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
