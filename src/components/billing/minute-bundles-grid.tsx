'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Zap, Star, Settings, RefreshCw, ArrowUpCircle, Package, Phone, Mail, Building2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ManageBundleDialog from './manage-bundle-dialog';

interface MinutePackage {
    id: string;
    name: string;
    description: string;
    minutes: number;
    price: number;
    validity_days: number;
    currency?: string;
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

interface ActiveBundle {
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
    validity_days?: number;
}

interface MinuteBundlesGridProps {
    onAddToCart?: (packageData: MinutePackage) => void;
    activeBundles?: ActiveBundle[];
    purchasedAddonIds?: Set<string>;
}

export default function MinuteBundlesGrid({
    onAddToCart,
    activeBundles = [],
    purchasedAddonIds = new Set()
}: MinuteBundlesGridProps) {
    const t = useTranslations('billing');
    const locale = useLocale();
    const [packages, setPackages] = useState<MinutePackagesByDuration | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<'monthly' | 'annual'>('annual');
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [managingBundle, setManagingBundle] = useState<ActiveBundle | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showPackages, setShowPackages] = useState(false);
    const [showContactSalesModal, setShowContactSalesModal] = useState(false);

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
        } catch (error) {
            console.error(error);
            toast.error(t('errors.loadMinutePackagesFailed'));
        } finally {
            setIsLoading(false);
        }
    };

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

            if (response.ok) {
                toast.success(t('minutePackages.packageAddedSuccess'));
                window.location.reload();
            } else {
                toast.error(t('minutePackages.purchaseFailed'));
            }
        } catch (error) {
            toast.error(t('minutePackages.purchaseFailed'));
        } finally {
            setIsPurchasing(false);
            setSelectedPackage(null);
        }
    };

    const hasActiveBundle = activeBundles.some(b => !b.is_topup);
    const activeBundleData = activeBundles.find(b => !b.is_topup);
    const purchasedBundleId = activeBundleData?.package_id;

    // Check if bundle is expired
    const isBundleExpired = activeBundleData ? new Date(activeBundleData.expires_at) <= new Date() : true;

    // Check if bundle has 0 minutes but is not expired
    const hasZeroMinutesButNotExpired = activeBundleData
        ? activeBundleData.minutes_remaining === 0 && !isBundleExpired
        : false;

    // UI Rule: If expired, show packages directly (reset showPackages)
    // Also reset showPackages when bundle changes (e.g., after purchase)
    useEffect(() => {
        if (isBundleExpired) {
            setShowPackages(true);
        } else if (hasActiveBundle && !hasZeroMinutesButNotExpired) {
            // If bundle has minutes > 0, reset showPackages to show bundle card
            setShowPackages(false);
        }
    }, [isBundleExpired, hasActiveBundle, hasZeroMinutesButNotExpired]);

    const isCurrentPlan = (pkg: MinutePackage) => {
        return purchasedBundleId === pkg.id;
    };

    const getActiveBundleData = (pkg: MinutePackage) => {
        return activeBundles.find(b => b.package_id === pkg.id);
    };

    const currentPackages = packages
        ? selectedCategory === 'monthly'
            ? packages.monthly
            : packages.annual
        : [];

    // Get all packages from all categories
    const allPackages = packages
        ? [...packages.monthly, ...(packages.quarterly || []), ...(packages.semiAnnual || []), ...packages.annual]
        : [];

    // UI Rules Implementation:
    // 1. If active bundle with 0 minutes (not expired) AND showPackages is false: Show only bundle card
    // 2. If expired OR showPackages is true: Show packages
    // 3. If active bundle with minutes > 0: Show bundle card (current behavior)
    const shouldShowPackages = isBundleExpired || showPackages || !hasActiveBundle;
    const shouldShowBundleCard = hasActiveBundle && !isBundleExpired && !showPackages;

    // When user has active bundle and not showing packages, show that package (or create fallback if not found in packages)
    const displayedPackages = shouldShowPackages
        ? currentPackages
        : (hasActiveBundle && purchasedBundleId
            ? (() => {
                const matchedPackage = allPackages.find(p => p.id === purchasedBundleId);
                if (matchedPackage) {
                    return [matchedPackage];
                }
                // Fallback: Create a synthetic package from the bundle data
                if (activeBundleData) {
                    return [{
                        id: purchasedBundleId,
                        name: activeBundleData.package_name || `${activeBundleData.minutes_purchased} Minutes`,
                        description: '',
                        minutes: activeBundleData.minutes_purchased,
                        price: activeBundleData.purchase_price * 100, // Convert to cents for consistency
                        validity_days: 30, // Default fallback
                        is_popular: false,
                        is_promotional: false
                    }];
                }
                return [];
            })()
            : []);

    const renderPackageCard = (pkg: MinutePackage) => {
        const isUserCurrentPlan = isCurrentPlan(pkg);
        const bundleData = getActiveBundleData(pkg);

        // Debug logging in development
        if (process.env.NODE_ENV === 'development' && isUserCurrentPlan) {
            console.log('🔍 Current Plan Debug:', {
                packageId: pkg.id,
                packageMinutes: pkg.minutes,
                bundleData: bundleData ? {
                    id: bundleData.id,
                    minutes_purchased: bundleData.minutes_purchased,
                    minutes_remaining: bundleData.minutes_remaining,
                    package_id: bundleData.package_id
                } : 'NOT FOUND',
                allActiveBundles: activeBundles.map(b => ({
                    id: b.id,
                    package_id: b.package_id,
                    minutes_remaining: b.minutes_remaining,
                    minutes_purchased: b.minutes_purchased
                }))
            });
        }

        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                key={pkg.id}
                className={cn(
                    "relative rounded-xl p-5 sm:p-6 h-full flex flex-col",
                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
                    "border-2 transition-all duration-300",
                    isUserCurrentPlan
                        ? "border-blue-500/50 shadow-blue-500/20 shadow-2xl scale-105"
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-400/50"
                )}
            >
                {isUserCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white border-0 shadow-lg px-3 py-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t('subscriptions.addons.active')}
                        </Badge>
                    </div>
                )}

                <div className="text-center mb-2">
                    {pkg.minutes === 1000 && !isUserCurrentPlan && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg mb-1 text-[10px] px-1.5 py-0.5">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                            Best Offer
                        </Badge>
                    )}
                    {pkg.is_popular && !isUserCurrentPlan && pkg.minutes !== 1000 && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 mb-1 text-[10px] px-1.5 py-0.5">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                            {t('minutePackages.mostPopular')}
                        </Badge>
                    )}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {pkg.minutes.toLocaleString()} {t('minutePackages.minutes')}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                        {pkg.validity_days >= 365 ? t('minutePackages.annual') : t('minutePackages.monthly')}
                    </p>
                </div>

                <div className="text-center mb-4">
                    {isUserCurrentPlan && bundleData ? (
                        <div className="space-y-0.5">
                            {/* CRITICAL: Show actual remaining minutes from the bundle, not package minutes */}
                            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                                {bundleData.minutes_remaining?.toLocaleString() || '0'}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t('minutes.remaining')}</p>
                            {/* Debug info - remove in production */}
                            {process.env.NODE_ENV === 'development' && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Bundle ID: {bundleData.id} | Purchased: {bundleData.minutes_purchased} | Remaining: {bundleData.minutes_remaining}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            <div className="flex items-baseline justify-center gap-1">
                                {/* Show monthly price for annual packages, full price for monthly */}
                                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                                    {pkg.validity_days >= 365
                                        ? locale === 'en' 
                                            ? `$${Math.round(pkg.price / 12).toLocaleString('en-US')}`
                                            : `${Math.round(pkg.price / 12).toLocaleString('de-DE')},-`
                                        : locale === 'en'
                                            ? `$${Math.round(pkg.price).toLocaleString('en-US')}`
                                            : `${Math.round(pkg.price).toLocaleString('de-DE')},-`
                                    }
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                                {pkg.validity_days >= 365
                                    ? t('minutePackages.perMonth')
                                    : t('minutePackages.perMonth')
                                }
                            </p>
                            {/* Savings text for annual plans */}
                            {pkg.validity_days >= 365 && pkg.minutes === 200 && (
                                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    18% savings billed annually
                                </p>
                            )}
                            {pkg.validity_days >= 365 && pkg.minutes === 500 && (
                                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    22% savings billed annually
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-1 mb-4 flex-grow">
                    {pkg.description && pkg.description.trim() ? (
                        // Parse description from database - handles JSON bilingual format or plain string
                        (() => {
                            let descriptionText = pkg.description;

                            // Try to parse as JSON (bilingual format: {en: "...", no: "..."})
                            try {
                                const parsed = JSON.parse(pkg.description);
                                if (parsed && typeof parsed === 'object') {
                                    // Get description for current locale, fallback to English
                                    descriptionText = parsed[locale] || parsed['en'] || pkg.description;
                                }
                            } catch {
                                // Not JSON, use as plain string
                            }

                            // Try splitting by actual newline first, then by literal \n
                            let lines = descriptionText.includes('\n')
                                ? descriptionText.split('\n')
                                : descriptionText.split('\\n');

                            // Filter empty lines and map to rendered elements
                            return lines.filter(line => line.trim()).map((line, idx) => {
                                const trimmedLine = line.trim();
                                // Skip the "Included" / "Inkludert" header line
                                if (trimmedLine === 'Included' || trimmedLine === 'Inkludert') return null;

                                // Remove bullet point if present
                                const cleanLine = trimmedLine.replace(/^[●•]\s*/, '');

                                return (
                                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span className="flex-1 leading-relaxed">{cleanLine}</span>
                                    </div>
                                );
                            });
                        })()
                    ) : (
                        // Fallback to hardcoded features if no description
                        [
                            { label: `${pkg.minutes.toLocaleString()} ${t('minutePackages.callingMinutes')}`, icon: CheckCircle2 },
                            { label: `${pkg.validity_days} ${t('minutePackages.daysValidity')}`, icon: CheckCircle2 },
                            { label: t('minutePackages.premiumVoiceQuality'), icon: CheckCircle2 },
                            { label: t('minutePackages.supportIncluded'), icon: CheckCircle2 }
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <feature.icon className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span className="flex-1 leading-relaxed">{feature.label}</span>
                            </div>
                        ))
                    )}
                </div>

                {!isUserCurrentPlan && (
                    <Button
                        onClick={() => handlePurchase(pkg)}
                        disabled={isPurchasing && selectedPackage === pkg.id}
                        className={cn(
                            "w-full py-2 rounded-lg font-semibold transition-all duration-300 relative overflow-hidden text-sm",
                            "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]"
                        )}
                    >
                        {isPurchasing && selectedPackage === pkg.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                {t('minutePackages.getStarted')}
                            </span>
                        )}
                    </Button>
                )}

                {/* Manage Button for Active Bundle */}
                {isUserCurrentPlan && bundleData && !bundleData.is_topup && (
                    <Button
                        onClick={() => setManagingBundle(bundleData)}
                        variant="outline"
                        className={cn(
                            "w-full py-4 rounded-xl font-bold transition-all duration-300",
                            "border-2 border-blue-500/50 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            {t('minutePackages.managePlan')}
                        </span>
                    </Button>
                )}
            </motion.div>
        );
    };

    // Enterprise Card - Horizontal rectangle layout
    const renderEnterpriseCard = () => {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                key="enterprise"
                className={cn(
                    "relative rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-center gap-4 md:gap-6",
                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
                    "border-2 transition-all duration-300",
                    "border-purple-400 dark:border-purple-600 hover:border-purple-500 shadow-lg shadow-purple-500/10"
                )}
            >
                {/* Left Section: Badge and Title */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[140px]">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg px-3 py-1 mb-2">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Enterprise
                    </Badge>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">
                        Enterprise
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold text-center">
                        AI Phone Assistant
                    </p>
                </div>

                {/* Middle Section: Pricing */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[120px] border-t border-b md:border-t-0 md:border-b-0 md:border-l md:border-r border-slate-200 dark:border-slate-700 py-3 md:py-0 md:px-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">
                        Included
                    </p>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        Custom
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5">
                        Pricing
                    </p>
                </div>

                {/* Right Section: Features */}
                <div className="flex-grow flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6">
                    {[
                        { label: 'Custom call volume', icon: CheckCircle2 },
                        { label: 'Custom assistants', icon: CheckCircle2 },
                        { label: 'Advanced workflows', icon: CheckCircle2 },
                        { label: 'Enterprise agreement', icon: CheckCircle2 }
                    ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <feature.icon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <span>{feature.label}</span>
                        </div>
                    ))}
                </div>

                {/* Rightmost: Button */}
                <div className="flex-shrink-0 w-full md:w-auto">
                    <Button
                        onClick={() => setShowContactSalesModal(true)}
                        className={cn(
                            "w-full md:w-auto py-3 px-6 rounded-lg font-semibold transition-all duration-300 relative overflow-hidden whitespace-nowrap",
                            "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                        )}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact Sales
                        </span>
                    </Button>
                </div>
            </motion.div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            {/* UI Rule: Show category selector only when showing packages (expired or "Show Packages" clicked) */}
            {shouldShowPackages && (
                <div className="flex justify-center mb-12">
                    <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        <button
                            onClick={() => setSelectedCategory('monthly')}
                            className={cn(
                                "px-8 py-2.5 rounded-xl font-bold transition-all duration-500 text-sm",
                                selectedCategory === 'monthly'
                                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md scale-105"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            {t('minutePackages.monthly')}
                        </button>
                        <button
                            onClick={() => setSelectedCategory('annual')}
                            className={cn(
                                "px-8 py-2.5 rounded-xl font-bold transition-all duration-500 text-sm",
                                selectedCategory === 'annual'
                                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md scale-105"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            {t('minutePackages.annual')}
                        </button>
                    </div>
                </div>
            )}

            {/* UI Rule: Show "Show Packages" button only when bundle has 0 minutes (not expired) and packages are hidden */}
            {hasActiveBundle && !isBundleExpired && hasZeroMinutesButNotExpired && !showPackages && (
                <div className="flex justify-center mb-8">
                    <Button
                        onClick={() => setShowPackages(true)}
                        className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg px-8 py-6 text-base font-semibold"
                    >
                        <Package className="w-5 h-5 mr-2" />
                        Show Packages
                    </Button>
                </div>
            )}

            {/* UI Rule: Show bundle card OR packages, never both simultaneously (except after clicking "Show Packages") */}
            {shouldShowBundleCard && !showPackages ? (
                // Show only the active bundle card
                <div className="grid gap-8 justify-center grid-cols-1 max-w-md mx-auto">
                    <AnimatePresence mode="wait">
                        {displayedPackages.map((pkg) => renderPackageCard(pkg))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className={cn(
                        "grid gap-4 justify-center w-full",
                        displayedPackages.length === 1 ? "grid-cols-1 max-w-md mx-auto" :
                            displayedPackages.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto" :
                                "grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto"
                    )}>
                        <AnimatePresence mode="wait">
                            {displayedPackages.map((pkg) => renderPackageCard(pkg))}
                        </AnimatePresence>
                    </div>
                    
                    {/* Enterprise Card - Horizontal rectangle below the packages */}
                    <div className="w-full max-w-7xl mx-auto">
                        <AnimatePresence mode="wait">
                            {renderEnterpriseCard()}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Contact Sales Modal */}
            <Dialog open={showContactSalesModal} onOpenChange={setShowContactSalesModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            Contact Our Sales Team
                        </DialogTitle>
                        <DialogDescription>
                            Get in touch with us to discuss your enterprise needs and custom pricing options.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Phone Contact */}
                        <a
                            href="tel:+4740556333"
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200 group cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium mb-1">
                                    Contact through phone number
                                </p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    +47 405 56 333
                                </p>
                            </div>
                        </a>

                        {/* Email Contact */}
                        <a
                            href="mailto:contact@hello.ai"
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200 group cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium mb-1">
                                    Send us an email
                                </p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors break-all">
                                    contact@hello.ai
                                </p>
                            </div>
                        </a>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Manage Bundle Dialog */}
            {managingBundle && (
                <ManageBundleDialog
                    isOpen={!!managingBundle}
                    onClose={() => setManagingBundle(null)}
                    currentBundle={{
                        id: managingBundle.id,
                        package_id: managingBundle.package_id,
                        package_name: managingBundle.package_name || `${managingBundle.minutes_purchased} Minutes`,
                        minutes_remaining: managingBundle.minutes_remaining,
                        minutes_purchased: managingBundle.minutes_purchased,
                        purchase_price: managingBundle.purchase_price,
                        expires_at: managingBundle.expires_at,
                        validity_days: managingBundle.validity_days || 30, // Use actual validity_days from API, fallback to 30
                        is_topup: managingBundle.is_topup
                    }}
                    onBundleUpdated={() => {
                        setRefreshKey(prev => prev + 1);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
