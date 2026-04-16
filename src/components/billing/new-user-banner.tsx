'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Zap, X, CheckCircle2, AlertTriangle, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewUserBannerProps {
  className?: string;
  /** When true, CTA button navigates to /dashboard/billing instead of scrolling to packages */
  navigateToBilling?: boolean;
  /** When false, hides the welcome banner (default: true) */
  showWelcome?: boolean;
  /** Pre-fetched minutes data from server component. When provided, skips the internal /api/minutes/my-minutes fetch. */
  prefetchedMinutesData?: any | null;
}

interface UserMinutes {
  totalMinutes: number;
  bundles: any[];
  totalPurchaseCount: number;
}

interface UserData {
  user: {
    id: number;
    welcome_banner_dismissed?: boolean;
  };
}

// Banner types
type BannerType = 'welcome' | 'no-minutes' | 'must-buy' | null;

export default function NewUserBanner({ className, navigateToBilling = false, showWelcome = true, prefetchedMinutesData = null }: NewUserBannerProps) {
  const t = useTranslations('billing.newUserBanner');
  const router = useRouter();
  const [bannerType, setBannerType] = useState<BannerType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    checkBannerStatus();
  }, []);

  const checkBannerStatus = async () => {
    try {
      setIsLoading(true);

      // Fetch user data to check welcome banner dismiss status
      // and minutes data in parallel (unless minutes data was pre-fetched by server)
      const userResPromise = fetch('/api/auth/me');
      const minutesResPromise = prefetchedMinutesData !== null
        ? Promise.resolve(null) // skip fetch — use prefetched data
        : fetch('/api/minutes/my-minutes');

      const [userRes, minutesRes] = await Promise.all([userResPromise, minutesResPromise]);

      let welcomeBannerDismissed = false;
      if (userRes.ok) {
        const userData: UserData = await userRes.json();
        welcomeBannerDismissed = userData.user.welcome_banner_dismissed || false;
      }

      let minutesData: UserMinutes;
      if (prefetchedMinutesData !== null) {
        minutesData = prefetchedMinutesData as UserMinutes;
      } else {
        if (!minutesRes || !minutesRes.ok) {
          setBannerType(null);
          return;
        }
        minutesData = await minutesRes.json();
      }

      const { totalMinutes, totalPurchaseCount } = minutesData;

      // Banner logic (priority order):
      // 1. If remaining minutes > 0 AND first purchase AND not dismissed → Welcome banner
      // 2. If remaining minutes === 0 AND never purchased → Must buy banner
      // 3. If remaining minutes === 0 AND has purchased before → No minutes warning
      // 4. Otherwise → No banner

      if (totalMinutes > 0) {
        // User has minutes remaining
        if (showWelcome && totalPurchaseCount === 1 && !welcomeBannerDismissed) {
          // First purchase, show welcome banner
          setBannerType('welcome');
        } else {
          // No banner needed
          setBannerType(null);
        }
      } else {
        // User has 0 minutes
        if (totalPurchaseCount === 0) {
          // Never purchased → Must buy banner
          setBannerType('must-buy');
        } else {
          // Has purchased before but ran out → No minutes warning
          setBannerType('no-minutes');
        }
      }
    } catch (error) {
      console.error('Error checking banner status:', error);
      setBannerType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    // Only the welcome banner can be dismissed permanently
    if (bannerType !== 'welcome') {
      return;
    }

    try {
      setIsDismissing(true);

      const res = await fetch('/api/auth/dismiss-welcome-banner', {
        method: 'POST',
      });

      if (res.ok) {
        setBannerType(null);
      }
    } catch (error) {
      console.error('Failed to dismiss welcome banner:', error);
      setBannerType(null);
    } finally {
      setIsDismissing(false);
    }
  };

  const handleCtaClick = () => {
    if (navigateToBilling) {
      router.push('/dashboard/billing');
    } else {
      const packagesSection = document.querySelector('[data-section="minute-packages"]');
      if (packagesSection) {
        packagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Don't render anything while loading or no banner
  if (isLoading || bannerType === null) {
    return null;
  }

  // Banner content based on type
  const bannerConfig = {
    'welcome': {
      icon: Zap,
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-100 dark:border-slate-700',
      bgColor: 'bg-white dark:bg-slate-900',
      title: t('title'),
      description: t('description'),
      buttonText: t('browseButton'),
      buttonStyle: 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700',
      showFeatures: true,
      dismissable: true
    },
    'no-minutes': {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-200 dark:border-amber-900/50',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      title: t('noMinutesTitle'),
      description: t('noMinutesDescription'),
      buttonText: t('topUpButton'),
      buttonStyle: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
      showFeatures: false,
      dismissable: false
    },
    'must-buy': {
      icon: ShoppingCart,
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-100 dark:border-emerald-900/50',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      title: t('mustBuyTitle'),
      description: t('mustBuyDescription'),
      buttonText: t('browseButton'),
      buttonStyle: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
      showFeatures: true,
      dismissable: false
    }
  };

  const config = bannerConfig[bannerType];
  const Icon = config.icon;

  // Split description by \n for multi-line display
  const descriptionLines = config.description.split('\\n');

  return (
    <div className={cn(
      "border rounded-lg shadow-sm p-3 relative",
      config.borderColor,
      config.bgColor,
      className
    )}>
      {/* Dismiss button - only for welcome banner */}
      {config.dismissable && (
        <button
          onClick={handleDismiss}
          disabled={isDismissing}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label={t('dismiss') || 'Dismiss'}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="pr-6">
        {/* Title with icon */}
        <div className="flex items-center gap-2 mb-1">
          <Icon className={cn("w-4 h-4", config.iconColor)} />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {config.title}
          </h3>
        </div>

        {/* Description */}
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
          {descriptionLines.map((line, index) => (
            <span key={index}>{line}{index < descriptionLines.length - 1 ? ' ' : ''}</span>
          ))}
        </div>

        {/* CTA and Features */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleCtaClick}
            size="sm"
            className={cn("text-white text-xs font-medium h-7 px-3", config.buttonStyle)}
          >
            <Icon className="w-3 h-3 mr-1" />
            {config.buttonText}
          </Button>

          {/* Subtext Features - only for welcome and must-buy banners */}
          {config.showFeatures && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{t('feature1')}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{t('feature2')}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{t('feature3')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
