import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, getAuthToken, getBackendUrl } from '../../../_helpers';

const sendOfferPath = (id: string) => `/api/documents/${id}/send-offer`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();
    const body = await request.json();

    const response = await fetch(
      buildBackendUrl(backendUrl, sendOfferPath(id)),
      {
        method: 'POST',
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
    console.error('[API PROXY /api/documents/:id/send-offer POST]', error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';

    return NextResponse.json(
      { error: message },
      { status: message === 'Authentication required' ? 401 : 500 }
    );
  }
}


