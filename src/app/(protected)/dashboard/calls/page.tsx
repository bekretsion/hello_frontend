import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import CallsTableClient from './calls-table-client';
import { getTranslations } from 'next-intl/server';
import { Headphones } from 'lucide-react';

interface CustomJwtPayload {
  id: number;
  email: string;
  role: string;
}

export default async function CallsPage() {
  const t = await getTranslations('calls');
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const token = sessionCookie?.value;

  let userRole: string = '';

  const jwtSecret = (process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || '').trim();
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify<CustomJwtPayload>(token, secret);
      userRole = payload.role;
    } catch {
      // userRole remains empty
    }
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4 p-2 sm:p-4 md:p-0'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2' data-tour="page-header">
          <Heading title={t('title')} description={t('description')} />
          <Link
            href="/dashboard/settings?tab=account"
            className="flex items-center gap-1.5 shrink-0 text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
            aria-label="Go to Account settings to enable listening and reading call details"
          >
            <Headphones className="h-4 w-4" aria-hidden="true" />
            Listen and read call details?
          </Link>
        </div>
        <Separator />
        <div data-tour="calls-table" className='w-full'>
          <CallsTableClient userRole={userRole} assistantId={null} />
        </div>
      </div>
    </PageContainer>
  );
}
