'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    MoreVertical,
    Clock,
    Settings,
    RefreshCw,
    CreditCard,
    AlertCircle,
    CheckCircle2,
    Zap,
    ArrowUpCircle,
    XCircle,
    Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatNOK } from '@/lib/currency';
import { useTranslations, useLocale } from 'next-intl';

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

interface CurrentPlanCardProps {
    bundle: MinuteBundle;
    onUpgrade?: () => void;
    onRenew?: () => void;
    onRefresh?: () => void;
}

export default function CurrentPlanCard({ bundle, onUpgrade, onRenew, onRefresh }: CurrentPlanCardProps) {
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const t = useTranslations('billing');
    const locale = useLocale();
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate days until expiry
    const expiryDate = new Date(bundle.expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    const isExpired = daysUntilExpiry <= 0;

    // Calculate usage percentage
    const usagePercentage = bundle.minutes_purchased > 0
        ? Math.round(((bundle.minutes_purchased - bundle.minutes_remaining) / bundle.minutes_purchased) * 100)
        : 0;

    // Get remaining percentage for visual
    const remainingPercentage = bundle.minutes_purchased > 0
        ? (bundle.minutes_remaining / bundle.minutes_purchased) * 100
        : 0;

    // Format the package name nicely (localized)
    const formatPackageName = (name?: string, packageId?: string) => {
        if (name) return name;
        if (packageId) {
            // Parse package ID like "minutes-500-365" to localized "{count} minutes"
            const match = packageId.match(/minutes-(\d+)/);
            if (match) {
                const count = Number(match[1]);
                return t('settingsPage.currentBundle.minutesLabel', { count });
            }
        }
        return t('settingsPage.currentBundle.fallbackName');
    };

    const handleManageSubscription = async () => {
        try {
            setIsProcessing(true);
            toast.loading('Opening billing portal...');

            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to open billing portal');
            }

            const data = await response.json();
            window.location.href = data.url;
        } catch (error: any) {
            toast.dismiss();
            toast.error('Failed to open billing portal', { description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelPlan = async () => {
        try {
            setIsProcessing(true);
            toast.loading('Processing cancellation...');

            // Note: This would typically call an API to cancel the subscription
            // For minute bundles, cancellation might mean different things:
            // - Disable auto-renewal
            // - Mark as inactive (keeps remaining minutes until expiry)

            const response = await fetch('/api/minutes/cancel-bundle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bundleId: bundle.id })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to cancel plan');
            }

            toast.dismiss();
            toast.success('Auto-renewal cancelled', {
                description: 'Your plan will remain active until it expires. You can continue using your remaining minutes.'
            });
            setShowCancelDialog(false);
            onRefresh?.();
        } catch (error: any) {
            toast.dismiss();
            toast.error('Failed to cancel plan', { description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <Card className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-emerald-50/20 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 border-2 border-blue-200/60 dark:border-blue-800/40 shadow-xl">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

                {/* Current Plan Badge */}
                <div className="absolute top-3 left-3">
                    <Badge className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white border-0 shadow-lg text-xs px-3 py-1">
                        <CheckCircle2 className="w-3 h-3 mr-1.5" />
                        Current Plan
                    </Badge>
                </div>

                {/* Manage Icon - Top Right */}
                <div className="absolute top-3 right-3 z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700/80"
                            >
                                <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <span className="sr-only">Manage plan</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onUpgrade}>
                                <ArrowUpCircle className="mr-2 h-4 w-4" />
                                Upgrade Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onRenew}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Renew Early
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleManageSubscription}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Manage Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = '/dashboard/billing/settings'}>
                                <Settings className="mr-2 h-4 w-4" />
                                Billing Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setShowCancelDialog(true)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Auto-Renewal
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <CardContent className="pt-12 pb-6 px-6">
                    {/* Plan Name & Info */}
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            {formatPackageName(bundle.package_name, bundle.package_id)}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {bundle.is_topup ? 'Emergency Top-up' : 'Minute Bundle'}
                        </p>
                    </div>

                    {/* Visual Progress Circle */}
                    <div className="relative w-32 h-32 mx-auto mb-6">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="plan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                            {/* Background track */}
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                className="text-slate-200 dark:text-slate-700"
                            />
                            {/* Progress arc */}
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="url(#plan-gradient)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 42}`}
                                strokeDashoffset={`${2 * Math.PI * 42 * (1 - remainingPercentage / 100)}`}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        {/* Center content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                                {bundle.minutes_remaining}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                minutes left
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {bundle.minutes_purchased}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Total Minutes</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {usagePercentage}%
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Used</div>
                        </div>
                    </div>

                    {/* Expiry Info */}
                    <div className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-lg border",
                        isExpired
                            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                            : isExpiringSoon
                                ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400"
                                : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                    )}>
                        {isExpired ? (
                            <>
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Expired</span>
                            </>
                        ) : isExpiringSoon ? (
                            <>
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Valid until {expiryDate.toLocaleDateString()}</span>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-600" />
                            Plan Details
                        </DialogTitle>
                        <DialogDescription>
                            Full details of your current minute plan
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Package</span>
                                <p className="font-medium">{formatPackageName(bundle.package_name, bundle.package_id)}</p>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Status</span>
                                <p className="font-medium capitalize">{bundle.status}</p>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Total Minutes</span>
                                <p className="font-medium">{bundle.minutes_purchased}</p>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Remaining</span>
                                <p className="font-medium">{bundle.minutes_remaining}</p>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Purchased</span>
                                <p className="font-medium">{new Date(bundle.purchased_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Expires</span>
                                <p className="font-medium">{expiryDate.toLocaleDateString()}</p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-slate-500 dark:text-slate-400">Purchase Price</span>
                                <p className="font-medium">{formatNOK(bundle.purchase_price, locale)}</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            Cancel Auto-Renewal
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel auto-renewal for this plan?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                <strong>Note:</strong> Your plan will remain active until the expiry date. You'll keep all remaining minutes ({bundle.minutes_remaining} minutes) until then.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                            disabled={isProcessing}
                        >
                            Keep Plan
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelPlan}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Cancel Auto-Renewal'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
