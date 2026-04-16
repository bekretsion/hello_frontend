'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@/lib/currency';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import YourPlansSection from '@/components/billing/your-plans-section';
import NewUserBanner from '@/components/billing/new-user-banner';
import { useAuth } from '@/hooks/use-auth';
import { useBillingStore } from '@/stores/billing-store';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Zap, Clock, CreditCard, FileText, X, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export interface BillingSSRData {
    serviceAddons: ServiceAddon[];
    purchasedAddonIds: string[];
    receipt: any | null;
    hasActiveMinuteBundle: boolean;
    dailyTopupCount: number;
    minutesData: any | null;
}

interface BillingClientProps {
    ssrData: BillingSSRData;
}

export default function BillingClient({ ssrData }: BillingClientProps) {
    const billingStore = useBillingStore();
    const locale = useLocale();

    // Local UI state
    const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
    const [selectedMinuteBundles, setSelectedMinuteBundles] = useState<Map<string, { package: any; quantity: number }>>(new Map());
    const [dailyTopupLimit] = useState<number>(5);
    const [isUnifiedCheckout, setIsUnifiedCheckout] = useState(false);
    const [isReceiptProcessing, setIsReceiptProcessing] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const minuteSummaryRef = useRef<HTMLDivElement>(null);

    const t = useTranslations('billing');
    const { user } = useAuth();

    // --- SEED ZUSTAND WITH SSR DATA on first load (no hydration wait needed) ---
    useEffect(() => {
        // Seed store with SSR data when cache is empty or stale
        if (!billingStore.isInitialized || billingStore.isStale()) {
            billingStore.setServiceAddons(ssrData.serviceAddons);
            billingStore.setPurchasedAddonIds(new Set(ssrData.purchasedAddonIds));
            billingStore.setReceipt(ssrData.receipt);
            billingStore.markInitialized();
        }

        // Always sync per-user, per-request fields from latest SSR data.
        // This prevents a previous account's minute-bundle state from leaking
        // into a newly logged-in user when the store is already initialized.
        billingStore.setHasActiveMinuteBundle(ssrData.hasActiveMinuteBundle);
        billingStore.setDailyTopupCount(ssrData.dailyTopupCount);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- DERIVE STATE FROM STORE ---
    const serviceAddons = billingStore.serviceAddons;
    const setServiceAddons = billingStore.setServiceAddons;
    // FIX: stable selector + useMemo instead of getPurchasedAddonIds() creating new Set on every render
    const purchasedAddonIdsArray = useBillingStore(s => s.purchasedAddonIds);
    const purchasedAddonIds = useMemo(() => new Set(purchasedAddonIdsArray), [purchasedAddonIdsArray]);
    const setPurchasedAddonIds = billingStore.setPurchasedAddonIds;
    const receipt = billingStore.receipt;
    const setReceipt = billingStore.setReceipt;
    const receiptLoading = billingStore.receiptLoading;
    const setReceiptLoading = billingStore.setReceiptLoading;
    const hasActiveMinuteBundle = billingStore.hasActiveMinuteBundle;
    const setHasActiveMinuteBundle = billingStore.setHasActiveMinuteBundle;
    const dailyTopupCount = billingStore.dailyTopupCount;
    const setDailyTopupCount = billingStore.setDailyTopupCount;

    // --- FETCH HELPERS (client-side refreshes only) ---
    const fetchReceipt = async () => {
        try {
            setReceiptLoading(true);
            const response = await fetch('/api/receipts/my-receipt', { cache: 'no-store' });
            if (response.status === 404) { setReceipt(null); return; }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch receipt');
            }
            const data = await response.json();
            setReceipt(data.success && data.data ? data.data : null);
        } catch (error: any) {
            if (error.message && !error.message.includes('404') && error.message !== 'Failed to fetch receipt') {
                toast.error('Failed to load receipt', { description: error.message });
            }
            setReceipt(null);
        } finally {
            setReceiptLoading(false);
        }
    };

    const handleReceiptPayment = async () => {
        if (!receipt) return;
        try {
            setIsReceiptProcessing(true);
            setReceiptModalOpen(false);
            toast.loading('Redirecting to secure checkout...');
            const response = await fetch('/api/receipts/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiptId: receipt.id })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create checkout session');
            window.location.href = data.url;
        } catch (error: any) {
            toast.dismiss();
            toast.error('Payment failed', { description: error.message });
            setIsReceiptProcessing(false);
        }
    };

    const isTopupPackage = (pkg: any) => pkg.validity_days === 0 || pkg.id?.includes('topup');

    const getTotalTopupsInCart = () =>
        Array.from(selectedMinuteBundles.entries())
            .filter(([, item]) => isTopupPackage(item.package))
            .reduce((sum, [, item]) => sum + item.quantity, 0);

    const getTotalMinuteBundlesInCart = () =>
        Array.from(selectedMinuteBundles.entries())
            .filter(([, item]) => !isTopupPackage(item.package))
            .reduce((sum, [, item]) => sum + item.quantity, 0);

    const getRemainingTopupSlots = () => dailyTopupLimit - dailyTopupCount - getTotalTopupsInCart();

    const handleUnifiedCheckout = async () => {
        const hasAddons = selectedAddons.size > 0;
        const hasMinuteBundles = selectedMinuteBundles.size > 0;
        const needsAssistantSetup = user && !receipt && user.signup_status === 'receipt_assigned';

        if (!hasAddons && !hasMinuteBundles && !needsAssistantSetup) {
            toast.error('Please select items to checkout');
            return;
        }

        if (hasMinuteBundles) {
            const totalTopups = getTotalTopupsInCart();
            const maxTopupsAllowed = dailyTopupLimit - dailyTopupCount;
            if (totalTopups > maxTopupsAllowed) {
                toast.error(`Cannot checkout with ${totalTopups} top-ups. Daily limit: ${maxTopupsAllowed}.`);
                return;
            }
            if (getTotalMinuteBundlesInCart() > 1) {
                toast.error(`Cannot checkout with more than 1 minute bundle at a time.`);
                return;
            }
        }

        setIsUnifiedCheckout(true);
        toast.loading('Creating checkout session for all items...');

        try {
            const minuteItems = hasMinuteBundles
                ? Array.from(selectedMinuteBundles.entries()).map(([packageId, item]) => ({
                    packageId, quantity: item.quantity,
                    name: `${item.package.minutes} Minutes`,
                    price: parseFloat(item.package.price)
                }))
                : undefined;

            const payload: any = {
                planId: hasAddons ? 'addon-only-package' : 'unified-checkout',
                planName: 'Unified Checkout',
                addonIds: hasAddons ? Array.from(selectedAddons) : [],
                totalDueToday: quote.totalDueToday || 0
            };
            if (minuteItems?.length) payload.minuteItems = minuteItems;
            if (needsAssistantSetup) payload.assistantSetup = true;

            const response = await fetch('/api/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create checkout session');
            toast.success('Redirecting to checkout...');
            window.location.href = data.url;
        } catch (error) {
            toast.dismiss();
            const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
            toast.error('Checkout Failed', { description: errorMessage });
            setIsUnifiedCheckout(false);
        }
    };

    const handleQuickTopup = async () => {
        if (!hasActiveMinuteBundle) {
            toast.error('You need an active minute bundle before purchasing top-ups.');
            return;
        }
        toast.loading('Loading 100-minute top-up...');
        try {
            const currentTopups = getTotalTopupsInCart();
            const maxTopups = dailyTopupLimit - dailyTopupCount;
            if (currentTopups >= maxTopups) {
                toast.dismiss();
                toast.error(`Top-up limit reached! Maximum ${maxTopups} per day.`);
                return;
            }
            const packagesResponse = await fetch('/api/minutes/packages');
            if (!packagesResponse.ok) throw new Error('Failed to fetch packages');
            const packagesData = await packagesResponse.json();
            const emergencyPackage = packagesData.topups?.find((pkg: any) => pkg.id === 'topup-100') ||
                packagesData.topups?.find((pkg: any) => pkg.validity_days === 0 && pkg.minutes >= 100) ||
                packagesData.topups?.[0];
            if (!emergencyPackage) throw new Error('100-minute top-up package not found');

            const newBundles = new Map(selectedMinuteBundles);
            const existing = newBundles.get(emergencyPackage.id);
            newBundles.set(emergencyPackage.id, { package: emergencyPackage, quantity: (existing?.quantity || 0) + 1 });
            setSelectedMinuteBundles(newBundles);
            toast.dismiss();
            toast.success(t('messages.emergencyTopupAdded', { current: currentTopups + 1, max: maxTopups }));
            setTimeout(() => minuteSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to add top-up', { description: error instanceof Error ? error.message : 'Unknown error' });
        }
    };

    const handleAddMinuteBundle = (packageData: any) => {
        const isTopup = isTopupPackage(packageData);
        if (isTopup) {
            if (!hasActiveMinuteBundle) { toast.error('You need an active minute bundle before purchasing top-ups.'); return; }
            if (getTotalTopupsInCart() >= dailyTopupLimit - dailyTopupCount) { toast.error(`Top-up limit reached!`); return; }
        } else {
            if (hasActiveMinuteBundle) { toast.error(`You already have an active minute bundle!`); return; }
            if (getTotalMinuteBundlesInCart() >= 1) { toast.error(`You can only add 1 minute bundle at a time.`); return; }
        }
        const newBundles = new Map(selectedMinuteBundles);
        const existing = newBundles.get(packageData.id);
        newBundles.set(packageData.id, { package: packageData, quantity: (existing?.quantity || 0) + 1 });
        setSelectedMinuteBundles(newBundles);
        if (isTopup) {
            toast.success(t('messages.emergencyTopupAdded', { current: getTotalTopupsInCart() + 1, max: dailyTopupLimit - dailyTopupCount }));
        } else {
            toast.success(`Minute bundle added! (1/1 bundle)`);
        }
        setTimeout(() => minuteSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    };

    const handleRemoveMinuteBundle = (packageId: string) => {
        const newBundles = new Map(selectedMinuteBundles);
        newBundles.delete(packageId);
        setSelectedMinuteBundles(newBundles);
        toast.success('Package removed from cart');
    };

    const handleIncreaseQuantity = (packageId: string) => {
        const existing = selectedMinuteBundles.get(packageId);
        if (!existing) return;
        if (!isTopupPackage(existing.package)) { toast.error(`Minute bundles are limited to 1 at a time.`); return; }
        if (getTotalTopupsInCart() >= dailyTopupLimit - dailyTopupCount) { toast.error(`Top-up limit reached!`); return; }
        const newBundles = new Map(selectedMinuteBundles);
        newBundles.set(packageId, { ...existing, quantity: existing.quantity + 1 });
        setSelectedMinuteBundles(newBundles);
        toast.success(`Quantity increased! (${getTotalTopupsInCart() + 1}/${dailyTopupLimit - dailyTopupCount} top-ups)`);
    };

    const handleDecreaseQuantity = (packageId: string) => {
        const newBundles = new Map(selectedMinuteBundles);
        const existing = newBundles.get(packageId);
        if (existing && existing.quantity > 1) {
            newBundles.set(packageId, { ...existing, quantity: existing.quantity - 1 });
            setSelectedMinuteBundles(newBundles);
        }
    };

    const handleAddonToggle = (addonId: string) => {
        if (purchasedAddonIds.has(addonId)) { toast.error('This add-on is already purchased and active on your account'); return; }
        if (addonId.toLowerCase().includes('topup') && !hasActiveMinuteBundle) {
            toast.error('You need an active minute bundle before purchasing top-ups.'); return;
        }
        setSelectedAddons((prevSelected) => {
            const newSelected = new Set(prevSelected);
            const isAdding = !newSelected.has(addonId);
            if (isAdding) newSelected.add(addonId); else newSelected.delete(addonId);
            const addon = serviceAddons.find((a) => a.id === addonId);
            const addonKeySuffix = addon?.name_key?.split('.').pop();
            const addonName = addonKeySuffix ? t(`services.${addonKeySuffix}`) : t('addOns.genericName');
            if (isAdding) toast.success(t('addOns.addedToPackage', { name: addonName }));
            else toast.info(t('addOns.removedFromPackage', { name: addonName }));
            return newSelected;
        });
    };

    const quote = useMemo(() => {
        const BUNDLE_DISCOUNT_THRESHOLD = 3;
        const BUNDLE_DISCOUNT_PERCENT = 0.1;
        let addonsMonthlyCost = 0;
        let addonsSetupCost = 0;
        selectedAddons.forEach((addonId) => {
            const addon = serviceAddons.find((a) => a.id === addonId);
            if (addon) {
                addonsMonthlyCost += parseFloat(addon.monthly_price.toString());
                addonsSetupCost += parseFloat(addon.setup_fee.toString());
            }
        });
        const discountApplied = selectedAddons.size >= BUNDLE_DISCOUNT_THRESHOLD;
        const monthlyDiscountAmount = discountApplied ? addonsMonthlyCost * BUNDLE_DISCOUNT_PERCENT : 0;
        const totalMonthlyCost = addonsMonthlyCost - monthlyDiscountAmount;
        const minuteBundleCost = Array.from(selectedMinuteBundles.values())
            .reduce((sum, item) => sum + (parseFloat(item.package.price) * item.quantity), 0);
        const totalDueToday = totalMonthlyCost + addonsSetupCost + minuteBundleCost;
        return { addonsMonthlyCost, addonsSetupCost, discountApplied, monthlyDiscountAmount, totalMonthlyCost, minuteBundleCost, totalDueToday };
    }, [selectedAddons, serviceAddons, selectedMinuteBundles]);

    return (
        <PageContainer>
            {/* Note: heading is rendered in page.tsx (server component) above this Suspense boundary */}
            <div className='flex w-full flex-col items-center space-y-3 sm:space-y-4 pt-1 px-2 sm:px-4 md:px-6 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-emerald-50/30 dark:from-slate-900/50 dark:via-slate-800/30 dark:to-slate-900/50 min-h-screen'>

                {/* Receipt Loading Spinner */}
                {user && receiptLoading && (
                    <div className='w-full max-w-7xl'>
                        <Card className='w-full'>
                            <CardContent className='p-4 sm:p-6 md:p-8 flex items-center justify-center'>
                                <Loader2 className='h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground' />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Receipt Notification Bar */}
                {user && !receiptLoading && receipt && receipt.status === 'assigned' && (
                    <div className='w-full max-w-7xl'>
                        <div
                            className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => setReceiptModalOpen(true)}
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                            <p className="font-semibold text-sm sm:text-base text-blue-900 truncate">Custom Receipt #{receipt.receipt_number}</p>
                                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-200 text-blue-800 rounded w-fit">Pending Payment</span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-blue-700 mt-1">
                                            Total: <span className="font-semibold">${parseFloat(receipt.total).toFixed(2)}</span>
                                            {receipt.items?.length > 0 && <span className="ml-2">• {receipt.items.length} item{receipt.items.length > 1 ? 's' : ''}</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setReceiptModalOpen(true); }} className="w-full sm:w-auto text-xs sm:text-sm">
                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />View
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                                        <FileText className='h-4 w-4 sm:h-5 sm:w-5' />Receipt #{receipt.receipt_number}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm">Custom Receipt • Pending Payment</DialogDescription>
                                </DialogHeader>
                                <div className='space-y-4 sm:space-y-6 mt-4'>
                                    {receipt.items?.length > 0 && (
                                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                                            <Table className="min-w-[500px]">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs sm:text-sm">Description</TableHead>
                                                        <TableHead className="text-right text-xs sm:text-sm">Qty</TableHead>
                                                        <TableHead className="text-right text-xs sm:text-sm">Price</TableHead>
                                                        <TableHead className="text-right text-xs sm:text-sm">Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {receipt.items.map((item: any) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium text-xs sm:text-sm max-w-[200px] truncate">{item.description}</TableCell>
                                                            <TableCell className="text-right text-xs sm:text-sm">{item.quantity}</TableCell>
                                                            <TableCell className="text-right text-xs sm:text-sm">${parseFloat(item.unit_price).toFixed(2)}</TableCell>
                                                            <TableCell className="text-right text-xs sm:text-sm">${parseFloat(item.total).toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>${parseFloat(receipt.subtotal).toFixed(2)}</span></div>
                                        {receipt.tax_amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({receipt.tax_rate}%):</span><span>${parseFloat(receipt.tax_amount).toFixed(2)}</span></div>}
                                        {receipt.discount_amount > 0 && <div className="flex justify-between text-green-600"><span className="text-muted-foreground">Discount:</span><span>-${parseFloat(receipt.discount_amount).toFixed(2)}</span></div>}
                                        <Separator />
                                        <div className="flex justify-between text-base sm:text-lg font-bold pt-2"><span>Total:</span><span>${parseFloat(receipt.total).toFixed(2)}</span></div>
                                    </div>
                                    {receipt.notes && (<><Separator /><div><h4 className="font-semibold mb-2">Notes</h4><p className="text-sm text-muted-foreground whitespace-pre-line">{receipt.notes}</p></div></>)}
                                    {receipt.terms && (<><Separator /><div><h4 className="font-semibold mb-2">Terms</h4><p className="text-sm text-muted-foreground whitespace-pre-line">{receipt.terms}</p></div></>)}
                                </div>
                                <div className="mt-4 sm:mt-6 pt-4 border-t">
                                    <Button className='w-full text-sm sm:text-base' size='lg' onClick={handleReceiptPayment} disabled={isReceiptProcessing}>
                                        {isReceiptProcessing ? (
                                            <><Loader2 className='mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin' /><span className="hidden sm:inline">Processing...</span><span className="sm:hidden">Processing</span></>
                                        ) : (
                                            <><CreditCard className='mr-2 h-4 w-4 sm:h-5 sm:w-5' /><span className="hidden sm:inline">Pay ${parseFloat(receipt.total).toFixed(2)} with Stripe</span><span className="sm:hidden">Pay ${parseFloat(receipt.total).toFixed(2)}</span></>
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {/* No Receipt (meeting attended) */}
                {user && !receiptLoading && !receipt && user.signup_status === 'meeting_attended' && (
                    <div className='w-full max-w-7xl'>
                        <Card className='w-full'>
                            <CardHeader className='p-4 sm:p-6'>
                                <CardTitle className="text-lg sm:text-xl">Preparing Your Custom Receipt</CardTitle>
                                <CardDescription className='text-xs sm:text-sm'>We are preparing your custom receipt. Please wait for it to be assigned.</CardDescription>
                            </CardHeader>
                            <CardContent className='p-4 sm:p-6 pt-0'>
                                <p className="text-sm sm:text-base text-muted-foreground">Your receipt will appear here once it's ready. You'll receive an email notification when it's available.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Assistant Setup Payment fallback */}
                {user && !receipt && user.signup_status === 'receipt_assigned' && (
                    <div className='w-full max-w-7xl'>
                        <Card className='w-full border-emerald-200/60 shadow-emerald-100'>
                            <CardHeader className='p-4 sm:p-6'>
                                <CardTitle className="text-lg sm:text-xl">Complete Your Assistant Setup</CardTitle>
                                <CardDescription className='text-xs sm:text-sm'>Your demo meeting is complete. Pay the one-time setup fee to start activation (ready in 2 business days).</CardDescription>
                            </CardHeader>
                            <CardContent className='p-4 sm:p-6 pt-0'>
                                <div className='text-xs sm:text-sm text-muted-foreground'>Secure Stripe checkout • Webhook-verified • Email confirmation</div>
                            </CardContent>
                            <CardFooter className='p-4 sm:p-6 pt-0'>
                                <Button className='w-full text-sm sm:text-base' size='lg' onClick={handleUnifiedCheckout} disabled={isUnifiedCheckout}>
                                    {isUnifiedCheckout ? <><Loader2 className='mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin' />Processing...</> : <><CheckCircle2 className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />Pay Setup Fee</>}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}

                {/* New User Banner — pre-fetched minutes data passed to skip its own fetch */}
                <div className='w-full max-w-7xl'>
                    <NewUserBanner className="mb-6" prefetchedMinutesData={ssrData.minutesData} />
                </div>

                {/* Your Plans Section — pre-fetched minutes data passed to skip duplicate fetch */}
                <div className='w-full max-w-7xl' data-section="your-plans">
                    <YourPlansSection
                        onUpgrade={() => {
                            document.querySelector('[data-section="your-plans"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        onAddMinutes={handleQuickTopup}
                        onAddPackage={handleAddMinuteBundle}
                        selectedAddons={selectedAddons}
                        onAddonToggle={handleAddonToggle}
                        purchasedAddonIds={purchasedAddonIds}
                        serviceAddons={serviceAddons}
                        hasActiveMinuteBundle={hasActiveMinuteBundle}
                        prefetchedMinutesData={ssrData.minutesData}
                    />
                </div>

                {/* Summary / Cart Card */}
                <div className='w-full max-w-7xl'>
                    <Card className='w-full shadow-2xl shadow-blue-100/30 border border-blue-100/50 dark:border-slate-700/30 bg-gradient-to-br from-white/90 via-blue-50/30 to-white/90 dark:from-slate-900/90 dark:via-slate-800/40 dark:to-slate-900/90 backdrop-blur-xl ring-1 ring-blue-100/30'>
                        <CardHeader className="bg-gradient-to-r from-blue-50/40 via-emerald-50/20 to-blue-50/40 dark:from-slate-800/40 dark:via-slate-700/20 dark:to-slate-800/40 border-b border-blue-100/30 dark:border-slate-700/30 rounded-t-lg p-4 sm:p-6">
                            <CardTitle className="flex items-center space-x-2 sm:space-x-4 text-lg sm:text-xl lg:text-2xl">
                                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-100/80 to-emerald-100/80 dark:from-slate-700/80 dark:to-slate-600/80 ring-1 ring-blue-200/30 shadow-lg flex-shrink-0">
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="font-light tracking-tight text-slate-800 dark:text-slate-100">{t('quote.title')}</span>
                            </CardTitle>
                            <CardDescription className="text-sm sm:text-base lg:text-lg mt-2 sm:mt-3 text-slate-600 dark:text-slate-300 font-light">{t('quote.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4 sm:space-y-6 p-4 sm:p-6'>
                            {(selectedMinuteBundles.size > 0 || selectedAddons.size > 0) ? (
                                <>
                                    <div ref={minuteSummaryRef} className="space-y-3 sm:space-y-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />Your Cart
                                            </h3>
                                            <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-2 sm:gap-4">
                                                {selectedMinuteBundles.size > 0 && (<><span>Bundles: {getTotalMinuteBundlesInCart()}/1</span><span className="hidden sm:inline">•</span><span>Top-ups: {getTotalTopupsInCart()}/{dailyTopupLimit - dailyTopupCount}</span></>)}
                                                {selectedAddons.size > 0 && (<>{selectedMinuteBundles.size > 0 && <span className="hidden sm:inline">•</span>}<span>Add-ons: {selectedAddons.size} selected</span></>)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-muted/50 p-3 sm:p-4 md:p-5 backdrop-blur-sm'>
                                        <div className='flex items-center justify-between mb-3 sm:mb-4'>
                                            <div className="flex items-center space-x-2 sm:space-x-3">
                                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                <span className="font-semibold text-sm sm:text-base">Selected Items ({selectedMinuteBundles.size + selectedAddons.size})</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 sm:space-y-4">
                                            {Array.from(selectedMinuteBundles.entries()).map(([packageId, item]) => (
                                                <div key={packageId} className="p-3 sm:p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-blue-200/30">
                                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                                                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                                            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                                                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold text-base sm:text-lg">{item.package.minutes} Minutes</div>
                                                                <div className="text-xs sm:text-sm text-muted-foreground">{item.package.validity_days === 0 ? 'Never expires' : `Valid for ${item.package.validity_days} days`}</div>
                                                                <div className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(parseFloat(item.package.price), locale)} each</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                                                            {isTopupPackage(item.package) ? (
                                                                <>
                                                                    <div className="flex items-center gap-2 border border-border rounded-lg p-1">
                                                                        <Button variant="ghost" size="sm" onClick={() => handleDecreaseQuantity(packageId)} disabled={item.quantity <= 1} className="h-7 w-7 sm:h-8 sm:w-8 p-0">-</Button>
                                                                        <span className="w-6 sm:w-8 text-center font-semibold text-xs sm:text-sm">{item.quantity}</span>
                                                                        <Button variant="ghost" size="sm" onClick={() => handleIncreaseQuantity(packageId)} disabled={getRemainingTopupSlots() <= 0} className="h-7 w-7 sm:h-8 sm:w-8 p-0">+</Button>
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground">Top-up {item.quantity}/{dailyTopupLimit - dailyTopupCount}</span>
                                                                </>
                                                            ) : <div className="text-xs sm:text-sm text-muted-foreground">Quantity: 1 (max)</div>}
                                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveMinuteBundle(packageId)} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-6 sm:h-7">Remove</Button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-border/30 flex justify-between items-center">
                                                        <span className="text-xs sm:text-sm text-muted-foreground">Subtotal:</span>
                                                        <span className="font-semibold text-sm sm:text-base">{formatCurrency(parseFloat(item.package.price) * item.quantity, locale)}</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {Array.from(selectedAddons).map((addonId) => {
                                                const addon = serviceAddons.find((a) => a.id === addonId);
                                                return addon ? (
                                                    <div key={addonId} className="p-3 sm:p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-blue-200/30">
                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                                                            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                                                <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0">
                                                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-semibold text-base sm:text-lg">{t(`services.${addon.name_key.split('.').pop()}`)}</div>
                                                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                                                        {t('quote.monthlySubscription')}{Number(addon.setup_fee) > 0 && ` • + ${formatCurrency(Number(addon.setup_fee), locale)} setup`}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                                                <span className="font-semibold text-sm sm:text-base">{formatCurrency(parseFloat(addon.monthly_price.toString()), locale)}{t('pricing.perMonth')}</span>
                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 flex-shrink-0" onClick={() => handleAddonToggle(addonId)}>
                                                                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                        {quote.discountApplied && (
                                            <div className='mt-3 flex items-center justify-between text-sm text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md border border-green-200/50'>
                                                <span>{t('bundles.bundleDiscount')} (10%)</span>
                                                <span>-{formatCurrency(quote.monthlyDiscountAmount, locale)}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg bg-muted/10">
                                    {t('quote.noServicesSelected')}
                                </div>
                            )}

                            <div className="pt-3 sm:pt-4 border-t-2 border-border/50">
                                {quote.minuteBundleCost > 0 && (
                                    <div className="flex justify-between items-center mb-2 text-xs sm:text-sm text-muted-foreground">
                                        <span>Minute Bundles</span><span className='font-medium text-slate-800 dark:text-slate-200'>{formatCurrency(quote.minuteBundleCost, locale)}</span>
                                    </div>
                                )}
                                {quote.addonsMonthlyCost > 0 && (
                                    <div className="flex justify-between items-center mb-2 text-xs sm:text-sm text-muted-foreground">
                                        <span>{t('quote.addOnServices')}</span><span className='font-medium text-slate-800 dark:text-slate-200'>{formatCurrency(quote.addonsMonthlyCost, locale)}{t('pricing.perMonth')}</span>
                                    </div>
                                )}
                                {quote.addonsSetupCost > 0 && (
                                    <div className="flex justify-between items-start sm:items-center mb-2 text-xs sm:text-sm text-amber-600 font-medium gap-2">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span>{t('quote.oneTimeSetupFees')}</span>
                                            <span className="text-[10px] sm:text-xs font-normal opacity-80">{t('quote.setupFeeDescription')}</span>
                                        </div>
                                        <span className="flex-shrink-0">+{formatCurrency(quote.addonsSetupCost, locale)}</span>
                                    </div>
                                )}
                                <Separator className="my-2 sm:my-3" />
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-sm sm:text-base">{t('quote.totalDueToday')}</span>
                                    <div className="flex flex-col items-end">
                                        <span className='text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400'>
                                            {formatCurrency(quote.totalDueToday, locale)}
                                        </span>
                                        {quote.totalMonthlyCost > 0 && (
                                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                                                {t('quote.monthlyRecurring')}: {formatCurrency(quote.totalMonthlyCost, locale)}{t('pricing.perMonth')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className='mt-4 sm:mt-6'>
                                <Button
                                    size='lg'
                                    className='w-full text-sm sm:text-base lg:text-lg h-10 sm:h-12 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all font-semibold'
                                    onClick={handleUnifiedCheckout}
                                    disabled={
                                        (selectedAddons.size === 0 && selectedMinuteBundles.size === 0 && !(user && !receipt && user.signup_status === 'receipt_assigned')) ||
                                        isUnifiedCheckout
                                    }
                                >
                                    {isUnifiedCheckout ? (
                                        <><Loader2 className='mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin' />{t('checkout.redirecting')}</>
                                    ) : (
                                        <><CheckCircle2 className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />{t('quote.proceedToCheckout')}</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}
