import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/assistants/requests`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch assistant requests' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching assistant requests:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    let backendResponse: Response;

    if (contentType.includes('multipart/form-data')) {
      // Wizard sends FormData (with optional file attachments) — proxy it directly
      const formData = await req.formData();

      backendResponse = await fetch(`${BACKEND_URL}/api/assistants/requests`, {
        method: 'POST',
        headers: {
          // Do NOT set Content-Type — fetch will set multipart boundary automatically
          Authorization: `Bearer ${sessionCookie.value}`,
        },
        body: formData,
      });
    } else {
      // Fallback: plain JSON body (old dialog path)
      const body = await req.json();

      backendResponse = await fetch(`${BACKEND_URL}/api/assistants/requests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionCookie.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to create assistant request' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assistant request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

