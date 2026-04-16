import { NextResponse } from 'next/server';
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();
    const body = await request.json();
    const { id: packageId } = await params;

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const backendResponse = await fetch(`${backendUrl}/api/admin/packages/${packageId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API PROXY /api/admin/packages PUT] Error:`, error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';
    const status =
      error instanceof Error && error.message === 'Authentication required'
        ? 401
        : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();
    const { id: packageId } = await params;

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);

    const backendResponse = await fetch(`${backendUrl}/api/admin/packages/${packageId}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store'
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error(`[API PROXY /api/admin/packages DELETE] Error:`, error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';
    const status =
      error instanceof Error && error.message === 'Authentication required'
        ? 401
        : 500;
    return NextResponse.json({ message }, { status });
  }
}