// app/api/signup/resend-otp/route.ts - Proxy resend OTP request to backend

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { verificationToken } = body;

        // Validation
        if (!verificationToken) {
            return NextResponse.json(
                { message: 'Verification token is required.' },
                { status: 400 }
            );
        }

        const backendUrl = process.env.BACKEND_API_URL;
        if (!backendUrl) {
            throw new Error('Backend API URL is not configured.');
        }

        // Forward request to backend
        const apiResponse = await fetch(`${backendUrl}/api/signup/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({ verificationToken })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return NextResponse.json(
                {
                    message: data.message || 'Failed to resend OTP',
                    waitSeconds: data.waitSeconds
                },
                { status: apiResponse.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Resend OTP error:', error);
        const message =
            error instanceof Error
                ? error.message
                : 'An internal server error occurred';
        return NextResponse.json({ message }, { status: 500 });
    }
}
