// app/api/outlook-meetings/[eventId]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const NODE_API_URL = `${process.env.BACKEND_API_URL}/api/outlook-meetings`;

// Helper for requests targeting a specific event
async function makeBackendRequestWithId(
  method: string,
  eventId: string,
  body?: any
) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  const response = await fetch(`${NODE_API_URL}/${eventId}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionCookie.value}`
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });

  // Handle empty responses, like 204 No Content from DELETE
  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await response.json();
  return new NextResponse(JSON.stringify(data), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Update an Outlook calendar event
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    return makeBackendRequestWithId('PUT', eventId, body);
  } catch (error) {
    console.error(`[API PROXY /api/outlook-meetings/:id PUT] Error:`, error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// Delete an Outlook calendar event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    return makeBackendRequestWithId('DELETE', eventId);
  } catch (error) {
    console.error(`[API PROXY /api/outlook-meetings/:id DELETE] Error:`, error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

