// app/api/integrations/requests/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Update integration request status (Admin only)
export async function PATCH(
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
    const body = await request.json();

    const BACKEND_API_URL = `${process.env.BACKEND_API_URL}/api/integrations/requests/${id}/status`;

    const response = await fetch(BACKEND_API_URL, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionCookie.value}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API_INTEGRATIONS_REQUEST_STATUS_UPDATE_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}


