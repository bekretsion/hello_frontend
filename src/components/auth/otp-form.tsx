'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VerifyOTPSchema, type VerifyOTPInput } from '@/lib/schema';

export function OTPForm() {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [verificationToken, setVerificationToken] = useState<string | null>(null);
    const t = useTranslations('auth.signupPage');

    useEffect(() => {
        // Get stored data
        const storedEmail = sessionStorage.getItem('tempSignupEmail');
        const storedVerificationToken = sessionStorage.getItem('verificationToken');

        if (storedEmail) {
            setEmail(storedEmail);
        }
        if (storedVerificationToken) {
            setVerificationToken(storedVerificationToken);
        }
        
        if (!storedEmail && !storedVerificationToken) {
            // If no stored data, show a message but don't redirect
            // User can still enter OTP if they know it
            toast.info('No session data found', {
                description: 'If you have an OTP, you can still verify it. Otherwise, please sign up again.'
            });
        }
    }, [router]);

    const form = useForm<VerifyOTPInput>({
        resolver: zodResolver(VerifyOTPSchema),
        defaultValues: {
            otp: '',
        }
    });

    const { formState: { isSubmitting } } = form;

    const onSubmit = async (values: VerifyOTPInput) => {
        try {
            // Get verificationToken from state or sessionStorage
            const tokenToUse = verificationToken || sessionStorage.getItem('verificationToken');

            if (!tokenToUse) {
                toast.error('Verification token required', {
                    description: 'Please sign up again to receive an OTP.'
                });
                router.push('/signup');
                return;
            }

            const response = await fetch('/api/signup/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verificationToken: tokenToUse,
                    otp: values.otp
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'OTP verification failed');
            }

            toast.success('Email verified successfully!', {
                description: 'Now, tell us about your business.'
            });

            // Redirect to business info onboarding
            router.push('/onboarding');

        } catch (error) {
            toast.error('Verification Error', {
                description: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
        }
    };

    return (
        <Card className="w-full shadow-2xl border-0 rounded-2xl">
            <CardHeader className="text-center pb-3 pt-4 px-4 sm:px-6">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#83d2df] shadow-lg">
                    <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 font-outfit">Verify Your Email</CardTitle>
                <CardDescription className="text-gray-600 text-xs sm:text-sm mt-1">
                    {email ? (
                        <>We've sent a 6-digit code to <span className="font-semibold">{email}</span></>
                    ) : (
                        <>Enter the 6-digit code sent to your email</>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Verification Code</FormLabel>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                        <FormControl>
                                            <Input
                                                placeholder="123456"
                                                maxLength={6}
                                                className="pl-10 text-center text-2xl tracking-[0.5em] font-bold"
                                                {...field}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-[#83d2df] hover:bg-[#6bb8c7] text-white shadow-lg tooltip-trigger"
                            size="lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify & Continue'
                            )}
                        </Button>

                        <div className="text-center mt-4">
                            <button
                                type="button"
                                className="text-sm text-[#83d2df] hover:underline"
                                onClick={() => {
                                    toast.info('Feature coming soon', {
                                        description: 'OTP resend functionality will be available shortly.'
                                    });
                                }}
                            >
                                Resend Code
                            </button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
