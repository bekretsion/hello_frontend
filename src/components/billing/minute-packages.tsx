'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ShoppingCart } from 'lucide-react';

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

interface MinutePackagesProps {
  onAddToCart?: (packageData: MinutePackage) => void;
  selectedPackages?: string[];
}

export default function MinutePackages({ onAddToCart, selectedPackages = [] }: MinutePackagesProps) {
  const [packages, setPackages] = useState<MinutePackagesByDuration | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesRes, minutesRes] = await Promise.all([
        fetch('/api/minutes/packages'),
        fetch('/api/minutes/my-minutes')
      ]);

      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
      }

      // Minutes data fetched but not currently used in UI
    } catch (error) {
      // console.error('Failed to fetch data:', error);
      toast.error('Failed to load minute packages');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!packageId) return;

    // Find the package data
    const allPackages = packages ? [
      ...packages.monthly,
      ...packages.quarterly,
      ...packages.semiAnnual,
      ...packages.annual,
      ...packages.topups
    ] : [];

    const packageData = allPackages.find(pkg => pkg.id === packageId);

    if (!packageData) {
      toast.error('Package not found');
      return;
    }

    // If onAddToCart handler is provided, use it (add to cart flow)
    if (onAddToCart) {
      onAddToCart(packageData);
      return;
    }

    // Otherwise, use direct purchase flow
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

  const PackageCategoryCard = ({
    title,
    icon,
    description,
    packages,
    onPurchase,
    isPurchasing,
    selectedPackage,
    isAddToCart,
    selectedPackages = []
  }: {
    title: string;
    icon: string;
    description: string;
    packages: MinutePackage[];
    onPurchase: (id: string) => void;
    isPurchasing: boolean;
    selectedPackage: string | null;
    isAddToCart?: boolean;
    selectedPackages?: string[];
  }) => {
    const [selectedPkg, setSelectedPkg] = useState<string | null>(null);

    return (
      <Card className="border border-blue-100/50 dark:border-slate-700/30 bg-gradient-to-br from-white/80 via-blue-50/20 to-white/80 dark:from-slate-900/80 dark:via-slate-800/30 dark:to-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-500 ring-1 ring-blue-100/20 hover:ring-blue-200/30 h-full flex flex-col">
        <CardHeader className="text-center pb-4 pt-6">
          <div className="flex flex-col items-center space-y-3">
            <div className="text-3xl">{icon}</div>
            <div>
              <CardTitle className="text-lg font-medium text-slate-800 dark:text-slate-100 tracking-tight">
                {title}
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col">
          <Select value={selectedPkg || ""} onValueChange={setSelectedPkg}>
            <SelectTrigger className="w-full border-blue-100/50 bg-white/50 dark:bg-slate-800/50">
              <SelectValue placeholder="Select package..." />
            </SelectTrigger>
            <SelectContent>
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{pkg.minutes} minutes</span>
                        {pkg.id.startsWith('custom-') && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0.5">
                            Special
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">${pkg.price} • ${getPricePerMinute(pkg.price, pkg.minutes)}/min</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPkg && (() => {
            const pkg = packages.find(p => p.id === selectedPkg);
            if (!pkg) return null;

            return (
              <div className="space-y-3 flex-1">
                <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100/30">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-100 leading-tight">{pkg.name}</span>
                    <div className="flex flex-wrap gap-1 flex-shrink-0">
                      {pkg.minutes === 500 && (
                        <Badge className="bg-blue-500/90 text-white text-xs whitespace-nowrap">Popular</Badge>
                      )}
                      {pkg.id.startsWith('custom-') && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs whitespace-nowrap">
                          ✨ Special
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Minutes:</span>
                      <span className="font-medium">{pkg.minutes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">${pkg.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Per minute:</span>
                      <span className="font-medium">${getPricePerMinute(pkg.price, pkg.minutes)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500/90 to-emerald-500/90 hover:from-blue-600 hover:to-emerald-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => onPurchase(pkg.id)}
                    disabled={isPurchasing || (isAddToCart && selectedPackages.includes(pkg.id))}
                  >
                    {isPurchasing && selectedPackage === pkg.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (isAddToCart && selectedPackages.includes(pkg.id)) ? (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Already in Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {isAddToCart ? 'Add to Cart' : 'Purchase Package'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-muted-foreground">Loading minute packages...</p>
        </div>
      </div>
    );
  }

  if (!packages) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Failed to load minute packages</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {/* Current Minutes Status */}

      {/* Package Categories Grid - Centered layout for 2 packages */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 max-w-3xl w-full">
          {/* Monthly Packages */}
          {packages.monthly.length > 0 && (
            <PackageCategoryCard
              title="Monthly"
              icon=""
              description="1 Month Validity"
              packages={packages.monthly}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
              selectedPackage={selectedPackage}
              isAddToCart={!!onAddToCart}
              selectedPackages={selectedPackages}
            />
          )}

          {/* Quarterly Packages */}
          {packages.quarterly.length > 0 && (
            <PackageCategoryCard
              title="Quarterly"
              icon=""
              description="3 Months Validity"
              packages={packages.quarterly}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
              selectedPackage={selectedPackage}
              isAddToCart={!!onAddToCart}
              selectedPackages={selectedPackages}
            />
          )}

          {/* 6-Month Packages */}
          {packages.semiAnnual.length > 0 && (
            <PackageCategoryCard
              title="6-Month"
              icon=""
              description="6 Months Validity"
              packages={packages.semiAnnual}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
              selectedPackage={selectedPackage}
              isAddToCart={!!onAddToCart}
              selectedPackages={selectedPackages}
            />
          )}

          {/* Annual Packages */}
          {packages.annual.length > 0 && (
            <PackageCategoryCard
              title="Annual"
              icon=""
              description="12 Months Validity"
              packages={packages.annual}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
              selectedPackage={selectedPackage}
              isAddToCart={!!onAddToCart}
              selectedPackages={selectedPackages}
            />
          )}
        </div>
      </div>
    </div>
  );
}
