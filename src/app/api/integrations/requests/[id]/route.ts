// app/api/integrations/requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Delete integration request (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const BACKEND_API_URL = `${process.env.BACKEND_API_URL}/api/integrations/requests/${id}`;

    const response = await fetch(BACKEND_API_URL, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionCookie.value}`
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API_INTEGRATIONS_REQUEST_DELETE_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}


