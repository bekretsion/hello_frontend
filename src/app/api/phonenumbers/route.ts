import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const NODE_API_URL = `${process.env.BACKEND_API_URL}/api/phonenumbers`;

/**
 * @handler GET - Fetches all phone numbers from the Node.js backend.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    const response = await fetch(NODE_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch phone numbers' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_PHONENUMBERS_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @handler POST - Creates a new phone number by forwarding the request.
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    const body = await request.json();

    const response = await fetch(NODE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to create phone number' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[API_PHONENUMBERS_POST_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = sessionCookie.value;
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Phone number ID is required in the request body' },
        { status: 400 }
      );
    }

    const NODE_API_URL = `${process.env.BACKEND_API_URL}/api/phonenumbers/${id}`;

    const response = await fetch(NODE_API_URL, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return NextResponse.json(
        { message: data?.message || 'Failed to delete phone number' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: 'Phone number deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API_PHONENUMBERS_DELETE_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
