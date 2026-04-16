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

    const response = await fetch(`${BACKEND_URL}/api/assistants/edit-requests`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch assistant edit requests' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching assistant edit requests:', error);
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

    // Read incoming form data
    const incomingFormData = await req.formData();

    // Re-build form data for the backend request
    const formData = new FormData();
    incomingFormData.forEach((value, key) => {
      formData.append(key, value as any);
    });

    const response = await fetch(`${BACKEND_URL}/api/assistants/edit-requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`
        // NOTE: Do not set Content-Type; fetch will set proper multipart boundary
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to create assistant edit request' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assistant edit request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
















































