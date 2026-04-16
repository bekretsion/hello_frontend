// app/api/admin/pending-review/route.ts - Get users pending review

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const backendUrl = process.env.BACKEND_API_URL;
        if (!backendUrl) {
            throw new Error('Backend API URL is not configured.');
        }

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const apiResponse = await fetch(`${backendUrl}/api/onboarding/pending-review`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${sessionCookie.value}`
            }
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return NextResponse.json(
                { message: data.message || 'Failed to fetch pending reviews' },
                { status: apiResponse.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Pending review error:', error);
        const message = error instanceof Error ? error.message : 'An internal server error occurred';
        return NextResponse.json({ message }, { status: 500 });
    }
}
