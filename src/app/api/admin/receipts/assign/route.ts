import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiptId, userId } = body;

    if (!receiptId || !userId) {
      return NextResponse.json(
        { message: 'Receipt ID and User ID are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/receipts/admin/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ receiptId, userId })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to assign receipt' },
      { status: 500 }
    );
  }
}

