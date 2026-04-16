// app/dashboard/scheduled-calls/page.tsx

import ScheduledCallsTableClient from '@/components/calls/ScheduledCallsTableClient';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getTranslations } from 'next-intl/server';

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export default async function ScheduledCallsPage() {
  const t = await getTranslations('scheduledCalls');
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const token = sessionCookie?.value;

  let userRole = '';

  const jwtSecret = (process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || '').trim();
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(jwtSecret);

      const { payload } = await jwtVerify<JwtPayload>(token, secret);

      userRole = payload.role;
    } catch (error) {
      console.error('Failed to verify JWT:', error);
    }
  }

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>{t('title')}</h2>
      </div>
      {/* Pass the user role to the client component if needed for permissions */}
      <ScheduledCallsTableClient userRole={userRole} />
    </div>
  );
}