import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const getAuthToken = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) {
    throw new Error('Authentication required');
  }
  return sessionCookie.value;
};

const getBackendUrl = () => {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    throw new Error('Backend API URL is not configured');
  }
  return backendUrl;
};

export async function GET() {
  try {
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const backendResponse = await fetch(`${backendUrl}/api/admin/access-overrides`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API PROXY /api/admin/access-overrides GET] Error:`, error);
    const message = error instanceof Error ? error.message : 'An internal server error.';
    const status = error instanceof Error && error.message === 'Authentication required' ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();
    const body = await request.json();

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const backendResponse = await fetch(`${backendUrl}/api/admin/access-overrides`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API PROXY /api/admin/access-overrides POST] Error:`, error);
    const message = error instanceof Error ? error.message : 'An internal server error.';
    const status = error instanceof Error && error.message === 'Authentication required' ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
