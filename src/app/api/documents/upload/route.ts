import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getBackendUrl, buildBackendUrl } from '../../_helpers';

export async function POST(request: NextRequest) {
    try {
        const token = await getAuthToken();
        const backendUrl = getBackendUrl();

        // Get the form data from the request
        const formData = await request.formData();

        // Forward to backend
        const response = await fetch(
            buildBackendUrl(backendUrl, '/api/documents/upload'),
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                    // Don't set Content-Type - fetch will set it with the correct boundary
                },
                body: formData
            }
        );

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[API PROXY /api/documents/upload POST]', error);
        const message =
            error instanceof Error ? error.message : 'An internal server error.';

        return NextResponse.json(
            { success: false, message },
            { status: message === 'Authentication required' ? 401 : 500 }
        );
    }
}
