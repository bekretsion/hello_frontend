// /app/api/meetings/[eventId]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const NODE_API_URL = `${process.env.BACKEND_API_URL}/api/meetings`;

// Helper for requests targeting a specific event
// This helper remains largely the same, but we will call it differently
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
    cache: 'no-store' // Added for consistency
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

// --- REFACTORED: Handles updating a meeting using the Promise<params> pattern ---
export async function PUT(
  request: Request,
  // Using the older pattern as requested
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params; // Await the promise to get the params
    const body = await request.json();
    return makeBackendRequestWithId('PUT', eventId, body);
  } catch (error) {
    console.error(`[API PROXY /api/meetings/:id PUT] Error:`, error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// --- REFACTORED: Handles deleting a meeting using the Promise<params> pattern ---
export async function DELETE(
  request: Request,
  // Using the older pattern as requested
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params; // Await the promise to get the params
    return makeBackendRequestWithId('DELETE', eventId);
  } catch (error) {
    console.error(`[API PROXY /api/meetings/:id DELETE] Error:`, error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';
    return NextResponse.json({ message }, { status: 500 });
  }
}