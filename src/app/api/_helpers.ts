import { cookies } from 'next/headers';

export const getBackendUrl = () => {
  const url = process.env.BACKEND_API_URL;

  if (!url) {
    throw new Error('BACKEND_API_URL is not configured.');
  }

  return url;
};

export const getAuthToken = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    throw new Error('Authentication required');
  }

  return sessionCookie.value;
};

export const buildBackendUrl = (
  backendUrl: string,
  path: string,
  searchParams?: string
) => {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendUrl}${sanitizedPath}${searchParams ? `?${searchParams}` : ''}`;
};


