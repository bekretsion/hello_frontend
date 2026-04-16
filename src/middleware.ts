import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define the shape of the JWT payload for type safety
interface JwtPayload {
  id: number;
  email: string;
  role: string;
  activeAccountType: string;
  iat: number;
  exp: number;
}

// Define the secret key outside the function so it's only created once
// Backend uses JWT_SECRET, so we need to match that
// Get and trim the secret to handle any whitespace/newline issues
const getJwtSecret = () => {
  const secretValue = (
    process.env.JWT_SECRET ||
    process.env.JWT_SECRET_KEY ||
    ''
  ).trim();
  if (!secretValue) {
    console.error(
      '❌ JWT_SECRET is not set or is empty in environment variables'
    );
    throw new Error('JWT_SECRET is not configured');
  }
  return new TextEncoder().encode(secretValue);
};

// Create secret once, but validate it
let secret: Uint8Array;
try {
  secret = getJwtSecret();
} catch (error) {
  console.error('❌ Failed to initialize JWT secret:', error);
  // Create a dummy secret to prevent crashes, but it will fail verification
  secret = new TextEncoder().encode('dummy-secret-for-error-handling');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session')?.value;

  const authPages = [
    '/login',
    '/signup',
    '/admin-login',
    '/forgot-password',
    '/reset-password',
    '/verify-otp',
    '/onboarding'
  ];
  const isAuthPage =
    authPages.includes(pathname) ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/onboarding');

  // Public pages that don't require authentication
  const publicPages = [
    '/dashboard/onboarding/voice-assistant',
    '/privacy',
    '/terms'
  ];
  const isPublicPage = publicPages.some((page) => pathname.startsWith(page));

  // === 1. Handling Unauthenticated Users ===
  if (!sessionToken) {
    // Allow access to auth pages and public onboarding page
    if (isAuthPage || isPublicPage) {
      return NextResponse.next();
    }
    // Otherwise redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // === 2. Handling Authenticated Users ===
  try {
    // Verify the token AND extract the payload (which contains the role)
    const { payload } = await jwtVerify<JwtPayload>(sessionToken, secret);
    const userRole = payload.role;

    console.log('🔐 Middleware - Authenticated user:', { userRole, pathname });

    // RULE A: If the user is logged in, redirect them to their journey step (for customers) or admin page
    // EXCEPTION: Allow /onboarding (business info form) for users with 'registered' status
    if (isAuthPage) {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/dashboard/users', request.url));
      }

      // Allow /onboarding page for authenticated users (they need to complete business info)
      if (pathname === '/onboarding') {
        console.log('✅ Allowing access to /onboarding for authenticated user');
        return NextResponse.next();
      }

      // For customers, fetch their current journey status and redirect accordingly
      try {
        const userStatusResponse = await fetch(
          `${process.env.BACKEND_API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          }
        );

        if (userStatusResponse.ok) {
          const userData = await userStatusResponse.json();
          const user = userData.user || userData; // Handle both response formats
          const signupStatus =
            user.signup_status || user.signupStatus || 'registered';

          console.log('📊 Login redirect - User signup status:', signupStatus);

          // Map signup status to appropriate page
          const statusRouteMap: Record<string, string> = {
            meeting_attended: '/dashboard/billing',
            receipt_assigned: '/dashboard/billing',
            paid: '/dashboard/activation',
            assistant_ready: '/dashboard/my-assistants'
          };

          const targetRoute =
            statusRouteMap[signupStatus] || '/dashboard/my-assistants';
          console.log(
            `🔄 Redirecting logged-in user to their journey step: ${targetRoute}`
          );
          return NextResponse.redirect(new URL(targetRoute, request.url));
        }
      } catch (error) {
        console.error('❌ Error fetching user status on login:', error);
      }

      // Fallback if status fetch fails
      return NextResponse.redirect(
        new URL('/dashboard/my-assistants', request.url)
      );
    }

    // RULE B: Admin-specific rules
    if (userRole === 'admin') {
      // Redirect admins from /dashboard to /dashboard/users
      if (pathname === '/dashboard' || pathname === '/dashboard/analytics' || pathname === '/dashboard/my-assistants') {
        return NextResponse.redirect(new URL('/dashboard/users', request.url));
      }
      // Admins have full access, let them through
      return NextResponse.next();
    }

    // RULE C: User Journey Management (for non-admins only)
    // Only Settings, Support, and Billing are always accessible
    const alwaysAccessiblePages = [
      '/dashboard/settings',
      '/dashboard/support',
      '/dashboard/billing'
    ];

    const isAlwaysAccessible = alwaysAccessiblePages.some((page) =>
      pathname.startsWith(page)
    );

    // If user is on always-accessible utility pages, let them through
    if (isAlwaysAccessible) {
      console.log(
        '✅ Middleware - User on always-accessible utility page:',
        pathname
      );
      return NextResponse.next();
    }

    // RULE D: Journey-based access control - Check for ALL dashboard pages
    if (pathname.startsWith('/dashboard')) {
      console.log(
        '🔍 Middleware - Checking user journey status for:',
        pathname
      );

      try {
        const userStatusResponse = await fetch(
          `${process.env.BACKEND_API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          }
        );

        if (userStatusResponse.ok) {
          const userData = await userStatusResponse.json();
          const user = userData.user || userData; // Handle both response formats
          const signupStatus =
            user.signup_status || user.signupStatus || 'assistant_ready';
          const totalMinutes = user.total_minutes_remaining || 0;

          console.log('📊 User signup status:', signupStatus);
          console.log('⏱️ User total minutes:', totalMinutes);

          // If user has active access but no minutes, redirect to billing
          const hasActiveBundle = totalMinutes > 0;
          if (signupStatus === 'assistant_ready' && !hasActiveBundle) {
            const isBillingPage =
              pathname === '/dashboard/billing' ||
              pathname.startsWith('/dashboard/billing/');
            if (!isBillingPage) {
              return NextResponse.redirect(
                new URL('/dashboard/billing', request.url)
              );
            }
          }

          // Map each status to their ONLY allowed journey page
          const statusRouteMap: Record<string, string> = {
            meeting_attended: '/dashboard/billing',
            receipt_assigned: '/dashboard/billing',
            paid: '/dashboard/activation',
            assistant_ready: 'FULL_ACCESS'
          };

          const allowedRoute = statusRouteMap[signupStatus];

          // assistant_ready (or any unrecognised legacy status) → full access
          if (allowedRoute === 'FULL_ACCESS' || !allowedRoute) {
            console.log('✅ User has full dashboard access');
            return NextResponse.next();
          }

          // Check if user is already on their current journey step
          if (pathname.startsWith(allowedRoute)) {
            return NextResponse.next();
          }

          // Redirect to their current step
          console.log(`🔄 Redirecting (${signupStatus}) → ${allowedRoute}`);
          return NextResponse.redirect(new URL(allowedRoute, request.url));
        } else {
          // If profile fetch fails, redirect to onboarding (safe default)
          console.warn(
            '⚠️ Failed to fetch user profile (status:',
            userStatusResponse.status,
            '), redirecting to onboarding'
          );

          // Profile fetch failed — allow through rather than blocking
          console.warn('⚠️ Failed to fetch user profile, allowing access');
          return NextResponse.next();
        }
      } catch (error) {
        console.error('❌ Error in user journey check:', error);
        // If API is down, allow through rather than blocking
        return NextResponse.next();
      }
    }

    // If no rules match, allow the request
    console.log('✅ Middleware - Allowing access to:', pathname);
    return NextResponse.next();
  } catch (err) {
    // This block runs ONLY if jwtVerify fails (invalid/expired token)
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('❌ JWT verification failed:', errorMessage);
    console.error('❌ Error details:', err);

    // Check if JWT_SECRET is set and log it (without exposing the actual value)
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    if (!jwtSecret || jwtSecret.trim().length === 0) {
      console.error(
        '❌ JWT_SECRET or JWT_SECRET_KEY is not set or is empty in environment variables'
      );
    } else {
      console.log(
        '✅ JWT_SECRET is set (length:',
        jwtSecret.trim().length,
        'chars)'
      );
    }

    // Only redirect if we're not already on the login page (prevent loops)
    if (!isAuthPage) {
      // Delete the bad cookie and redirect to login ONLY if token is invalid
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }

    // If we're on an auth page and token is invalid, just allow access
    return NextResponse.next();
  }
}

// The matcher config remains the same
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)']
};
