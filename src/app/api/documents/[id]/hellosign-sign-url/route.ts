import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, getAuthToken, getBackendUrl } from '../../../_helpers';

const getPath = (id: string) => `/api/documents/${id}/hellosign-sign-url`;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = await getAuthToken();
        const backendUrl = getBackendUrl();

        // Pass query params correctly (though usually none for this endpoint)
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        const response = await fetch(
            buildBackendUrl(backendUrl, getPath(id), queryString),
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
        console.error('[API PROXY /api/documents/:id/hellosign-sign-url GET]', error);
        const message =
            error instanceof Error ? error.message : 'An internal server error.';

        return NextResponse.json(
            { error: message },
            { status: message === 'Authentication required' ? 401 : 500 }
        );
    }
}
