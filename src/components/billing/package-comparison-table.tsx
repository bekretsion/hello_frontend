'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Check, X, Star, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function PackageComparisonTable() {
  const [packages, setPackages] = useState<MinutePackagesByDuration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'monthly' | 'quarterly' | 'semiAnnual' | 'annual'>('monthly');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/minutes/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      } else {
        toast.error('Failed to load packages');
      }
    } catch (error) {
      toast.error('Error loading packages');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!packageId) return;

    setIsPurchasing(true);
    setSelectedPackage(packageId);

    try {
      const response = await fetch('/api/minutes/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Purchase failed');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      toast.error('Purchase failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const getPricePerMinute = (price: number, minutes: number) => {
    return (price / minutes).toFixed(3);
  };

  const getSavingsPercentage = (currentPrice: number, basePrice: number) => {
    if (basePrice <= currentPrice) return 0;
    return Math.round(((basePrice - currentPrice) / basePrice) * 100);
  };

  const getValidityText = (days: number) => {
    if (days === 0) return "Never expires";
    if (days === 30) return "1 Month";
    if (days === 90) return "3 Months";
    if (days === 180) return "6 Months";
    if (days === 365) return "12 Months";
    return `${days} Days`;
  };

  const toggleMobileExpand = (packageId: string) => {
    setExpandedMobile(expandedMobile === packageId ? null : packageId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="text-slate-500 dark:text-slate-400">Loading packages...</p>
        </div>
      </div>
    );
  }

  if (!packages) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 dark:text-slate-400">Unable to load packages</p>
      </div>
    );
  }

  // Get packages from selected category
  const currentPackages = packages[selectedCategory] || [];

  // Sort packages by minutes (ascending) for better comparison
  const sortedPackages = [...currentPackages].sort((a, b) => a.minutes - b.minutes);

  const basePricePerMinute = sortedPackages.length > 0 ?
    Math.max(...sortedPackages.map(pkg => pkg.price / pkg.minutes)) : 0;

  // Category information
  const categoryInfo = {
    monthly: { label: 'Monthly Plans', description: '1 Month Validity', duration: '30 days' },
    quarterly: { label: 'Quarterly Plans', description: '3 Months Validity', duration: '90 days' },
    semiAnnual: { label: '6-Month Plans', description: '6 Months Validity', duration: '180 days' },
    annual: { label: 'Annual Plans', description: '12 Months Validity', duration: '365 days' }
  };

  const FeatureIcon = ({ available }: { available: boolean }) => {
    if (available) return <Check className="w-4 h-4 text-emerald-600" aria-label="Included" />;
    return <X className="w-4 h-4 text-slate-300" aria-label="Not included" />;
  };

  const getFeatureValue = (pkg: MinutePackage, featureId: string) => {
    switch (featureId) {
      case 'minutes':
        return pkg.minutes.toLocaleString();
      case 'validity':
        return getValidityText(pkg.validity_days);
      default:
        return true; // All boolean features are true for all packages
    }
  };

  // Define features for comparison
  const features = [
    { id: 'minutes', label: 'Minutes Included', type: 'value' },
    { id: 'validity', label: 'Validity Period', type: 'value' },
    { id: 'instant', label: 'Instant Activation', type: 'boolean' },
    { id: 'fifo', label: 'FIFO Usage Order', type: 'boolean' },
    { id: 'quality', label: 'Premium Call Quality', type: 'boolean' },
    { id: 'support', label: '24/7 Support', type: 'boolean' },
  ];

  return (
    <div className="space-y-8 py-8">
      {/* Clean Header */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h2 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
          Choose Your Plan
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
          Simple, transparent pricing for every need. All plans include premium features and 24/7 support.
        </p>
      </div>

      {/* Integrated Section: Tabs + Description + Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Top section: Category Toggle + Description */}
        <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 px-6 py-8 border-b border-slate-200 dark:border-slate-700">
          {/* Category Toggle - Centered */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-md flex gap-1 border border-slate-200 dark:border-slate-700">
              {Object.entries(categoryInfo).map(([key]) => {
                const categoryKey = key as keyof typeof categoryInfo;
                const hasPackages = packages[categoryKey]?.length > 0;

                if (!hasPackages) return null;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(categoryKey)}
                    className={cn(
                      "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                      selectedCategory === categoryKey
                        ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg scale-105"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {key === 'semiAnnual' ? '6-Month' :
                      key.charAt(0).toUpperCase() + key.slice(1)}
                    {categoryKey === 'annual' && (
                      <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        Best Value
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Description - Left aligned */}
          <div className="text-left">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {categoryInfo[selectedCategory].label}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {categoryInfo[selectedCategory].description}
              </span>
              <span className="text-slate-400">•</span>
              <span>{sortedPackages.length} package{sortedPackages.length !== 1 ? 's' : ''} available</span>
            </p>
          </div>
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden lg:block">
          {sortedPackages.length > 0 ? (
            <div className="overflow-x-auto overflow-y-visible">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
                <div
                  className="grid gap-0 min-w-max"
                  style={{ gridTemplateColumns: `200px repeat(${sortedPackages.length}, 250px)` }}
                >
                  <div className="p-4 lg:p-6 border-r border-slate-200 dark:border-slate-700 min-w-[200px] flex items-center">
                    <h3 className="text-base lg:text-lg font-semibold text-slate-900 dark:text-white">Features</h3>
                  </div>
                  {sortedPackages.map((pkg) => {
                    const isPopular = pkg.minutes === 500;
                    const pricePerMinute = parseFloat(getPricePerMinute(pkg.price, pkg.minutes));
                    const savings = getSavingsPercentage(pricePerMinute, basePricePerMinute);

                    return (
                      <div key={pkg.id} className="p-4 lg:p-6 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 relative w-[250px] pt-8">
                        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-20 flex flex-col space-y-1 items-center">
                          {isPopular && (
                            <Badge className="bg-blue-600 text-white px-2 py-0.5 text-xs font-medium whitespace-nowrap shadow-sm">
                              <Star className="w-3 h-3 mr-1" />
                              Most Popular
                            </Badge>
                          )}
                          {pkg.id.startsWith('custom-') && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 text-xs font-medium whitespace-nowrap shadow-sm">
                              ✨ Special
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2 lg:space-y-3 mt-4">
                          <div>
                            <h4 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white leading-tight px-2" title={pkg.name}>
                              {pkg.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {getValidityText(pkg.validity_days)}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                              ${pkg.price}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              ${pricePerMinute.toFixed(3)}/min
                            </div>
                            {savings > 0 && (
                              <div className="text-xs text-emerald-600 font-medium">
                                Save {savings}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feature Rows */}
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="grid gap-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-max"
                    style={{ gridTemplateColumns: `200px repeat(${sortedPackages.length}, 250px)` }}
                  >
                    <div className="p-4 lg:p-5 border-r border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white min-w-[200px] flex items-center">
                      <span className="text-sm lg:text-base">{feature.label}</span>
                    </div>
                    {sortedPackages.map((pkg) => (
                      <div key={`${pkg.id}-${feature.id}`} className="p-4 lg:p-5 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 w-[250px] flex items-center justify-center">
                        {feature.type === 'value' ? (
                          <span className="font-semibold text-slate-900 dark:text-white text-sm lg:text-base break-words">
                            {getFeatureValue(pkg, feature.id)}
                          </span>
                        ) : (
                          <FeatureIcon available={true} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                <div
                  className="grid gap-0 min-w-max"
                  style={{ gridTemplateColumns: `200px repeat(${sortedPackages.length}, 250px)` }}
                >
                  <div className="p-4 lg:p-6 border-r border-slate-200 dark:border-slate-700 min-w-[200px]"></div>
                  {sortedPackages.map((pkg) => {
                    const isPopular = pkg.minutes === 500;

                    return (
                      <div key={`${pkg.id}-action`} className="p-4 lg:p-6 border-r border-slate-200 dark:border-slate-700 last:border-r-0 w-[250px]">
                        <Button
                          onClick={() => handlePurchase(pkg.id)}
                          disabled={isPurchasing}
                          className={cn(
                            "w-full h-10 lg:h-12 font-semibold transition-all duration-300 focus:ring-2 focus:ring-offset-2 text-sm lg:text-base shadow-lg hover:shadow-xl hover:scale-105",
                            isPopular
                              ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white focus:ring-blue-500"
                              : "bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white dark:from-blue-50 dark:to-emerald-50 dark:text-slate-900 dark:hover:from-blue-100 dark:hover:to-emerald-100 focus:ring-slate-500"
                          )}
                        >
                          {isPurchasing && selectedPackage === pkg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Get Started"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-500 dark:text-slate-400">No packages available in this category</p>
            </div>
          )}
        </div>

        {/* Mobile Accordion View */}
        <div className="lg:hidden px-4 py-6 space-y-4">
          {sortedPackages.length > 0 ? sortedPackages.map((pkg) => {
            const isExpanded = expandedMobile === pkg.id;
            const isPopular = pkg.minutes === 500;
            const pricePerMinute = parseFloat(getPricePerMinute(pkg.price, pkg.minutes));
            const savings = getSavingsPercentage(pricePerMinute, basePricePerMinute);

            return (
              <div key={pkg.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Package Header */}
                <button
                  onClick={() => toggleMobileExpand(pkg.id)}
                  className="w-full p-4 sm:p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate" title={pkg.name}>
                          {pkg.name}
                        </h3>
                        <div className="flex space-x-1">
                          {isPopular && (
                            <Badge className="bg-blue-600 text-white px-2 py-0.5 text-xs whitespace-nowrap">
                              Popular
                            </Badge>
                          )}
                          {pkg.id.startsWith('custom-') && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 text-xs whitespace-nowrap">
                              ✨ Special
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">${pkg.price}</span>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          ${pricePerMinute.toFixed(3)}/min
                        </span>
                      </div>
                      {savings > 0 && (
                        <div className="text-xs text-emerald-600 font-medium">
                          Save {savings}%
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700">
                    <div className="p-4 sm:p-6 space-y-4">
                      {features.map((feature) => (
                        <div key={feature.id} className="flex items-center justify-between py-2">
                          <span className="text-sm sm:text-base text-slate-600 dark:text-slate-300 flex-1 min-w-0 pr-4">
                            {feature.label}
                          </span>
                          <div className="flex-shrink-0">
                            {feature.type === 'value' ? (
                              <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base text-right">
                                {getFeatureValue(pkg, feature.id)}
                              </span>
                            ) : (
                              <FeatureIcon available={true} />
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="pt-4">
                        <Button
                          onClick={() => handlePurchase(pkg.id)}
                          disabled={isPurchasing}
                          className={cn(
                            "w-full h-11 sm:h-12 font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-xl",
                            isPopular
                              ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                              : "bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white dark:from-blue-50 dark:to-emerald-50 dark:text-slate-900 dark:hover:from-blue-100 dark:hover:to-emerald-100"
                          )}
                        >
                          {isPurchasing && selectedPackage === pkg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Get Started"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-16">
              <p className="text-slate-500 dark:text-slate-400">No packages available in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Trust Indicators - Outside the card */}
      <div className="text-center mt-8">
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Instant Activation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>30-Day Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}