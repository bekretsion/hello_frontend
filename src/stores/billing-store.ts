// stores/billing-store.ts
// Zustand store for billing data caching to prevent refetching on navigation

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

interface BillingState {
    // Data
    serviceAddons: ServiceAddon[];
    purchasedAddonIds: string[]; // Changed to array for JSON serialization
    receipt: any | null;
    hasActiveMinuteBundle: boolean;
    dailyTopupCount: number;

    // Loading states
    isInitialized: boolean;
    isLoading: boolean;
    receiptLoading: boolean;

    // Hydration state - prevents flash of loading state
    hasHydrated: boolean;

    // Last fetch timestamp (for stale-while-revalidate pattern)
    lastFetchedAt: number | null;

    // Actions
    setServiceAddons: (addons: ServiceAddon[]) => void;
    setPurchasedAddonIds: (ids: Set<string>) => void;
    getPurchasedAddonIds: () => Set<string>;
    setReceipt: (receipt: any | null) => void;
    setHasActiveMinuteBundle: (hasBundle: boolean) => void;
    setDailyTopupCount: (count: number) => void;
    setIsLoading: (loading: boolean) => void;
    setReceiptLoading: (loading: boolean) => void;
    markInitialized: () => void;
    invalidateCache: () => void;
    isStale: () => boolean;
    setHasHydrated: (state: boolean) => void;
}

// Cache is considered stale after 5 minutes
const STALE_TIME_MS = 5 * 60 * 1000;

export const useBillingStore = create<BillingState>()(
    persist(
        (set, get) => ({
            // Initial state
            serviceAddons: [],
            purchasedAddonIds: [], // Array for JSON serialization
            receipt: null,
            hasActiveMinuteBundle: false,
            dailyTopupCount: 0,

            isInitialized: false,
            isLoading: false,
            receiptLoading: false, // Start with false to prevent blink
            hasHydrated: false,
            lastFetchedAt: null,

            // Actions
            setServiceAddons: (addons) => set({ serviceAddons: addons }),

            // Convert Set to Array for storage, but accept Set as input
            setPurchasedAddonIds: (ids) => set({ purchasedAddonIds: Array.from(ids) }),

            // Helper to get as Set for component usage
            getPurchasedAddonIds: () => new Set(get().purchasedAddonIds),

            setReceipt: (receipt) => set({ receipt }),

            setHasActiveMinuteBundle: (hasBundle) => set({ hasActiveMinuteBundle: hasBundle }),

            setDailyTopupCount: (count) => set({ dailyTopupCount: count }),

            setIsLoading: (loading) => set({ isLoading: loading }),

            setReceiptLoading: (loading) => set({ receiptLoading: loading }),

            markInitialized: () => set({
                isInitialized: true,
                lastFetchedAt: Date.now()
            }),

            invalidateCache: () => set({
                isInitialized: false,
                lastFetchedAt: null
            }),

            isStale: () => {
                const { lastFetchedAt } = get();
                if (!lastFetchedAt) return true;
                return Date.now() - lastFetchedAt > STALE_TIME_MS;
            },

            setHasHydrated: (state) => set({ hasHydrated: state }),
        }),
        {
            name: 'billing-store', // Key in sessionStorage
            storage: createJSONStorage(() => sessionStorage), // Use sessionStorage (clears on browser close)
            partialize: (state) => ({
                // Only persist these fields
                serviceAddons: state.serviceAddons,
                purchasedAddonIds: state.purchasedAddonIds,
                receipt: state.receipt,
                hasActiveMinuteBundle: state.hasActiveMinuteBundle,
                dailyTopupCount: state.dailyTopupCount,
                isInitialized: state.isInitialized,
                lastFetchedAt: state.lastFetchedAt,
            }),
            onRehydrateStorage: () => (state) => {
                // Called when store is rehydrated from sessionStorage
                state?.setHasHydrated(true);
            },
        }
    )
);
