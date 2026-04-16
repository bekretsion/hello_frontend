import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

/**
 * @handler POST - Upload or update the authenticated user's profile picture
 * 
 * We must reconstruct the FormData with a proper Blob so multer on the backend
 * can parse the multipart upload correctly.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = sessionCookie.value;

    // Read the incoming FormData from the client
    const incomingFormData = await request.formData();
    const file = incomingFormData.get('profilePicture') as File | null;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided in the request' },
        { status: 400 }
      );
    }

    console.log('[API_PROFILE_PICTURE_POST] Forwarding file:', file.name, 'size:', file.size, 'type:', file.type);

    // Reconstruct FormData with a proper Blob for reliable forwarding
    const forwardFormData = new FormData();
    const fileBuffer = await file.arrayBuffer();
    const blob = new Blob([fileBuffer], { type: file.type });
    forwardFormData.append('profilePicture', blob, file.name);

    const response = await fetch(`${BACKEND_URL}/api/auth/me/profile-picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Do NOT set Content-Type manually — fetch will set the correct multipart boundary
      },
      body: forwardFormData,
      cache: 'no-store'
    });

    console.log('[API_PROFILE_PICTURE_POST] Backend response status:', response.status);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('[API_PROFILE_PICTURE_POST_ERROR] Non-JSON response:', textResponse.substring(0, 500));
      return NextResponse.json(
        { message: 'Invalid response from backend' },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log('[API_PROFILE_PICTURE_POST] Backend response data:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to upload profile picture' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_PROFILE_PICTURE_POST_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @handler DELETE - Remove the authenticated user's profile picture
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = sessionCookie.value;

    const response = await fetch(`${BACKEND_URL}/api/auth/me/profile-picture`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('[API_PROFILE_PICTURE_DELETE_ERROR] Non-JSON response:', textResponse.substring(0, 200));
      return NextResponse.json(
        { message: 'Invalid response from backend' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to remove profile picture' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_PROFILE_PICTURE_DELETE_ERROR]', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
