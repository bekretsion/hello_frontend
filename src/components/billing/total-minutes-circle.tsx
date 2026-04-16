'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MinutesData {
  totalMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  bundles?: Array<{
    expires_at: string;
    minutes_purchased: number;
  }>;
}

export interface UsageStats {
  averageDailyUsage: number;
  estimatedDaysRemaining: number;
  nextRenewalDate: string | null;
}

interface TotalMinutesCircleProps {
  refreshTrigger?: number;
  transparent?: boolean;
  /** Pre-fetched minutes data from a parent server component. When supplied, skips the internal fetch. */
  prefetchedMinutesData?: any | null;
  /** Pre-fetched calls list from a sibling component. When supplied, skips the internal get-calls fetch. */
  prefetchedCallsList?: Array<{ startedAt: string; duration?: number }> | null;
}

export default function TotalMinutesCircle({
  refreshTrigger = 0,
  transparent = false,
  prefetchedMinutesData = null,
  prefetchedCallsList = null,
  onUsageStatsUpdate,
}: TotalMinutesCircleProps & { onUsageStatsUpdate?: (stats: UsageStats | null) => void }) {
  const t = useTranslations('billing.settingsPage');
  const [minutesData, setMinutesData] = useState<MinutesData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageStats = async (remainingMinutes: number, bundles: any[]) => {
    try {
      // If calls are already passed in from a parent, use them directly (avoids a 1000-call fetch)
      let calls: any[] = [];
      if (prefetchedCallsList !== null) {
        calls = prefetchedCallsList;
      } else {
        const callsRes = await fetch(`/api/vapi/calls/get-calls?limit=1000`);
        if (callsRes.ok) {
          const callsData = await callsRes.json();
          calls = callsData.calls || [];
        }
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      let totalMinutesUsed = 0;
      let daysWithCalls = new Set<string>();

      calls.forEach((call: any) => {
        if (call.startedAt) {
          const callDate = new Date(call.startedAt);
          if (callDate >= thirtyDaysAgo) {
            const duration = call.duration || 0;
            const minutes = Math.ceil(duration / 60);
            totalMinutesUsed += minutes;
            daysWithCalls.add(callDate.toISOString().split('T')[0]);
          }
        }
      });

      // Calculate average daily usage
      const daysCount = Math.max(1, daysWithCalls.size || 1); // At least 1 day to avoid division by zero
      const averageDailyUsage = totalMinutesUsed / daysCount;

      // Calculate estimated days remaining
      const estimatedDaysRemaining = averageDailyUsage > 0
        ? Math.floor(remainingMinutes / averageDailyUsage)
        : null;

      // Find next renewal date (earliest expires_at from active bundles)
      let nextRenewalDate: string | null = null;
      if (bundles.length > 0) {
        const activeBundles = bundles.filter((b: any) => {
          if (!b.expires_at) return false;
          const expiry = new Date(b.expires_at);
          return expiry > new Date();
        });

        if (activeBundles.length > 0) {
          const sortedBundles = activeBundles.sort((a: any, b: any) =>
            new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
          );
          nextRenewalDate = sortedBundles[0].expires_at;
        }
      }

      const stats = {
        averageDailyUsage: Math.round(averageDailyUsage * 10) / 10, // Round to 1 decimal
        estimatedDaysRemaining: estimatedDaysRemaining || 0,
        nextRenewalDate,
      };
      setUsageStats(stats);
      if (onUsageStatsUpdate) {
        onUsageStatsUpdate(stats);
      }
    } catch (err) {
      // Silently fail - usage stats are optional
      console.error('Failed to fetch usage stats:', err);
      const stats = {
        averageDailyUsage: 0,
        estimatedDaysRemaining: 0,
        nextRenewalDate: null,
      };
      setUsageStats(stats);
      if (onUsageStatsUpdate) {
        onUsageStatsUpdate(stats);
      }
    }
  };

  const fetchMinutesData = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: any;
      if (prefetchedMinutesData !== null) {
        // Use pre-fetched data from the server component — no network call needed
        data = prefetchedMinutesData;
      } else {
        // Standalone usage (e.g. billing page) — fetch from client
        const res = await fetch(`/api/minutes/my-minutes?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (!res.ok) throw new Error('Failed to fetch minutes data');
        data = await res.json();
      }

      let totalPurchasedMinutes = 0;
      if (Array.isArray(data.bundles)) {
        totalPurchasedMinutes = data.bundles.reduce(
          (sum: number, bundle: any) =>
            sum + (bundle.minutes_purchased || bundle.minutes || 0),
          0
        );
      }

      const remainingMinutes = data.totalMinutes || 0;
      const usedMinutes = Math.max(
        0,
        totalPurchasedMinutes - remainingMinutes
      );

      setMinutesData({
        totalMinutes: totalPurchasedMinutes,
        remainingMinutes,
        usedMinutes,
        bundles: data.bundles || [],
      });

      // Fetch usage statistics
      await fetchUsageStats(remainingMinutes, data.bundles || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      toast.error('Failed to load minutes data', { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinutesData();
  }, [refreshTrigger]);

  /* ---------------- Loading ---------------- */
  if (loading) {
    const content = (
      <div className="flex items-center justify-center w-full h-full">
        <Skeleton className="w-full aspect-square rounded-full" />
      </div>
    );

    return transparent ? (
      content
    ) : (
      <Card className="w-80 h-80">
        <CardContent className="h-full flex items-center justify-center">
          {content}
        </CardContent>
      </Card>
    );
  }

  /* ---------------- Error ---------------- */
  if (error || !minutesData) {
    const content = (
      <div className="text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-xs text-slate-500">{error || 'Please refresh'}</p>
      </div>
    );

    return transparent ? (
      content
    ) : (
      <Card className="w-80 h-80">
        <CardContent className="h-full flex items-center justify-center">
          {content}
        </CardContent>
      </Card>
    );
  }

  /* ---------------- Calculations ---------------- */
  const { totalMinutes, remainingMinutes, usedMinutes } = minutesData;

  const remainingPercentage =
    totalMinutes > 0 ? (remainingMinutes / totalMinutes) * 100 : 100;

  const usedPercentage =
    totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;

  /* ---------------- Circle Geometry ---------------- */
  const SVG_SIZE = 160;
  const RADIUS = 64;
  const STROKE = 6;
  const INNER_GAP = 0; // ✅ critical spacing
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const circle = (
    <div className="relative w-full h-full flex items-center justify-center min-h-0">
      <div className="relative w-full max-w-[140px] sm:max-w-[160px] aspect-square flex items-center justify-center p-3 sm:p-4 md:p-5">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="absolute inset-0"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="minute-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Background Ring */}
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-slate-200 dark:text-slate-700"
          />

          {/* Progress Ring */}
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="url(#minute-gradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={
              CIRCUMFERENCE * (1 - remainingPercentage / 100)
            }
            className="transition-all duration-1000 ease-out"
          />

          {/* ✅ Large Center Mask */}
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={RADIUS - STROKE - INNER_GAP}
            className="fill-white dark:fill-slate-900"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center pointer-events-none px-3 sm:px-4">
          <div className="text-2xl sm:text-3xl md:text-[36px] font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent leading-tight break-words">
            {remainingMinutes.toLocaleString()}
          </div>
          <div className="text-xs sm:text-xs text-slate-600 dark:text-slate-400 mt-1.5 sm:mt-2 leading-tight">
            {t('minutesRemaining')}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 leading-tight">
            {t('percentUsed', { percent: Math.round(usedPercentage) })}
          </div>
        </div>
      </div>
    </div>
  );

  /* ---------------- Render ---------------- */
  if (transparent) return circle;

  return (
    <Card className="w-80 h-80 bg-gradient-to-br from-white via-blue-50/30 to-emerald-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-lg">
      <CardContent className="h-full flex items-center justify-center p-8">
        {circle}
      </CardContent>
    </Card>
  );
}
