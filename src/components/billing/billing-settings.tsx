'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Loader2,
  CreditCard,
  Bell,
  Settings,
  RefreshCw,
  Package,
  Clock,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  ShoppingCart,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import TotalMinutesCircle, { UsageStats } from './total-minutes-circle';
import BillingLogs from './billing-logs';
import ActiveSubscriptions, { ActiveSubscriptionsContent } from './active-subscriptions';
import ManageBundleDialog from './manage-bundle-dialog';

interface BillingSettings {
  auto_topup_enabled: boolean;
  auto_topup_threshold: number;
  auto_charge_enabled: boolean;
  auto_renewal_enabled: boolean;
  auto_retry_enabled: boolean;
  auto_renewal_trigger_hours: number;
  low_minutes_threshold: number;
  topup_amount: number;
  notification_email: string;
  has_payment_method?: boolean;
}

interface InputStates {
  low_minutes_threshold: string;
  topup_amount: string;
  auto_renewal_trigger_hours: string;
  auto_topup_threshold: string;
}

interface UserMinutes {
  totalMinutes: number;
  bundles: Array<{
    id: number;
    package_id: string;
    minutes_remaining: number;
    minutes_purchased: number;
    purchase_price: number;
    expires_at: string;
    package_name: string;
    validity_days: number;
    is_topup: boolean;
    status: string;
  }>;
}

interface BillingSettingsProps {
  scrollToNotifications?: boolean;
}

export default function BillingSettings({ scrollToNotifications = false }: BillingSettingsProps) {
  const [settings, setSettings] = useState<BillingSettings>({
    auto_topup_enabled: false,
    auto_topup_threshold: 10,
    auto_charge_enabled: false,
    auto_renewal_enabled: true,
    auto_retry_enabled: true,
    auto_renewal_trigger_hours: 5,
    low_minutes_threshold: 20,
    topup_amount: 100,
    notification_email: ''
  });
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [editingEmails, setEditingEmails] = useState<{ [key: number]: string }>({});
  const [inputStates, setInputStates] = useState<InputStates>({
    low_minutes_threshold: '20',
    topup_amount: '100',
    auto_renewal_trigger_hours: '5',
    auto_topup_threshold: '10'
  });
  const [userMinutes, setUserMinutes] = useState<UserMinutes | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isBillingLogsExpanded, setIsBillingLogsExpanded] = useState(false);
  const [isBundleDetailsExpanded, setIsBundleDetailsExpanded] = useState(false);
  const [isMinutesSubscriptionsExpanded, setIsMinutesSubscriptionsExpanded] =
    useState(true);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [bundleCurrentPage, setBundleCurrentPage] = useState(1);
  const bundleItemsPerPage = 10;
  const [managingBundle, setManagingBundle] = useState<any | null>(null);
  const hasLoadedRef = useRef(false);
  const hasScrolledToNotifications = useRef(false);

  const t = useTranslations('billing');

  // Handle scrollToNotifications prop - expand settings and scroll to card
  useEffect(() => {
    if (scrollToNotifications && !isLoading && !hasScrolledToNotifications.current) {
      hasScrolledToNotifications.current = true;
      // Expand the billing settings section
      setIsSettingsExpanded(true);
      // Wait for the expansion animation and DOM update
      setTimeout(() => {
        const notificationsCard = document.getElementById('notifications-card');
        if (notificationsCard) {
          notificationsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a brief highlight effect
          notificationsCard.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            notificationsCard.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }
      }, 300);
    }
  }, [scrollToNotifications, isLoading]);

  useEffect(() => {
    const cacheKey = 'billing_settings_loaded';
    const hasLoaded = sessionStorage.getItem(cacheKey) === 'true';

    if (hasLoaded) {
      // Already loaded before, fetch silently without showing loading
      setIsLoading(false);
      fetchSettings();
      fetchUserMinutes();
      return;
    }

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      sessionStorage.setItem(cacheKey, 'true');
      fetchSettings();
      fetchUserMinutes();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/minutes/settings');
      if (response.ok) {
        const data = await response.json();
        // Convert API response format to frontend format
        const thresholdValue = data.low_minutes_threshold || 20;
        const topupValue = data.topup_amount || 100;
        const triggerHoursValue = data.auto_renewal_trigger_hours || 5;
        const hasPaymentMethod = Boolean(data.stripe_customer_id);
        const notificationEmail = data.notification_email || '';
        
        // Parse comma-separated emails into array
        const emails = notificationEmail 
          ? notificationEmail.split(',').map(e => e.trim()).filter(e => e !== '')
          : [];
        setNotificationEmails(emails);

        // Read auto_topup and auto_charge as SEPARATE settings
        const autoTopupEnabled = Boolean(data.auto_topup_enabled);
        const autoTopupThreshold = data.auto_topup_threshold || 10;
        let autoChargeEnabled = Boolean(data.auto_charge_enabled);
        let autoRenewalEnabled =
          data.auto_renewal_enabled !== undefined
            ? Boolean(data.auto_renewal_enabled)
            : true;
        let autoRetryEnabled =
          data.auto_retry_enabled !== undefined
            ? Boolean(data.auto_retry_enabled)
            : true;

        // Only auto-enable auto_renewal and auto_retry if not set
        const desiredAutoRenewal = true;
        const desiredAutoRetry = true;

        const needsUpdate = !autoRenewalEnabled || !autoRetryEnabled;

        if (needsUpdate) {
          try {
            const enableResponse = await fetch('/api/minutes/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                autoTopupEnabled: autoTopupEnabled,
                autoTopupThreshold: autoTopupThreshold,
                autoChargeEnabled: autoChargeEnabled,
                autoRenewalEnabled: desiredAutoRenewal,
                autoRetryEnabled: desiredAutoRetry,
                autoRenewalTriggerHours: triggerHoursValue,
                lowMinutesThreshold: thresholdValue,
                topupAmount: topupValue,
                notificationEmail
              })
            });

            if (!enableResponse.ok) {
              console.error(
                'Failed to set default billing settings',
                await enableResponse.text()
              );
            } else {
              autoRenewalEnabled = desiredAutoRenewal;
              autoRetryEnabled = desiredAutoRetry;
            }
          } catch (error) {
            console.error('Error enabling default billing settings:', error);
          }
        }

        setSettings({
          auto_topup_enabled: autoTopupEnabled,
          auto_topup_threshold: autoTopupThreshold,
          auto_charge_enabled: autoChargeEnabled,
          auto_renewal_enabled: autoRenewalEnabled,
          auto_retry_enabled: autoRetryEnabled,
          auto_renewal_trigger_hours: triggerHoursValue,
          low_minutes_threshold: thresholdValue,
          topup_amount: topupValue,
          notification_email: notificationEmail,
          has_payment_method: hasPaymentMethod
        });

        setInputStates({
          low_minutes_threshold: thresholdValue.toString(),
          topup_amount: topupValue.toString(),
          auto_renewal_trigger_hours: triggerHoursValue.toString(),
          auto_topup_threshold: autoTopupThreshold.toString()
        });
      }
    } catch (error) {
      console.error('Failed to fetch billing settings:', error);
      toast.error(t('settingsPage.messages.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserMinutes = async () => {
    try {
      const response = await fetch('/api/minutes/my-minutes');
      if (response.ok) {
        const data = await response.json();
        setUserMinutes(data);
      }
    } catch (error) {
      console.error('Failed to fetch user minutes:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert frontend format to API format
      const apiData = {
        autoTopupEnabled: settings.auto_topup_enabled,
        autoTopupThreshold: settings.auto_topup_threshold,
        autoChargeEnabled: settings.auto_charge_enabled,
        autoRenewalEnabled: settings.auto_renewal_enabled,
        autoRetryEnabled: settings.auto_retry_enabled,
        autoRenewalTriggerHours: settings.auto_renewal_trigger_hours,
        lowMinutesThreshold: settings.low_minutes_threshold,
        topupAmount: settings.topup_amount,
        notificationEmail: notificationEmails.join(',')
      };

      const response = await fetch('/api/minutes/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        toast.success(t('settingsPage.messages.saveSuccess'));
      } else {
        const error = await response.json();
        throw new Error(error.message || t('settingsPage.messages.saveError'));
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(t('settingsPage.messages.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof BillingSettings) => {
    setSettings((prev) => {
      const newValue = !prev[key];

      // Mutual exclusivity: Auto Top-Up and Auto-Charge cannot both be enabled
      if (key === 'auto_topup_enabled' && newValue === true) {
        return {
          ...prev,
          auto_topup_enabled: true,
          auto_charge_enabled: false  // Disable auto-charge
        };
      }
      if (key === 'auto_charge_enabled' && newValue === true) {
        return {
          ...prev,
          auto_charge_enabled: true,
          auto_topup_enabled: false  // Disable auto top-up
        };
      }

      return {
        ...prev,
        [key]: newValue
      };
    });
  };

  const handleInputChange = (
    key: keyof BillingSettings,
    value: string | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Combined: Minutes & Subscriptions - Collapsible */}
      <Card className='overflow-hidden border-2 py-0 shadow-lg'>
        <button
          onClick={() =>
            setIsMinutesSubscriptionsExpanded(!isMinutesSubscriptionsExpanded)
          }
          className='from-primary/5 via-primary/10 to-primary/5 hover:from-primary/10 hover:via-primary/15 hover:to-primary/10 w-full bg-gradient-to-r px-4 pt-4 pb-4 transition-colors sm:px-6 sm:pt-6 sm:pb-5'
        >
          <div className='flex items-center justify-between'>
            <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-4'>
              <div className='bg-primary/20 flex-shrink-0 rounded-xl p-2 shadow-sm sm:p-3'>
                <Clock className='text-primary h-5 w-5 sm:h-7 sm:w-7' />
              </div>
              <div className='min-w-0 flex-1'>
                <CardTitle className='truncate text-left text-lg font-bold sm:text-2xl'>
                  {t('settingsPage.minutesAndSubscriptions')}
                </CardTitle>
                <CardDescription className='mt-1 text-left text-sm sm:text-base'>
                  {t('settingsPage.minutesAndSubscriptionsDesc')}
                </CardDescription>
              </div>
            </div>
            <div className='bg-background ml-2 flex-shrink-0 rounded-full p-1.5 shadow-sm transition-transform duration-200 hover:scale-110 sm:p-2'>
              {isMinutesSubscriptionsExpanded ? (
                <ChevronUp className='text-foreground h-4 w-4 sm:h-5 sm:w-5' />
              ) : (
                <ChevronDown className='text-foreground h-4 w-4 sm:h-5 sm:w-5' />
              )}
            </div>
          </div>
        </button>
        {isMinutesSubscriptionsExpanded && (
          <CardContent className='space-y-6 p-4 sm:space-y-8 sm:p-6'>
            <div className='grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2'>
              {/* Total Real-time Minutes */}
              <div className='group border-primary/20 from-primary/5 via-primary/10 to-primary/5 hover:border-primary/40 relative overflow-hidden rounded-xl border-2 bg-gradient-to-br p-4 shadow-md transition-all hover:shadow-xl sm:p-6 md:p-8'>
                <div className='from-primary/0 via-primary/5 to-primary/10 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100' />
                <div className='relative'>
                  <div className='mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3'>
                    <div className='bg-primary/30 rounded-xl p-2 shadow-sm sm:p-2.5'>
                      <Clock className='text-primary h-4 w-4 sm:h-5 sm:w-5' />
                    </div>
                    <h4 className='text-sm font-bold sm:text-base'>
                      {t('settingsPage.realTimeMinutes')}
                    </h4>
                  </div>
                  <div className='flex justify-center'>
                    <TotalMinutesCircle
                      key={refreshKey}
                      refreshTrigger={refreshKey}
                      transparent={true}
                      onUsageStatsUpdate={setUsageStats}
                    />
                  </div>
                  
                  {/* Separator Line */}
                  {usageStats && (
                    <div className='mt-6 border-t border-border/50' />
                  )}
                  
                  {/* Usage Information */}
                  {usageStats && (
                    <div className='mt-6 space-y-4'>
                      {/* Usage Period */}
                      <div className='text-center space-y-1'>
                        <p className='text-xs text-muted-foreground'>
                          {t('settingsPage.usagePeriod.label')}
                        </p>
                        <p className='text-sm font-semibold text-foreground'>
                          {t('settingsPage.usagePeriod.value', {
                            minutes: usageStats.averageDailyUsage.toFixed(1)
                          })}
                        </p>
                      </div>

                      {/* Estimated Days Remaining */}
                      {usageStats.averageDailyUsage > 0 && usageStats.estimatedDaysRemaining > 0 && (
                        <div className='text-center space-y-1'>
                          <p className='text-xs text-muted-foreground'>
                            {t('settingsPage.estimatedDaysRemaining.label')}
                          </p>
                          <p className='text-sm font-semibold text-emerald-600 dark:text-emerald-400'>
                            {t('settingsPage.estimatedDaysRemaining.value', {
                              days: usageStats.estimatedDaysRemaining
                            })}
                          </p>
                        </div>
                      )}

                      {/* Next Renewal Date */}
                      {usageStats.nextRenewalDate && (
                        <div className='text-center space-y-1'>
                          <p className='text-xs text-muted-foreground'>
                            {t('settingsPage.nextRenewalDate.label')}
                          </p>
                          <p className='text-sm font-semibold text-blue-600 dark:text-blue-400'>
                            {new Date(usageStats.nextRenewalDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}

                      {/* Purchase Additional Minutes Button */}
                      <div className='pt-2'>
                        <Link href='/dashboard/billing' className='block'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-full text-xs h-8 border-primary/20 hover:border-primary/40 hover:bg-primary/5'
                          >
                            <ShoppingCart className='h-3 w-3 mr-2' />
                            {t('settingsPage.purchaseAdditionalMinutes')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Subscriptions & Bundles - Combined Card */}
              <Card className='border-2 border-emerald-200/50 shadow-lg transition-all hover:border-emerald-300/50 hover:shadow-xl dark:border-emerald-900/50 dark:hover:border-emerald-800/50 bg-gradient-to-br from-emerald-50/30 via-emerald-100/20 to-emerald-50/30 dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-emerald-950/20'>
                <CardHeader className='px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4'>
                  <div className='flex items-center gap-2 sm:gap-3'>
                    <div className='flex-shrink-0 rounded-xl bg-emerald-500/20 p-2 shadow-sm sm:p-2.5'>
                      <Package className='h-4 w-4 text-emerald-600 sm:h-5 sm:w-5 dark:text-emerald-500' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <CardTitle className='text-base font-bold sm:text-lg'>
                        {t('settingsPage.activeBundles')}
                      </CardTitle>
                      <CardDescription className='mt-1 text-xs sm:text-sm'>
                        {t('settingsPage.activeBundlesDesc')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-4 sm:p-6'>
                  {/* Active Bundles Section */}
                  {userMinutes ? (
                    <div className='space-y-5'>
                      {/* Total Minutes Summary */}
                      <div className='relative overflow-hidden rounded-xl border-2 border-emerald-300/50 bg-gradient-to-br from-emerald-50 via-emerald-100/80 to-emerald-50 p-4 shadow-md sm:p-6 dark:border-emerald-800/50 dark:from-emerald-950/40 dark:via-emerald-900/30 dark:to-emerald-950/40'>
                        <div className='absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-800/20' />
                        <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                          <div className='flex-1'>
                            <div className='mb-2 text-3xl font-extrabold text-emerald-700 sm:text-4xl md:text-5xl dark:text-emerald-400'>
                              {userMinutes.totalMinutes}
                            </div>
                            <div className='mb-1 text-sm font-semibold text-emerald-600 sm:text-base dark:text-emerald-500'>
                              {t('settingsPage.totalMinutes', {
                                count: userMinutes.totalMinutes
                              })}
                            </div>
                            <div className='text-muted-foreground flex items-center gap-2 text-xs sm:text-sm'>
                              <Package className='h-3 w-3 sm:h-4 sm:w-4' />
                              {t('settingsPage.totalAvailable', {
                                count: userMinutes.bundles.length
                              })}
                            </div>
                          </div>
                          <div className='text-left sm:text-right'>
                            <div className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>
                              {t('settingsPage.estimated')}
                            </div>
                            <div className='text-lg font-bold text-emerald-700 sm:text-xl dark:text-emerald-400'>
                              {t('settingsPage.estimatedTime', {
                                hours: Math.floor(
                                  userMinutes.totalMinutes / 60
                                ),
                                minutes: userMinutes.totalMinutes % 60
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {userMinutes.bundles.length === 0 && (
                        <div className='border-muted-foreground/30 bg-muted/20 rounded-xl border-2 border-dashed p-12 text-center'>
                          <div className='bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                            <Package className='text-muted-foreground h-8 w-8 opacity-50' />
                          </div>
                          <p className='text-muted-foreground text-base font-semibold'>
                            {t('settingsPage.noActiveBundles')}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='flex items-center justify-center py-12'>
                      <Loader2 className='text-primary h-8 w-8 animate-spin' />
                    </div>
                  )}

                  {/* Separator between bundles and subscriptions */}
                  <Separator className='my-6' />

                  {/* Active Subscriptions Section - Embedded */}
                  <ActiveSubscriptionsContent
                    key={refreshKey}
                    refreshTrigger={refreshKey}
                  />
                </CardContent>
              </Card>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bundle Details - Collapsible */}
      {userMinutes && userMinutes.bundles.length > 0 && (
        <div className='rounded-xl border-2 border-purple-200/50 shadow-md transition-all hover:border-purple-300/50 hover:shadow-lg dark:border-purple-900/50 dark:hover:border-purple-800/50 overflow-hidden'>
          <button
            onClick={() => setIsBundleDetailsExpanded(!isBundleDetailsExpanded)}
            className='flex w-full items-center justify-between rounded-t-xl bg-gradient-to-r from-purple-50/50 to-purple-100/30 p-3 transition-colors hover:from-purple-50/70 hover:to-purple-100/50 sm:p-4 md:p-5 dark:from-purple-950/20 dark:to-purple-900/10 dark:hover:from-purple-950/30 dark:hover:to-purple-900/20'
          >
            <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
              <div className='flex-shrink-0 rounded-xl bg-purple-500/20 p-2 shadow-sm sm:p-2.5'>
                <Package className='h-4 w-4 text-purple-600 sm:h-5 sm:w-5 dark:text-purple-500' />
              </div>
              <span className='truncate text-sm font-bold sm:text-base'>
                {t('settingsPage.bundleDetails')}
              </span>
            </div>
            <div className='bg-background ml-2 flex-shrink-0 rounded-full p-1.5 shadow-sm transition-transform duration-200 hover:scale-110 sm:p-2'>
              {isBundleDetailsExpanded ? (
                <ChevronUp className='text-foreground h-4 w-4 sm:h-5 sm:w-5' />
              ) : (
                <ChevronDown className='text-foreground h-4 w-4 sm:h-5 sm:w-5' />
              )}
            </div>
          </button>
          {isBundleDetailsExpanded && (
            <div className='bg-background border-t border-purple-200/50 p-4 sm:p-6 dark:border-purple-900/50 rounded-b-xl'>
              {/* Pagination info */}
              <div className='text-muted-foreground mb-4 flex items-center justify-between text-sm'>
                <span>
                  {t('settingsPage.bundlePagination.showing')}{' '}
                  {Math.min(
                    (bundleCurrentPage - 1) * bundleItemsPerPage + 1,
                    userMinutes.bundles.length
                  )}
                  -
                  {Math.min(
                    bundleCurrentPage * bundleItemsPerPage,
                    userMinutes.bundles.length
                  )}{' '}
                  {t('settingsPage.bundlePagination.of')} {userMinutes.bundles.length}{' '}
                  {t('settingsPage.bundlePagination.bundles')}
                </span>
              </div>

              <div className='grid max-h-[500px] grid-cols-1 gap-3 overflow-y-auto sm:gap-4 md:grid-cols-2'>
                {userMinutes.bundles
                  .slice(
                    (bundleCurrentPage - 1) * bundleItemsPerPage,
                    bundleCurrentPage * bundleItemsPerPage
                  )
                  .map((bundle) => {
                    const expiryDate = new Date(bundle.expires_at);
                    const isExpiringSoon =
                      expiryDate.getTime() - Date.now() <
                      7 * 24 * 60 * 60 * 1000; // 7 days
                    const isExpired = expiryDate.getTime() < Date.now();

                    return (
                      <div
                        key={bundle.id}
                        className={cn(
                          'group relative overflow-hidden rounded-xl border-2 p-3 transition-all hover:shadow-lg sm:p-4 md:p-5',
                          isExpired
                            ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100/50 dark:border-red-900 dark:from-red-950/30 dark:to-red-900/20'
                            : isExpiringSoon
                              ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:border-orange-900 dark:from-orange-950/30 dark:to-orange-900/20'
                              : 'border-border from-background to-muted/20 bg-gradient-to-br'
                        )}
                      >
                        <div className='relative flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start'>
                          <div className='min-w-0 flex-1'>
                            <div className='mb-2 flex items-center gap-2'>
                              <div
                                className={cn(
                                  'flex-shrink-0 rounded-lg p-1 sm:p-1.5',
                                  isExpired
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : isExpiringSoon
                                      ? 'bg-orange-100 dark:bg-orange-900/30'
                                      : 'bg-primary/10'
                                )}
                              >
                                <Package
                                  className={cn(
                                    'h-4 w-4',
                                    isExpired
                                      ? 'text-red-600 dark:text-red-400'
                                      : isExpiringSoon
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : 'text-primary'
                                  )}
                                />
                              </div>
                              <div className='truncate font-bold'>
                                {t('settingsPage.currentBundle.minutesLabel', {
                                  count: bundle.minutes_purchased
                                })}
                              </div>
                            </div>
                            <div className='text-muted-foreground ml-6 text-xs sm:ml-8 sm:text-sm'>
                              {t('settingsPage.remainingOf', {
                                remaining: bundle.minutes_remaining,
                                total: bundle.minutes_purchased
                              })}
                            </div>
                          </div>
                          <div className='w-full text-left sm:w-auto sm:text-right'>
                            <div
                              className={cn(
                                'mb-1.5 flex items-center gap-1.5 text-xs font-semibold sm:justify-end sm:text-sm',
                                isExpired
                                  ? 'text-red-600 dark:text-red-400'
                                  : isExpiringSoon
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-muted-foreground'
                              )}
                            >
                              <Clock className='h-4 w-4' />
                              {isExpired
                                ? t('settingsPage.expired')
                                : t('settingsPage.expires', {
                                  date: `${expiryDate.getDate()} ${expiryDate.toLocaleDateString('en-GB', { month: 'short' })} ${expiryDate.getFullYear()} · ${expiryDate.getHours().toString().padStart(2, '0')}:${expiryDate.getMinutes().toString().padStart(2, '0')}`
                                })}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              {bundle.validity_days === 0
                                ? t('settingsPage.neverExpires')
                                : t('settingsPage.daysValidity', {
                                  days: bundle.validity_days
                                })}
                            </div>
                          </div>
                        </div>

                        {/* Manage Button - Only for non-topup active bundles */}
                        {!bundle.is_topup && !isExpired && (
                          <div className='border-border/30 mt-3 border-t pt-3'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setManagingBundle(bundle)}
                              className='flex w-full items-center justify-center gap-2'
                            >
                              <Settings className='h-4 w-4' />
                              {t('settingsPage.currentBundle.manageBundle')}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Pagination Controls */}
              {userMinutes.bundles.length > bundleItemsPerPage && (
                <div className='mt-6 flex items-center justify-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setBundleCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={bundleCurrentPage === 1}
                  >
                    <ChevronDown className='h-4 w-4 rotate-90' />
                    Previous
                  </Button>

                  <div className='flex items-center gap-1'>
                    {Array.from(
                      {
                        length: Math.ceil(
                          userMinutes.bundles.length / bundleItemsPerPage
                        )
                      },
                      (_, i) => i + 1
                    )
                      .filter((page) => {
                        const totalPages = Math.ceil(
                          userMinutes.bundles.length / bundleItemsPerPage
                        );
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - bundleCurrentPage) <= 1
                        );
                      })
                      .map((page, index, array) => (
                        <span key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className='text-muted-foreground px-2'>
                              ...
                            </span>
                          )}
                          <Button
                            variant={
                              bundleCurrentPage === page ? 'default' : 'outline'
                            }
                            size='sm'
                            onClick={() => setBundleCurrentPage(page)}
                            className='h-8 w-8 p-0'
                          >
                            {page}
                          </Button>
                        </span>
                      ))}
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setBundleCurrentPage((prev) =>
                        Math.min(
                          Math.ceil(
                            userMinutes.bundles.length / bundleItemsPerPage
                          ),
                          prev + 1
                        )
                      )
                    }
                    disabled={
                      bundleCurrentPage >=
                      Math.ceil(userMinutes.bundles.length / bundleItemsPerPage)
                    }
                  >
                    Next
                    <ChevronDown className='h-4 w-4 -rotate-90' />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Billing Logs - Collapsible */}
      <div className='rounded-xl border-2 border-amber-200/50 shadow-md transition-all hover:border-amber-300/50 hover:shadow-lg dark:border-amber-900/50 dark:hover:border-amber-800/50 overflow-hidden'>
        <button
          onClick={() => setIsBillingLogsExpanded(!isBillingLogsExpanded)}
          className='flex w-full items-center justify-between rounded-t-xl bg-gradient-to-r from-amber-50/50 to-amber-100/30 p-3 transition-colors hover:from-amber-50/70 hover:to-amber-100/50 sm:p-4 md:p-5 dark:from-amber-950/20 dark:to-amber-900/10 dark:hover:from-amber-950/30 dark:hover:to-amber-900/20'
        >
          <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
            <div className='flex-shrink-0 rounded-xl bg-amber-500/20 p-2 shadow-sm sm:p-2.5'>
              <Clock className='h-4 w-4 text-amber-600 sm:h-5 sm:w-5 dark:text-amber-500' />
            </div>
            <span className='truncate text-sm font-bold sm:text-base'>
              {t('settingsPage.billingLogs')}
            </span>
          </div>
          <div className='bg-background ml-2 flex-shrink-0 rounded-full p-1.5 shadow-sm transition-transform duration-200 hover:scale-110 sm:p-2'>
            {isBillingLogsExpanded ? (
              <ChevronUp className='text-foreground h-4 w-4 sm:h-5 sm:w-5' />
            ) : (
              <ChevronDown className='text-foreground h-4 w-4 sm:h-5 sm:w-5' />
            )}
          </div>
        </button>
        {isBillingLogsExpanded && (
          <div className='bg-background border-t border-amber-200/50 p-4 sm:p-6 dark:border-amber-900/50 rounded-b-xl'>
            <BillingLogs />
          </div>
        )}
      </div>

      <Separator />

      {/* Expandable Settings Card - Contains all 4 settings */}
      <Card className='overflow-hidden transition-all !py-0'>
        <button
          onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
          className='hover:bg-muted/50 w-full transition-colors rounded-t-xl block p-4 sm:p-5'
        >
            <div className='flex items-center justify-between gap-3'>
              <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-3'>
                <div className='bg-primary/10 flex-shrink-0 rounded-lg p-1.5 sm:p-2'>
                  <Settings className='text-primary h-4 w-4 sm:h-5 sm:w-5' />
                </div>
                <div className='min-w-0 flex-1 text-left'>
                  <h3 className='text-sm font-semibold sm:text-base'>
                    {t('settingsSection.title')}
                  </h3>
                  <p className='text-muted-foreground text-xs sm:text-sm'>
                    {t('settingsSection.description')}
                  </p>
                </div>
              </div>
              <div className='bg-muted flex-shrink-0 rounded-full p-1.5 transition-transform duration-200'>
                {isSettingsExpanded ? (
                  <ChevronUp className='text-foreground h-4 w-4 sm:h-5 sm:w-5' />
                ) : (
                  <ChevronDown className='text-foreground h-4 w-4 sm:h-5 sm:w-5' />
                )}
              </div>
            </div>
        </button>
        {isSettingsExpanded && (
          <CardContent className='px-4 pt-0 pb-4 sm:px-5 sm:pb-5'>
            <div className='grid grid-cols-1 gap-3 border-t pt-4 sm:gap-4 md:grid-cols-2'>
              {/* Auto-Charge */}
              <Card className='border-2 transition-all hover:shadow-sm'>
                <CardContent className='p-4 sm:p-5'>
                  <div className='mb-3 flex items-start justify-between gap-3 sm:mb-4'>
                    <div className='flex min-w-0 flex-1 items-start gap-2 sm:gap-3'>
                      <div className='mt-0.5 flex-shrink-0 rounded-lg bg-green-500/10 p-1.5 sm:p-2'>
                        <CreditCard className='h-4 w-4 text-green-600 sm:h-5 sm:w-5 dark:text-green-500' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='mb-1 flex items-center gap-2'>
                          <Label
                            htmlFor='auto-charge'
                            className='cursor-pointer text-xs font-semibold sm:text-sm'
                          >
                            {t('settingsPage.autoCharge.title')}
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type='button' className='text-muted-foreground hover:text-foreground transition-colors'>
                                  <HelpCircle className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side='bottom' className='max-w-xs'>
                                <p>{t('settingsPage.autoCharge.description')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className='text-muted-foreground text-xs sm:text-sm'>
                          {t('settingsPage.autoCharge.description')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id='auto-charge'
                      checked={settings.auto_charge_enabled}
                      disabled={!settings.has_payment_method}
                      onCheckedChange={() =>
                        handleToggle('auto_charge_enabled')
                      }
                      className='ml-2 flex-shrink-0 sm:ml-4'
                    />
                  </div>
                        {!settings.has_payment_method && (
                          <div className='mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/30'>
                            <p className='flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400'>
                              <AlertCircle className='h-4 w-4' />
                              {t('settingsPage.autoCharge.makePurchaseFirst')}
                            </p>
                          </div>
                        )}
                        {settings.auto_charge_enabled && (
                          <div className='grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2 sm:gap-4 sm:pt-4'>
                            <div className='space-y-2'>
                              <Label
                                htmlFor='threshold'
                                className='text-xs font-medium sm:text-sm'
                              >
                                {t('settingsPage.autoCharge.threshold')}
                              </Label>
                              <Input
                                id='threshold'
                                type='number'
                                value={inputStates.low_minutes_threshold}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setInputStates((prev) => ({
                                    ...prev,
                                    low_minutes_threshold: value
                                  }));
                                  const numValue = parseInt(value);
                                  if (
                                    !isNaN(numValue) &&
                                    numValue >= 1 &&
                                    numValue <= 1000
                                  ) {
                                    handleInputChange(
                                      'low_minutes_threshold',
                                      numValue
                                    );
                                  }
                                }}
                                min='1'
                                max='1000'
                                className='h-9 sm:h-10'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label
                                htmlFor='topup-amount'
                                className='text-xs font-medium sm:text-sm'
                              >
                                {t('settingsPage.autoCharge.topup')}
                              </Label>
                              <Input
                                id='topup-amount'
                                type='number'
                                value={inputStates.topup_amount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setInputStates((prev) => ({
                                    ...prev,
                                    topup_amount: value
                                  }));
                                  const numValue = parseInt(value);
                                  if (
                                    !isNaN(numValue) &&
                                    numValue >= 1 &&
                                    numValue <= 1000
                                  ) {
                                    handleInputChange('topup_amount', numValue);
                                  }
                                }}
                                min='50'
                                max='1000'
                                className='h-9 sm:h-10'
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

              {/* Auto Top-Up */}
              <Card className='border-2 transition-all hover:shadow-sm'>
                <CardContent className='p-4 sm:p-5'>
                  <div className='flex items-start justify-between mb-3 sm:mb-4 gap-3'>
                    <div className='flex items-start gap-2 sm:gap-3 flex-1 min-w-0'>
                      <div className='rounded-lg bg-amber-500/10 p-1.5 sm:p-2 mt-0.5 flex-shrink-0'>
                        <Zap className='h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-500' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Label htmlFor='auto-topup' className='text-xs sm:text-sm font-semibold cursor-pointer'>
                            {t('settingsPage.autoTopup.title')}
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type='button' className='text-muted-foreground hover:text-foreground transition-colors'>
                                  <HelpCircle className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side='bottom' className='max-w-xs'>
                                <p>{t('settingsPage.autoTopup.description')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className='text-xs sm:text-sm text-muted-foreground'>
                          {t('settingsPage.autoTopup.description')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id='auto-topup'
                      checked={settings.auto_topup_enabled && !settings.auto_charge_enabled}
                      disabled={!settings.has_payment_method || settings.auto_charge_enabled}
                      onCheckedChange={() => handleToggle('auto_topup_enabled')}
                      className='ml-2 sm:ml-4 flex-shrink-0'
                    />
                  </div>
                        {settings.auto_charge_enabled && (
                          <div className='rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 p-3 mb-4'>
                            <p className='text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2'>
                              <AlertCircle className='h-4 w-4' />
                              {t('settingsPage.autoTopup.disabledByAutoCharge')}
                            </p>
                          </div>
                        )}
                        {!settings.has_payment_method && !settings.auto_charge_enabled && (
                          <div className='rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 p-3 mb-4'>
                            <p className='text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2'>
                              <AlertCircle className='h-4 w-4' />
                              {t('settingsPage.autoCharge.makePurchaseFirst')}
                            </p>
                          </div>
                        )}
                        {settings.auto_topup_enabled && (
                          <div className='pt-3 sm:pt-4 border-t'>
                            <div className='space-y-2'>
                              <Label htmlFor='auto-topup-threshold' className='text-xs sm:text-sm font-medium'>
                                {t('settingsPage.autoTopup.threshold')}
                              </Label>
                              <div className='flex items-center gap-2'>
                                <Input
                                  id='auto-topup-threshold'
                                  type='number'
                                  value={inputStates.auto_topup_threshold}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setInputStates((prev) => ({
                                      ...prev,
                                      auto_topup_threshold: value
                                    }));
                                    const numValue = parseInt(value);
                                    if (
                                      !isNaN(numValue) &&
                                      numValue >= 1 &&
                                      numValue <= 500
                                    ) {
                                      handleInputChange('auto_topup_threshold', numValue);
                                    }
                                  }}
                                  min='1'
                                  max='500'
                                  className='h-9 sm:h-10 w-24'
                                />
                                <span className='text-xs sm:text-sm text-muted-foreground'>
                                  {t('settingsPage.autoTopup.minutes')}
                                </span>
                              </div>
                              <p className='text-xs text-muted-foreground mt-2'>
                                {t('settingsPage.autoTopup.note')}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

              {/* Auto-Renewal */}
              <Card className='border-2 transition-all hover:shadow-sm'>
                <CardContent className='p-4 sm:p-5'>
                  <div className='mb-3 flex items-start justify-between gap-3 sm:mb-4'>
                    <div className='flex min-w-0 flex-1 items-start gap-2 sm:gap-3'>
                      <div className='mt-0.5 flex-shrink-0 rounded-lg bg-blue-500/10 p-1.5 sm:p-2'>
                        <Settings className='h-4 w-4 text-blue-600 sm:h-5 sm:w-5 dark:text-blue-500' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='mb-1 flex items-center gap-2'>
                          <Label
                            htmlFor='auto-renewal'
                            className='cursor-pointer text-xs font-semibold sm:text-sm'
                          >
                            {t('settingsPage.autoRenewal.title')}
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type='button' className='text-muted-foreground hover:text-foreground transition-colors'>
                                  <HelpCircle className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side='bottom' className='max-w-xs'>
                                <p>{t('settingsPage.autoRenewal.description')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className='text-muted-foreground text-xs sm:text-sm'>
                          {t('settingsPage.autoRenewal.description')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id='auto-renewal'
                      checked={settings.auto_renewal_enabled}
                      onCheckedChange={() =>
                        handleToggle('auto_renewal_enabled')
                      }
                      className='ml-2 flex-shrink-0 sm:ml-4'
                    />
                  </div>
                        {settings.auto_renewal_enabled && (
                          <div className='flex flex-col items-start gap-2 border-t pt-3 sm:flex-row sm:items-center sm:gap-3 sm:pt-4'>
                            <div className='flex w-full items-center gap-2 sm:w-auto'>
                              <Input
                                id='trigger-hours'
                                type='number'
                                min='1'
                                max='24'
                                value={settings.auto_renewal_trigger_hours}
                                onChange={(e) =>
                                  handleInputChange(
                                    'auto_renewal_trigger_hours',
                                    parseInt(e.target.value) || 5
                                  )
                                }
                                className='h-9 w-20 sm:h-10'
                              />
                              <span className='text-muted-foreground text-xs whitespace-nowrap sm:text-sm'>
                                {t('settingsPage.autoRenewal.hrsBefore')}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

              {/* Auto-Retry */}
              <Card className='border-2 transition-all hover:shadow-sm'>
                <CardContent className='p-4 sm:p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex min-w-0 flex-1 items-start gap-2 sm:gap-3'>
                      <div className='mt-0.5 flex-shrink-0 rounded-lg bg-purple-500/10 p-1.5 sm:p-2'>
                        <RefreshCw className='h-4 w-4 text-purple-600 sm:h-5 sm:w-5 dark:text-purple-500' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='mb-1 flex items-center gap-2'>
                          <Label
                            htmlFor='auto-retry'
                            className='cursor-pointer text-xs font-semibold sm:text-sm'
                          >
                            {t('settingsPage.autoRetry.title')}
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type='button' className='text-muted-foreground hover:text-foreground transition-colors'>
                                  <HelpCircle className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side='bottom' className='max-w-xs'>
                                <p>{t('settingsPage.autoRetry.info')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className='text-muted-foreground text-xs sm:text-sm'>
                          {t('settingsPage.autoRetry.description')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id='auto-retry'
                      checked={settings.auto_retry_enabled}
                      onCheckedChange={() => handleToggle('auto_retry_enabled')}
                      className='ml-2 flex-shrink-0 sm:ml-4'
                    />
                  </div>
                </CardContent>
              </Card>


              {/* Notifications */}
              <Card id="notifications-card" className='hover:border-primary/20 border-2 transition-all hover:shadow-sm scroll-mt-24'>
                <CardContent className='p-4 sm:p-5'>
                  <div className='mb-3 flex items-start gap-2 sm:mb-4 sm:gap-3'>
                    <div className='mt-0.5 flex-shrink-0 rounded-lg bg-amber-500/10 p-1.5 sm:p-2'>
                      <Bell className='h-4 w-4 text-amber-600 sm:h-5 sm:w-5 dark:text-amber-500' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='mb-1 flex items-center gap-2'>
                        <Label className='text-xs font-semibold sm:text-sm'>
                          {t('settingsPage.notifications.title')}
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type='button' className='text-muted-foreground hover:text-foreground transition-colors'>
                                <HelpCircle className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side='bottom' className='max-w-xs'>
                              <p>{t('settingsPage.notifications.description')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className='text-muted-foreground text-xs sm:text-sm'>
                        {t('settingsPage.notifications.description')}
                      </p>
                    </div>
                  </div>
                        <div className='space-y-3'>
                          {notificationEmails.map((email, index) => (
                            <div key={index} className='flex items-center gap-2'>
                              <Input
                                type='email'
                                value={editingEmails[index] !== undefined ? editingEmails[index] : email}
                                onChange={(e) => {
                                  setEditingEmails(prev => ({
                                    ...prev,
                                    [index]: e.target.value
                                  }));
                                }}
                                placeholder='your-email@example.com'
                                className='h-9 sm:h-10 flex-1'
                              />
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={async () => {
                                  const updatedEmail = editingEmails[index] !== undefined 
                                    ? editingEmails[index] 
                                    : email;
                                  
                                  if (!updatedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedEmail)) {
                                    toast.error(t('settingsPage.notifications.invalidEmail'));
                                    return;
                                  }
                                  
                                  const updatedEmails = [...notificationEmails];
                                  updatedEmails[index] = updatedEmail;
                                  
                                  try {
                                    const response = await fetch('/api/minutes/settings', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        ...settings,
                                        notificationEmail: updatedEmails.join(',')
                                      })
                                    });
                                    
                                    if (response.ok) {
                                      setNotificationEmails(updatedEmails);
                                      setEditingEmails(prev => {
                                        const newState = { ...prev };
                                        delete newState[index];
                                        return newState;
                                      });
                                      toast.success(t('settingsPage.notifications.saveEmail') + ' ' + t('settingsPage.messages.saveSuccess'));
                                    } else {
                                      throw new Error('Failed to save');
                                    }
                                  } catch (error) {
                                    toast.error(t('settingsPage.messages.saveError'));
                                  }
                                }}
                                className='h-9 sm:h-10'
                              >
                                {t('settingsPage.notifications.saveEmail')}
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={async () => {
                                  const updatedEmails = notificationEmails.filter((_, i) => i !== index);
                                  
                                  try {
                                    const response = await fetch('/api/minutes/settings', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        ...settings,
                                        notificationEmail: updatedEmails.join(',')
                                      })
                                    });
                                    
                                    if (response.ok) {
                                      setNotificationEmails(updatedEmails);
                                      setEditingEmails(prev => {
                                        const newState = { ...prev };
                                        delete newState[index];
                                        return newState;
                                      });
                                      toast.success(t('settingsPage.messages.saveSuccess'));
                                    } else {
                                      throw new Error('Failed to remove');
                                    }
                                  } catch (error) {
                                    toast.error(t('settingsPage.messages.saveError'));
                                  }
                                }}
                                className='h-9 sm:h-10 text-destructive hover:text-destructive'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          ))}
                          {notificationEmails.length < 3 && (
                            <Button
                              type='button'
                              variant='outline'
                              onClick={() => {
                                setNotificationEmails([...notificationEmails, '']);
                                setEditingEmails(prev => ({
                                  ...prev,
                                  [notificationEmails.length]: ''
                                }));
                              }}
                              className='w-full h-9 sm:h-10'
                            >
                              + {t('settingsPage.notifications.addEmail')}
                            </Button>
                          )}
                          {notificationEmails.length === 0 && (
                            <Button
                              type='button'
                              variant='outline'
                              onClick={() => {
                                setNotificationEmails(['']);
                                setEditingEmails({ 0: '' });
                              }}
                              className='w-full h-9 sm:h-10'
                            >
                              + {t('settingsPage.notifications.addEmail')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className='flex justify-end pt-3 sm:pt-4'>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size='lg'
          className='w-full min-w-[120px] sm:w-auto'
        >
          {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {t('settingsPage.saveSettings')}
        </Button>
      </div>

      {/* Manage Bundle Dialog */}
      {managingBundle && (
        <ManageBundleDialog
          isOpen={!!managingBundle}
          onClose={() => setManagingBundle(null)}
          currentBundle={managingBundle}
          onBundleUpdated={() => {
            fetchUserMinutes();
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
