import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

async function getAuthHeader() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  if (!session) return null;
  return `Bearer ${session.value}`;
}

// GET /api/el-phone-numbers/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthHeader();
  if (!auth) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const res = await fetch(`${BACKEND_URL}/api/el-phone-numbers/${id}`, {
    headers: { Authorization: auth },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// DELETE /api/el-phone-numbers/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthHeader();
  if (!auth) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const res = await fetch(`${BACKEND_URL}/api/el-phone-numbers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
