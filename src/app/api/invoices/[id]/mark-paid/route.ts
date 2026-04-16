import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const getAuthToken = async () => {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
        throw new Error('Authentication required');
    }
    return sessionCookie.value;
};

const getBackendUrl = () => {
    const url = process.env.BACKEND_API_URL;
    if (!url) {
        throw new Error('BACKEND_API_URL is not configured.');
    }
    return url;
};

const buildBackendUrl = (base: string, path: string) =>
    `${base.replace(/\/+$/, '')}${path}`;

const markPaidPath = (id: string) => `/api/invoices/${id}/mark-paid`;

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
            buildBackendUrl(backendUrl, markPaidPath(id)),
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
        console.error('[API PROXY /api/invoices/:id/mark-paid POST]', error);
        const message =
            error instanceof Error ? error.message : 'An internal server error.';

        return NextResponse.json(
            { error: message },
            { status: message === 'Authentication required' ? 401 : 500 }
        );
    }
}
