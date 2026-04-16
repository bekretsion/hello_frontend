import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ call_id: string }> }
) {
  try {
    const { call_id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_API_URL is not configured.');
    }

    const backendResponse = await fetch(
      `${backendUrl}/api/vapi/calls/${call_id}/audio`,
      {
        headers: { Authorization: `Bearer ${sessionCookie.value}` },
        cache: 'no-store'
      }
    );

    if (!backendResponse.ok) {
      return NextResponse.json({ message: 'Audio not available' }, { status: 404 });
    }

    const contentType = backendResponse.headers.get('content-type') || 'audio/mpeg';
    const audioBuffer = await backendResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (error) {
    console.error('[API PROXY /api/vapi/calls/[call_id]/audio] Error:', error);
    return NextResponse.json({ message: 'Audio not available' }, { status: 404 });
  }
}
