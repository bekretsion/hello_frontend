import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const query = req.nextUrl.searchParams.get('query');
    if (!query) {
      return NextResponse.json({ message: 'query is required' }, { status: 400 });
    }

    const params = new URLSearchParams({ query });
    const limit = req.nextUrl.searchParams.get('limit');
    if (limit) params.set('limit', limit);

    const res = await fetch(`${BACKEND_URL}/api/vapi/calls/search?${params}`, {
      headers: { Authorization: `Bearer ${session.value}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[API PROXY /api/vapi/calls/search] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
