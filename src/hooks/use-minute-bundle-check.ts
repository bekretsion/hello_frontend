import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface MinuteBundleStatus {
  hasActiveBundle: boolean;
  hasExpiredBundle: boolean;
  hasZeroMinutes: boolean;
  isLoading: boolean;
}

export function useMinuteBundleCheck() {
  const [status, setStatus] = useState<MinuteBundleStatus>({
    hasActiveBundle: false,
    hasExpiredBundle: false,
    hasZeroMinutes: false,
    isLoading: true
  });
  const router = useRouter();
  const t = useTranslations('billing');

  useEffect(() => {
    checkMinuteBundle();
  }, []);

  const checkMinuteBundle = async () => {
    try {
      const response = await fetch('/api/minutes/my-minutes');
      if (!response.ok) {
        setStatus({
          hasActiveBundle: false,
          hasExpiredBundle: false,
          hasZeroMinutes: false,
          isLoading: false
        });
        return;
      }

      const data = await response.json();
      const bundles = data.bundles || [];
      const now = new Date();

      // Check for active non-topup bundles
      const activeBundles = bundles.filter((bundle: any) => {
        if (bundle.is_topup) return false;
        if (bundle.status !== 'active') return false;
        const expiresAt = new Date(bundle.expires_at);
        return expiresAt > now;
      });

      const hasActiveBundle = activeBundles.length > 0;

      // Check if all bundles are expired
      const hasExpiredBundle = bundles.length > 0 && activeBundles.length === 0;

      // Check if active bundle has 0 minutes
      const hasZeroMinutes = activeBundles.some((bundle: any) => bundle.minutes_remaining === 0);

      setStatus({
        hasActiveBundle,
        hasExpiredBundle,
        hasZeroMinutes,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to check minute bundle:', error);
      setStatus({
        hasActiveBundle: false,
        hasExpiredBundle: false,
        hasZeroMinutes: false,
        isLoading: false
      });
    }
  };

  const requireMinuteBundle = (action: () => void) => {
    if (status.isLoading) {
      toast.loading('Checking minute bundle status...');
      return;
    }

    if (!status.hasActiveBundle || status.hasExpiredBundle || status.hasZeroMinutes) {
      toast.error(t('serviceInterrupted.title'), {
        description: t('serviceInterrupted.description'),
        action: {
          label: t('goToBilling'),
          onClick: () => router.push('/dashboard/plan-addons')
        }
      });
      return;
    }

    action();
  };

  const isRestricted = !status.isLoading && (!status.hasActiveBundle || status.hasExpiredBundle || status.hasZeroMinutes);

  return {
    ...status,
    isRestricted,
    requireMinuteBundle,
    refresh: checkMinuteBundle
  };
}

