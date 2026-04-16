'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type OnboardingStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'unknown';

export default function PendingReviewPage() {
    const router = useRouter();
    const [status, setStatus] = useState<OnboardingStatus>('pending');
    const [loading, setLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState<string>('');

    const checkStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/onboarding/status', {
                method: 'GET',
            });

            const result = await response.json();

            if (response.ok) {
                // Assuming the backend returns { status: 'pending' | 'under_review' | 'approved' | 'rejected', reason?: string }
                // Normalize 'under_review' to 'pending' for display purposes
                const responseStatus = result.status || 'pending';
                setStatus(responseStatus === 'under_review' ? 'pending' : responseStatus);
                if (result.reason) {
                    setRejectionReason(result.reason);
                }

                // If approved, redirect to login
                if (result.status === 'approved') {
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#83d2df] via-[#6bb8c7] to-[#5a9fb0]">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#83d2df]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>



            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-2xl mx-auto">
                    <Card className="shadow-2xl border-0 rounded-3xl bg-white/95 backdrop-blur-xl">
                        <CardHeader className="text-center pb-6 pt-8">
                            {status === 'pending' && (
                                <>
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
                                        <Clock className="h-10 w-10 text-yellow-600 animate-pulse" />
                                    </div>
                                    <CardTitle className="text-3xl font-bold text-gray-900">Application Under Review</CardTitle>
                                    <CardDescription className="text-gray-600 text-lg mt-2">
                                        Thank you for submitting your application! Our team is reviewing your information.
                                    </CardDescription>
                                </>
                            )}

                            {status === 'approved' && (
                                <>
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                                        <CheckCircle className="h-10 w-10 text-green-600" />
                                    </div>
                                    <CardTitle className="text-3xl font-bold text-gray-900">Application Approved!</CardTitle>
                                    <CardDescription className="text-gray-600 text-lg mt-2">
                                        Congratulations! Your account has been approved. Redirecting to login...
                                    </CardDescription>
                                </>
                            )}

                            {status === 'rejected' && (
                                <>
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                                        <XCircle className="h-10 w-10 text-red-600" />
                                    </div>
                                    <CardTitle className="text-3xl font-bold text-gray-900">Application Rejected</CardTitle>
                                    <CardDescription className="text-gray-600 text-lg mt-2">
                                        Unfortunately, your application was not approved at this time.
                                    </CardDescription>
                                </>
                            )}
                        </CardHeader>

                        <CardContent className="px-8 pb-8">
                            {status === 'pending' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                        <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                                        <ul className="space-y-2 text-blue-800 text-sm">
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>Our team will review your business information</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>This process typically takes 1-2 business days</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>You'll receive an email notification once your account is approved</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <Button
                                        onClick={checkStatus}
                                        disabled={loading}
                                        className="w-full bg-[#83d2df] hover:bg-[#6bb8c7] text-white"
                                        size="lg"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Checking Status...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Refresh Status
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {status === 'rejected' && rejectionReason && (
                                <div className="space-y-6">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                        <h3 className="font-semibold text-red-900 mb-2">Reason for Rejection:</h3>
                                        <p className="text-red-800 text-sm">{rejectionReason}</p>
                                    </div>

                                    <Button
                                        onClick={() => router.push('/signup')}
                                        className="w-full bg-[#83d2df] hover:bg-[#6bb8c7] text-white"
                                        size="lg"
                                    >
                                        Apply Again
                                    </Button>
                                </div>
                            )}

                            {status === 'approved' && (
                                <div className="text-center">
                                    <p className="text-gray-600 mb-4">You can now access your account!</p>
                                    <Button
                                        onClick={() => router.push('/login')}
                                        className="bg-[#83d2df] hover:bg-[#6bb8c7] text-white"
                                        size="lg"
                                    >
                                        Go to Login
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-6 text-center">
                        <p className="text-white/80 text-sm">
                            Need help? Contact us at{' '}
                            <a href="mailto:support@hello.ai" className="text-white font-semibold hover:underline">
                                support@hello.ai
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
