'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap,
  TrendingUp,
  AlertCircle,
  Package,
  Plus,
  X,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MinuteBundlesGrid from './minute-bundles-grid';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface MinuteBundle {
  id: number;
  package_id: string;
  minutes_purchased: number;
  minutes_remaining: number;
  purchase_price: number;
  purchased_at: string;
  expires_at: string;
  status: string;
  is_topup: boolean;
  package_name?: string;
}

interface Subscription {
  planId: string | null;
  addonIds: string[];
  status: string;
  isActive: boolean;
}

interface BillingSettings {
  auto_topup_enabled: boolean;
  auto_topup_threshold: number;
  auto_charge_enabled: boolean;
  auto_renewal_enabled: boolean;
  low_minutes_threshold: number;
  topup_amount: number;
  notification_email: string | null;
}

interface ServiceAddon {
  id: string;
  name_key: string;
  description_key: string;
  monthly_price: string | number;
  setup_fee: string | number;
  is_active: boolean;
  sort_order: number;
}

interface YourPlansSectionProps {
  onUpgrade?: () => void;
  onAddMinutes?: () => void;
  onAddPackage?: (packageData: any) => void;
  selectedAddons?: Set<string>;
  onAddonToggle?: (addonId: string) => void;
  purchasedAddonIds?: Set<string>;
  serviceAddons?: ServiceAddon[];
  hasActiveMinuteBundle?: boolean;
  /** Pre-fetched minutes data from server component. When provided, skips the internal /api/minutes/my-minutes fetch. */
  prefetchedMinutesData?: any | null;
}

export default function YourPlansSection({
  onUpgrade,
  onAddMinutes,
  onAddPackage,
  selectedAddons = new Set(),
  onAddonToggle,
  purchasedAddonIds = new Set(),
  serviceAddons = [],
  hasActiveMinuteBundle = false,
  prefetchedMinutesData = null
}: YourPlansSectionProps) {
  const t = useTranslations('billing');
  const tSettings = useTranslations('billing.settings');
  const locale = useLocale();
  const [bundles, setBundles] = useState<MinuteBundle[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);

  useEffect(() => {
    fetchUserPlans();

    // Refresh data when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUserPlans();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchUserPlans = async () => {
    try {
      setIsLoading(true);

      // Use pre-fetched data from server if available, otherwise fetch client-side
      let minutesData: any = null;
      if (prefetchedMinutesData !== null) {
        minutesData = prefetchedMinutesData;
      } else {
        const minutesRes = await fetch(`/api/minutes/my-minutes?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        });
        if (minutesRes.ok) minutesData = await minutesRes.json();
      }

      if (minutesData) {
        setBundles(minutesData.bundles || []);
        setTotalMinutes(minutesData.totalMinutes || 0);
      }

      // Fetch subscriptions
      const subsRes = await fetch('/api/user/subscription');
      if (subsRes.ok) {
        const data = await subsRes.json();
        if (data.subscription && data.subscription.isActive) {
          setSubscription(data.subscription);
        }
      }

      // Fetch billing settings
      const settingsRes = await fetch('/api/minutes/settings');
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setBillingSettings(data);
      }
    } catch (error) {
      toast.error(t('errors.loadPlansFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalMinutesUsed = () => {
    return bundles.reduce((acc, bundle) => {
      return acc + (bundle.minutes_purchased - bundle.minutes_remaining);
    }, 0);
  };

  const getTotalMinutesPurchased = () => {
    return bundles.reduce((acc, bundle) => acc + bundle.minutes_purchased, 0);
  };

  const getUsagePercentage = () => {
    const purchased = getTotalMinutesPurchased();
    if (purchased === 0) return 0;
    const remaining = totalMinutes;
    return Math.round(((purchased - remaining) / purchased) * 100);
  };

  const MinuteWheel = () => {
    const remainingPercentage = getTotalMinutesPurchased() > 0 ? (totalMinutes / getTotalMinutesPurchased()) * 100 : 0;

    return (
      <TooltipProvider>
        <Tooltip open={showBreakdown}>
          <TooltipTrigger asChild>
            <div
              className="relative w-full h-full mx-auto cursor-pointer transition-transform hover:scale-105 p-4"
              onMouseEnter={() => setShowBreakdown(true)}
              onMouseLeave={() => setShowBreakdown(false)}
            >
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="billing-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-200 dark:text-slate-700" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="url(#billing-gradient)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - remainingPercentage / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-4">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent leading-tight">
                  {totalMinutes.toLocaleString()}
                </div>
                <div className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400 mt-1">{t('minutePackages.minutes')}</div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-0.5">{getUsagePercentage()}% {t('settings.minutesUsed')}</div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="p-2.5 bg-white dark:bg-slate-800 border shadow-xl">
            <div className="space-y-1">
              <div className="font-semibold text-xs mb-1">{t('settingsPage.bundleDetails')}</div>
              <div className="flex justify-between text-xs gap-3">
                <span className="text-slate-600 dark:text-slate-400">{t('minutePackages.minutes')}:</span>
                <span className="font-medium">{getTotalMinutesPurchased().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs gap-3">
                <span className="text-slate-600 dark:text-slate-400">{t('settings.minutesUsed')}:</span>
                <span className="font-medium text-orange-600">{getTotalMinutesUsed().toLocaleString()} min</span>
              </div>
              <div className="flex justify-between text-xs gap-3">
                <span className="text-slate-600 dark:text-slate-400">{t('settingsPage.minutesRemaining')}:</span>
                <span className="font-medium text-emerald-600">{totalMinutes.toLocaleString()} min</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // CRITICAL: Include bundles with 0 minutes if not expired (they remain active per rules)
  // Only exclude expired bundles
  const now = new Date();
  const activeBundles = bundles.filter(b => {
    if (b.status !== 'active') return false;
    const expiresAt = new Date(b.expires_at);
    return expiresAt > now; // Include if not expired, regardless of minutes_remaining
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Panel: Minute Wheel + Settings (always visible) */}
        <div className="flex flex-col items-center justify-start py-4 lg:col-span-3">
          {/* Minute Wheel */}
          <div className="w-full max-w-[250px] aspect-square">
            <MinuteWheel />
          </div>

          {/* Top-up button - Only enabled if user has an active minute bundle */}
          <>
            <Button
              onClick={onAddMinutes}
              size="lg"
              disabled={!hasActiveMinuteBundle}
              className={`w-full max-w-[150px] h-10 text-xs font-semibold shadow-lg mt-3 ${hasActiveMinuteBundle
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
                : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                }`}
              title={!hasActiveMinuteBundle ? "You need an active minute bundle to purchase top-ups" : undefined}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {t('bundles.addMinutes')}
            </Button>
            {!hasActiveMinuteBundle && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1">
                Purchase a minute package first
              </p>
            )}
          </>

          {/* Spacer between top-up button and settings */}
          <div className="h-4"></div>

          {/* Billing Settings - always visible */}
          {billingSettings && (
            <div className="space-y-6 w-full max-w-[160px]">
              <div className="flex flex-col bg-blue-100/50 dark:bg-blue-900/20 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span className="font-medium text-xs">{tSettings('autoRenewal')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type='button' className='text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors'>
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>{tSettings('autoRenewalTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    checked={billingSettings.auto_renewal_enabled}
                    onCheckedChange={async (val) => {
                      try {
                        setBillingSettings(s => ({ ...s!, auto_renewal_enabled: val }));
                        const resp = await fetch('/api/minutes/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            autoRenewalEnabled: val,
                            autoChargeEnabled: billingSettings?.auto_charge_enabled ?? false,
                          }),
                        });
                        if (!resp.ok) throw new Error('Failed to update');
                        toast.success(tSettings('autoRenewalUpdated'));
                      } catch {
                        setBillingSettings(s => ({ ...s!, auto_renewal_enabled: !val }));
                        toast.error(tSettings('autoRenewalUpdateFailed'));
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{tSettings('autoRenewalSubtitle')}</p>
              </div>
              <div className="flex flex-col bg-blue-100/50 dark:bg-blue-900/20 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span className="font-medium text-xs">{tSettings('autoCharge')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type='button' className='text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors'>
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>{tSettings('autoChargeTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    checked={billingSettings.auto_charge_enabled}
                    onCheckedChange={async (val) => {
                      try {
                        // If enabling auto-charge, disable auto-topup (mutual exclusivity)
                        const newAutoTopup = val ? false : billingSettings?.auto_topup_enabled ?? false;
                        setBillingSettings(s => ({ ...s!, auto_charge_enabled: val, auto_topup_enabled: newAutoTopup }));
                        const resp = await fetch('/api/minutes/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            autoChargeEnabled: val,
                            autoTopupEnabled: newAutoTopup,
                            autoRenewalEnabled: billingSettings?.auto_renewal_enabled ?? false,
                          }),
                        });
                        if (!resp.ok) throw new Error('Failed to update');
                        toast.success(tSettings('autoChargeUpdated'));
                      } catch {
                        setBillingSettings(s => ({ ...s!, auto_charge_enabled: !val }));
                        toast.error(tSettings('autoChargeUpdateFailed'));
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{tSettings('autoChargeSubtitle')}</p>
              </div>

              {/* Auto Top-Up */}
              <div className={cn(
                "flex flex-col rounded-lg px-3 py-2 shadow-sm",
                billingSettings.auto_charge_enabled
                  ? "bg-gray-100/50 dark:bg-gray-800/20 opacity-60"
                  : "bg-amber-100/50 dark:bg-amber-900/20"
              )}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className={cn(
                      "w-3.5 h-3.5",
                      billingSettings.auto_charge_enabled
                        ? "text-gray-400"
                        : "text-amber-600 dark:text-amber-500"
                    )} />
                    <span className="font-medium text-xs">{tSettings('autoTopup')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type='button' className={cn(
                            "transition-colors",
                            billingSettings.auto_charge_enabled
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                          )}>
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>{tSettings('autoTopupTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    checked={billingSettings.auto_topup_enabled && !billingSettings.auto_charge_enabled}
                    disabled={billingSettings.auto_charge_enabled}
                    onCheckedChange={async (val) => {
                      try {
                        setBillingSettings(s => ({ ...s!, auto_topup_enabled: val }));
                        const resp = await fetch('/api/minutes/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            autoTopupEnabled: val,
                            autoChargeEnabled: billingSettings?.auto_charge_enabled ?? false,
                            autoRenewalEnabled: billingSettings?.auto_renewal_enabled ?? false,
                          }),
                        });
                        if (!resp.ok) throw new Error('Failed to update');
                        toast.success(tSettings('autoTopupUpdated'));
                      } catch {
                        setBillingSettings(s => ({ ...s!, auto_topup_enabled: !val }));
                        toast.error(tSettings('autoTopupUpdateFailed'));
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{tSettings('autoTopupSubtitle')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Minute Packages + Add-ons stacked vertically */}
        <div className="lg:col-span-9 py-6 flex flex-col">
          {/* Top: Minute Package Card */}
          <div className="flex items-start justify-center w-full" data-section="minute-packages">
            <MinuteBundlesGrid
              onAddToCart={onAddPackage}
              activeBundles={activeBundles}
              purchasedAddonIds={purchasedAddonIds}
            />
          </div>

          {/* Spacer */}
          <div className="h-6"></div>

          {/* Bottom: Service Add-ons (2 rows x 3 columns grid) */}
          <div className="space-y-3 w-full">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
              SERVICE ADD-ONS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Filter out topup addons - they are handled via minute packages, not service addons */}
              {serviceAddons
                .filter(addon => !addon.id.toLowerCase().includes('topup') && !addon.name_key.toLowerCase().includes('topup'))
                .map((addon) => {
                  const isSelected = selectedAddons.has(addon.id);
                  const isPurchased = purchasedAddonIds.has(addon.id);
                  const name = t(`services.${addon.name_key.split('.').pop()}`);

                  return (
                    <div
                      key={addon.id}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-300",
                        isPurchased
                          ? "opacity-50 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                          : isSelected
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 hover:shadow-sm"
                      )}
                    >
                      <div className="flex flex-col min-w-0 mr-3">
                        <span className="text-sm font-semibold truncate">{name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {formatCurrency(parseFloat(addon.monthly_price.toString()), locale)}/mnd
                          </span>
                          {parseFloat(addon.setup_fee.toString()) > 0 && (
                            <span className="text-[10px] text-slate-400">
                              +{formatCurrency(parseFloat(addon.setup_fee.toString()), locale)} oppsett
                            </span>
                          )}
                        </div>
                      </div>
                      {!isPurchased && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-lg shrink-0",
                            isSelected ? "text-red-500 hover:text-red-700 hover:bg-red-50" : "text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          )}
                          onClick={() => onAddonToggle && onAddonToggle(addon.id)}
                        >
                          {isSelected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}