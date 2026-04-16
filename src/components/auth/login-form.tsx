'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Lock, Mail, LogIn as LogInIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export interface LoginFormProps {
  minimal?: boolean;
}

export function LoginForm({ minimal = false }: LoginFormProps) {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const t = useTranslations('auth.loginForm');

  // Load cached email on mount
  const cachedEmail = typeof window !== 'undefined' ? localStorage.getItem('cachedEmail') || '' : '';

  // Create schema with translations
  const formSchema = z.object({
    email: z.string().email({ message: t('validation.emailInvalid') }),
    password: z.string().min(1, { message: t('validation.passwordRequired') }),
    accountType: z.string().min(1, { message: t('validation.accountTypeRequired') })
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: cachedEmail,
      password: '',
      accountType: 'inbound'
    }
  });

  // Set account type to inbound (default)
  useEffect(() => {
    form.setValue('accountType', 'inbound');
    if (cachedEmail) {
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: FormValues) => {
    try {
      console.log('🔐 Attempting login with:', { email: values.email, accountType: values.accountType });

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      const result = await response.json();
      console.log('📥 Login response:', { ok: response.ok, status: response.status });

      if (!response.ok) {
        console.error('❌ Login failed:', result.message);
        throw new Error(result.message || 'Failed to login');
      }

      const { user, token } = result;
      console.log('✅ Login successful, user:', user);

      // Set session cookie
      console.log('🍪 Setting session cookie...');
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!sessionResponse.ok) {
        console.error('❌ Failed to create session');
        throw new Error('Failed to create session');
      }

      console.log('✅ Session cookie set successfully');

      // Cache credentials if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem('cachedEmail', values.email);
        localStorage.setItem('cachedAccountType', values.accountType);
      } else {
        localStorage.removeItem('cachedEmail');
        localStorage.removeItem('cachedAccountType');
      }

      // Login will automatically save to localStorage via the store
      login(user);
      toast.success(t('toasts.loginSuccessful'), {
        description: t('toasts.welcomeBack', { email: user.email })
      });

      // Check if user came from onboarding choice page
      const onboardingChoice = sessionStorage.getItem('onboardingChoice');
      sessionStorage.removeItem('onboardingChoice');

      // Small delay to ensure cookie is set, then redirect to let middleware handle routing
      console.log('🔄 Redirecting to dashboard...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect based on onboarding choice or default to dashboard
      if (onboardingChoice === 'create-assistant') {
        window.location.href = '/dashboard/onboarding/voice-assistant';
      } else {
        // Use window.location.href for a hard redirect to ensure middleware processes the session
        window.location.href = '/dashboard/my-assistants';
      }
    } catch (error) {
      toast.error(t('toasts.loginFailed'), {
        description: error instanceof Error ? error.message : t('toasts.unexpectedError')
      });
    }
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">{t('email')}</FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <FormControl>
                  <Input
                    placeholder={t('emailPlaceholder')}
                    className="pl-10 h-11 border-gray-200 focus:border-[#83d2df] focus:ring-[#83d2df]"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">{t('password')}</FormLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 border-gray-200 focus:border-[#83d2df] focus:ring-[#83d2df]"
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#83d2df] focus:ring-[#83d2df]"
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
              {t('RememberMe')}
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-[#83d2df] hover:text-[#3d8691] transition-colors"
          >
            {t('forgotPassword') || 'Forgot your password?'}
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 mt-2 bg-[#83d2df] hover:bg-[#58a5b0] text-white font-semibold transition-all duration-200"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('signingIn')}
            </>
          ) : (
            t('signIn')
          )}
        </Button>
      </form>
    </Form>
  );

  if (minimal) {
    return formContent;
  }

  return (
    <Card className="w-full shadow-lg border border-gray-100 rounded-xl mb-4">
      <CardHeader className="text-center pb-2 pt-3 px-3 sm:px-4">
        <div className="mx-auto mb-1 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
          <LogInIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <CardTitle className="text-base sm:text-lg font-bold">{t('welcomeBack')}</CardTitle>
        <CardDescription className="text-gray-500 text-xs sm:text-sm">
          {t('pleaseLogin')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-4">
        {formContent}

        {/* Signup Link - MUST BE VISIBLE */}
        <div className="text-center mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs sm:text-sm text-gray-600">{t('haveAccount')}? </span>
          <Link
            href="/signup"
            className="text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline transition-colors font-semibold cursor-pointer"
          >
            {t('SignUp')}
          </Link>
        </div>

        {/* Legal Links */}
        <div className="text-center mt-3 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-primary hover:underline transition-colors">
            Privacy Policy
          </Link>
          <span className="mx-2">•</span>
          <Link href="/terms" className="hover:text-primary hover:underline transition-colors">
            Terms of Service
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}