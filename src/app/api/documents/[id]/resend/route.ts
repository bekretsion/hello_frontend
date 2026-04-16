import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, getAuthToken, getBackendUrl } from '../../../_helpers';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = await getAuthToken();
        const backendUrl = getBackendUrl();
        const body = await request.json().catch(() => ({}));

        const response = await fetch(
            buildBackendUrl(backendUrl, `/api/documents/${id}/resend`),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body),
                cache: 'no-store'
            }
        );

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[API PROXY /api/documents/:id/resend POST]', error);
        const message =
            error instanceof Error ? error.message : 'An internal server error.';

        return NextResponse.json(
            { success: false, message },
            { status: message === 'Authentication required' ? 401 : 500 }
        );
    }
}
