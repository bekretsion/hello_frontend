import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { agentId } = await params;

    const response = await fetch(`${BACKEND_URL}/api/assistants/preview-agent/${agentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting preview agent:', error);
    return NextResponse.json({ message: 'Cleanup attempted' }, { status: 200 });
  }
}
