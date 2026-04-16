import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ call_id: string }> }
) {
  try {
    const { call_id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    const token = sessionCookie.value;

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    const finalBackendUrl = `${backendUrl}/api/vapi/calls/${call_id}`;

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);

    const backendResponse = await fetch(finalBackendUrl, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(responseData, { status: backendResponse.status });
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('[API PROXY /api/vapi/calls/[call_id]] Error:', error);
    const message = error instanceof Error ? error.message : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
