'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Zap, ChevronLeft, ChevronRight, Star, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MinutePackage {
  id: string;
  name: string;
  description: string;
  minutes: number;
  price: number;
  validity_days: number;
  is_popular?: boolean;
  is_promotional?: boolean;
}

interface MinutePackagesByDuration {
  monthly: MinutePackage[];
  quarterly: MinutePackage[];
  semiAnnual: MinutePackage[];
  annual: MinutePackage[];
  topups: MinutePackage[];
}

interface ServiceAddon {
  id: string;
  name_key: string;
  description_key: string;
  monthly_price: string | number;
  setup_fee: string | number;
  stripe_monthly_price_id?: string;
  stripe_setup_price_id?: string;
  is_active: boolean;
  sort_order: number;
}

interface MinutePackagesCarouselProps {
  onAddToCart?: (packageData: MinutePackage) => void;
  selectedAddons?: Set<string>;
  onAddonToggle?: (addonId: string) => void;
  purchasedAddonIds?: Set<string>;
}

export default function MinutePackagesCarousel({ onAddToCart, selectedAddons = new Set(), onAddonToggle, purchasedAddonIds = new Set() }: MinutePackagesCarouselProps) {
  const t = useTranslations('billing');
  const tPackages = useTranslations('billing.minutePackages');
  const [packages, setPackages] = useState<MinutePackagesByDuration | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'monthly' | 'annual'>('annual');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | 'none'>('none');
  const [serviceAddons, setServiceAddons] = useState<ServiceAddon[]>([]);
  const [prevDisplayedPackage, setPrevDisplayedPackage] = useState<MinutePackage | null>(null);
  const [isAddonsExpanded, setIsAddonsExpanded] = useState(false);

  const preferredMinutes = 500;

  const findIndexForMinutes = (list: MinutePackage[] = [], minutes: number) =>
    list.findIndex(pkg => pkg.minutes === minutes);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const packagesRes = await fetch('/api/minutes/packages');
      if (!packagesRes.ok) {
        throw new Error("Failed to fetch packages");
      }

      const packagesData = await packagesRes.json();
      setPackages(packagesData);

      // Select 500 minutes by default (annual list)
      if (packagesData?.annual?.length > 0) {
        const idx = findIndexForMinutes(packagesData.annual, preferredMinutes);
        setActiveIndex(idx !== -1 ? idx : 0);
      } else {
        setActiveIndex(0);
      }


      // Fetch service add-ons
      const addonsRes = await fetch('/api/service-addons');
      if (addonsRes.ok) {
        const addonsData = await addonsRes.json();
        setServiceAddons(addonsData.slice(0, 4));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('errors.loadMinutePackagesFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const currentPackages = packages
    ? selectedCategory === 'monthly'
      ? packages.monthly
      : packages.annual
    : [];

  const handlePurchase = async (packageData: MinutePackage) => {
    if (onAddToCart) {
      onAddToCart(packageData);
      return;
    }

    setIsPurchasing(true);
    setSelectedPackage(packageData.id);

    try {
      const response = await fetch('/api/minutes/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: packageData.id })
      });

      if (!response.ok) {
        throw new Error('Purchase failed');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success(tPackages('packageAddedSuccess'));
      }
    } catch (error) {
      toast.error(tPackages('purchaseFailed'));
    } finally {
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const handlePrevious = () => {
    if (isTransitioning || activeIndex <= 0) return;

    setPrevDisplayedPackage(currentPackages[activeIndex]);
    setTransitionDirection("left");
    setIsTransitioning(true);
    setActiveIndex(prev => prev - 1);
  };

  const handleNext = () => {
    if (isTransitioning || activeIndex >= currentPackages.length - 1) return;

    setPrevDisplayedPackage(currentPackages[activeIndex]);
    setTransitionDirection("right");
    setIsTransitioning(true);
    setActiveIndex(prev => prev + 1);
  };

  const renderPackageContent = (pkg: MinutePackage, isActive: boolean) => (
    <>
      {/* Header */}
      <div className="text-center space-y-1 sm:space-y-1.5">
        {pkg.is_popular && (
          <Badge className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white border-0 shadow-lg mb-1 text-[9px] sm:text-[10px] py-0.5">
            <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />
            {tPackages('mostPopular')}
          </Badge>
        )}
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
          {pkg.minutes} {tPackages('minutes')}
        </h3>
        <p className="text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400">
          {selectedCategory === 'monthly' ? tPackages('oneMonthValidity') : tPackages('twelveMonthsValidity')}
        </p>
      </div>

      {/* Price */}
      <div className="text-center py-2 sm:py-3">
        <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          ${(pkg.price / 100).toFixed(0)}
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          ${((pkg.price / 100) / pkg.minutes).toFixed(2)} {tPackages('perMinute')}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 flex-shrink-0" />
          <span>{pkg.minutes.toLocaleString()} {tPackages('callingMinutes')}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 flex-shrink-0" />
          <span>{pkg.validity_days} {tPackages('daysValidity')}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 flex-shrink-0" />
          <span>{tPackages('premiumVoiceQuality')}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 flex-shrink-0" />
          <span>{tPackages('supportIncluded')}</span>
        </div>
      </div>

      {/* CTA Button - Only in active card */}
      {isActive && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handlePurchase(pkg);
          }}
          disabled={isPurchasing && selectedPackage === pkg.id}
          className={cn(
            "w-full h-7 sm:h-8 text-[10px] sm:text-xs font-semibold rounded-lg transition-all duration-300 relative overflow-hidden",
            "shadow-lg hover:shadow-2xl hover:scale-105",
            "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />

          <span className="relative flex items-center justify-center">
            {isPurchasing && selectedPackage === pkg.id ? (
              <>
                <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5 animate-spin" />
                {tPackages('processing')}
              </>
            ) : (
              <>
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                {tPackages('getStarted')}
              </>
            )}
          </span>
        </Button>
      )}
    </>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const prevPackage = activeIndex > 0 ? currentPackages[activeIndex - 1] : null;
  const currentPackage = currentPackages[activeIndex];
  const nextPackage = activeIndex < currentPackages.length - 1 ? currentPackages[activeIndex + 1] : null;

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Category Toggle - Outside, Standalone */}
      {currentPackages.length > 0 && (
        <div className="flex justify-center">
          <div className="relative inline-flex p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-100 via-blue-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md backdrop-blur-xl">
            <div
              className={cn(
                "absolute top-0.5 sm:top-1 h-[calc(100%-4px)] sm:h-[calc(100%-8px)] rounded-md sm:rounded-lg transition-all duration-300 ease-out",
                "bg-gradient-to-r from-blue-600 to-emerald-600 shadow-md",
                selectedCategory === 'monthly' ? 'left-0.5 sm:left-1 w-[calc(50%-2px)] sm:w-[calc(50%-4px)]' : 'left-[calc(50%+1px)] sm:left-[calc(50%+2px)] w-[calc(50%-2px)] sm:w-[calc(50%-4px)]'
              )}
            />
            <button
              onClick={() => {
                if (selectedCategory !== 'monthly') {
                  setTransitionDirection('none');
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setSelectedCategory('monthly');
                    setActiveIndex(0);
                    setIsTransitioning(false);
                  }, 300);
                }
              }}
              className={cn(
                "relative z-10 px-3 sm:px-6 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs font-semibold transition-colors duration-300",
                selectedCategory === 'monthly' ? 'text-white' : 'text-slate-700 dark:text-slate-300'
              )}
            >
              {tPackages('monthly')}
            </button>
            <button
              onClick={() => {
                if (selectedCategory !== 'annual') {
                  setTransitionDirection('none');
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setSelectedCategory('annual');
                    //const preferredMintues = 500;
                    if (packages?.annual?.length) {
                      const idx = findIndexForMinutes(packages.annual, preferredMinutes);
                      setActiveIndex(idx !== -1 ? idx : 0);
                    }
                    else {
                      setActiveIndex(0);
                    }
                    setIsTransitioning(false);
                  }, 300);
                }
              }}
              className={cn(
                "relative z-10 px-3 sm:px-6 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs font-semibold transition-colors duration-300",
                selectedCategory === 'annual' ? 'text-white' : 'text-slate-700 dark:text-slate-300'
              )}
            >
              {tPackages('annual')}
            </button>
          </div>
        </div>
      )}

      {/* Main Carousel Container - Fixed Card Structure */}
      {currentPackages.length > 0 && (
        <div className="relative w-full max-w-md mx-auto">
          {/* Fixed Main Card Container */}
          <div className={cn(
            "relative rounded-lg sm:rounded-xl overflow-visible",
            "bg-gradient-to-br from-white/95 via-blue-50/40 to-white/95",
            "dark:from-slate-900/95 dark:via-slate-800/40 dark:to-slate-900/95",
            "backdrop-blur-2xl border-2 border-blue-200/60 dark:border-blue-700/60 shadow-2xl",
            "transition-shadow duration-500"
          )}>
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-60 pointer-events-none rounded-lg sm:rounded-xl" />

            {/* Previous Package Preview (Left) - Hidden on mobile */}
            {prevPackage && (
              <div className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 w-[100px] h-[250px] pointer-events-none z-0">
                <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-white/40 via-blue-50/20 to-white/40 dark:from-slate-900/40 dark:via-slate-800/20 dark:to-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 shadow-md opacity-40 blur-[2px] scale-90">
                  <div className="p-2 space-y-2 select-none">
                    <div className="text-center">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {prevPackage.minutes} Min
                      </h3>
                      <p className="text-[8px] text-slate-600 dark:text-slate-400">
                        {selectedCategory === 'monthly' ? '1M' : '12M'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        ${(prevPackage.price / 100).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Package Preview (Right) - Hidden on mobile */}
            {nextPackage && (
              <div className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 w-[100px] h-[250px] pointer-events-none z-0">
                <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-white/40 via-blue-50/20 to-white/40 dark:from-slate-900/40 dark:via-slate-800/20 dark:to-slate-900/40 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 shadow-md opacity-40 blur-[2px] scale-90">
                  <div className="p-2 space-y-2 select-none">
                    <div className="text-center">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {nextPackage.minutes} Min
                      </h3>
                      <p className="text-[8px] text-slate-600 dark:text-slate-400">
                        {selectedCategory === 'monthly' ? '1M' : '12M'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        ${(nextPackage.price / 100).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Button - Left (Inside Card) */}
            <button
              onClick={handlePrevious}
              disabled={activeIndex === 0}
              className={cn(
                "absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30",
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full",
                "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-slate-200/50 dark:border-slate-700/50",
                "shadow-xl hover:shadow-2xl transition-all duration-300",
                "flex items-center justify-center",
                "disabled:opacity-20 disabled:cursor-not-allowed",
                "hover:scale-110 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600",
                "active:scale-95"
              )}
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300" />
            </button>

            {/* Navigation Button - Right (Inside Card) */}
            <button
              onClick={handleNext}
              disabled={activeIndex === currentPackages.length - 1}
              className={cn(
                "absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30",
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full",
                "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-slate-200/50 dark:border-slate-700/50",
                "shadow-xl hover:shadow-2xl transition-all duration-300",
                "flex items-center justify-center",
                "disabled:opacity-20 disabled:cursor-not-allowed",
                "hover:scale-110 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600",
                "active:scale-95"
              )}
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300" />
            </button>

            {/* Center Content Area (Only this changes on navigation) */}
            <div className="relative z-10 px-4 sm:px-8 md:px-[120px] py-4 sm:py-6 perspective-1000">
              {/* Transitioning Content */}
              <div className="relative preserve-3d">

                {/* OUTGOING PACKAGE (old one) */}
                {isTransitioning && prevDisplayedPackage && (
                  <div
                    className={cn(
                      "absolute inset-0 transition-all duration-700 ease-in-out backface-hidden",
                      transitionDirection === "right"
                        ? "opacity-0 rotate-y-90"
                        : "opacity-0 -rotate-y-90"
                    )}
                  >
                    <div className="space-y-3">
                      {renderPackageContent(prevDisplayedPackage, false)}
                    </div>
                  </div>
                )}

                {/* INCOMING PACKAGE (current one) */}
                {currentPackage && (
                  <div
                    className={cn(
                      "transition-all duration-700 ease-in-out backface-hidden",
                      isTransitioning
                        ? transitionDirection === "right"
                          ? "opacity-0 -rotate-y-90"
                          : "opacity-0 rotate-y-90"
                        : "opacity-100 rotate-y-0"
                    )}
                    onTransitionEnd={() => {
                      setIsTransitioning(false);
                      setTransitionDirection("none");
                      setPrevDisplayedPackage(null);
                    }}
                  >
                    <div className="space-y-3">
                      {renderPackageContent(currentPackage, true)}
                    </div>
                  </div>
                )}
              </div>

              {/* Static Service Add-ons */}
              {serviceAddons.length > 0 && currentPackage && (
                <div className="mt-3">
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <button
                        onClick={() => setIsAddonsExpanded(!isAddonsExpanded)}
                        className="bg-gradient-to-br from-white/95 via-blue-50/40 to-white/95 dark:from-slate-900/95 dark:via-slate-800/40 dark:to-slate-900/95 px-2 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                      >
                        <span>Add-ons</span>
                        <ChevronRight
                          className={cn(
                            "w-3 h-3 transition-transform duration-200",
                            isAddonsExpanded && "rotate-90"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {isAddonsExpanded && (
                    <div className="space-y-1.5">
                      {/* Filter out topup addons - they are handled via minute packages, not service addons */}
                      {serviceAddons
                        .filter(addon => !addon.id.toLowerCase().includes('topup') && !addon.name_key.toLowerCase().includes('topup'))
                        .map((addon) => {
                          const isSelected = selectedAddons.has(addon.id);
                          const isPurchased = purchasedAddonIds.has(addon.id);

                          // Get translated name and description from the translation files
                          // Remove any "billing.services." prefix if present
                          const nameKey = addon.name_key.split('.').pop() || addon.name_key;
                          const descKey = addon.description_key.split('.').pop() || addon.description_key;
                          const displayName = t(`services.${nameKey}`);
                          const displayDescription = t(`services.${descKey}`);

                          // Prices are stored in dollars in the database, not cents
                          const monthlyPrice = parseFloat(addon.monthly_price.toString());
                          const setupFee = parseFloat(addon.setup_fee.toString());

                          return (
                            <div
                              key={addon.id}
                              className={cn(
                                "p-1 rounded-md backdrop-blur-sm border transition-all duration-300",
                                isPurchased
                                  ? "bg-slate-100/80 dark:bg-slate-700/40 border-slate-400 dark:border-slate-600 opacity-60"
                                  : isSelected
                                    ? "bg-blue-50/80 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600 shadow-lg"
                                    : "bg-white/60 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <h4 className={cn(
                                      "font-semibold text-[10px] truncate",
                                      isPurchased ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white"
                                    )}>
                                      {displayName}
                                    </h4>
                                    {isPurchased && (
                                      <Badge variant="secondary" className="text-[6px] px-1 py-0 h-3">
                                        Purchased
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[10px] leading-tight line-clamp-1 text-slate-600 dark:text-slate-400">
                                    {displayDescription}
                                  </p>
                                  <div className="mt-0.5">
                                    <span className={cn(
                                      "text-[9px] font-bold",
                                      isPurchased ? "text-slate-500 dark:text-slate-400"
                                        : isSelected ? "text-blue-600 dark:text-blue-400"
                                          : "text-slate-700 dark:text-slate-300"
                                    )}>
                                      ${monthlyPrice.toFixed(0)}/mo
                                    </span>
                                    {setupFee > 0 && (
                                      <span className="text-[8px] text-slate-500 dark:text-slate-400 ml-1">
                                        +${setupFee.toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-1">
                                  {isPurchased ? (
                                    <div className="p-0.5 rounded-md bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                      <CheckCircle2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                    </div>
                                  ) : isSelected ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddonToggle && onAddonToggle(addon.id);
                                      }}
                                      className="p-0.5 rounded-md bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 border border-red-300 dark:border-red-700 transition-colors"
                                      title={t('quote.removeAddon') || 'Remove addon'}
                                    >
                                      <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddonToggle && onAddonToggle(addon.id);
                                      }}
                                      className="p-0.5 rounded-md bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900/60 border border-green-300 dark:border-green-700 transition-colors"
                                      title={t('quote.addAddon') || 'Add addon'}
                                    >
                                      <Plus className="w-3 h-3 text-green-600 dark:text-green-400" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Indicators */}
              <div className="flex justify-center gap-1 pt-4 pb-2">
                {currentPackages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (isTransitioning) return; // 

                      const direction = index > activeIndex ? 'right' : 'left';

                      setTransitionDirection(direction);
                      setIsTransitioning(true);
                      setActiveIndex(index);
                    }}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300 hover:scale-125",
                      index === activeIndex
                        ? "w-4 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-md shadow-blue-500/50"
                        : "w-1 bg-slate-300 dark:bg-slate-700 hover:bg-gradient-to-r hover:from-blue-400 hover:to-emerald-400"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
