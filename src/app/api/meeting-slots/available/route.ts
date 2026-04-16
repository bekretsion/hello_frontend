import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    // Note: This endpoint is public to allow users to view available slots during onboarding
    // Authentication is optional - if token exists, it will be included in the request

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const backendUrl = `${process.env.BACKEND_API_URL}/api/meeting-slots/available${queryString ? `?${queryString}` : ''}`;

    // Build headers - include Authorization only if token exists
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Error (meeting-slots/available):', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

