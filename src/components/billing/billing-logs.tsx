'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Loader2,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  XCircle,
  Zap,
  CreditCard,
  RefreshCw,
  Shield,
  Bell,
  Package,
  Search,
  Filter,
  Download,
  ChevronRight,
  ChevronLeft,
  UserCog,
  CalendarClock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingLog {
  id: number;
  user_id: number;
  event_type: string;
  amount: number | null;
  minutes_involved: number | null;
  bundle_id: number | null;
  stripe_payment_intent_id: string | null;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface BillingHistory {
  bundles: any[];
  logs: BillingLog[];
}

// Event type configurations for display
const eventTypeConfig = {
  package_purchase: {
    icon: Package,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    label: 'Package Purchase',
    description: 'Purchased minute package'
  },
  topup_purchase: {
    icon: Zap,
    color:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    label: 'Emergency Top-up',
    description: 'Emergency minute top-up'
  },
  auto_charge_success: {
    icon: CreditCard,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    label: 'Auto-charge Success',
    description: 'Automatic charge completed'
  },
  auto_charge_failed: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    label: 'Auto-charge Failed',
    description: 'Automatic charge failed'
  },
  bundle_expired: {
    icon: Clock,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    label: 'Bundle Expired',
    description: 'Minute bundle expired'
  },
  low_minutes_warning: {
    icon: Bell,
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    label: 'Low Minutes Warning',
    description: 'Low minutes threshold reached'
  },
  payment_retry: {
    icon: RefreshCw,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    label: 'Payment Retry',
    description: 'Payment retry attempt'
  },
  calls_blocked: {
    icon: Shield,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    label: 'Calls Blocked',
    description: 'Calls blocked due to insufficient minutes'
  },
  renewal_reminder: {
    icon: Bell,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    label: 'Renewal Reminder',
    description: 'Bundle renewal reminder sent'
  },
  auto_renewal_success: {
    icon: RefreshCw,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    label: 'Auto-renewal Success',
    description: 'Automatic renewal completed'
  },
  auto_renewal_failed: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    label: 'Auto-renewal Failed',
    description: 'Automatic renewal failed'
  },
  subscription_activated: {
    icon: Package,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    label: 'Subscription Activated',
    description: 'Service subscription activated'
  },
  package_upgrade_scheduled: {
    icon: CalendarClock,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    label: 'Package Upgrade Scheduled',
    description: 'Scheduled upgrade to a larger package'
  },
  package_downgrade_scheduled: {
    icon: CalendarClock,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    label: 'Package Downgrade Scheduled',
    description: 'Scheduled downgrade to a smaller package'
  },
  admin_package_assign: {
    icon: UserCog,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    label: 'Admin Package Assignment',
    description: 'Package assigned by administrator'
  },
  admin_manual_topup: {
    icon: UserCog,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    label: 'Admin Top-up',
    description: 'Manual top-up by administrator'
  }
};

interface BillingLogsProps {
  limit?: number;
  showFilters?: boolean;
  showExport?: boolean;
}

export default function BillingLogs({
  limit = 100,
  showFilters = true,
  showExport = true
}: BillingLogsProps) {
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(
    null
  );
  const [filteredLogs, setFilteredLogs] = useState<BillingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const t = useTranslations('billing.logs');

  const fetchBillingHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/minutes/history`);
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data);
      } else {
        toast.error(t('messages.fetchError'));
      }
    } catch (error) {
      toast.error(t('messages.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterLogs = useCallback(() => {
    if (!billingHistory?.logs) {
      setFilteredLogs([]);
      return;
    }

    let filtered = [...billingHistory.logs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.stripe_payment_intent_id
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter((log) => log.event_type === eventTypeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      if (dateFilter !== 'all') {
        filtered = filtered.filter(
          (log) => new Date(log.created_at) >= filterDate
        );
      }
    }

    setFilteredLogs(filtered);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [billingHistory?.logs, searchTerm, eventTypeFilter, dateFilter]);

  useEffect(() => {
    fetchBillingHistory();
  }, [fetchBillingHistory]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${day} ${month} ${year}, ${hour12}:${minutes} ${ampm}`;
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const exportLogs = () => {
    if (!filteredLogs.length) {
      toast.error(t('messages.noExport'));
      return;
    }

    const csvContent = [
      [
        'Date',
        'Event Type',
        'Description',
        'Amount',
        'Minutes',
        'Payment ID'
      ].join(','),
      ...filteredLogs.map((log) =>
        [
          formatDate(log.created_at),
          log.event_type,
          `"${log.description || ''}"`,
          log.amount || '',
          log.minutes_involved || '',
          log.stripe_payment_intent_id || ''
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(t('messages.exportSuccess'));
  };

  const getEventConfig = (eventType: string) => {
    const config = eventTypeConfig[eventType as keyof typeof eventTypeConfig];
    if (config) {
      return {
        ...config,
        label: t(`eventTypes.${eventType}.label`),
        description: t(`eventTypes.${eventType}.description`)
      };
    }

    return {
      icon: AlertCircle,
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      label: t('eventTypes.unknown.label', { type: eventType }),
      description: t('eventTypes.unknown.description')
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Calendar className='h-5 w-5' />
            <span>{t('title')}</span>
          </CardTitle>
          <CardDescription>{t('loading')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle className='flex items-center space-x-2'>
              <Calendar className='h-5 w-5' />
              <span>{t('title')}</span>
            </CardTitle>
            <CardDescription>
              {limit < 100
                ? t('recentActivity', { limit })
                : t('completeActivity')}
            </CardDescription>
          </div>
          {showExport && (
            <Button
              onClick={exportLogs}
              variant='outline'
              size='sm'
              className='flex items-center space-x-2 self-start sm:self-auto'
            >
              <Download className='h-4 w-4' />
              <span className='hidden sm:inline'>{t('export')}</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        {showFilters && (
          <div className='mb-6 space-y-4'>
            <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
              {/* Search */}
              <div className='relative w-full lg:flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>

              {/* Event Type Filter */}
              <div className='w-full lg:w-[260px]'>
                <Select
                  value={eventTypeFilter}
                  onValueChange={setEventTypeFilter}
                >
                  <SelectTrigger className='w-full'>
                    <div className='flex items-center'>
                      <Filter className='mr-2 h-4 w-4 flex-shrink-0' />
                      <SelectValue placeholder={t('filterEventType')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('eventType')}</SelectItem>
                    <SelectItem value='package_purchase'>
                      {t('eventTypes.package_purchase.label')}
                    </SelectItem>
                    <SelectItem value='topup_purchase'>
                      {t('eventTypes.topup_purchase.label')}
                    </SelectItem>
                    <SelectItem value='auto_charge_success'>
                      {t('eventTypes.auto_charge_success.label')}
                    </SelectItem>
                    <SelectItem value='auto_charge_failed'>
                      {t('eventTypes.auto_charge_failed.label')}
                    </SelectItem>
                    <SelectItem value='bundle_expired'>
                      {t('eventTypes.bundle_expired.label')}
                    </SelectItem>
                    <SelectItem value='low_minutes_warning'>
                      {t('eventTypes.low_minutes_warning.label')}
                    </SelectItem>
                    <SelectItem value='payment_retry'>
                      {t('eventTypes.payment_retry.label')}
                    </SelectItem>
                    <SelectItem value='calls_blocked'>
                      {t('eventTypes.calls_blocked.label')}
                    </SelectItem>
                    <SelectItem value='renewal_reminder'>
                      {t('eventTypes.renewal_reminder.label')}
                    </SelectItem>
                    <SelectItem value='auto_renewal_success'>
                      {t('eventTypes.auto_renewal_success.label')}
                    </SelectItem>
                    <SelectItem value='auto_renewal_failed'>
                      {t('eventTypes.auto_renewal_failed.label')}
                    </SelectItem>
                    <SelectItem value='subscription_activated'>
                      {t('eventTypes.subscription_activated.label')}
                    </SelectItem>
                    <SelectItem value='package_upgrade_scheduled'>
                      {t('eventTypes.package_upgrade_scheduled.label')}
                    </SelectItem>
                    <SelectItem value='package_downgrade_scheduled'>
                      {t('eventTypes.package_downgrade_scheduled.label')}
                    </SelectItem>
                    <SelectItem value='admin_package_assign'>
                      {t('eventTypes.admin_package_assign.label')}
                    </SelectItem>
                    <SelectItem value='admin_manual_topup'>
                      {t('eventTypes.admin_manual_topup.label')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className='w-full lg:w-[220px]'>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className='w-full'>
                    <div className='flex items-center'>
                      <Calendar className='mr-2 h-4 w-4 flex-shrink-0' />
                      <SelectValue placeholder={t('filterDate')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('period')}</SelectItem>
                    <SelectItem value='today'>{t('periods.today')}</SelectItem>
                    <SelectItem value='week'>{t('periods.week')}</SelectItem>
                    <SelectItem value='month'>{t('periods.month')}</SelectItem>
                    <SelectItem value='quarter'>
                      {t('periods.quarter')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <div className='flex flex-col items-start justify-between gap-2 text-sm sm:flex-row sm:items-center'>
              <span className='text-muted-foreground'>
                {t('showingRange', { start: Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length), end: Math.min(currentPage * itemsPerPage, filteredLogs.length), total: filteredLogs.length })}
              </span>
              <Button
                onClick={fetchBillingHistory}
                variant='ghost'
                size='sm'
                className='flex items-center space-x-1 self-start sm:self-auto'
              >
                <RefreshCw className='h-3 w-3' />
                <span>{t('refresh')}</span>
              </Button>
            </div>
          </div>
        )}

        {showFilters && <Separator className='mb-6' />}

        {/* Logs List */}
        <div className='space-y-4'>
          {filteredLogs.length === 0 ? (
            <div className='py-12 text-center'>
              <Calendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>{t('noLogs')}</h3>
              <p className='text-muted-foreground'>
                {searchTerm || eventTypeFilter !== 'all' || dateFilter !== 'all'
                  ? t('adjustFilters')
                  : t('emptyState')}
              </p>
            </div>
          ) : (
            <>
              {/* Paginated logs */}
              <div className='max-h-[600px] space-y-4 overflow-y-auto'>
                {filteredLogs
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((log) => {
                    const config = getEventConfig(log.event_type);
                    const IconComponent = config.icon;

                    return (
                      <Card
                        key={log.id}
                        className='transition-all hover:shadow-md'
                      >
                        <CardContent className='p-4'>
                          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4'>
                            {/* Icon */}
                            <div
                              className={cn(
                                'flex-shrink-0 self-start rounded-full p-2',
                                config.color
                              )}
                            >
                              <IconComponent className='h-4 w-4' />
                            </div>

                            {/* Content */}
                            <div className='min-w-0 flex-1'>
                              <div className='mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                <h4 className='font-semibold break-words'>
                                  {config.label}
                                </h4>
                                <div className='text-muted-foreground text-sm'>
                                  {formatDate(log.created_at)}
                                </div>
                              </div>

                              <p className='text-muted-foreground mb-3 text-sm break-words'>
                                {config.description}
                              </p>

                              {/* Details */}
                              <div className='text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:flex-wrap sm:gap-4'>
                                {log.amount && (
                                  <div className='flex items-center space-x-1'>
                                    <DollarSign className='h-3 w-3 flex-shrink-0' />
                                    <span className='break-all'>
                                      {formatAmount(log.amount)}
                                    </span>
                                  </div>
                                )}
                                {log.minutes_involved && (
                                  <div className='flex items-center space-x-1'>
                                    <Clock className='h-3 w-3 flex-shrink-0' />
                                    <span>{t('minutesCount', { count: log.minutes_involved })}</span>
                                  </div>
                                )}
                                {log.stripe_payment_intent_id && (
                                  <div className='flex items-center space-x-1'>
                                    <CreditCard className='h-3 w-3 flex-shrink-0' />
                                    <span className='font-mono break-all'>
                                      {log.stripe_payment_intent_id.slice(-8)}
                                    </span>
                                  </div>
                                )}
                                {log.bundle_id && (
                                  <div className='flex items-center space-x-1'>
                                    <Package className='h-3 w-3 flex-shrink-0' />
                                    <span>{t('bundleNumber', { id: log.bundle_id })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {/* Pagination Controls */}
              {filteredLogs.length > itemsPerPage && (
                <div className='mt-6 flex items-center justify-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className='h-4 w-4' />
                    {t('previous')}
                  </Button>

                  <div className='flex items-center gap-1'>
                    {Array.from(
                      { length: Math.ceil(filteredLogs.length / itemsPerPage) },
                      (_, i) => i + 1
                    )
                      .filter((page) => {
                        // Show first page, last page, current page, and pages adjacent to current
                        const totalPages = Math.ceil(
                          filteredLogs.length / itemsPerPage
                        );
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => (
                        <>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span
                              key={`ellipsis-${page}`}
                              className='text-muted-foreground px-2'
                            >
                              ...
                            </span>
                          )}
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? 'default' : 'outline'
                            }
                            size='sm'
                            onClick={() => setCurrentPage(page)}
                            className='h-8 w-8 p-0'
                          >
                            {page}
                          </Button>
                        </>
                      ))}
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          Math.ceil(filteredLogs.length / itemsPerPage),
                          prev + 1
                        )
                      )
                    }
                    disabled={
                      currentPage >=
                      Math.ceil(filteredLogs.length / itemsPerPage)
                    }
                  >
                    {t('next')}
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Note: Pagination is now built-in above */}
      </CardContent>
    </Card>
  );
}
