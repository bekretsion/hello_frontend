import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@/components/ui/skeleton';
import BillingClient, { type BillingSSRData } from './billing-client';

export async function generateMetadata() {
  const t = await getTranslations('billing');
  return { title: `Dashboard: ${t('title', { defaultValue: 'Plan & Add-ons' })}` };
}

/**
 * Skeleton shown while BillingDataProvider is fetching SSR data.
 * Keeps the page feeling immediately interactive.
 */
function BillingSkeleton() {
  return (
    <div className="flex w-full flex-col items-center space-y-4 pt-1 px-2 sm:px-4 md:px-6">
      <div className="w-full max-w-7xl space-y-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Async server component — runs INSIDE the Suspense boundary.
 * All 5 backend calls are fired in parallel via Promise.allSettled so that
 * a single slow endpoint cannot cascade delays onto the rest.
 * The page heading above streams at TTFB before this completes.
 */
async function BillingDataProvider({ token }: { token: string | undefined }) {
  const backendUrl = process.env.BACKEND_API_URL;

  // Parallel fetch — all 5 data sources at once
  const [addonsResult, subscriptionResult, receiptResult, minutesResult, topupResult] =
    await Promise.allSettled([
      // 1. Service add-ons (public, no auth needed)
      backendUrl
        ? fetch(`${backendUrl}/api/service-addons`, { next: { revalidate: 300 } }).then(r => r.ok ? r.json() : [])
        : Promise.resolve([]),

      // 2. User subscription / purchased add-ons
      backendUrl && token
        ? fetch(`${backendUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 30 }
        }).then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),

      // 3. Receipt
      backendUrl && token
        ? fetch(`${backendUrl}/api/receipts/customer`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }).then(r => r.ok ? r.json() : null).catch(() => null)
        : Promise.resolve(null),

      // 4. Minutes / active bundle check
      backendUrl && token
        ? fetch(`${backendUrl}/api/minutes/my-minutes`, {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 30 }
        }).then(r => r.ok ? r.json() : null).catch(() => null)
        : Promise.resolve(null),

      // 5. Daily top-up status
      backendUrl && token
        ? fetch(`${backendUrl}/api/minutes/topup-status`, {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 60 }
        }).then(r => r.ok ? r.json() : null).catch(() => null)
        : Promise.resolve(null),
    ]);

  // Safely unwrap settled results
  const serviceAddons: any[] = addonsResult.status === 'fulfilled' ? (addonsResult.value ?? []) : [];
  const meData: any = subscriptionResult.status === 'fulfilled' ? subscriptionResult.value : null;
  const receiptData: any = receiptResult.status === 'fulfilled' ? receiptResult.value : null;
  const minutesData: any = minutesResult.status === 'fulfilled' ? minutesResult.value : null;
  const topupData: any = topupResult.status === 'fulfilled' ? topupResult.value : null;

  // Derive purchased addon IDs from /api/auth/me response
  let purchasedAddonIds: string[] = [];
  if (meData?.user?.current_addons) {
    try {
      const raw = typeof meData.user.current_addons === 'string'
        ? JSON.parse(meData.user.current_addons)
        : meData.user.current_addons;
      purchasedAddonIds = Array.isArray(raw) ? raw.map((a: any) => String(a.id ?? a)) : [];
    } catch {
      purchasedAddonIds = [];
    }
  }

  // Derive active minute bundle flag
  // Business rule: a bundle counts as "active" for purchasing top-ups
  // if it is non-topup, not expired, and has status 'active'.
  // Users with 0 remaining minutes can still buy top-ups as long as the bundle hasn't expired.
  const hasActiveMinuteBundle = minutesData?.bundles?.some((bundle: any) =>
    (bundle.is_topup === 0 || bundle.is_topup === false) &&
    bundle.status === 'active' &&
    new Date(bundle.expires_at) > new Date()
  ) ?? false;

  // Derive receipt — backend returns { success, data } or { data } shape
  const receipt = receiptData?.data ?? (receiptData?.success === false ? null : receiptData) ?? null;

  const ssrData: BillingSSRData = {
    serviceAddons,
    purchasedAddonIds,
    receipt,
    hasActiveMinuteBundle,
    dailyTopupCount: topupData?.currentCount ?? 0,
    minutesData,
  };

  return <BillingClient ssrData={ssrData} />;
}

export default async function BillingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const t = await getTranslations('billing');

  return (
    <>
      {/*
        LCP element: heading is static — no async I/O before this JSX returns,
        so it lands in the very first HTML chunk at TTFB.
        BillingDataProvider (inside Suspense) runs all data fetches in parallel
        and resolves independently without blocking this heading.
      */}
      <div className="px-4 md:px-6 pt-2 mb-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('description')}
        </p>
      </div>

      <Suspense fallback={<BillingSkeleton />}>
        <BillingDataProvider token={token} />
      </Suspense>
    </>
  );
}