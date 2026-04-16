// File: app/api/login/admin/route.ts

import { NextResponse } from 'next/server';
import { LoginInput } from '@/lib/schema';

export async function POST(request: Request) {
  try {
    // 1. Get the email and password from the client request
    const body: LoginInput = await request.json();
    const { email, password } = body;

    // 2. Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('Backend API URL is not configured.');
    }

    // 3. Call the actual backend ADMIN API (server-to-server)
    //    *** THIS IS THE ONLY LINE THAT IS DIFFERENT ***
    const apiResponse = await fetch(`${backendUrl}/api/auth/login/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    // 4. Get the JSON response from the backend
    const data = await apiResponse.json();

    // 5. If the backend returned an error, forward it to the client
    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Authentication failed' },
        { status: apiResponse.status }
      );
    }

    // 6. If successful, forward the successful response (including user and token)
    //    back to the client.
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_ADMIN_LOGIN_ERROR]', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
