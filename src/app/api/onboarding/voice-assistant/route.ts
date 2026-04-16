import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[ONBOARDING_API] Forwarding request to backend...');
    
    // No authentication required - this endpoint creates the account
    // Forward the onboarding request to the backend
    const response = await fetch(`${BACKEND_URL}/api/onboarding/voice-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[ONBOARDING_API] Backend response status:', response.status);

    const data = await response.json();
    
    console.log('[ONBOARDING_API] Backend response data:', {
      success: data.success,
      hasToken: !!data.token,
      message: data.message
    });

    // If backend returned a token, set it as an HTTP-only cookie
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    if (data.token && response.ok) {
      console.log('[ONBOARDING_API] Setting session cookie from backend token');
      nextResponse.cookies.set('session', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
    }

    return nextResponse;
    
  } catch (error) {
    console.error('[ONBOARDING_API] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error during onboarding submission' },
      { status: 500 }
    );
  }
}

