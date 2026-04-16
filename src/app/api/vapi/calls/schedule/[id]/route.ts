// src/app/api/vapi/calls/schedule/[id]/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Using the "destructured promise" signature
) {
  try {
    // You must now 'await' the params promise to get the values
    const { id: callId } = await params;

    if (!callId) {
      return NextResponse.json(
        { message: 'Call ID is required.' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || cookieStore.get('access_token');
    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required.' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    const backendResponse = await fetch(
      `${backendUrl}/api/vapi/scheduled-calls/${callId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { message: errorData.message || 'An error occurred on the backend.' },
        { status: backendResponse.status }
      );
    }

    if (backendResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(
      { message: 'Successfully deleted.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API PROXY DELETE] Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
