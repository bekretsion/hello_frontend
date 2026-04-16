import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const getBackendUrl = () => {
  const url = process.env.BACKEND_API_URL;
  if (!url) {
    throw new Error('BACKEND_API_URL is not configured.');
  }
  return url;
};

const getAuthToken = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) {
    throw new Error('Authentication required');
  }
  return sessionCookie.value;
};

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();

    const backendResponse = await fetch(`${backendUrl}/api/projects/projects/stats?t=${Date.now()}`, {
      method: 'GET',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API PROXY /api/projects/stats GET] Error:`, error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';
    const status =
      error instanceof Error && error.message === 'Authentication required'
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
