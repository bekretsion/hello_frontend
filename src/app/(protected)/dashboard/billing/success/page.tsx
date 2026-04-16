'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Phone, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BillingSuccessPage() {
  const t = useTranslations('billing.success');
  const [isProcessing, setIsProcessing] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('session_id');
  const packageId = searchParams.get('package_id');
  const type = searchParams.get('type');
  const planId = searchParams.get('plan_id');
  const addonsParam = searchParams.get('addons');

  const fulfillPurchase = useCallback(async () => {
    try {
      const response = await fetch('/api/minutes/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, packageId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fulfill purchase');
      }

      setPurchaseDetails(data);

      // Wait a moment for the backend to update all records
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh user data to update state everywhere
      try {
        await fetch('/api/auth/me', { cache: 'no-store' });
      } catch (refreshError) {
        console.error('Failed to refresh user data:', refreshError);
        // Don't fail the whole flow if refresh fails
      }

      toast.success('Purchase successful!', {
        description: `${data.minutes} minutes have been added to your account`
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Purchase fulfillment failed');
      toast.error('Purchase fulfillment failed');
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, packageId]);

  const handleServiceSuccess = useCallback(async () => {
    try {
      // Parse addons from URL parameter
      let addonIds: string[] = [];
      if (addonsParam) {
        try {
          addonIds = JSON.parse(decodeURIComponent(addonsParam));
        } catch (e) {
          // Failed to parse addons parameter, continue with empty array
        }
      }

      const response = await fetch('/api/billing/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          planId,
          addonIds
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to activate service subscription');
      }

      setPurchaseDetails({
        type: 'service',
        planId,
        planName: data.planName || 'Service Plan',
        addonIds,
        ...data
      });

      // Wait a moment for the backend to update all records
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh user data to update state everywhere
      try {
        await fetch('/api/auth/me', { cache: 'no-store' });
      } catch (refreshError) {
        console.error('Failed to refresh user data:', refreshError);
        // Don't fail the whole flow if refresh fails
      }

      toast.success('Service subscription activated!', {
        description: 'Your new plan and add-ons are now active'
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Service activation failed');
      toast.error('Service activation failed');
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, planId, addonsParam]);

  useEffect(() => {
    // Prevent duplicate processing
    if (hasProcessed) return;

    // For subscriptions, webhook handles everything - don't call fulfill
    if (sessionId && type === 'subscription') {
      setHasProcessed(true);
      setIsProcessing(false);
      setPurchaseDetails({
        type: 'subscription',
        minutes: 'Processing...'
      });
      toast.success('Payment successful!', {
        description: 'Your subscription is being activated and will be available shortly.'
      });
      // Refresh user data after a delay to let webhook process
      setTimeout(async () => {
        try {
          await fetch('/api/auth/me', { cache: 'no-store' });
          await fetch('/api/minutes/my-minutes', { cache: 'no-store' });
        } catch (refreshError) {
          console.error('Failed to refresh user data:', refreshError);
        }
      }, 2000);
    } else if (sessionId && packageId && type === 'minutes') {
      setHasProcessed(true);
      fulfillPurchase();
    } else if (sessionId && type === 'annual_upgrade') {
      // Handle annual plan upgrade - webhook scheduled the upgrade; activates when minutes hit 0 or at next refill
      setHasProcessed(true);
      setIsProcessing(false);
      setPurchaseDetails({
        type: 'annual_upgrade',
        minutes: 'Processing...'
      });
      toast.success('Upgrade payment successful!', {
        description: 'Your upgrade is scheduled. A new 12-month cycle will begin when your current minutes run out or at your next monthly refill.'
      });
      // Refresh user data after a delay to let webhook process
      setTimeout(async () => {
        try {
          await fetch('/api/auth/me', { cache: 'no-store' });
          await fetch('/api/minutes/my-minutes', { cache: 'no-store' });
        } catch (refreshError) {
          console.error('Failed to refresh user data:', refreshError);
        }
      }, 2000);
    } else if (sessionId && (type === 'monthly_upgrade' || type === 'monthly_downgrade')) {
      // Handle monthly plan change (upgrade or downgrade) — user paid full price, change is now scheduled
      const isUpgrade = type === 'monthly_upgrade';
      setHasProcessed(true);
      setIsProcessing(false);
      setPurchaseDetails({
        type,
        minutes: 'Processing...'
      });
      toast.success(isUpgrade ? 'Upgrade payment successful!' : 'Downgrade payment successful!', {
        description: 'Your plan change has been scheduled. It will apply when your current minutes run out or at the next billing cycle.'
      });
      setTimeout(async () => {
        try {
          await fetch('/api/auth/me', { cache: 'no-store' });
          await fetch('/api/minutes/my-minutes', { cache: 'no-store' });
        } catch (refreshError) {
          console.error('Failed to refresh user data:', refreshError);
        }
      }, 2000);
    } else if (sessionId && type === 'monthly_to_annual_switch') {
      // Handle monthly → annual switch - webhook handles subscription creation and old sub cancellation
      setHasProcessed(true);
      setIsProcessing(false);
      setPurchaseDetails({
        type: 'monthly_to_annual_switch',
        minutes: 'Processing...'
      });
      toast.success('Annual plan activated!', {
        description: 'Your annual subscription is now active. Your current monthly minutes will continue until they expire.'
      });
      // Refresh user data after a delay to let webhook process
      setTimeout(async () => {
        try {
          await fetch('/api/auth/me', { cache: 'no-store' });
          await fetch('/api/minutes/my-minutes', { cache: 'no-store' });
        } catch (refreshError) {
          console.error('Failed to refresh user data:', refreshError);
        }
      }, 2000);
    } else if (sessionId && (type === 'minutes_multiple' || type === 'consolidated')) {
      // Handle multiple packages or consolidated purchases - webhook will process automatically
      setHasProcessed(true);
      setIsProcessing(false);
      setPurchaseDetails({
        type: type === 'consolidated' ? 'consolidated' : 'minutes_multiple',
        minutes: 'Processing...'
      });
      toast.success('Payment successful!', {
        description: 'Your purchase is being processed and will be available shortly.'
      });
    } else if (sessionId && planId) {
      // Handle service subscription success
      setHasProcessed(true);
      handleServiceSuccess();
    } else {
      setError('Invalid payment session');
      setIsProcessing(false);
    }
  }, [sessionId, packageId, type, planId, hasProcessed, fulfillPurchase, handleServiceSuccess]);

  if (isProcessing) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full px-4">
          <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
            <h2 className="text-xl sm:text-2xl font-semibold">{t('processing')}</h2>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              {t('processingDescription')}
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full px-4">
          <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl sm:text-2xl">❌</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-red-600">{t('purchaseFailed')}</h2>
              <p className="text-sm sm:text-base text-muted-foreground px-4">{error}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full px-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/billing')}
                className="w-full sm:flex-1"
              >
                {t('backToBilling')}
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="w-full sm:flex-1"
              >
                {t('tryAgain')}
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] w-full px-4 py-8">
        <div className="flex flex-col items-center justify-center w-full max-w-4xl space-y-6 sm:space-y-8">
          {/* Success Header */}
          <div className="text-center space-y-3 sm:space-y-4 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-600">{t('purchaseSuccessful')} 🎉</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto px-4">
              {(type === 'monthly_upgrade' || type === 'monthly_downgrade')
                ? 'Your plan change payment is confirmed! The new plan will apply as soon as your current minutes run out, or when your billing period ends.'
                : type === 'monthly_to_annual_switch'
                ? 'Your annual plan is now active! Your current monthly minutes will continue until they expire, then annual minute allocations will begin automatically.'
                : type === 'annual_upgrade'
                ? 'Your annual plan upgrade is scheduled! Your current minutes remain active. Once they run out or your next monthly refill arrives, a brand-new 12-month cycle with your upgraded plan will begin.'
                : type === 'minutes'
                ? t('minutePackageActivated')
                : t('serviceSubscriptionActivated')
              }
            </p>
          </div>

          {/* Purchase Details */}
          {purchaseDetails && type === 'minutes' && (
            <Card className="w-full max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2 text-lg sm:text-xl">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>{t('minutesAdded')}</span>
                </CardTitle>
                <CardDescription className="text-sm">{t('newMinutePackageDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                    {purchaseDetails.minutes?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('minutesAddedToAccount')}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('bundleId')}:</span>
                    <span className="font-medium">#{purchaseDetails.bundleId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('status')}:</span>
                    <span className="font-medium text-green-600">{t('active')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Subscription Details */}
          {purchaseDetails && purchaseDetails.type === 'service' && (
            <Card className="w-full max-w-lg mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2 text-lg sm:text-xl">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t('serviceActivated')}</span>
                </CardTitle>
                <CardDescription className="text-sm">{t('newSubscriptionDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-medium text-sm sm:text-base">Base Plan:</span>
                      <span className="font-semibold text-primary text-sm sm:text-base">{purchaseDetails.planName}</span>
                    </div>
                  </div>

                  {purchaseDetails.addonIds && purchaseDetails.addonIds.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Add-on Services:</div>
                      {purchaseDetails.addonIds.map((addonId: string) => (
                        <div key={addonId} className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span className="capitalize">{addonId.replace('-', ' ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Billing:</span>
                    <span className="font-medium">Monthly</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md mx-auto px-4">
            <Button
              size="lg"
              onClick={() => {
                // Force a full page reload to refresh all state, JWT, and data
                window.location.href = '/dashboard/analytics';
              }}
              className="flex items-center justify-center space-x-2 w-full sm:flex-1"
            >
              <span>{t('goToDashboard')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // Force a full page reload to refresh all state, JWT, and data
                window.location.href = '/dashboard/billing';
              }}
              className="w-full sm:flex-1"
            >
              {t('viewBilling')}
            </Button>
          </div>

          {/* Next Steps */}
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-lg sm:text-xl">{t('whatsNext')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center space-y-2 p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-base">{t('startMakingCalls')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('startMakingCallsDescription')}
                  </p>
                </div>

                <div className="text-center space-y-2 p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-base">{t('trackUsage')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('trackUsageDescription')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}