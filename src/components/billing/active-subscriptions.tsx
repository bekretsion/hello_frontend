'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Settings, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Define the add-on services (should match the ones in billing page)
const addOnServices = [
  {
    id: 'call-whispering',
    nameKey: 'callWhispering',
    descriptionKey: 'callWhisperingDesc',
    monthlyPrice: 50,
    setupFee: 0
  },
  {
    id: 'voicemail-handling',
    nameKey: 'voicemailHandling',
    descriptionKey: 'voicemailHandlingDesc',
    monthlyPrice: 30,
    setupFee: 0
  },
  {
    id: 'multilingual-support',
    nameKey: 'multilingualSupport',
    descriptionKey: 'multilingualSupportDesc',
    monthlyPrice: 80,
    setupFee: 0
  },
  {
    id: 'weekly-reports',
    nameKey: 'weeklyReports',
    descriptionKey: 'weeklyReportsDesc',
    monthlyPrice: 40,
    setupFee: 0
  },
  {
    id: 'real-time-dashboard',
    nameKey: 'realTimeDashboard',
    descriptionKey: 'realTimeDashboardDesc',
    monthlyPrice: 100,
    setupFee: 0
  },
  {
    id: 'calendar-integration',
    nameKey: 'calendarIntegration',
    descriptionKey: 'calendarIntegrationDesc',
    monthlyPrice: 30,
    setupFee: 50
  },
  {
    id: 'crm-integration',
    nameKey: 'crmIntegration',
    descriptionKey: 'crmIntegrationDesc',
    monthlyPrice: 50,
    setupFee: 100
  },
  {
    id: 'menu-management',
    nameKey: 'menuManagement',
    descriptionKey: 'menuManagementDesc',
    monthlyPrice: 40,
    setupFee: 0
  },
  {
    id: 'custom-voice',
    nameKey: 'customVoice',
    descriptionKey: 'customVoiceDesc',
    monthlyPrice: 0,
    setupFee: 150
  },
  {
    id: 'branded-scripts',
    nameKey: 'brandedScripts',
    descriptionKey: 'brandedScriptsDesc',
    monthlyPrice: 0,
    setupFee: 100
  },
  {
    id: 'greeting-customization',
    nameKey: 'greetingCustomization',
    descriptionKey: 'greetingCustomizationDesc',
    monthlyPrice: 0,
    setupFee: 20
  }
];

interface Subscription {
  planId: string | null;
  addonIds: string[];
  status: string;
  isActive: boolean;
}

interface ActiveSubscriptionsProps {
  refreshTrigger?: number;
}

export default function ActiveSubscriptions({
  refreshTrigger = 0
}: ActiveSubscriptionsProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations('billing');
  const tSub = useTranslations('billing.subscriptions');
  const router = useRouter();

  useEffect(() => {
    fetchSubscription();
  }, [refreshTrigger]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || tSub('errors.fetchFailed'));
      }

      setSubscription(data.subscription);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      toast.error(tSub('errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Settings className='h-5 w-5' />
            <span>{tSub('title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-8'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span className='ml-2'>{tSub('loading')}</span>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !subscription.isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Settings className='h-5 w-5' />
            <span>{tSub('title')}</span>
          </CardTitle>
          <CardDescription>
            {tSub('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='py-8 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800'>
              <AlertCircle className='h-8 w-8 text-slate-400' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>
              {tSub('noActive.title')}
            </h3>
            <p className='text-muted-foreground mb-4'>
              {tSub('noActive.message')}
            </p>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/billing')}
            >
              {tSub('noActive.button')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeAddons = subscription.addonIds
    .map((addonId) => addOnServices.find((addon) => addon.id === addonId))
    .filter(Boolean);

  const totalMonthlyCost = activeAddons.reduce((total, addon) => {
    return total + (addon?.monthlyPrice || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <CheckCircle2 className='h-5 w-5 text-green-600' />
          <span>{tSub('title')}</span>
        </CardTitle>
        <CardDescription>
          {tSub('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Subscription Status */}
        <div className='flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
          <div className='flex items-center space-x-3'>
            <div className='h-3 w-3 animate-pulse rounded-full bg-green-500'></div>
            <div>
              <div className='font-semibold text-green-800 dark:text-green-200'>
                {tSub('status.active')}
              </div>
              <div className='text-sm text-green-600 dark:text-green-400'>
                {activeAddons.length !== 1
                  ? tSub('status.summaryPlural', {
                    count: activeAddons.length
                  })
                  : tSub('status.summary', {
                    count: activeAddons.length
                  })}
              </div>
            </div>
          </div>
          <Badge
            variant='secondary'
            className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          >
            {subscription.status}
          </Badge>
        </div>

        {/* Active Add-ons */}
        {activeAddons.length > 0 && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-semibold'>{tSub('addons.title')}</h4>
              <div className='text-muted-foreground text-sm'>
                {tSub('addons.monthly', { cost: totalMonthlyCost })}
              </div>
            </div>

            <div className='space-y-3'>
              {activeAddons.map((addon) => {
                if (!addon) return null;

                return (
                  <div
                    key={addon.id}
                    className='bg-card flex items-center justify-between rounded-lg border p-3'
                  >
                    <div className='flex-1'>
                      <div className='font-medium'>
                        {t(`services.${addon.nameKey}`)}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        {t(`services.${addon.descriptionKey}`)}
                      </div>
                    </div>
                    <div className='ml-4 text-right'>
                      {addon.monthlyPrice > 0 && (
                        <div className='font-semibold'>
                          ${addon.monthlyPrice}
                          {tSub('addons.mo')}
                        </div>
                      )}
                      <Badge variant='outline' className='text-xs'>
                        {tSub('addons.active')}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Summary */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>
              {tSub('summary.totalCost')}
            </span>
            <span className='text-lg font-bold'>
              ${totalMonthlyCost.toFixed(2)}
            </span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>
              {tSub('summary.nextBilling')}
            </span>
            <span>{tSub('summary.automatic')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex space-x-3 pt-2'>
          <Button variant='outline' size='sm' className='flex-1'>
            {tSub('actions.manage')}
          </Button>
          <Button variant='outline' size='sm' className='flex-1'>
            {tSub('actions.addMore')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Content-only version without Card wrapper (for embedding in other cards)
export function ActiveSubscriptionsContent({
  refreshTrigger = 0
}: ActiveSubscriptionsProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations('billing');
  const tSub = useTranslations('billing.subscriptions');
  const router = useRouter();

  useEffect(() => {
    fetchSubscription();
  }, [refreshTrigger]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || tSub('errors.fetchFailed'));
      }

      setSubscription(data.subscription);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      toast.error(tSub('errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
        <span className='ml-2'>{tSub('loading')}</span>
      </div>
    );
  }

  if (!subscription || !subscription.isActive) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <CheckCircle2 className='h-5 w-5 text-green-600' />
          <span className='font-semibold'>{tSub('title')}</span>
        </div>
        <div className='flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
          <div className='flex items-center space-x-3'>
            <div className='h-3 w-3 animate-pulse rounded-full bg-green-500'></div>
            <div>
              <div className='font-semibold text-green-800 dark:text-green-200'>
                {tSub('status.active')}
              </div>
              <div className='text-sm text-green-600 dark:text-green-400'>
                0 {tSub('addons.title').toLowerCase()}
              </div>
            </div>
          </div>
          <Badge
            variant='secondary'
            className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          >
            active
          </Badge>
        </div>
        <Separator />
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>
              {tSub('summary.totalCost')}
            </span>
            <span className='text-lg font-bold'>
              $0.00
            </span>
          </div>
        </div>
      </div>
    );
  }

  const activeAddons = subscription.addonIds
    .map((addonId) => addOnServices.find((addon) => addon.id === addonId))
    .filter(Boolean);

  const totalMonthlyCost = activeAddons.reduce((total, addon) => {
    return total + (addon?.monthlyPrice || 0);
  }, 0);

  return (
    <div className='space-y-6'>
      {/* Section Header */}
      <div className='flex items-center gap-2'>
        <CheckCircle2 className='h-5 w-5 text-green-600' />
        <span className='font-semibold'>{tSub('title')}</span>
      </div>

      {/* Subscription Status */}
      <div className='flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <div className='flex items-center space-x-3'>
          <div className='h-3 w-3 animate-pulse rounded-full bg-green-500'></div>
          <div>
            <div className='font-semibold text-green-800 dark:text-green-200'>
              {tSub('status.active')}
            </div>
            <div className='text-sm text-green-600 dark:text-green-400'>
              {activeAddons.length !== 1
                ? tSub('status.summaryPlural', {
                  count: activeAddons.length
                })
                : tSub('status.summary', {
                  count: activeAddons.length
                })}
            </div>
          </div>
        </div>
        <Badge
          variant='secondary'
          className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        >
          {subscription.status}
        </Badge>
      </div>

      {/* Active Add-ons */}
      {activeAddons.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h4 className='text-sm font-semibold'>{tSub('addons.title')}</h4>
            <div className='text-muted-foreground text-sm'>
              {tSub('addons.monthly', { cost: totalMonthlyCost })}
            </div>
          </div>

          <div className='space-y-3'>
            {activeAddons.map((addon) => {
              if (!addon) return null;

              return (
                <div
                  key={addon.id}
                  className='bg-card flex items-center justify-between rounded-lg border p-3'
                >
                  <div className='flex-1'>
                    <div className='font-medium'>
                      {t(`services.${addon.nameKey}`)}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      {t(`services.${addon.descriptionKey}`)}
                    </div>
                  </div>
                  <div className='ml-4 text-right'>
                    {addon.monthlyPrice > 0 && (
                      <div className='font-semibold'>
                        ${addon.monthlyPrice}
                        {tSub('addons.mo')}
                      </div>
                    )}
                    <Badge variant='outline' className='text-xs'>
                      {tSub('addons.active')}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Separator />

      {/* Summary */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>
            {tSub('summary.totalCost')}
          </span>
          <span className='text-lg font-bold'>
            ${totalMonthlyCost.toFixed(2)}
          </span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>
            {tSub('summary.nextBilling')}
          </span>
          <span>{tSub('summary.automatic')}</span>
        </div>
      </div>
    </div>
  );
}
