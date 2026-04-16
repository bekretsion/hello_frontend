import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: string;
  activeAccountType: string; // Add the new field
  apiKey: string;
  iat: number;
  exp: number;
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;

  try {
    // Backend uses JWT_SECRET, so we need to match that
    // Get and trim the secret to handle any whitespace/newline issues
    const secretValue = (process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || '').trim();
    if (!secretValue) {
      console.error('❌ JWT_SECRET is not set or is empty in session.ts');
      return null;
    }
    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify<UserPayload>(session, secret);

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      activeAccountType: payload.activeAccountType,
      apiKey: payload.apiKey
    };
  } catch (error) {
    // If verification fails, the token is invalid
    console.error('Failed to verify session', error);
    return null;
  }
}
