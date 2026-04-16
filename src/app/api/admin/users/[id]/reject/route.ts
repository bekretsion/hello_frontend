// app/api/admin/users/[id]/reject/route.ts - Reject a user

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { reason } = body;

        const backendUrl = process.env.BACKEND_API_URL;
        if (!backendUrl) {
            throw new Error('Backend API URL is not configured.');
        }

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const apiResponse = await fetch(`${backendUrl}/api/onboarding/${id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${sessionCookie.value}`
            },
            body: JSON.stringify({ reason })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return NextResponse.json(
                { message: data.message || 'Failed to reject user' },
                { status: apiResponse.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Reject user error:', error);
        const message = error instanceof Error ? error.message : 'An internal server error occurred';
        return NextResponse.json({ message }, { status: 500 });
    }
}
