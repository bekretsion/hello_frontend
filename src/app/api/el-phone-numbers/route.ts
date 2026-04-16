import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

async function getAuthHeader() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  if (!session) return null;
  return `Bearer ${session.value}`;
}

// GET /api/el-phone-numbers — list all
export async function GET() {
  const auth = await getAuthHeader();
  if (!auth) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const res = await fetch(`${BACKEND_URL}/api/el-phone-numbers`, {
    headers: { Authorization: auth },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// POST /api/el-phone-numbers — import Twilio number
export async function POST(req: NextRequest) {
  const auth = await getAuthHeader();
  if (!auth) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/api/el-phone-numbers/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
