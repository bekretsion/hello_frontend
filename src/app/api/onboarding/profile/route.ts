import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://inno-backend-cwnd.onrender.com';

/**
 * GET - Fetch the current user's onboarding profile data
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || cookieStore.get('access_token');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required. Please verify your email first.' },
        { status: 401 }
      );
    }

    const token = sessionCookie.value;

    console.log('[API_ONBOARDING_PROFILE_GET] Fetching profile from backend:', `${BACKEND_URL}/api/onboarding/profile`);

    const response = await fetch(`${BACKEND_URL}/api/onboarding/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store'
    });

    // Handle 404 or other errors gracefully - return empty profile instead of error
    if (!response.ok) {
      // If backend endpoint doesn't exist (404) or returns error, return empty profile
      if (response.status === 404) {
        console.warn('[API_ONBOARDING_PROFILE_GET] Backend endpoint not found (404), returning empty profile');
        return NextResponse.json({ 
          data: {
            organizationNumber: '',
            languages: [],
            websites: [],
            socialMedia: []
          }
        }, { status: 200 });
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.warn('[API_ONBOARDING_PROFILE_GET] Backend returned non-JSON response, returning empty profile:', textResponse.substring(0, 200));
        // Return empty profile instead of error to allow frontend to continue working
        return NextResponse.json({ 
          data: {
            organizationNumber: '',
            languages: [],
            websites: [],
            socialMedia: []
          }
        }, { status: 200 });
      }

      const data = await response.json();
      console.warn('[API_ONBOARDING_PROFILE_GET] Backend error:', {
        status: response.status,
        data: data
      });
      
      // Return empty profile instead of error for non-404 errors too
      return NextResponse.json({ 
        data: {
          organizationNumber: '',
          languages: [],
          websites: [],
          socialMedia: []
        }
      }, { status: 200 });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.warn('[API_ONBOARDING_PROFILE_GET] Non-JSON response, returning empty profile:', textResponse.substring(0, 200));
      return NextResponse.json({ 
        data: {
          organizationNumber: '',
          languages: [],
          websites: [],
          socialMedia: []
        }
      }, { status: 200 });
    }

    const data = await response.json();

    // Parse JSON strings back to arrays for frontend consumption
    const parsedData = { ...data };
    if (parsedData.data) {
      const profileData = parsedData.data;
      // Parse languages if it's a JSON string
      if (profileData.languages && typeof profileData.languages === 'string') {
        try {
          profileData.languages = JSON.parse(profileData.languages);
        } catch (e) {
          console.warn('[API_ONBOARDING_PROFILE_GET] Failed to parse languages:', e);
          profileData.languages = [];
        }
      }
      // Parse websites if it's a JSON string
      if (profileData.websites && typeof profileData.websites === 'string') {
        try {
          profileData.websites = JSON.parse(profileData.websites);
        } catch (e) {
          console.warn('[API_ONBOARDING_PROFILE_GET] Failed to parse websites:', e);
          profileData.websites = [];
        }
      }
      // Parse socialMedia if it's a JSON string
      if (profileData.socialMedia && typeof profileData.socialMedia === 'string') {
        try {
          profileData.socialMedia = JSON.parse(profileData.socialMedia);
        } catch (e) {
          console.warn('[API_ONBOARDING_PROFILE_GET] Failed to parse socialMedia:', e);
          profileData.socialMedia = [];
        }
      }
      // Also check for snake_case variants
      if (profileData.social_media && typeof profileData.social_media === 'string') {
        try {
          profileData.social_media = JSON.parse(profileData.social_media);
        } catch (e) {
          console.warn('[API_ONBOARDING_PROFILE_GET] Failed to parse social_media:', e);
          profileData.social_media = [];
        }
      }
    } else {
      // Handle case where data is at root level
      if (parsedData.languages && typeof parsedData.languages === 'string') {
        try {
          parsedData.languages = JSON.parse(parsedData.languages);
        } catch (e) {
          console.warn('[API_ONBOARDING_PROFILE_GET] Failed to parse languages:', e);
          parsedData.languages = [];
        }
      }
      if (parsedData.websites && typeof parsedData.websites === 'string') {
        try {
          parsedData.websites = JSON.parse(parsedData.websites);
        } catch (e) {
          console.warn('[API_ONBOARDING_PROFILE_GET] Failed to parse websites:', e);
          parsedData.websites = [];
        }
      }
      if (parsedData.socialMedia && typeof parsedData.socialMedia === 'string') {
        try {
          parsedData.socialMedia = JSON.parse(parsedData.socialMedia);
        } catch (e) {
          console.warn('[API_ONBOARDING_PROFILE_GET] Failed to parse socialMedia:', e);
          parsedData.socialMedia = [];
        }
      }
      if (parsedData.social_media && typeof parsedData.social_media === 'string') {
        try {
          parsedData.social_media = JSON.parse(parsedData.social_media);
        } catch (e) {
          console.warn('[API_ONBOARDING_PROFILE_GET] Failed to parse social_media:', e);
          parsedData.social_media = [];
        }
      }
    }

    return NextResponse.json(parsedData, { status: 200 });
  } catch (error) {
    console.error('[API_ONBOARDING_PROFILE_GET_ERROR]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update the current user's onboarding profile data
 */
export async function PUT(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[API_ONBOARDING_PROFILE_PUT] JSON Parse Error:', parseError);
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || cookieStore.get('access_token');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Authentication required. Please verify your email first.' },
        { status: 401 }
      );
    }

    const token = sessionCookie.value;

    console.log('[API_ONBOARDING_PROFILE_PUT] Updating profile:', `${BACKEND_URL}/api/onboarding/profile`);
    console.log('[API_ONBOARDING_PROFILE_PUT] Request body:', JSON.stringify(body, null, 2));
    
    // Prepare body for backend - convert arrays to JSON strings if needed
    const backendBody: any = {
      organizationNumber: body.organizationNumber,
    };

    // Convert array fields to JSON strings (backend expects JSON strings, not arrays)
    if (body.languages) {
      backendBody.languages = Array.isArray(body.languages) 
        ? JSON.stringify(body.languages) 
        : body.languages;
      console.log('[API_ONBOARDING_PROFILE_PUT] Languages:', body.languages, '->', backendBody.languages);
    }
    if (body.websites) {
      backendBody.websites = Array.isArray(body.websites) 
        ? JSON.stringify(body.websites) 
        : body.websites;
      console.log('[API_ONBOARDING_PROFILE_PUT] Websites:', body.websites, '->', backendBody.websites);
    }
    if (body.socialMedia) {
      backendBody.socialMedia = Array.isArray(body.socialMedia) 
        ? JSON.stringify(body.socialMedia) 
        : body.socialMedia;
      console.log('[API_ONBOARDING_PROFILE_PUT] Social Media:', body.socialMedia, '->', backendBody.socialMedia);
    }

    const response = await fetch(`${BACKEND_URL}/api/onboarding/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(backendBody),
      cache: 'no-store'
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('[API_ONBOARDING_PROFILE_PUT_ERROR] Non-JSON response:', textResponse.substring(0, 200));
      return NextResponse.json(
        { message: 'Invalid response from backend' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('[API_ONBOARDING_PROFILE_PUT] Backend error:', {
        status: response.status,
        data: data
      });
      
      return NextResponse.json(
        { message: data.message || data.error || 'Failed to update profile' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API_ONBOARDING_PROFILE_PUT_ERROR]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


