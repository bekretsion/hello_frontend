'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export default function VerifyEmailPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [pendingData, setPendingData] = useState<{ verificationToken: string; email: string } | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Get pending verification data from session storage
        const stored = sessionStorage.getItem('pendingVerification');
        if (stored) {
            setPendingData(JSON.parse(stored));
        } else {
            // No pending verification, redirect to signup
            router.push('/signup');
        }
    }, [router]);

    useEffect(() => {
        // Countdown timer for resend cooldown
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleInputChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        pastedData.split('').forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        if (pastedData.length === 6) {
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        if (!pendingData) return;

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code');
            return;
        }

        setIsVerifying(true);

        try {
            const response = await fetch('/api/signup/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    verificationToken: pendingData.verificationToken,
                    otp: otpCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid verification code');
            }

            // Store the token and set session cookie (same as login flow)
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Set session cookie (required for middleware authentication)
                const sessionResponse = await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: data.token })
                });

                if (!sessionResponse.ok) {
                    console.error('Failed to create session');
                }

                // Login to auth store
                login(data.user, data.token);
            }

            // Clear pending verification
            sessionStorage.removeItem('pendingVerification');

            toast.success('Email verified!', {
                description: 'Welcome to Hello!'
            });

            // Small delay to ensure cookie is set, then redirect
            await new Promise(resolve => setTimeout(resolve, 100));

            // Redirect to business info onboarding
            window.location.href = '/dashboard/onboarding/business-info';

        } catch (error) {
            toast.error('Verification failed', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (!pendingData || resendCooldown > 0) return;

        setIsResending(true);

        try {
            const response = await fetch('/api/signup/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    verificationToken: pendingData.verificationToken,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.waitSeconds) {
                    setResendCooldown(data.waitSeconds);
                }
                throw new Error(data.message || 'Failed to resend code');
            }

            // Update verification token if a new one was provided
            if (data.verificationToken) {
                const newPendingData = { ...pendingData, verificationToken: data.verificationToken };
                setPendingData(newPendingData);
                sessionStorage.setItem('pendingVerification', JSON.stringify(newPendingData));
            }

            toast.success('Code resent!', {
                description: 'Please check your email for the new verification code.'
            });

            // Set cooldown
            setResendCooldown(60);

        } catch (error) {
            toast.error('Failed to resend', {
                description: error instanceof Error ? error.message : 'Please try again later'
            });
        } finally {
            setIsResending(false);
        }
    };

    if (!pendingData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#83d2df]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#83d2df] via-[#6bb8c7] to-[#5a9fb0] px-4">
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#83d2df]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <Card className="relative z-10 w-full max-w-md shadow-2xl border-0 rounded-2xl bg-white/95 backdrop-blur-xl">
                <CardHeader className="text-center pb-4 pt-6 px-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#83d2df] shadow-lg">
                        <Mail className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
                    <CardDescription className="text-gray-600 text-sm mt-2">
                        We&apos;ve sent a 6-digit code to<br />
                        <span className="font-semibold text-gray-800">{pendingData.email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    {/* OTP Input */}
                    <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                        {otp.map((digit, index) => (
                            <Input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 rounded-lg focus:border-[#83d2df] focus:ring-[#83d2df]"
                            />
                        ))}
                    </div>

                    {/* Verify Button */}
                    <Button
                        onClick={handleVerify}
                        className="w-full h-12 bg-[#83d2df] hover:bg-[#6bb8c7] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={isVerifying || otp.join('').length !== 6}
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify Email'
                        )}
                    </Button>

                    {/* Resend Code */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600 mb-2">Didn&apos;t receive the code?</p>
                        <Button
                            variant="ghost"
                            onClick={handleResend}
                            disabled={isResending || resendCooldown > 0}
                            className="text-[#83d2df] hover:text-[#6bb8c7] hover:bg-[#83d2df]/10"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : resendCooldown > 0 ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend in {resendCooldown}s
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend Code
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Back to Signup */}
                    <div className="text-center mt-4 pt-4 border-t border-gray-200">
                        <Link
                            href="/signup"
                            className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition-colors"
                        >
                            ← Back to Sign Up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
