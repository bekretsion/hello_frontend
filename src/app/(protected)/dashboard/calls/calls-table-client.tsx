'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton'; // For loading state
import {
  IconChevronDown,
  IconChevronUp,
  IconDownload,
  IconFileExport,
  IconFilter,
  IconLoader2,
  IconX
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState, useRef } from 'react';
// Import the xlsx library. Make sure to install it: `npm install xlsx`
import * as XLSX from 'xlsx';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  CalendarIcon,
  Key,
  Settings,
  AlertTriangle,
  Bot,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import NewUserBanner from '@/components/billing/new-user-banner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { CreateAssistantRequestModal } from '@/components/assistant/create-assistant-request-modal';
import { AudioPlayer } from '@/components/audio-player';
import { useMinuteBundleCheck } from '@/hooks/use-minute-bundle-check';

// The interface now lives here, as it's directly used by this component.
// In a larger app, you might move this to a shared `types/index.ts` file.
export interface CallData {
  id: string;
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | string;
  status: string;
  startedAt: string;
  endedAt: string;
  endedReason: string | null;
  summary: string | null;
  transcript: string | null;
  stereoRecordingUrl: string | null;
  customerNumber: string | null;
  analysis?: {
    successEvaluation?: string;
  } | null;
}

/**
 * Derives the actual call status from analysis.successEvaluation
 * Priority: analysis.successEvaluation > raw status
 */
const deriveCallStatus = (call: CallData): string => {
  // Priority 1: Use analysis.successEvaluation if available
  if (call.analysis?.successEvaluation !== undefined) {
    return call.analysis.successEvaluation === 'true' ? 'completed' : 'failed';
  }
  
  // Priority 2: Return raw status from API
  return call.status;
};

// Error types for handling specific API key issues
type ApiErrorCode =
  | 'API_KEY_NOT_CONFIGURED'
  | 'INVALID_API_KEY'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | null;

/**
 * Empty state component to display when no assistants are available
 */
function NoAssistantsCard({ onRequestClick, isRestricted, requireMinuteBundle }: {
  onRequestClick: () => void;
  isRestricted: boolean;
  requireMinuteBundle: (action: () => void) => void;
}) {
  const tAssistants = useTranslations('assistants');
  const tBilling = useTranslations('billing');

  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center justify-center p-12 text-center'>
        <div className='mx-auto mb-6 w-fit rounded-full bg-blue-100 p-4 dark:bg-blue-900/20'>
          <Bot className='h-12 w-12 text-blue-600 dark:text-blue-400' />
        </div>
        <h3 className='mb-3 text-2xl font-semibold'>
          {tAssistants('noAssistantsAvailable.title')}
        </h3>
        <p className='text-muted-foreground mx-auto mb-6 max-w-md'>
          {tAssistants('noAssistantsAvailable.callsDescription')}
        </p>
        {isRestricted && (
          <p className='text-destructive mb-4 text-sm font-medium'>
            {tBilling('serviceInterrupted.description')}
          </p>
        )}
        <div
          className={isRestricted ? 'cursor-not-allowed' : ''}
          onClick={isRestricted ? () => requireMinuteBundle(() => { }) : undefined}
        >
          <Button
            onClick={isRestricted ? undefined : onRequestClick}
            disabled={isRestricted}
            className={`bg-[#83d2df] text-white hover:bg-[#6bb8c7] ${isRestricted ? 'pointer-events-none opacity-50' : ''
              }`}
          >
            <Bot className='mr-2 h-4 w-4' />
            {tAssistants('request.requestNew')}
          </Button>
        </div>
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
        <div className='mx-auto mb-6 w-fit rounded-full bg-orange-100 p-4 dark:bg-orange-900/20'>
          <Package className='h-12 w-12 text-orange-600 dark:text-orange-400' />
        </div>
        <h3 className='mb-3 text-2xl font-semibold'>
          {tBilling('serviceInterrupted.title')}
        </h3>
        <p className='text-muted-foreground mx-auto mb-6 max-w-md'>
          {tBilling('serviceInterrupted.description')}
        </p>
        <Button asChild className='bg-[#83d2df] text-white hover:bg-[#6bb8c7]'>
          <Link href='/dashboard/billing'>
            <Package className='mr-2 h-4 w-4' />
            {tBilling('goToBilling')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// The component no longer takes `initialCalls` as a prop.
export default function CallsTableClient({
  userRole,
  assistantId
}: {
  userRole: string;
  assistantId: string | null;
}) {
  const [calls, setCalls] = useState<CallData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ApiErrorCode>(null);
  const [isServiceInterrupted, setIsServiceInterrupted] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [hasActiveMinuteBundle, setHasActiveMinuteBundle] = useState(false);
  const { isRestricted, requireMinuteBundle } = useMinuteBundleCheck();

  // Pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [filteredCalls, setFilteredCalls] = useState<CallData[]>([]);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<CallData[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Filter states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('all');
  // Remove showFilters (init and setShowFilters usage)

  const canViewAdvancedDetails =
    userRole === 'admin' || userRole?.includes('advanced');

  const t = useTranslations('calls');
  const tCommon = useTranslations('common');

  // Translation mapping for call types
  const translateCallType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      inboundPhoneCall: t('callTypes.inboundCall'),
      outboundPhoneCall: t('callTypes.outboundCall'),
      webCall: t('callTypes.webCall')
    };
    return typeMap[type] || type;
  };

  // Translation mapping for call statuses
  const translateStatus = (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    const statusMap: { [key: string]: string } = {
      completed: t('statuses.completed'),
      ended: t('statuses.completed'), // Map ended to completed (Fullført/Completed)
      cancelled: t('statuses.cancelled'),
      'in-progress': t('statuses.inProgress'),
      inprogress: t('statuses.inProgress'),
      queued: t('statuses.inProgress'), // Map queued to in progress (Pågående/In progress)
      ringing: t('statuses.inProgress'), // Map ringing to in progress
      initiated: t('statuses.inProgress'), // Map initiated to in progress
      failed: t('statuses.failed')
    };
    return statusMap[normalizedStatus] || status;
  };

  // Get unique statuses from actual call data
  const uniqueStatuses = React.useMemo(() => {
    const statuses = new Set(calls.map((call) => call.status));
    return Array.from(statuses).sort();
  }, [calls]);

  // Color mapping for call status
  const getStatusColor = (status: string): string => {
    const normalizedStatus = status.toLowerCase();

    // Green for successful/completed states
    if (normalizedStatus === 'completed' || normalizedStatus === 'ended') {
      return 'bg-green-100 text-green-800 border-green-200';
    }

    // Red for failed/error states
    if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
      return 'bg-red-100 text-red-800 border-red-200';
    }

    // Yellow for in-progress/pending states
    if (
      normalizedStatus === 'in-progress' ||
      normalizedStatus === 'queued' ||
      normalizedStatus === 'initiated'
    ) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }

    // Default gray for unknown states
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Fetch active minute bundle status
  useEffect(() => {
    const fetchBundleStatus = async () => {
      try {
        const response = await fetch('/api/minutes/my-minutes');
        if (response.ok) {
          const data = await response.json();
          // Check if user has any active bundles with remaining time
          const hasBundle = data.bundles?.some((bundle: { status: string; expires_at: string }) =>
            bundle.status === 'active' && new Date(bundle.expires_at) > new Date()
          ) || false;
          setHasActiveMinuteBundle(hasBundle);
        }
      } catch (error) {
        console.error('Failed to fetch bundle status:', error);
      }
    };
    fetchBundleStatus();
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true; // Track component mount status

    const fetchCalls = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
          setErrorCode(null);
        }

        const params = new URLSearchParams();
        if (assistantId) params.set('assistantId', assistantId);
        params.set('limit', '30');
        const apiUrl = `/api/vapi/calls/get-calls?${params.toString()}`;

        const response = await fetch(apiUrl, {
          signal: abortController.signal
        });

        if (!response.ok) {
          // Parse the error response to get the error code
          const errorData = await response.json();

          // Check for service interruption (403 with service_interrupted reason)
          if (
            response.status === 403 &&
            (errorData.reason === 'service_interrupted' ||
              errorData.message?.includes('service has been interrupted'))
          ) {
            if (isMounted) {
              setCalls([]);
              setError(null);
              setErrorCode(null);
            }
            return; // Show empty table
          }

          // Determine the error code
          let detectedCode: ApiErrorCode = null;
          if (errorData.code) {
            detectedCode = errorData.code as ApiErrorCode;
          } else if (errorData.message?.includes('API_KEY_NOT_CONFIGURED')) {
            detectedCode = 'API_KEY_NOT_CONFIGURED';
          } else if (errorData.message?.includes('INVALID_API_KEY')) {
            detectedCode = 'INVALID_API_KEY';
          }

          // For API key related errors or 401 with no assistant, show page with empty table
          const isApiKeyError = detectedCode === 'API_KEY_NOT_CONFIGURED' || detectedCode === 'INVALID_API_KEY' || detectedCode === 'INSUFFICIENT_PERMISSIONS';
          if (isApiKeyError || (response.status === 401 && !assistantId)) {
            if (isMounted) {
              setErrorCode(detectedCode);
              setCalls([]);
              setError(null);
            }
            return;
          }

          if (isMounted) setErrorCode(detectedCode);
          throw new Error(
            errorData.message || `${t('errors.fetchFailed')} ${response.status}`
          );
        }

        const data = await response.json();
        if (isMounted) {
          setCalls(data.calls);
          setHasMore(data.pagination?.hasMore ?? false);
          setNextCursor(data.pagination?.nextCursor ?? null);
        }
      } catch (err) {
        const error = err as Error;
        if (isMounted && error.name !== 'AbortError') {
          // Check if error is about service interruption
          if (
            error.message.includes('service has been interrupted') ||
            error.message.includes('service_interrupted')
          ) {
            setCalls([]);
            setError(null);
          } else if (error.message.includes('401')) {
            // For auth errors, show empty table instead of error
            setCalls([]);
            setError(null);
          } else {
            setError(error.message);
            setIsServiceInterrupted(false);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCalls();

    // Cleanup: Abort request and mark component as unmounted
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [t, assistantId, userRole]);

  // Load More handler – appends the next page of calls
  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (assistantId) params.set('assistantId', assistantId);
      params.set('limit', '30');
      params.set('cursor', nextCursor);
      const apiUrl = `/api/vapi/calls/get-calls?${params.toString()}`;

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to load more calls');

      const data = await response.json();
      setCalls(prev => [...prev, ...data.calls]);
      setHasMore(data.pagination?.hasMore ?? false);
      setNextCursor(data.pagination?.nextCursor ?? null);
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    let filtered = [...calls];

    // Apply time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (timeRange) {
        case '7days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          filterDate.setMonth(now.getMonth() - 6);
          break;
      }

      filtered = filtered.filter(
        (call) => new Date(call.startedAt) >= filterDate
      );
    }

    // Apply date filter (specific date)
    if (selectedDate) {
      filtered = filtered.filter((call) => {
        const callDate = new Date(call.startedAt);
        return (
          callDate.getFullYear() === selectedDate.getFullYear() &&
          callDate.getMonth() === selectedDate.getMonth() &&
          callDate.getDate() === selectedDate.getDate()
        );
      });
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((call) => {
        const normalizedStatus = call.status.toLowerCase();
        switch (selectedStatus) {
          case 'completed':
            // Match completed and ended statuses
            return normalizedStatus === 'completed' || normalizedStatus === 'ended';
          case 'cancelled':
            // Match cancelled status
            return normalizedStatus === 'cancelled';
          case 'in-progress':
            // Match in-progress, inprogress, queued, ringing, initiated
            return (
              normalizedStatus === 'in-progress' ||
              normalizedStatus === 'inprogress' ||
              normalizedStatus === 'queued' ||
              normalizedStatus === 'ringing' ||
              normalizedStatus === 'initiated'
            );
          case 'failed':
            // Match failed status
            return normalizedStatus === 'failed';
          default:
            return call.status === selectedStatus;
        }
      });
    }

    // Apply search: use API results if available, otherwise client-side filter
    if (searchResults !== null) {
      filtered = searchResults;
    } else {
      const searchTerm = search.toLowerCase();
      if (searchTerm) {
        filtered = filtered.filter((call) => {
          const fieldsToSearch = [
            call.customerNumber,
            call.summary,
            call.transcript
          ];
          return fieldsToSearch.some(
            (field) => field && String(field).toLowerCase().includes(searchTerm)
          );
        });
      }
    }

    setFilteredCalls(filtered);
  }, [search, calls, selectedDate, selectedStatus, timeRange, searchResults]);

  // Debounced API search — fires when search term changes
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/vapi/calls/search?query=${encodeURIComponent(search.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setSearchResults(data.calls || []);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search]);

  // Scroll expanded row into view
  useEffect(() => {
    if (expandedCallId) {
      setTimeout(() => {
        const expandedRow = document.querySelector(
          `[data-expanded-row-id="${expandedCallId}"]`
        );
        if (expandedRow) {
          expandedRow.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 100);
    }
  }, [expandedCallId]);

  // Lazy-fetch full conversation details (transcript + recording) when a row is expanded
  useEffect(() => {
    if (!expandedCallId) return;

    const call = calls.find(c => c.id === expandedCallId);
    if (!call) return;

    // Already have the data — nothing to fetch (use loose != to also catch undefined)
    if (call.transcript != null || call.stereoRecordingUrl != null) return;

    const fetchDetails = async () => {
      setLoadingDetailId(expandedCallId);
      try {
        const res = await fetch(`/api/vapi/calls/${expandedCallId}`);
        if (!res.ok) return;
        const detail = await res.json();

        setCalls(prev =>
          prev.map(c =>
            c.id === expandedCallId
              ? {
                  ...c,
                  transcript: detail.transcript ?? c.transcript,
                  // Use the audio proxy URL if ElevenLabs signals audio exists
                  stereoRecordingUrl:
                    detail.stereoRecordingUrl ??
                    (detail.hasAudio ? `/api/vapi/calls/${expandedCallId}/audio` : c.stereoRecordingUrl),
                  summary: detail.summary ?? c.summary
                }
              : c
          )
        );
      } catch (_) {
        // fail silently — UI already shows "no transcript"
      } finally {
        setLoadingDetailId(null);
      }
    };

    fetchDetails();
  }, [expandedCallId, calls]);

  /**
   * Clears all filters
   */
  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedStatus('all');
    setTimeRange('all');
    setSearch('');
  };

  /**
   * Handles exporting the currently filtered call data to an Excel file.
   */
  const handleExport = () => {
    if (filteredCalls.length === 0) {
      // You might want to show a toast notification here instead of an alert.
      alert(t('export.noData'));
      return;
    }

    // 1. Format the data for the worksheet.
    const dataToExport = filteredCalls.map((call) => ({
      [t('table.phoneNumber')]: call.customerNumber ?? tCommon('unknown'),
      [t('table.type')]: translateCallType(call.type),
      [t('table.status')]: translateStatus(deriveCallStatus(call)),
      [t('table.startedAt')]: new Date(call.startedAt).toLocaleString('en-GB'),
      [t('table.endedAt')]: new Date(call.endedAt).toLocaleString('en-GB'),
      // [t('table.cost')]: call.cost ?? tCommon('unknown'),
      [t('table.endReason')]: call.endedReason || tCommon('unknown'),
      [t('table.summary')]: call.summary || t('noSummary')
      // [t('table.transcript')]: call.transcript || t('noTranscript'),
      // [t('table.recordingUrl')]: call.stereoRecordingUrl || tCommon('unknown'),
      // [t('table.callId')]: call.id
    }));

    // 2. Create a new worksheet from the formatted data.
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // 3. (Optional) Set column widths for better readability.
    worksheet['!cols'] = [
      { wch: 20 }, // Phone Number
      { wch: 20 }, // Type
      { wch: 15 }, // Status
      { wch: 25 }, // Started At
      { wch: 25 }, // Ended At
      // { wch: 10 }, // Cost ($)
      { wch: 20 }, // End Reason
      { wch: 50 } // Summary
      // { wch: 80 }, // Transcript
      // { wch: 50 }, // Recording URL
      // { wch: 40 } // Call ID
    ];

    // 4. Create a new workbook and append the worksheet.
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('export.sheetName'));

    // 5. Generate the .xlsx file and trigger the download.
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${t('export.fileName')}_${today}.xlsx`);
  };

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={10} filterCount={1} />;
  }

  if (error) {
    return (
      <div className='bg-card flex h-64 items-center justify-center rounded-md border'>
        <p className='text-destructive'>
          {tCommon('error')}: {error}
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      {/* Billing status banner */}
      <NewUserBanner navigateToBilling showWelcome={false} />

      {/* Assistant request modal (accessible from elsewhere if needed) */}
      <CreateAssistantRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        hasActiveMinuteBundle={!isRestricted}
      />

      {/* Search and Actions Bar */}
      <div className='bg-card rounded-md border p-3 sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          {/* Search bar */}
          <div className='relative min-w-0 flex-1'>
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='hover:bg-muted h-9 w-full min-w-[200px] rounded-md border px-3 pr-8 focus:outline-none'
            />
            {isSearching && (
              <IconLoader2 className='absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400' />
            )}
          </div>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div className='flex flex-1 flex-wrap items-center gap-2'>
              {/* Time Range */}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className='hover:bg-muted h-9 w-full min-w-[140px] rounded-md border sm:w-auto'>
                  <SelectValue placeholder={t('filters.allTime')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('filters.allTime')}</SelectItem>
                  <SelectItem value='7days'>
                    {t('filters.last7Days')}
                  </SelectItem>
                  <SelectItem value='30days'>
                    {t('filters.last30Days')}
                  </SelectItem>
                  <SelectItem value='3months'>
                    {t('filters.last3Months')}
                  </SelectItem>
                  <SelectItem value='6months'>
                    {t('filters.last6Months')}
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Specific Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='hover:bg-muted h-9 w-full min-w-[140px] justify-start rounded-md border border-input px-3 text-left text-sm font-normal sm:w-auto'
                  >
                    <CalendarIcon className='mr-2 h-4 w-4 flex-shrink-0' />
                    <span className='truncate'>
                      {selectedDate ? (
                        format(selectedDate, 'PP')
                      ) : (
                        <span>{t('filters.pickDate') || 'Pick a date'}</span>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className='hover:bg-muted h-9 w-full min-w-[140px] rounded-md border sm:w-auto'>
                  <SelectValue
                    placeholder={t('filters.allStatuses') || 'All Statuses'}
                  />
                </SelectTrigger>
                <SelectContent className='min-w-[var(--radix-select-trigger-width)]'>
                  <SelectItem value='all'>
                    <span className='inline-flex items-center gap-2'>
                      <span className='h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gray-400'></span>
                      <span>{t('filters.allStatuses') || 'All Statuses'}</span>
                    </span>
                  </SelectItem>
                  <SelectItem value='completed'>
                    <span className='inline-flex items-center gap-2'>
                      <span className='h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500'></span>
                      <span>{t('statuses.completed')}</span>
                    </span>
                  </SelectItem>
                  <SelectItem value='cancelled'>
                    <span className='inline-flex items-center gap-2'>
                      <span className='h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500'></span>
                      <span>{t('statuses.cancelled')}</span>
                    </span>
                  </SelectItem>
                  <SelectItem value='in-progress'>
                    <span className='inline-flex items-center gap-2'>
                      <span className='h-2.5 w-2.5 flex-shrink-0 rounded-full bg-yellow-500'></span>
                      <span>{t('statuses.inProgress')}</span>
                    </span>
                  </SelectItem>
                  <SelectItem value='failed'>
                    <span className='inline-flex items-center gap-2'>
                      <span className='h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500'></span>
                      <span>{t('statuses.failed')}</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Clear Filters Button */}
              <Button
                onClick={clearFilters}
                variant='default'
                size='sm'
                className='h-9 flex-1 border-0 bg-red-600 px-3 whitespace-nowrap text-white hover:bg-red-700 sm:flex-initial'
              >
                <IconX className='mr-1.5 h-4 w-4' />
                <span className='hidden sm:inline'>
                  {t('filters.clearFilters')}
                </span>
                <span className='sm:hidden'>{t('clear')}</span>
              </Button>
            </div>
            {/* Export Button - Moved to the right */}
            <Button
              onClick={handleExport}
              variant='default'
              size='sm'
              disabled={isLoading}
              className='h-9 bg-[#6aa84f]/80 px-3 whitespace-nowrap text-white hover:bg-[#6aa84f]'
            >
              <IconFileExport className='mr-2 h-4 w-4' />
              <span className='hidden sm:inline'>
                {t('export.downloadXlsx') || 'Download xlsx'}
              </span>
              <span className='sm:hidden'>{t('export.short') || 'Export'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className='hidden overflow-x-auto overflow-y-visible rounded-md border md:block'>
        <Table className='w-full'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[50px]'></TableHead>
              <TableHead className='min-w-[120px]'>
                {t('table.phoneNumber')}
              </TableHead>
              <TableHead className='min-w-[100px]'>{t('table.type')}</TableHead>
              <TableHead className='min-w-[100px]'>
                {t('table.status')}
              </TableHead>
              <TableHead className='min-w-[150px]'>
                {t('table.startedAt')}
              </TableHead>
              <TableHead className='min-w-[150px]'>
                {t('table.endedAt')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCalls.length > 0 ? (
              filteredCalls.map((call) => {
                const isExpanded = expandedCallId === call.id;
                return (
                  <React.Fragment key={call.id}>
                    <TableRow
                      onClick={() =>
                        setExpandedCallId(isExpanded ? null : call.id)
                      }
                      className='cursor-pointer'
                    >
                      <TableCell>
                        <Button variant='ghost' size='icon'>
                          {isExpanded ? (
                            <IconChevronUp className='h-4 w-4' />
                          ) : (
                            <IconChevronDown className='h-4 w-4' />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {call.customerNumber ?? tCommon('unknown')}
                      </TableCell>
                      <TableCell>{translateCallType(call.type)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(deriveCallStatus(call))}`}
                        >
                          {translateStatus(deriveCallStatus(call))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(call.startedAt).toLocaleString('en-GB')}
                      </TableCell>
                      <TableCell>
                        {new Date(call.endedAt).toLocaleString('en-GB')}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow data-expanded-row-id={call.id}>
                        <TableCell colSpan={6} className='p-0'>
                          <div className='bg-muted/20 min-w-0 space-y-4 border-t p-4 sm:p-6'>
                            <div className='space-y-2'>
                              <h6 className='text-foreground text-sm font-semibold sm:text-base'>
                                {t('details.summary')}
                              </h6>
                              <div className='bg-background max-h-48 overflow-y-auto rounded-md border p-3 sm:p-4'>
                                <p className='text-muted-foreground text-sm leading-relaxed break-words whitespace-pre-wrap sm:text-base'>
                                  {call.summary || t('noSummary')}
                                </p>
                              </div>
                            </div>
                            {loadingDetailId === call.id ? (
                              <div className='border-t pt-4 flex items-center gap-2 text-muted-foreground text-sm'>
                                <IconLoader2 className='h-4 w-4 animate-spin' />
                                {t('details.loadingDetails')}
                              </div>
                            ) : (
                              <>
                                {call.stereoRecordingUrl && (
                                  <div className='space-y-2 border-t pt-2'>
                                    <h6 className='text-foreground text-sm font-semibold sm:text-base'>
                                      {t('details.recording')}
                                    </h6>
                                    <div className='bg-background rounded-md border p-2'>
                                      <AudioPlayer src={call.stereoRecordingUrl} />
                                    </div>
                                  </div>
                                )}
                                {call.transcript && (
                                  <div className='space-y-2 border-t pt-2'>
                                    <h6 className='text-foreground text-sm font-semibold sm:text-base'>
                                      {t('details.transcript')}
                                    </h6>
                                    <div className='bg-background max-h-60 overflow-y-auto rounded-md border p-3 sm:p-4'>
                                      <pre className='text-foreground font-sans text-sm leading-relaxed break-words whitespace-pre-wrap sm:text-base'>
                                        {call.transcript}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  {t('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className='space-y-3 md:hidden'>
        {filteredCalls.length > 0 ? (
          filteredCalls.map((call) => {
            const isExpanded = expandedCallId === call.id;
            return (
              <Card key={call.id} className='overflow-hidden'>
                <CardContent className='p-0'>
                  <div
                    onClick={() =>
                      setExpandedCallId(isExpanded ? null : call.id)
                    }
                    className='cursor-pointer space-y-2 p-4'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='min-w-0 flex-1'>
                        <div className='truncate text-base font-semibold'>
                          {call.customerNumber ?? tCommon('unknown')}
                        </div>
                        <div className='text-muted-foreground mt-1 text-sm'>
                          {translateCallType(call.type)}
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='flex-shrink-0'
                      >
                        {isExpanded ? (
                          <IconChevronUp className='h-4 w-4' />
                        ) : (
                          <IconChevronDown className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(deriveCallStatus(call))}`}
                      >
                        {translateStatus(deriveCallStatus(call))}
                      </span>
                    </div>
                    <div className='text-muted-foreground space-y-1 text-xs'>
                      <div>
                        <span className='font-medium'>
                          {t('table.startedAt')}:{' '}
                        </span>
                        {new Date(call.startedAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div>
                        <span className='font-medium'>
                          {t('table.endedAt')}:{' '}
                        </span>
                        {new Date(call.endedAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className='bg-muted/20 min-w-0 space-y-4 border-t p-4'>
                      <div className='space-y-2'>
                        <h6 className='text-foreground text-sm font-semibold'>
                          {t('details.summary')}
                        </h6>
                        <div className='bg-background max-h-48 overflow-y-auto rounded-md border p-3'>
                          <p className='text-muted-foreground text-sm leading-relaxed break-words whitespace-pre-wrap'>
                            {call.summary || t('noSummary')}
                          </p>
                        </div>
                      </div>
                      {call.stereoRecordingUrl && (
                        <div className='space-y-2 border-t pt-2'>
                          <h6 className='text-foreground text-sm font-semibold'>
                            {t('details.recording')}
                          </h6>
                          <div className='bg-background rounded-md border p-2'>
                            <AudioPlayer src={call.stereoRecordingUrl} />
                          </div>
                        </div>
                      )}
                      {call.transcript && (
                        <div className='space-y-2 border-t pt-2'>
                          <h6 className='text-foreground text-sm font-semibold'>
                            {t('details.transcript')}
                          </h6>
                          <div className='bg-background max-h-60 overflow-y-auto rounded-md border p-3'>
                            <pre className='text-foreground font-sans text-sm leading-relaxed break-words whitespace-pre-wrap'>
                              {call.transcript}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className='flex h-24 items-center justify-center'>
              <p className='text-muted-foreground'>{t('noResults')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Load More Button */}
      {
        hasMore && (
          <div className='flex justify-center pt-4'>
            <Button
              variant='outline'
              onClick={loadMore}
              disabled={isLoadingMore}
              className='min-w-[200px]'
            >
              {isLoadingMore ? (
                <>
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                  {tCommon('loading')}
                </>
              ) : (
                t('loadMore')
              )}
            </Button>
          </div>
        )
      }
    </div>
  );
}
