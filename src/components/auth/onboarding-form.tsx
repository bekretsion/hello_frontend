'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Building, User, Briefcase, Factory, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as z from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function OnboardingForm() {
    const router = useRouter();
    const t = useTranslations('auth.businessInfo');

    // Create schema with translated messages
    const BusinessOnboardingSchema = z.object({
        fullName: z.string().min(2, { message: t('validation.fullNameMin') }),
        role: z.string().min(1, { message: t('validation.roleRequired') }),
        companyName: z.string().min(2, { message: t('validation.companyNameMin') }),
        industry: z.string().min(1, { message: t('validation.industryRequired') }),
        phoneNumber: z.string().min(1, { message: t('validation.phoneNumberRequired') }),
    });

    type BusinessOnboardingInput = z.infer<typeof BusinessOnboardingSchema>;

    const form = useForm<BusinessOnboardingInput>({
        resolver: zodResolver(BusinessOnboardingSchema),
        defaultValues: {
            fullName: '',
            role: '',
            companyName: '',
            industry: '',
            phoneNumber: ''
        }
    });

    const { formState: { isSubmitting } } = form;

    const onSubmit = async (values: BusinessOnboardingInput) => {
        try {
            const response = await fetch('/api/onboarding/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });

            const result = await response.json();

            if (!response.ok) {
                // If session expired, redirect to verify OTP
                if (response.status === 401 && (result.message?.toLowerCase().includes('expired') || result.message?.toLowerCase().includes('authentication'))) {
                    toast.error(t('toasts.sessionExpired'), {
                        description: t('toasts.sessionExpiredDesc')
                    });
                    router.push('/verify-otp');
                    return;
                }
                
                // Show detailed validation errors if available
                let errorMessage = result.message || t('toasts.errorTitle');
                if (result.details) {
                    errorMessage += ': ' + result.details;
                } else if (result.errors && Array.isArray(result.errors)) {
                    const errorDetails = result.errors.map((err: any) => 
                        err.message || err.msg || JSON.stringify(err)
                    ).join(', ');
                    if (errorDetails) {
                        errorMessage += ': ' + errorDetails;
                    }
                }
                
                console.error('Onboarding error:', result);
                throw new Error(errorMessage);
            }

            toast.success(t('toasts.successTitle'), {
                description: t('toasts.successDesc')
            });

            // Clear the temp data
            sessionStorage.removeItem('tempSignupEmail');
            sessionStorage.removeItem('tempUserId');

            // Use window.location.href for hard redirect to force middleware to re-fetch user status
            window.location.href = '/dashboard';

        } catch (error) {
            toast.error(t('toasts.errorTitle'), {
                description: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
        }
    };

    return (
        <Card className="w-full shadow-2xl border-0 rounded-2xl">
            <CardHeader className="text-center pb-3 pt-4 px-4 sm:px-6">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#83d2df] shadow-lg">
                    <Building className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">{t('title')}</CardTitle>
                <CardDescription className="text-gray-600 text-xs sm:text-sm mt-1">
                    {t('description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Full Name */}
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('fullName')}</FormLabel>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                        <FormControl>
                                            <Input placeholder={t('fullNamePlaceholder')} className="pl-10" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Role */}
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('role')}</FormLabel>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="pl-10">
                                                    <SelectValue placeholder={t('rolePlaceholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="owner">{t('roles.owner')}</SelectItem>
                                                <SelectItem value="manager">{t('roles.manager')}</SelectItem>
                                                <SelectItem value="developer">{t('roles.developer')}</SelectItem>
                                                <SelectItem value="other">{t('roles.other')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Company Name */}
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('companyName')}</FormLabel>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                        <FormControl>
                                            <Input placeholder={t('companyNamePlaceholder')} className="pl-10" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Industry */}
                        <FormField
                            control={form.control}
                            name="industry"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('industry')}</FormLabel>
                                    <div className="relative">
                                        <Factory className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                        <FormControl>
                                            <Input placeholder={t('industryPlaceholder')} className="pl-10" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Phone Number */}
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('phoneNumber')}</FormLabel>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                                        <FormControl>
                                            <Input placeholder={t('phoneNumberPlaceholder')} type="tel" className="pl-10" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full mt-3 bg-[#83d2df] hover:bg-[#6bb8c7] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            size="lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('submitting')}
                                </>
                            ) : (
                                t('submitButton')
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
