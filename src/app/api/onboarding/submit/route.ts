import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

        // Validate required fields - only fullName is truly required by backend
        if (!body.fullName) {
            return NextResponse.json(
                { message: 'Full name is required' },
                { status: 400 }
            );
        }

        // Get session token from cookies (prioritize 'session' over 'access_token')
        // 'session' is the fresh token set after OTP verification
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session') || cookieStore.get('access_token');

        if (!sessionCookie) {
            return NextResponse.json(
                { message: 'Authentication required. Please verify your email first.' },
                { status: 401 }
            );
        }

        const token = sessionCookie.value;

        console.log('Forwarding onboarding submit request to backend:', BACKEND_URL);
        console.log('Request body received:', body);

        // Pass through all fields to backend - it will handle validation
        const requestBody = {
            fullName: body.fullName,
            role: body.role || null,
            companyName: body.companyName || null,
            industry: body.industry || null,
            phoneNumber: body.phoneNumber || null,
            organizationNumber: body.organizationNumber || null,
            languages: body.languages || null,
            websites: body.websites || null,
            socialMedia: body.socialMedia || null
        };

        console.log('Request body being sent to backend:', requestBody);

        // Forward the onboarding submit request to the backend with authentication
        const response = await fetch(`${BACKEND_URL}/api/onboarding/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
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

        // Log detailed errors if present
        if (data.errors && Array.isArray(data.errors)) {
            console.error('Backend validation errors:', JSON.stringify(data.errors, null, 2));
        }

        // If token is expired, return a more helpful error message
        if (response.status === 401 || response.status === 403) {
            if (data.message?.toLowerCase().includes('expired') || data.message?.toLowerCase().includes('invalid')) {
                return NextResponse.json(
                    { message: 'Your session has expired. Please verify your email again.' },
                    { status: 401 }
                );
            }
        }

        // If there are validation errors, format them nicely
        if (response.status === 400 && data.errors) {
            const errorMessages = Array.isArray(data.errors)
                ? data.errors.map((err: any) => err.message || err.msg || JSON.stringify(err)).join(', ')
                : JSON.stringify(data.errors);
            return NextResponse.json(
                {
                    message: data.message || 'Validation failed',
                    errors: data.errors,
                    details: errorMessages
                },
                { status: 400 }
            );
        }

        // Return the response from the backend
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Onboarding Submit API Error:', error);
        return NextResponse.json(
            { message: 'Internal server error during onboarding submission', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
