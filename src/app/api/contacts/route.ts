import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    const token = sessionCookie.value;

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) throw new Error('BACKEND_API_URL is not configured.');

    const backendApiUrl = `${backendUrl}/api/contacts`;

    const backendResponse = await fetch(backendApiUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json({ message: responseData.message || 'Error fetching contacts.' }, { status: backendResponse.status });
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('[API PROXY /contacts] Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    const token = sessionCookie.value;

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) throw new Error('BACKEND_API_URL is not configured.');

    const backendResponse = await fetch(`${backendUrl}/api/contacts`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    const responseData = await backendResponse.json();
    return NextResponse.json(responseData, { status: backendResponse.status });

  } catch (error: any) {
    console.error('[API PROXY DELETE /contacts] Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}