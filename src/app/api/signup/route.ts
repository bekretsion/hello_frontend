import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://inno-backend-cwnd.onrender.com';

export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { message: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.email || !body.password || !body.confirmPassword) {
      return NextResponse.json(
        { message: 'Email, password, and confirmPassword are required' },
        { status: 400 }
      );
    }

    console.log('Forwarding signup request to backend:', BACKEND_URL);

    // Forward the signup request to the backend
    const response = await fetch(`${BACKEND_URL}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Backend response parse error:', error);
      return NextResponse.json(
        { message: 'Invalid response from backend' },
        { status: 500 }
      );
    }

    console.log('Backend response:', { status: response.status, data });

    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json(
      { message: 'Internal server error during signup', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
