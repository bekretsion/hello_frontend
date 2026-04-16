import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

async function getAuthHeader() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  if (!session) return null;
  return `Bearer ${session.value}`;
}

// POST /api/el-phone-numbers/:id/outbound-call
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthHeader();
  if (!auth) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/api/el-phone-numbers/${id}/outbound-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
