
'use client';

import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import React, { useEffect, useMemo, useState, useCallback, useTransition, useDeferredValue } from 'react';
import { Phone, Clock, CheckCircle, XCircle, AlertTriangle, Bot, Package, Search, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/hooks/use-language';
import { useDynamicTranslation } from '@/hooks/use-dynamic-translation';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateAssistantRequestModal } from '@/components/assistant/create-assistant-request-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnalyticsSkeleton from './analytics-skeleton';
import TotalMinutesCircle from '@/components/billing/total-minutes-circle';
import NewUserBanner from '@/components/billing/new-user-banner';
import { Heading } from '@/components/ui/heading';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <div className="h-[45px] animate-pulse bg-muted rounded" />
});

export interface AnalyticsData {
  name: string;
  timeRange: { start: string; end: string; timezone: string };
  result: any[];
}

interface AnalyticsClientProps {
  assistantId: string | null;
  /** Minutes data pre-fetched by the server component — avoids duplicate client-side requests */
  minutesData?: any | null;
}

// Error types for handling specific API key issues
type ApiErrorCode = 'API_KEY_NOT_CONFIGURED' | 'INVALID_API_KEY' | 'INSUFFICIENT_PERMISSIONS' | 'RATE_LIMITED' | 'SERVICE_UNAVAILABLE' | null;

const getTimeRange = (filter: string, customDays: number = 30) => {
  const now = new Date();
  let startDate = new Date();
  switch (filter) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case '7days':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case '3months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'all':
      // All time — go back far enough to capture all historical data
      startDate = new Date('2020-01-01');
      break;
    case 'custom':
      // Custom days filter - go back the specified number of days
      startDate.setDate(now.getDate() - customDays);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to 30 days
      startDate.setDate(now.getDate() - 30);
      break;
  }
  return {
    start: startDate.toISOString(),
    end: now.toISOString(),
    step: 'day',
    timezone: 'UTC'
  };
};

// Stable module-level constant — zero re-creation cost on every render
const kpiChartOptions: ApexOptions = {
  chart: { type: 'area', height: 45, sparkline: { enabled: true }, background: 'transparent', toolbar: { show: false } },
  stroke: { curve: 'smooth', width: 2 },
  grid: { show: false },
  xaxis: { labels: { show: false }, axisBorder: { show: false } },
  yaxis: { labels: { show: false } },
  dataLabels: { enabled: false },
  tooltip: { enabled: false }
};

const getBaseChartOptions = (): ApexOptions => ({
  chart: {
    background: 'transparent',
    toolbar: { show: false },
    animations: {
      enabled: false // Disable animations for better performance
    }
  },
  grid: {
    borderColor: 'hsl(var(--border))',
    strokeDashArray: 4,
    xaxis: {
      lines: {
        show: false
      }
    }
  },
  xaxis: {
    labels: { style: { colors: 'hsl(var(--muted-foreground))' } },
    axisBorder: { color: 'hsl(var(--border))' },
    axisTicks: { color: 'hsl(var(--border))' }
  },
  yaxis: {
    labels: { style: { colors: 'hsl(var(--muted-foreground))' } }
  },
  legend: {
    labels: { colors: 'hsl(var(--foreground))' }
  },
  tooltip: {
    enabled: true,
    theme: 'dark'
  },
  dataLabels: { enabled: false }
});

/**
 * Empty state component to display when no assistants are available
 */
function NoAssistantsCard({ onRequestClick }: { onRequestClick: () => void }) {
  const tAssistants = useTranslations('assistants');

  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center justify-center p-12 text-center'>
        <div className='mx-auto mb-6 w-fit rounded-full bg-blue-100 dark:bg-blue-900/20 p-4'>
          <Bot className='h-12 w-12 text-blue-600 dark:text-blue-400' />
        </div>
        <h3 className='mb-3 text-2xl font-semibold'>
          {tAssistants('noAssistantsAvailable.title')}
        </h3>
        <p className='text-muted-foreground mx-auto mb-6 max-w-md'>
          {tAssistants('noAssistantsAvailable.analyticsDescription')}
        </p>
        <Button
          onClick={onRequestClick}
          className='bg-[#83d2df] hover:bg-[#6bb8c7] text-white'
        >
          <Bot className='mr-2 h-4 w-4' />
          {tAssistants('request.requestNew')}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Service interrupted component to display when user has no active minute bundle
 */
function ServiceInterruptedCard() {
  const tBilling = useTranslations('billing');
  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center justify-center p-12 text-center'>
        <div className='mx-auto mb-6 w-fit rounded-full bg-orange-100 dark:bg-orange-900/20 p-4'>
          <Package className='h-12 w-12 text-orange-600 dark:text-orange-400' />
        </div>
        <h3 className='mb-3 text-2xl font-semibold'>
          {tBilling('serviceInterrupted.title')}
        </h3>
        <p className='text-muted-foreground mx-auto mb-6 max-w-md'>
          {tBilling('serviceInterrupted.description')}
        </p>
        <Button
          asChild
          className='bg-[#83d2df] hover:bg-[#6bb8c7] text-white'
        >
          <Link href='/dashboard/billing'>
            <Package className='mr-2 h-4 w-4' />
            {tBilling('goToBilling')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsClient({ assistantId, minutesData: serverMinutesData }: AnalyticsClientProps) {
  const { translateCallType, translateCallStatus, t, tCommon } = useDynamicTranslation('analytics');
  const tAssistants = useTranslations('assistants');
  const { currentLanguage } = useLanguage();

  // useTransition — wraps non-urgent state updates so they don't block INP
  const [, startTransition] = useTransition();

  // Summary data returned from the new /analytics/summary endpoint
  const [summary, setSummary] = useState<any | null>(null);
  // Keep callsList for TotalMinutesCircle prop (fetched separately, only needed there)
  const [callsList, setCallsList] = useState<Array<{ startedAt: string; duration?: number }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ApiErrorCode>(null);
  const [isServiceInterrupted, setIsServiceInterrupted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('30days');
  // appliedCustomDays drives the data fetch/memo; customDaysInput is local UI state only
  const [appliedCustomDays, setAppliedCustomDays] = useState(60);
  const [customDaysInput, setCustomDaysInput] = useState('60');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [successRateFilter, setSuccessRateFilter] = useState<'all' | 'failed' | 'completed'>('all');
  const [showCallsByType, setShowCallsByType] = useState(false);

  // Keep a legacy `data` shape so downstream JSX that still references processedData still works
  // (will be null when loading, non-null after fetch)
  const [data, setData] = useState<AnalyticsData[] | null>(null);

  // Derive bundle status from server-prefetched data when available
  const hasActiveMinuteBundle = serverMinutesData
    ? (serverMinutesData.bundles?.some((bundle: { status: string; expires_at: string }) =>
      bundle.status === 'active' && new Date(bundle.expires_at) > new Date()
    ) ?? false)
    : false;

  // Apply custom days filter when user clicks outside the input (onBlur)
  // Only updates appliedCustomDays (which triggers fetch/memo) — NOT on every keystroke
  const handleCustomDaysBlur = useCallback(() => {
    const value = parseInt(customDaysInput) || 30;
    const clampedValue = Math.max(1, Math.min(365, value));
    setCustomDaysInput(String(clampedValue));
    if (clampedValue !== appliedCustomDays) {
      setAppliedCustomDays(clampedValue);
    }
  }, [customDaysInput, appliedCustomDays]);

  // Bundle status is now derived from serverMinutesData prop above — no separate fetch needed

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setErrorCode(null);

      const timeRange = getTimeRange(selectedFilter, appliedCustomDays);
      const params = new URLSearchParams({
        start: timeRange.start,
        end: timeRange.end,
        step: timeRange.step || 'day',
        timezone: timeRange.timezone || 'UTC',
      });

      // Fetch summary + calls list in parallel
      // (calls list is only needed for TotalMinutesCircle usage stats)
      let getCallsUrl = `/api/vapi/calls/get-calls?limit=500`;
      if (assistantId) getCallsUrl += `&${new URLSearchParams({ assistantId }).toString()}`;

      try {
        const [summaryRes, callsRes] = await Promise.all([
          fetch(`/api/vapi/analytics/summary?${params.toString()}`),
          fetch(getCallsUrl),
        ]);

        // Handle calls list (non-critical, best-effort)
        if (callsRes.ok) {
          const callsData = await callsRes.json();
          setCallsList(callsData.calls || []);
        }

        if (!summaryRes.ok) {
          const errData = await summaryRes.json().catch(() => ({}));

          if (summaryRes.status === 403 && (
            errData.reason === 'service_interrupted' ||
            errData.message?.includes('service has been interrupted')
          )) {
            setIsServiceInterrupted(true);
            setError(null);
            setErrorCode(null);
            return;
          }

          let code: ApiErrorCode = null;
          if (errData.code) code = errData.code as ApiErrorCode;
          const isApiKeyErr = code === 'API_KEY_NOT_CONFIGURED' || code === 'INVALID_API_KEY' || code === 'INSUFFICIENT_PERMISSIONS';
          if (isApiKeyErr || (summaryRes.status === 401 && !assistantId)) {
            setErrorCode(code);
            setSummary(null);
            setData([]);
            return;
          }

          setErrorCode(code);
          throw new Error(errData.message || `Request failed with status ${summaryRes.status}`);
        }

        const summaryData = await summaryRes.json();
        setSummary(summaryData);
        // Set data to non-null so legacy downstream checks (`data !== null`) still work
        setData([]);

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
        if (msg.includes('service has been interrupted') || msg.includes('service_interrupted')) {
          setIsServiceInterrupted(true);
          setError(null);
        } else if (msg.includes('401')) {
          setData([]);
          setError(null);
        } else {
          setError(msg);
          setIsServiceInterrupted(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // appliedCustomDays (not customDaysInput) so the fetch only fires on blur/enter
  }, [selectedFilter, appliedCustomDays, assistantId]);


  // ---------------------------------------------------------------------------
  // processedData: maps the pre-aggregated backend summary into chart-ready series.
  // All heavy aggregation has moved to the backend; this is now lightweight.
  // ---------------------------------------------------------------------------
  const processedData = useMemo(() => { // eslint-disable-line react-hooks/exhaustive-deps
    // Null = still loading (show skeleton). Empty data = data arrived but empty.
    if (data === null) return null;
    if (!summary) {
      // No API key / error state → return zeros so the page still renders
      return {
        kpis: { totalMinutes: 0, avgDurationMinutes: 0, numberOfCalls: 0, successfulCalls: 0, failedCalls: 0, successRate: 0, failureRate: 0 },
        charts: { dailyCallDuration: [], dailyCalls: {}, dailySuccessData: [], dailyFailureData: [], failedCallsData: [], callVolumeSeries: [], totalCallsSeries: { name: '', data: [] } },
        dateRange: { start: 0, end: 0 },
      };
    }

    const { kpis, dailySeries = [], callTypes = [], failureBreakdown = [] } = summary;
    const timeRange = getTimeRange(selectedFilter, appliedCustomDays);
    const rangeStart = new Date(timeRange.start).getTime();
    const rangeEnd = new Date(timeRange.end).getTime();

    // --- dailyCalls map (date → count) ---
    const dailyCalls: Record<string, number> = {};
    dailySeries.forEach((d: any) => { dailyCalls[d.date] = d.calls; });

    // --- dailyCallDuration (for the duration chart — keeps same shape as before) ---
    const dailyCallDuration = dailySeries.map((d: any) => ({
      date: d.date,
      sumDuration: d.durationSeconds,
    }));

    // --- Success / failure daily series ([timestamp, count][]) ---
    const dailySuccessData: [number, number][] = dailySeries.map((d: any) => [
      new Date(d.date).getTime(), d.successfulCalls,
    ]);
    const dailyFailureData: [number, number][] = dailySeries.map((d: any) => [
      new Date(d.date).getTime(), d.failedCalls,
    ]);

    // --- Failure reason breakdown (keeps same shape as before: { endedReason, countId }[]) ---
    const failedCallsData = failureBreakdown.map((fb: any) => ({
      endedReason: fb.reason,
      countId: String(fb.count),
    }));

    // --- Call volume series per type ---
    const allDatesForTotal = dailySeries.map((d: any) => d.date);
    const allCallTypes = callTypes.length > 0 ? callTypes : ['webCall'];

    const callVolumeSeries = allCallTypes.map((type: string) => ({
      name: translateCallType(type),
      data: dailySeries.map((d: any) => [
        new Date(d.date).getTime(),
        (d.byType && d.byType[type]) || 0,
      ]) as [number, number][],
    }));

    // --- Total calls series (continuous with zero-fill for the date range) ---
    const rangeStartDate = new Date(rangeStart);
    rangeStartDate.setHours(0, 0, 0, 0);
    const rangeEndDate = new Date(rangeEnd);
    rangeEndDate.setHours(23, 59, 59, 999);
    const rangeDays = Math.ceil((rangeEnd - rangeStart) / (24 * 60 * 60 * 1000));

    let totalCallsSeriesData: [number, number][];
    if (rangeDays <= 366) {
      const points: [number, number][] = [];
      const cur = new Date(rangeStartDate);
      while (cur.getTime() <= rangeEndDate.getTime()) {
        const ds = cur.toISOString().split('T')[0];
        points.push([cur.getTime(), dailyCalls[ds] || 0]);
        cur.setDate(cur.getDate() + 1);
      }
      totalCallsSeriesData = points;
    } else {
      const points: [number, number][] = [];
      const cur = new Date(rangeStartDate);
      while (cur.getTime() <= rangeEndDate.getTime()) {
        const weekEnd = new Date(cur); weekEnd.setDate(weekEnd.getDate() + 6);
        let weekCount = 0;
        const check = new Date(cur);
        while (check.getTime() <= weekEnd.getTime() && check.getTime() <= rangeEndDate.getTime()) {
          weekCount += dailyCalls[check.toISOString().split('T')[0]] || 0;
          check.setDate(check.getDate() + 1);
        }
        points.push([cur.getTime(), weekCount]);
        cur.setDate(cur.getDate() + 7);
      }
      totalCallsSeriesData = points;
    }

    return {
      kpis,
      charts: {
        dailyCallDuration,
        dailyCalls,
        dailySuccessData,
        dailyFailureData,
        failedCallsData,
        costBreakdownData: [], // cost data removed from this endpoint
        callVolumeSeries,
        totalCallsSeries: {
          name: t('totalCalls') || 'Total Calls',
          data: totalCallsSeriesData,
        },
      },
      dateRange: {
        start: allDatesForTotal.length > 0
          ? new Date(allDatesForTotal[0]).getTime()
          : rangeStart,
        end: allDatesForTotal.length > 0
          ? new Date(allDatesForTotal[allDatesForTotal.length - 1]).getTime()
          : rangeEnd,
      },
    };
    // appliedCustomDays (not customDaysInput) so this memo only re-runs on filter apply, not keystroke (INP fix)
  }, [summary, data, translateCallType, selectedFilter, appliedCustomDays, t]);



  // --- Chart Configurations (must be before conditional returns) ---
  const successRateChartOptions: ApexOptions = useMemo(() => {
    // Determine colors based on filter
    let colors: string[] = [];
    if (successRateFilter === 'all') {
      colors = ['#EF4444', '#22C55E']; // Red for failed, Green for completed
    } else if (successRateFilter === 'failed') {
      colors = ['#EF4444']; // Red for failed
    } else if (successRateFilter === 'completed') {
      colors = ['#22C55E']; // Green for completed
    }

    return {
      ...getBaseChartOptions(),
      // MODIFIED: Ensured toolbar is explicitly hidden
      chart: {
        type: 'area',
        height: 350,
        stacked: true,
        toolbar: { show: false },
        events: {
          legendClick: (chartContext, seriesIndex, opts) => {
            // Disable default legend click behavior to prevent confusion
            return false;
          }
        }
      },
      colors: colors,
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      xaxis: { type: 'datetime' },
      yaxis: {
        title: { text: 'Number of Calls' },
        labels: {
          formatter: (val) => val.toFixed(0)
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        showForSingleSeries: true
      }
    };
  }, [successRateFilter]);

  // --- Chart Configurations (must be before conditional returns) ---
  const dailyVolumeChartOptions: ApexOptions = useMemo(() => {
    // Early return if processedData is not available
    if (!processedData || !processedData.charts || !processedData.charts.totalCallsSeries) {
      return {
        ...getBaseChartOptions(),
        chart: { type: 'area', height: 350, toolbar: { show: false } },
        xaxis: { type: 'datetime' },
        yaxis: { title: { text: 'Number of Calls' } }
      };
    }

    // Use the selected time range for x-axis so chart always shows full period (like "all time")
    const timeRange = getTimeRange(selectedFilter, appliedCustomDays);
    const xaxisMin = new Date(timeRange.start).getTime();
    const xaxisMax = new Date(timeRange.end).getTime();
    const rangeDays = (xaxisMax - xaxisMin) / (24 * 60 * 60 * 1000);
    // Reasonable tick count: ~6–10 labels for the range
    const tickAmount = rangeDays <= 7 ? 7 : rangeDays <= 31 ? 6 : rangeDays <= 95 ? 8 : 10;

    return {
      ...getBaseChartOptions(),
      chart: {
        type: 'area',
        height: 350,
        stacked: false,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit'
      },
      colors: ['#3B82F6'],
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: 'hsl(var(--border))',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: {
          lines: {
            show: true,
            opacity: 0.2
          }
        },
        padding: { top: 8, right: 16, bottom: 0, left: 8 }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          format: 'dd MMM yyyy',
          rotate: -40,
          style: {
            colors: 'hsl(var(--muted-foreground))',
            fontSize: '12px'
          }
        },
        axisBorder: { color: 'hsl(var(--border))' },
        axisTicks: { color: 'hsl(var(--border))' },
        min: xaxisMin,
        max: xaxisMax,
        tickAmount: tickAmount,
        forceNiceScale: false,
        tooltip: { enabled: false }
      },
      yaxis: {
        title: { text: 'Number of Calls' },
        labels: {
          formatter: (val) => val.toFixed(0),
          style: { colors: 'hsl(var(--muted-foreground))' }
        },
        min: 0,
        forceNiceScale: true,
        tickAmount: 5,
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      legend: { show: false },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        theme: 'dark',
        x: { format: 'dd MMM yyyy' },
        y: {
          formatter: (val: number) => `${val} ${val === 1 ? 'call' : 'calls'}`
        }
      },
      markers: {
        size: 4,
        hover: { size: 6 },
        strokeWidth: 2,
        strokeColors: '#fff',
        fillColors: ['#3B82F6'],
        showNullDataPoints: false
      },
      plotOptions: {
        area: {
          fillTo: 'origin',
          distributed: false
        }
      }
    };
  }, [processedData, selectedFilter, appliedCustomDays]);

  // kpiChartOptions is now a stable module-level constant (defined above the component)

  // If processedData is null (e.g. data was set to empty array for API key errors), use zero defaults
  // NOTE: This must stay ABOVE all early returns to satisfy React's Rules of Hooks
  const displayData = processedData || {
    kpis: {
      totalMinutes: 0,
      avgDurationMinutes: 0,
      numberOfCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      successRate: 0,
      failureRate: 0
    },
    charts: {
      dailyCallDuration: [],
      dailyCalls: {},
      dailySuccessData: [],
      dailyFailureData: [],
      failedCallsData: [],
      callVolumeSeries: [],
      totalCallsSeries: { name: 'Total Calls', data: [] }
    },
    dateRange: {
      start: new Date().getTime(),
      end: new Date().getTime()
    }
  };

  // Deferred display data — charts use this so expensive chart re-renders
  // are deferred until the browser is idle after a filter interaction
  // NOTE: Must be above early returns (Rules of Hooks — fixes React error #310)
  const deferredDisplayData = useDeferredValue(displayData);

  // Memoised failure breakdown — avoids recompute on unrelated renders
  const endedReasonData = useMemo(() => deferredDisplayData.charts.failedCallsData.reduce(
    (acc: Record<string, number>, item: any) => {
      const reason = item.endedReason || 'Unknown';
      acc[reason] = (acc[reason] || 0) + parseInt(item.countId, 10);
      return acc;
    },
    {} as Record<string, number>
  ), [deferredDisplayData.charts.failedCallsData]);

  const endedReasonOptions: ApexOptions = useMemo(() => ({
    ...getBaseChartOptions(),
    chart: { type: 'bar', height: 350, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: true, barHeight: '70%', distributed: true }
    },
    xaxis: { categories: Object.keys(endedReasonData) },
    legend: { show: false }
  }), [endedReasonData]);

  // Stable memoised KPI sparkline series — prevent inline array alloc every render
  const avgDurationSeries = useMemo(() => [{
    name: t('avgDuration'),
    data: deferredDisplayData.charts.dailyCallDuration.map((d: any) => ({ x: d.date, y: +(d.sumDuration / 60).toFixed(2) }))
  }], [deferredDisplayData.charts.dailyCallDuration, t]);

  const totalCallsSeries = useMemo(() => [{
    name: t('metrics.calls'),
    data: Object.entries(deferredDisplayData.charts.dailyCalls).map(([x, y]) => ({ x, y }))
  }], [deferredDisplayData.charts.dailyCalls, t]);

  const successSparkSeries = useMemo(() => [{
    name: t('callStatus.completed'),
    data: deferredDisplayData.charts.dailySuccessData
  }], [deferredDisplayData.charts.dailySuccessData, t]);

  const failureSparkSeries = useMemo(() => [{
    name: t('callStatus.failed'),
    data: deferredDisplayData.charts.dailyFailureData
  }], [deferredDisplayData.charts.dailyFailureData, t]);


  // --- Early returns (after all hooks) ---

  if (isLoading) return <AnalyticsSkeleton />;

  // For non-API-key errors with no data, show error screen
  if ((error || !processedData) && !isServiceInterrupted && errorCode !== 'API_KEY_NOT_CONFIGURED' && errorCode !== 'INVALID_API_KEY' && errorCode !== 'INSUFFICIENT_PERMISSIONS')
    return (
      <div className='flex flex-1 flex-col space-y-3 sm:space-y-4 mb-6 sm:mb-8 w-full min-w-0 px-2 sm:px-0'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold tracking-tight'>
              {t('title')}
            </h1>
            <p className='text-sm text-muted-foreground'>
              {t('description')}
            </p>
          </div>
        </div>
        <div className='bg-card flex h-64 items-center justify-center rounded-md border'>
          <p className='text-destructive'>{tCommon('error')}: {error || tCommon('noData')}</p>
        </div>
      </div>
    );



  return (
    <div className='flex flex-1 flex-col space-y-3 sm:space-y-4 mb-6 sm:mb-8 w-full min-w-0 px-2 sm:px-0'>
      {/* Filter controls — heading is SSR'd by the server component in page.tsx */}
      <div className='flex items-center justify-end gap-2 sm:gap-3' data-tour="filters">

        {/* Export CSV button */}
        <Button
          variant='outline'
          size='sm'
          className='h-9 gap-1.5 shrink-0'
          title={t('export')}
          onClick={() => {
            const timeRange = getTimeRange(selectedFilter, appliedCustomDays);
            const params = new URLSearchParams({
              startDate: timeRange.start,
              endDate: timeRange.end,
            });
            window.location.href = `/api/export/analytics-summary?${params.toString()}`;
          }}
        >
          <Download className='h-4 w-4' />
          <span className='hidden sm:inline'>{t('export')}</span>
        </Button>
        <Select value={selectedFilter} onValueChange={(v) => startTransition(() => setSelectedFilter(v))}>
          <SelectTrigger className='w-full sm:w-[180px] text-sm sm:text-base'>
            <SelectValue placeholder={t('timeFilters.30days')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='today'>{t('timeFilters.today')}</SelectItem>
            <SelectItem value='7days'>{t('timeFilters.7days')}</SelectItem>
            <SelectItem value='30days'>{t('timeFilters.30days')}</SelectItem>
            <SelectItem value='3months'>{t('timeFilters.3months')}</SelectItem>
            <SelectItem value='all'>{t('timeFilters.all')}</SelectItem>
            <SelectItem value='custom'>{t('timeFilters.custom')}</SelectItem>
          </SelectContent>
        </Select>
        {selectedFilter === 'custom' && (
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <Input
                type='number'
                min={1}
                max={365}
                value={customDaysInput}
                onChange={(e) => setCustomDaysInput(e.target.value)}
                onBlur={handleCustomDaysBlur}
                className='w-24 pr-12 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
              />
              <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none'>{t('timeFilters.customDays')}</span>
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleCustomDaysBlur}
              className='h-9 w-9 p-0'
              title='Apply filter'
            >
              <Search className='h-4 w-4 text-[#83d2df]' />
            </Button>
          </div>
        )}
      </div>

      {/* Billing status banner — pass server-prefetched minutesData to skip the banner's own fetch */}
      <NewUserBanner navigateToBilling showWelcome={false} className="mb-2" prefetchedMinutesData={serverMinutesData} />

      {/* KPI Cards */}
      {/* Fixed 5-column grid with responsive breakpoints.
          Using explicit column counts ensures cards maintain vertical order
          when sidebar expands - they squish horizontally, not reflow vertically. */}
      <div
        className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 w-full'
        data-tour="metrics-cards"
      >
        {/* Minute Wheel Card - Standalone without background */}
        <Card className='overflow-hidden min-w-0'>
          <CardContent className='p-3 sm:p-4 min-h-[140px] sm:min-h-[160px] flex items-center justify-center overflow-hidden'>
            <div className='w-full h-full flex items-center justify-center py-2'>
              {/* Pass pre-fetched data to skip both internal API calls in TotalMinutesCircle */}
              <TotalMinutesCircle
                transparent={true}
                prefetchedMinutesData={serverMinutesData}
                prefetchedCallsList={callsList}
              />
            </div>
          </CardContent>
        </Card>

        {/* Avg Duration Card */}
        <Card className='min-w-0 overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3'>
            <CardTitle className='text-[10px] sm:text-xs font-medium truncate flex-1 min-w-0 pr-1.5'>
              {t('avgDuration')}
            </CardTitle>
            <Clock className='text-muted-foreground h-3 w-3 shrink-0' />
          </CardHeader>
          <CardContent className='px-3 pb-3'>
            <div className='flex items-baseline gap-1.5 flex-wrap mb-1'>
              <span className='text-lg sm:text-xl font-bold'>{displayData.kpis.avgDurationMinutes.toFixed(2)}</span>
              <span className='text-xs sm:text-sm font-medium text-muted-foreground'>min</span>
              <span className='text-[10px] sm:text-xs text-muted-foreground'>
                {t('avgDurationApprox', {
                  seconds: Math.round(displayData.kpis.avgDurationMinutes * 60)
                })}
              </span>
            </div>
            <ReactApexChart
              options={{ ...kpiChartOptions, colors: ['#6366F1'] }}
              series={avgDurationSeries}
              type='area'
              height={45}
            />
          </CardContent>
        </Card>

        {/* Total Calls Card */}
        <Card className='min-w-0 overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3'>
            <CardTitle className='text-[10px] sm:text-xs font-medium truncate flex-1 min-w-0 pr-1.5'>
              {t('totalCalls')} ({t('metrics.calls')})
            </CardTitle>
            <Phone className='text-muted-foreground h-3 w-3 shrink-0' />
          </CardHeader>
          <CardContent className='px-3 pb-3'>
            <div className='text-lg sm:text-xl font-bold mb-1'>
              {displayData.kpis.numberOfCalls}
            </div>
            <ReactApexChart
              options={{ ...kpiChartOptions, colors: ['#F97316'] }}
              series={totalCallsSeries}
              type='area'
              height={45}
            />
          </CardContent>
        </Card>

        {/* Success Rate Card */}
        <Card className='min-w-0 overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3'>
            <CardTitle className='text-[10px] sm:text-xs font-medium truncate flex-1 min-w-0 pr-1.5'>
              {t('successRate')}
            </CardTitle>
            <CheckCircle className='text-muted-foreground h-3 w-3 shrink-0' />
          </CardHeader>
          <CardContent className='px-3 pb-3'>
            <div className='text-lg sm:text-xl font-bold mb-1'>
              {displayData.kpis.successRate.toFixed(1)}%
            </div>
            <ReactApexChart
              options={{ ...kpiChartOptions, colors: ['#22C55E'] }}
              series={successSparkSeries}
              type='area'
              height={45}
            />
          </CardContent>
        </Card>

        {/* Failure Rate Card */}
        <Card className='min-w-0 overflow-hidden'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3'>
            <CardTitle className='text-[10px] sm:text-xs font-medium truncate flex-1 min-w-0 pr-1.5'>{t('failureRate')}</CardTitle>
            <XCircle className='text-muted-foreground h-3 w-3 shrink-0' />
          </CardHeader>
          <CardContent className='px-3 pb-3'>
            <div className='text-lg sm:text-xl font-bold mb-1'>
              {displayData.kpis.failureRate.toFixed(1)}%
            </div>
            <ReactApexChart
              options={{ ...kpiChartOptions, colors: ['#EF4444'] }}
              series={failureSparkSeries}
              type='area'
              height={45}
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='volume' data-tour="charts-section">
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='volume'>{t('tabLabels.calls')}</TabsTrigger>
          <TabsTrigger value='success'>{t('successRate')}</TabsTrigger>
          <TabsTrigger value='failures'>{t('tabs.failureReasons')}</TabsTrigger>
        </TabsList>
        <TabsContent value='volume' className='space-y-4'>
          <Card className='overflow-hidden'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>{t('callsOverTime')}</CardTitle>
                <div className='flex items-center gap-2'>
                  <Button
                    variant={!showCallsByType ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => startTransition(() => setShowCallsByType(false))}
                  >
                    {t('filters.all')}
                  </Button>
                  <Button
                    variant={showCallsByType ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => startTransition(() => setShowCallsByType(true))}
                  >
                    {t('callTypes.Web Call') ? t('tabLabels.calls') : 'By Type'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ReactApexChart
                key={`calls-chart-${currentLanguage}-${showCallsByType}`}
                options={dailyVolumeChartOptions}
                series={
                  showCallsByType && deferredDisplayData.charts.callVolumeSeries.length > 0
                    ? deferredDisplayData.charts.callVolumeSeries
                    : [deferredDisplayData.charts.totalCallsSeries]
                }
                type='area'
                height={350}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='success' className='space-y-4'>
          <Card className='overflow-hidden'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>{t('callStatusDistribution')}</CardTitle>
                <div className='flex items-center gap-2'>
                  <Button
                    variant={successRateFilter === 'all' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => startTransition(() => setSuccessRateFilter('all'))}
                  >
                    {t('filters.all')}
                  </Button>
                  <Button
                    variant={successRateFilter === 'failed' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => startTransition(() => setSuccessRateFilter('failed'))}
                    className={successRateFilter === 'failed' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                  >
                    {t('callStatus.failed')}
                  </Button>
                  <Button
                    variant={successRateFilter === 'completed' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => startTransition(() => setSuccessRateFilter('completed'))}
                    className={successRateFilter === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                  >
                    {t('callStatus.completed')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ReactApexChart
                options={successRateChartOptions}
                series={[
                  ...(successRateFilter === 'all' || successRateFilter === 'failed'
                    ? [{ name: t('callStatus.failed'), data: deferredDisplayData.charts.dailyFailureData }]
                    : []),
                  ...(successRateFilter === 'all' || successRateFilter === 'completed'
                    ? [{ name: t('callStatus.completed'), data: deferredDisplayData.charts.dailySuccessData }]
                    : [])
                ]}
                type='area'
                height={350}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='failures' className='space-y-4'>
          <Card className='overflow-hidden'>
            <CardHeader>
              <CardTitle>{t('charts.failedCallReasons')}</CardTitle>
              <CardDescription className='text-sm text-muted-foreground'>
                {t('charts.failedCallReasonsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(endedReasonData).length === 0 ? (
                <div className='flex h-[350px] items-center justify-center'>
                  <p className='text-muted-foreground text-sm'>{t('charts.noCallsInPeriod')}</p>
                </div>
              ) : (
                <ReactApexChart
                  options={endedReasonOptions}
                  series={[{
                    name: t('filters.all'),
                    data: Object.entries(endedReasonData).map(([reason, count]) => ({ x: reason, y: count }))
                  }]}
                  type='bar'
                  height={Math.max(250, Object.keys(endedReasonData).length * 50)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className='mt-14'></div>
    </div>
  );
}