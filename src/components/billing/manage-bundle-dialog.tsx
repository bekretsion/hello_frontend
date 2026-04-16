'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useFormatter, useLocale } from 'next-intl';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Package, Clock, AlertCircle, Calendar, X, Sparkles, Phone, CheckCircle2, Mail, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatNOK } from '@/lib/currency';

interface MinutePackage {
    id: string;
    name: string;
    description: string;
    minutes: number;
    price: string;
    validity_days: number;
    stripe_price_id: string;
    is_active: boolean;
}

interface ActiveBundle {
    id: number;
    package_id: string;
    package_name: string;
    minutes_purchased: number;
    minutes_remaining: number;
    purchase_price: number;
    expires_at: string;
    validity_days: number;
    is_topup: boolean;
    next_package_id?: string | null;
    next_package_name?: string | null;
    scheduled_change_at?: string | null;
}

interface ManageBundleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentBundle: ActiveBundle;
    onBundleUpdated: () => void;
}

export default function ManageBundleDialog({
    isOpen,
    onClose,
    currentBundle,
    onBundleUpdated
}: ManageBundleDialogProps) {
    const [packages, setPackages] = useState<MinutePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
    const t = useTranslations('billing.manageSubscription');
    const format = useFormatter();
    const locale = useLocale();

    // Determine current bundle's billing cycle (used throughout the component)
    const currentIsMonthly = currentBundle.validity_days > 0 && currentBundle.validity_days <= 31;
    const currentIsAnnual = currentBundle.validity_days > 270;

    useEffect(() => {
        if (isOpen) {
            fetchPackages();
            setSelectedPackageId(null);
        }
    }, [isOpen]);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/minutes/packages');
            if (!response.ok) throw new Error('Failed to fetch packages');

            const data = await response.json();

            // Get current bundle's minute count
            const currentMinutes = currentBundle.minutes_purchased;

            const allPackages = [
                ...(data.monthly || []),
                ...(data.quarterly || []),
                ...(data.annual || [])
            ];

            // Filter to show valid options
            // Monthly users: show same-cycle monthly plans + all annual plans (monthly→annual switch)
            // Annual users: show same-cycle annual upgrades only (no downgrades)
            const filteredPackages = allPackages.filter((pkg: MinutePackage) => {
                // Exclude topups
                if (pkg.id.includes('topup') || pkg.validity_days === 0) {
                    return false;
                }

                // Exclude current plan
                if (pkg.id === currentBundle.package_id) {
                    return false;
                }

                const pkgIsMonthly = pkg.validity_days > 0 && pkg.validity_days <= 31;
                const pkgIsAnnual = pkg.validity_days > 270;

                if (currentIsMonthly) {
                    // Monthly users can:
                    // - Switch to other monthly plans (upgrade/downgrade)
                    // - Switch to any annual plan (monthly→annual switch)
                    return pkgIsMonthly || pkgIsAnnual;
                }

                if (currentIsAnnual) {
                    // Annual users can only upgrade to higher annual plans (no downgrades, no monthly)
                    if (!pkgIsAnnual) return false;
                    if (pkg.minutes <= currentMinutes) return false;
                return true;
                }

                return false;
            });

            setPackages(filteredPackages);
        } catch (error) {
            toast.error('Failed to load available packages');
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleChange = async () => {
        if (!selectedPackageId) {
            toast.error(t('selectPackageError'));
            return;
        }

        if (selectedPackageId === currentBundle.package_id) {
            toast.error(t('alreadyOnPackageError'));
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/minutes/manage-bundle', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentBundleId: currentBundle.id,
                    newPackageId: selectedPackageId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to schedule plan change');
            }

            const result = await response.json();

            if (result.requiresPayment && result.checkoutUrl) {
                // Redirect to Stripe checkout
                window.location.href = result.checkoutUrl;
            } else if (result.scheduled) {
                toast.success(result.message);
                onBundleUpdated();
                onClose();
            } else {
                toast.success(result.message || t('successMessage'));
                onBundleUpdated();
                onClose();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('errorMessage');
            toast.error(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelScheduledChange = async () => {
        setProcessing(true);
        try {
            const response = await fetch('/api/minutes/manage-bundle', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentBundleId: currentBundle.id,
                    cancelScheduledChange: true
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to cancel scheduled change');
            }

            toast.success(t('scheduledChangeCancelled'));
            onBundleUpdated();
            onClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to cancel scheduled change';
            toast.error(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const getPackageComparison = (pkg: MinutePackage) => {
        const currentMinutes = currentBundle.minutes_purchased;
        const newMinutes = pkg.minutes;
        const pkgIsAnnual = pkg.validity_days > 270;

        // Monthly → Annual switch is always treated as an upgrade
        if (currentIsMonthly && pkgIsAnnual) {
            return { type: 'upgrade' as const, diff: newMinutes - currentMinutes, isAnnualSwitch: true, isAnnualUpgrade: false };
        }

        // Annual → Annual upgrade (new 12-month cycle)
        if (currentIsAnnual && pkgIsAnnual && newMinutes > currentMinutes) {
            return { type: 'upgrade' as const, diff: newMinutes - currentMinutes, isAnnualSwitch: false, isAnnualUpgrade: true };
        }

        if (newMinutes > currentMinutes) {
            return { type: 'upgrade' as const, diff: newMinutes - currentMinutes, isAnnualSwitch: false, isAnnualUpgrade: false };
        } else if (newMinutes < currentMinutes) {
            return { type: 'downgrade' as const, diff: currentMinutes - newMinutes, isAnnualSwitch: false, isAnnualUpgrade: false };
        }
        return { type: 'same' as const, diff: 0, isAnnualSwitch: false, isAnnualUpgrade: false };
    };

    const selectedPackage = packages.find(p => p.id === selectedPackageId);
    const comparison = selectedPackage ? getPackageComparison(selectedPackage) : null;
    const hasScheduledChange = !!(currentBundle.next_package_id && currentBundle.next_package_name);
    const expiryDate = new Date(currentBundle.expires_at);
    const formattedExpiry = `${expiryDate.getDate()} ${expiryDate.toLocaleDateString('en-GB', { month: 'short' })} ${expiryDate.getFullYear()} · ${expiryDate.getHours().toString().padStart(2, '0')}:${expiryDate.getMinutes().toString().padStart(2, '0')}`;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                hideClose
                className="max-w-[1800px] w-[95vw] sm:w-[90vw] overflow-visible p-0"
            >
                <DialogClose className="ring-offset-background focus:ring-ring absolute -top-3 -right-3 z-[70] rounded-full border border-border bg-background p-1.5 opacity-100 shadow-lg transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
                <div className="max-h-[85vh] overflow-y-auto overflow-x-visible p-6">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Package className="h-5 w-5" />
                        {t('title')}
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>

                {/* Scheduled Change Alert */}
                {hasScheduledChange && (
                    <div className="rounded-lg border-2 border-amber-500/30 bg-amber-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-amber-800">{t('scheduledChangeTitle')}</p>
                                <p className="text-sm text-amber-700 mt-1">
                                    {t('scheduledChangeDescription', { nextPlan: currentBundle.next_package_name, date: formattedExpiry })}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelScheduledChange}
                                    disabled={processing}
                                    className="mt-3 text-amber-700 border-amber-500/50 hover:bg-amber-500/20"
                                >
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <X className="h-4 w-4 mr-2" />
                                    )}
                                    {t('cancelScheduledChange')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Bundle Info */}
                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="bg-primary/10 text-xs sm:text-sm">{t('currentPlan')}</Badge>
                        <Badge variant="outline" className="text-xs">
                            {(currentBundle.validity_days > 0 && currentBundle.validity_days <= 31) ? t('monthly') :
                                (currentBundle.validity_days > 270) ? t('annual') : t('other')}
                        </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg sm:text-xl mb-1">{currentBundle.package_name.replace(/Minutes/i, t('minutes'))}</h3>
                            <p className="text-sm sm:text-base text-muted-foreground">
                                {t('minutesRemaining', { remaining: currentBundle.minutes_remaining, total: currentBundle.minutes_purchased })}
                            </p>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                            <div className="text-2xl sm:text-3xl font-bold mb-1">{formatNOK(currentBundle.purchase_price, locale)}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:justify-end">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                {t('expires', { date: formattedExpiry })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Available Packages */}
                <div className="mt-6">
                    <h4 className="font-semibold text-base sm:text-lg mb-1">
                        {t('selectNewPackage')}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        {currentIsAnnual
                            ? t('annualPlansOnly')
                            : currentIsMonthly
                                ? t('monthlyAndAnnualPlans')
                                : t('sameCycleOnly')}
                    </p>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t('noPackagesAvailable')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                            {packages.map((pkg) => {
                                const comparison = getPackageComparison(pkg);
                                // Current plan should already be filtered out, but check for safety
                                const isCurrent = pkg.id === currentBundle.package_id;
                                const isSelected = pkg.id === selectedPackageId;
                                const isScheduled = pkg.id === currentBundle.next_package_id;

                                // Safety check: if somehow current plan is in the list, skip it
                                if (isCurrent) {
                                    return null;
                                }

                                return (
                                    <button
                                        key={pkg.id}
                                        onClick={() => !isScheduled && setSelectedPackageId(pkg.id)}
                                        disabled={isScheduled}
                                        className={cn(
                                            'relative text-left p-5 rounded-lg border-2 transition-all w-full',
                                            isScheduled && 'opacity-75 cursor-not-allowed border-amber-500/50 bg-amber-500/5',
                                            !isScheduled && !isSelected && 'border-border hover:border-primary/50 hover:shadow-md',
                                            isSelected && 'border-primary bg-primary/5 shadow-md'
                                        )}
                                    >
                                        {/* Upgrade/Downgrade Badge */}
                                        {!isScheduled && (
                                            <div className="absolute top-3 right-3 flex gap-1.5">
                                                {comparison.type === 'upgrade' ? (
                                                    <Badge className="bg-green-500 text-white flex items-center gap-1 text-xs">
                                                        <ArrowUpCircle className="h-3 w-3" />
                                                        {comparison.isAnnualSwitch ? t('switchToAnnual') : t('upgrade')}
                                                    </Badge>
                                                ) : comparison.type === 'downgrade' ? (
                                                    <Badge className="bg-blue-500 text-white flex items-center gap-1 text-xs">
                                                        <ArrowDownCircle className="h-3 w-3" />
                                                        {t('downgrade')}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        )}

                                        {isScheduled && (
                                            <Badge className="absolute top-3 right-3 bg-amber-500 text-white text-xs">
                                                {t('scheduled')}
                                            </Badge>
                                        )}

                                        <div className="pr-20">
                                            <h3 className="font-semibold text-lg mb-2">{pkg.name.replace(/Minutes/i, t('minutes'))}</h3>
                                            <p className="text-sm text-muted-foreground leading-tight">
                                                {(pkg.validity_days > 0 && pkg.validity_days <= 31)
                                                    ? `${t('monthlySubscription')} - ${pkg.minutes} ${t('minutesPerMonth')}`
                                                    : `${pkg.minutes} ${t('minutesPerMonthForYear')}`
                                                }
                                                {pkg.name.includes('500') && <span className="whitespace-nowrap"> {t('bestValue')}</span>}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between pt-3 border-t gap-4">
                                            <div className="text-sm text-muted-foreground flex-shrink min-w-0">
                                                {t('packageDetails', { minutes: pkg.minutes, days: pkg.validity_days })}
                                            </div>
                                            <div className="text-xl font-bold whitespace-nowrap flex-shrink-0">
                                                {formatNOK(pkg.price, locale)}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Enterprise Card */}
                    <div className="mt-6 w-full">
                        <div className="relative rounded-xl border-2 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-5">
                            <div className="absolute -top-3 left-4 z-10">
                                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg px-3 py-1 text-sm">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {t('enterprise')}
                                </Badge>
                            </div>

                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                                        {t('enterprise')}
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {t('customPricing')}
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                                        {[t('unlimitedMinutes'), t('prioritySupport'), t('customIntegrations'), t('dedicatedManager')].map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 lg:items-end flex-shrink-0">
                                    <a
                                        href="tel:+4740556333"
                                        className={cn(
                                            "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-300",
                                            "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                                        )}
                                    >
                                        <Phone className="w-4 h-4" />
                                        {t('contactSales')}
                                    </a>
                                    <a
                                        href="mailto:contact@hello.ai"
                                        className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                        <Mail className="w-3 h-3" />
                                        contact@hello.ai
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Summary */}
                {selectedPackage && comparison && (
                    <div className="mt-4 rounded-lg border bg-muted/50 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                {comparison.isAnnualSwitch ? (
                                    <>
                                        <p className="font-semibold text-sm sm:text-base">
                                            {t('switchToAnnualPlan', { planName: selectedPackage.name })}
                                        </p>
                                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                            {t('annualSwitchSummary', { price: formatNOK(selectedPackage.price, locale), minutes: selectedPackage.minutes })}
                                        </p>
                                        <p className="text-xs sm:text-sm text-purple-600 font-medium mt-1.5">
                                            {t('annualSwitchKeepBundle')}
                                        </p>
                                    </>
                                ) : comparison.isAnnualUpgrade ? (
                                    <>
                                        <p className="font-semibold text-sm sm:text-base">
                                            {t('upgradeTo', { planName: selectedPackage.name })}
                                        </p>
                                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                            {t('annualUpgradeSummary', { minutes: selectedPackage.minutes })}
                                        </p>
                                        <p className="text-xs sm:text-sm text-green-600 font-medium mt-1.5">
                                            {t('annualUpgradeNewCycle')}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                <p className="font-semibold text-sm sm:text-base">
                                    {comparison.type === 'upgrade' ? t('upgradeTo', { planName: selectedPackage.name }) : t('downgradeTo', { planName: selectedPackage.name })}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                    {t('planChangePaymentSummary', { price: formatNOK(selectedPackage.price, locale) })}
                                </p>
                                <p className={`text-xs sm:text-sm font-medium mt-1.5 ${comparison.type === 'upgrade' ? 'text-green-600' : 'text-blue-600'}`}>
                                    {t('planChangeAppliesAtZero', { minutes: selectedPackage.minutes })}
                                </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={processing}
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={handleScheduleChange}
                        disabled={!selectedPackageId || processing || hasScheduledChange}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('processing')}
                            </>
                        ) : comparison?.isAnnualSwitch ? (
                            t('payAndSwitch')
                        ) : comparison?.type === 'upgrade' ? (
                            t('payAndUpgrade')
                        ) : comparison?.type === 'downgrade' ? (
                            t('payAndDowngrade')
                        ) : (
                            t('schedulePlanChange')
                        )}
                    </Button>
                </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}