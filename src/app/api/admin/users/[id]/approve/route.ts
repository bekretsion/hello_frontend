// app/api/admin/users/[id]/approve/route.ts - Approve a user

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const backendUrl = process.env.BACKEND_API_URL;
        if (!backendUrl) {
            throw new Error('Backend API URL is not configured.');
        }

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const apiResponse = await fetch(`${backendUrl}/api/onboarding/${id}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${sessionCookie.value}`
            }
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return NextResponse.json(
                { message: data.message || 'Failed to approve user' },
                { status: apiResponse.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Approve user error:', error);
        const message = error instanceof Error ? error.message : 'An internal server error occurred';
        return NextResponse.json({ message }, { status: 500 });
    }
}
