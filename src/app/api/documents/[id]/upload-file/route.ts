import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, getAuthToken, getBackendUrl } from '../../../_helpers';

const documentPath = (id: string) => `/api/documents/${id}`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();

    const formData = await request.formData();

    const response = await fetch(
      buildBackendUrl(backendUrl, `${documentPath(id)}/upload-file`),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formData,
        cache: 'no-store'
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API PROXY /api/documents/:id/upload-file POST]', error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';

    return NextResponse.json(
      { error: message },
      { status: message === 'Authentication required' ? 401 : 500 }
    );
  }
}

