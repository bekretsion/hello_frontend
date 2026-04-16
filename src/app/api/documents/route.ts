import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, getAuthToken, getBackendUrl } from '../_helpers';

const backendPath = '/api/documents';

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(
      buildBackendUrl(backendUrl, backendPath, queryString),
      {
        method: 'GET',
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
    console.error('[API PROXY /api/documents GET]', error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';

    return NextResponse.json(
      { error: message },
      { status: message === 'Authentication required' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();
    const backendUrl = getBackendUrl();
    const body = await request.json();

    const response = await fetch(buildBackendUrl(backendUrl, backendPath), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API PROXY /api/documents POST]', error);
    const message =
      error instanceof Error ? error.message : 'An internal server error.';

    return NextResponse.json(
      { error: message },
      { status: message === 'Authentication required' ? 401 : 500 }
    );
  }
}


