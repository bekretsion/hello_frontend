// app/api/meetings/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const NODE_API_URL = `${process.env.BACKEND_API_URL}/api/meetings`;

// --- MODIFIED: Helper function now accepts a dynamic URL ---
async function makeBackendRequest(method: string, url: string, body?: any) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  const response = await fetch(url, { // Use the passed URL
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

// --- MODIFIED: Reads query params and passes them to the backend ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  let backendUrl = NODE_API_URL;
  if (date) {
    backendUrl += `?date=${date}`;
  }

  return makeBackendRequest('GET', backendUrl);
}

export async function POST(request: Request) {
  const body = await request.json();
  // POST doesn't need query params, so it calls with the base URL
  return makeBackendRequest('POST', NODE_API_URL, body);
}