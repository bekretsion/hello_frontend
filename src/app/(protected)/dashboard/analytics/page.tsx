
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import PageContainer from '@/components/layout/page-container';
import AnalyticsClient from './analytics-client';
import AnalyticsSkeleton from './analytics-skeleton';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('analytics');
  return {
    title: `Dashboard: ${t('title')}`
  };
}

interface CustomJwtPayload {
  id: number;
  email: string;
  role: string;
  AssistantId: string;
}

/**
 * Intermediate async server component — fetches minutesData INSIDE the Suspense
 * boundary so the heading above streams to the browser immediately at TTFB,
 * while this component resolves in the background and replaces the skeleton.
 */
async function AnalyticsWithData({
  assistantId,
  token,
}: {
  assistantId: string | null;
  token: string | undefined;
}) {
  let minutesData: any = null;
  try {
    const backendUrl = process.env.BACKEND_API_URL;
    if (backendUrl && token) {
      const res = await fetch(`${backendUrl}/api/minutes/my-minutes`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 30 },
      });
      if (res.ok) {
        minutesData = await res.json();
      }
    }
  } catch {
    // minutesData stays null; components fall back to their own fetching
  }

  return <AnalyticsClient assistantId={assistantId} minutesData={minutesData} />;
}

export default async function OverviewPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const token = sessionCookie?.value;
  const t = await getTranslations('analytics');

  let assistantId: string | null = null;

  const jwtSecret = (process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || '').trim();
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify<CustomJwtPayload>(token, secret);
      assistantId = payload.AssistantId;
    } catch {
      // assistantId remains null; client handles this
    }
  }

  return (
    <PageContainer scrollable={false}>
      {/*
        LCP element: heading streams at TTFB — before the minutesData fetch completes.
        AnalyticsWithData (inside Suspense) fetches minutesData in the background
        and streams in once ready, replacing the skeleton.
      */}
      <div className='flex flex-col gap-1 px-2 sm:px-0 pt-2 mb-3 sm:mb-4' data-tour="page-header">
        <h1 className='text-xl sm:text-2xl md:text-3xl font-bold tracking-tight'>
          {t('title')}
        </h1>
        <p className='text-sm text-muted-foreground'>{t('description')}</p>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsWithData assistantId={assistantId} token={token} />
      </Suspense>
    </PageContainer>
  );
}
