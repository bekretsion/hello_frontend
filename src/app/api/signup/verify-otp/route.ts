import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://inno-backend-cwnd.onrender.com';

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            return NextResponse.json(
                { message: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!body.verificationToken || !body.otp) {
            return NextResponse.json(
                { message: 'Verification token and OTP are required' },
                { status: 400 }
            );
        }

        console.log('Forwarding verify-otp request to backend:', BACKEND_URL);

        // Forward the verify-otp request to the backend with new format
        const response = await fetch(`${BACKEND_URL}/api/signup/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                verificationToken: body.verificationToken,
                otp: body.otp
            }),
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

        // If backend returned a token, set it as an HTTP-only cookie
        // Check for both 'token' and 'access_token' field names
        const token = data.token || data.access_token;
        const nextResponse = NextResponse.json(data, { status: response.status });
        
        if (token && response.ok) {
            console.log('Setting session cookie from backend token');
            nextResponse.cookies.set('session', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
            });
            console.log('Session cookie set successfully');
        } else if (response.ok) {
            console.warn('Backend returned success but no token in response');
        }

        return nextResponse;

    } catch (error) {
        console.error('Verify OTP API Error:', error);
        return NextResponse.json(
            { message: 'Internal server error during OTP verification', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
