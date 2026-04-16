'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X, CheckCircle2, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

// Banner types
type BannerType = 'no-minutes' | 'must-buy' | null;

/**
 * ProfileCompletionBanner
 *
 * Performance fix: the previous version fetched /api/auth/me on every mount,
 * even though the user object is already available in useAuth().
 * Now it uses useAuth() directly and only fetches /api/onboarding/status
 * to check if the user is approved (in which case no banner is needed).
 */
export function ProfileCompletionBanner() {
  const router = useRouter();
  const { user } = useAuth();
  const [bannerType, setBannerType] = useState<BannerType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Derive profile completeness directly from useAuth() — no extra fetch needed
  const isProfileIncomplete = useMemo(() => {
    if (!user) return false;
    const fullName = (user as any).full_name || (user as any).fullName || '';
    const email = (user as any).email || '';
    const companyName = (user as any).company_name || (user as any).companyName || '';
    const phoneNumber = (user as any).phone_number || (user as any).phoneNumber || '';
    return !fullName.trim() || !email.trim() || !companyName.trim() || !phoneNumber.trim();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    checkBannerStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkBannerStatus = async () => {
    try {
      setIsLoading(true);

      // Check dismissed state from localStorage
      const dismissedKey = `profileBannerDismissed_${(user as any)?.id || 'guest'}`;
      const wasDismissed = localStorage.getItem(dismissedKey) === 'true';
      if (wasDismissed) {
        setIsLoading(false);
        return;
      }

      // Only fetch onboarding status if profile is incomplete (approved users don't need banner)
      if (!isProfileIncomplete) {
        setIsLoading(false);
        return;
      }

      const onboardingRes = await fetch('/api/onboarding/status', { cache: 'no-store' });
      if (onboardingRes.ok) {
        const onboardingData = await onboardingRes.json();
        if (onboardingData?.status?.reviewStatus === 'approved') {
          // Approved users don't need the profile completion banner
          setIsLoading(false);
          return;
        }
      }

      // Show banner for incomplete profiles that aren't approved
      setBannerType('must-buy');
    } catch (error) {
      console.error('Error checking banner status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setBannerType(null);
    const dismissedKey = `profileBannerDismissed_${(user as any)?.id || 'guest'}`;
    localStorage.setItem(dismissedKey, 'true');
  };

  const handleCompleteProfile = () => {
    router.push('/dashboard/settings?tab=profile');
  };

  if (isLoading || bannerType === null || isDismissed || !isProfileIncomplete) {
    return null;
  }

  const missingFields: string[] = [];
  const fullName = (user as any)?.full_name || (user as any)?.fullName || '';
  const email = (user as any)?.email || '';
  const companyName = (user as any)?.company_name || (user as any)?.companyName || '';
  const phoneNumber = (user as any)?.phone_number || (user as any)?.phoneNumber || '';
  if (!fullName.trim()) missingFields.push('Full Name');
  if (!email.trim()) missingFields.push('Email');
  if (!companyName.trim()) missingFields.push('Company Name');
  if (!phoneNumber.trim()) missingFields.push('Phone Number');

  if (missingFields.length === 0) return null;

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Complete Your Profile
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Please complete your profile by adding: {missingFields.join(', ')}.
                This helps us provide you with better service.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleCompleteProfile}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Complete Profile
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
