import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const backendUrl = process.env.BACKEND_API_URL;
    
    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    // Extract search parameters from the incoming request URL
    const { searchParams } = new URL(request.url);
    
    // Construct the final backend URL with any query parameters
    let finalBackendUrl = `${backendUrl}/api/service-addons`;
    if (searchParams.toString()) {
      finalBackendUrl += `?${searchParams.toString()}`;
    }

    const backendResponse = await fetch(finalBackendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json({
        message: responseData.message || 'An error occurred from the backend.'
      }, { status: backendResponse.status });
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error('[API PROXY /api/service-addons] Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
