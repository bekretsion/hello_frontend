// app/api/outlook-meetings/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const NODE_API_URL = `${process.env.BACKEND_API_URL}/api/outlook-meetings`;

// Helper function to make backend requests
async function makeBackendRequest(method: string, url: string, body?: any) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionCookie.value}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await response.json();
  return new NextResponse(JSON.stringify(data), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Get Outlook calendar events (with optional date filter)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  let backendUrl = NODE_API_URL;
  if (date) {
    backendUrl += `?date=${date}`;
  }

  return makeBackendRequest('GET', backendUrl);
}

// Create a new Outlook calendar event
export async function POST(request: Request) {
  const body = await request.json();
  return makeBackendRequest('POST', NODE_API_URL, body);
}

