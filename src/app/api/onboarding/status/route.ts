import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://inno-backend-cwnd.onrender.com';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        console.log('Checking onboarding status from backend:', BACKEND_URL);

        // Forward the status check request to the backend
        const response = await fetch(`${BACKEND_URL}/api/onboarding/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        let data;
        try {
            data = await response.json();
        } catch (error) {
            console.error('Backend response parse error:', error);
            return NextResponse.json(
                { message: 'Invalid response from backend' },
                { status: 500 }
            );
        }

        console.log('Backend response:', { status: response.status, data });

        // Return the response from the backend
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Onboarding Status API Error:', error);
        return NextResponse.json(
            { message: 'Internal server error during status check', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
