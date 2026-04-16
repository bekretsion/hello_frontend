// In your app/api/login/route.ts file

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // --- CHANGED: Get all fields from the body ---
    const body = await request.json();
    // Login request received
    const { email, password, accountType } = body;

    // A simple validation to ensure all required fields are present
    if (!email || !password || !accountType) {
      return NextResponse.json({ message: 'Email, password, and account type are required.' }, { status: 400 });
    }

    // Validate account type
    if (!['inbound', 'outbound', 'inbound_outbound'].includes(accountType)) {
      return NextResponse.json({ message: 'Invalid account type.' }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('Backend API URL is not configured.');
    }

    // --- CHANGED: Pass the accountType in the body to the backend ---
    const apiResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ email, password, accountType }) // Pass all three fields
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Authentication failed' },
        { status: apiResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Login error
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}