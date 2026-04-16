import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    const token = sessionCookie.value;

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) throw new Error('BACKEND_API_URL is not configured.');

    const body = await request.json();

    const backendResponse = await fetch(`${backendUrl}/api/contacts/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const responseData = await backendResponse.json();
    return NextResponse.json(responseData, { status: backendResponse.status });

  } catch (error: any) {
    console.error('[API PROXY /contacts/upload] Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}