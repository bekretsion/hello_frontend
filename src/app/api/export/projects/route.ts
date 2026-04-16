import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
}

async function getAuthToken() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) {
    throw new Error('Authentication required');
  }
  return sessionCookie.value;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = getBackendUrl();
    const token = await getAuthToken();

    const response = await fetch(`${backendUrl}/api/export/projects?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    // Handle CSV downloads
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/csv')) {
      const csvData = await response.text();
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'projects_export.csv';
      
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // Handle JSON response
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Project export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export project data' },
      { status: 500 }
    );
  }
}
