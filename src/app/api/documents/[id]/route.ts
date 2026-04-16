import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, getAuthToken, getBackendUrl } from '../../_helpers';

const documentPath = (id: string) => `/api/documents/${id}`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();
    const response = await fetch(
      buildBackendUrl(backendUrl, documentPath(id)),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    // Safely parse JSON - backend might return non-JSON on errors
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = { error: 'Invalid JSON response from server' };
      }
    } else {
      const text = await response.text();
      data = { error: text || response.statusText || 'Unknown error' };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API PROXY /api/documents/:id GET]', error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';

    return NextResponse.json(
      { error: message },
      { status: message === 'Authentication required' ? 401 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();
    const body = await request.json();

    const response = await fetch(
      buildBackendUrl(backendUrl, documentPath(id)),
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API PROXY /api/documents/:id PUT]', error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';

    return NextResponse.json(
      { error: message },
      { status: message === 'Authentication required' ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();

    const response = await fetch(
      buildBackendUrl(backendUrl, documentPath(id)),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API PROXY /api/documents/:id DELETE]', error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';

    return NextResponse.json(
      { error: message },
      { status: message === 'Authentication required' ? 401 : 500 }
    );
  }
}


