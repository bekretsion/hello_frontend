import { NextRequest, NextResponse } from 'next/server';
import { buildBackendUrl, getAuthToken, getBackendUrl } from '../../../_helpers';

const payPath = (id: string) => `/api/invoices/${id}/pay`;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = await getAuthToken();
        const backendUrl = getBackendUrl();

        const response = await fetch(
            buildBackendUrl(backendUrl, payPath(id)),
            {
                method: 'POST',
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
        console.error('[API PROXY /api/invoices/:id/pay POST]', error);
        const message =
            error instanceof Error ? error.message : 'An internal server error.';

        return NextResponse.json(
            { error: message },
            { status: message === 'Authentication required' ? 401 : 500 }
        );
    }
}
