import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 1. Authenticate the request from the Next.js client
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || cookieStore.get('access_token');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required.' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    // 2. Get the backend URL and Vapi Assistant ID from environment variables
    const backendUrl = process.env.BACKEND_API_URL;
    // const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;

    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    // 3. Get the required data from the request body (sent from InitiateCallModal)
    const body = await request.json();
    const { phoneNumber, vapiPhoneNumberId } = body;

    // Basic validation before sending to the backend
    if (!phoneNumber || !vapiPhoneNumberId) {
      return NextResponse.json(
        {
          message: 'Missing required fields: phoneNumber and vapiPhoneNumberId'
        },
        { status: 400 }
      );
    }

    // 4. Prepare and forward the request to your actual backend
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const backendPayload = {
      phoneNumber,
      vapiPhoneNumberId
      // vapiAssistantId, // Add the assistant ID from the server environment
    };

    console.log(
      'Forwarding instant call request to backend with payload:',
      backendPayload
    );

    const backendResponse = await fetch(
      `${backendUrl}/api/vapi/calls/instant`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(backendPayload),
        cache: 'no-store'
      }
    );

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: responseData.message || 'An error occurred from the backend.'
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('[API PROXY /api/vapi/calls/instant] Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || cookieStore.get('access_token');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required.' },
        { status: 401 }
      );
    }
    const token = sessionCookie.value;

    // 2. Get the backend URL from environment variables.
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    // 3. Extract search parameters (like 'status') from the incoming request.
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // 4. Construct the target URL for the backend, including any query parameters.
    const backendApiUrl = new URL(`${backendUrl}/api/vapi/scheduled-calls`);
    if (status) {
      backendApiUrl.searchParams.append('status', status);
    }

    // 5. Prepare the headers for the backend request.
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);

    console.log(`Forwarding GET request to: ${backendApiUrl.toString()}`);

    const backendResponse = await fetch(backendApiUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store' // Ensures the data is always fresh
    });

    // 6. Process the response from the backend.
    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: responseData.message || 'An error occurred from the backend.'
        },
        { status: backendResponse.status }
      );
    }

    // On success, forward the backend's data to the frontend.
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('[API PROXY /api/vapi/scheduled-calls] Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
