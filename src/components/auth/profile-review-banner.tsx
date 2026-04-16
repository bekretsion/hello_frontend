'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ReviewStatus = 'incomplete' | 'under_review' | 'pending' | 'approved' | 'rejected' | null;

interface UserStatusData {
    reviewStatus: ReviewStatus;
    rejectionReason?: string;
    isOnboardingComplete: boolean;
}

export function ProfileReviewBanner() {
    const { user } = useAuth();
    const [statusData, setStatusData] = useState<UserStatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStatus = async (showToast = false) => {
        if (showToast) {
            setRefreshing(true);
        }

        try {
            const response = await fetch('/api/onboarding/status', {
                method: 'GET',
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();
                const status = data.status || data;

                setStatusData({
                    reviewStatus: status.reviewStatus || status.review_status || null,
                    rejectionReason: status.rejectionReason || status.rejection_reason,
                    isOnboardingComplete: status.isOnboardingComplete || status.is_onboarding_complete || false,
                });

                if (showToast) {
                    if (status.reviewStatus === 'approved' || status.review_status === 'approved') {
                        toast.success('Your profile has been approved!', {
                            description: 'You now have full dashboard access.',
                        });
                    } else {
                        toast.info('Status checked', {
                            description: 'Your profile is still under review.',
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching review status:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchStatus();
        } else {
            setLoading(false);
        }
    }, [user?.id]);

    // Don't show banner if:
    // - Still loading
    // - User is already approved
    // - Status is null/incomplete (not yet submitted)
    if (loading || !statusData) {
        return null;
    }

    const { reviewStatus, rejectionReason, isOnboardingComplete } = statusData;

    // Only show banner for under_review/pending status
    if (reviewStatus !== 'under_review' && reviewStatus !== 'pending') {
        // Show rejection banner if rejected
        if (reviewStatus === 'rejected' && isOnboardingComplete) {
            return (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-800">
                                Profile Not Approved
                            </h3>
                            <p className="text-sm text-red-700 mt-1">
                                Your profile was not approved. Please update your information and resubmit.
                            </p>
                            {rejectionReason && (
                                <p className="text-sm text-red-600 mt-2 bg-red-100 p-2 rounded">
                                    <strong>Reason:</strong> {rejectionReason}
                                </p>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                                onClick={() => window.location.href = '/dashboard/onboarding'}
                            >
                                Update Profile
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-800">
                        Profile Under Review
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                        Your profile has been submitted and is currently being reviewed by our team.
                        You will be notified via email once your profile is approved.
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                        <p className="text-xs text-amber-600">
                            Review typically takes 1-2 business days.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-700 hover:bg-amber-100 h-7 px-2"
                            onClick={() => fetchStatus(true)}
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Check Status
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
