'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as z from 'zod';
import { Loader2, Mail, ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { currentLanguage } = useLanguage();
  const t = useTranslations('auth.forgotPassword');

  const formSchema = z.object({
  email: z.string().email({ message: t('validation.email') })
});

type FormValues = z.infer<typeof formSchema>;


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' }
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: FormValues) => {
    try {
      console.log('Sending forgot password request...', values);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        // Show error message for unregistered emails or other errors
        const errorMessage = result.message || t('toasts.failedToSend');
        toast.error(t('toasts.error'), {
          description: errorMessage
        });
        // Set form error to display in the email field
        form.setError('email', {
          type: 'server',
          message: errorMessage
        });
        return;
      }

      // Success - email exists and reset link sent
      setIsSubmitted(true);
      toast.success(t('toasts.successTitle'), {
        description: t('toasts.successDesc')
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error(t('toasts.timeoutTitle'), {
          description: t('toasts.timeoutDesc')
        });
      } else {
        toast.error(t('toasts.generalErrorTitle'), {
          description: error instanceof Error ? error.message : t('toasts.tryAgain')
        });
      }
    }
  };

  if (isSubmitted) {
    return (
      <div key={`submitted-${currentLanguage}`} className="min-h-screen w-full flex relative bg-gray-50">
        <div className="w-full flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border border-gray-100 rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold">{t('success.title')}</CardTitle>
                <CardDescription className="text-gray-600">
                  {t('success.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>{t('success.didNotReceive')}</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                    <li>{t('success.spam')}</li>
                    <li>{t('success.correctEmail')}</li>
                    <li>{t('success.wait')}</li>
                  </ul>
                </div>

                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('backToLogin')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={currentLanguage} className="min-h-screen w-full flex relative bg-gray-50">

      
      <div className="w-full flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border border-gray-100 rounded-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
              <CardDescription className="text-gray-600">
                {t('description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('emailLabel')}</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                          <FormControl>
                            <Input 
                              placeholder={t('emailPlaceholder')} 
                              className="pl-10" 
                              {...field} 
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit */}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('submitting')}
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        {t('submitButton')}
                      </>
                    )}
                  </Button>

                  {/* Back to Login */}
                  <div className="text-center">
                    <Link 
                      href="/login" 
                      className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors inline-flex items-center"
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      {t('backToLogin')}
                    </Link>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}