'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SignupBasicSchema, type SignupBasicInput } from '@/lib/schema';

export interface SignupFormProps {
  minimal?: boolean;
}

export function SignupForm({ minimal }: SignupFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const t = useTranslations('auth.signupPage');

  const form = useForm<SignupBasicInput>({
    resolver: zodResolver(SignupBasicSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: SignupBasicInput) => {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Signup failed');
      }

      // Store signup data in sessionStorage for next steps
      sessionStorage.setItem('tempSignupEmail', values.email);
      if (result.userId) {
        sessionStorage.setItem('tempUserId', result.userId.toString());
      }
      // Store verificationToken if provided by backend
      if (result.verificationToken) {
        sessionStorage.setItem('verificationToken', result.verificationToken);
      }

      toast.success(t('toasts.accountCreated'), {
        description: t('toasts.checkEmail')
      });

      // Redirect to verification page
      router.push('/verify-otp');

    } catch (error) {
      toast.error(t('toasts.signupError'), {
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
              <FormLabel className="text-gray-700 font-medium">{t('emailAddress')}</FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <FormControl>
                  <Input
                    placeholder={t('emailPlaceholder')}
                    type="email"
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
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">{t('confirmPassword')}</FormLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <FormControl>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
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
                  onClick={() => {
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Legal checkbox placeholder as per image */}
        <div className="flex items-center space-x-2 py-1">
          <input
            type="checkbox"
            id="terms"
            className="h-4 w-4 rounded border-gray-300 text-[#83d2df] focus:ring-[#83d2df]"
            required
          />
          <label htmlFor="terms" className="text-xs text-gray-600">
            {t('legal.iAccept')}{' '}
            <Link href="/terms" className="text-[#83d2df] hover:underline">
              {t('legal.termsOfUse')}
            </Link>{' '}
            {t('legal.and')}{' '}
            <Link href="/privacy" className="text-[#83d2df] hover:underline">
              {t('legal.privacyPolicy')}
            </Link>.
          </label>
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
              {t('signingUp') || t('createAccountBtn')}
            </>
          ) : (
            t('createAccountBtn')
          )}
        </Button>
      </form>
    </Form>
  );

  if (minimal) {
    return formContent;
  }

  return (
    <Card className="w-full shadow-2xl border-0 rounded-2xl">
      <CardHeader className="text-center pb-3 pt-4 px-4 sm:px-6">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#83d2df] shadow-lg">
          <User className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">{t('createAccountTitle')}</CardTitle>
        <CardDescription className="text-gray-600 text-xs sm:text-sm mt-1">
          {t('createAccountDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4">
        {formContent}

        {/* Login Link */}
        <div className="text-center mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs sm:text-sm text-gray-600">{t('alreadyHaveAccount')} </span>
          <Link
            href="/login"
            className="text-xs sm:text-sm text-[#83d2df] hover:text-[#6bb8c7] hover:underline transition-colors font-semibold"
          >
            {t('logIn')}
          </Link>
        </div>

        {/* Legal Links */}
        <div className="text-center mt-3 text-xs text-gray-500">
          <p className="mb-2">{t('bySigningUp')}</p>
          <Link href="/privacy" className="hover:text-[#83d2df] hover:underline transition-colors">
            {t('legal.privacyPolicy')}
          </Link>
          <span className="mx-2">•</span>
          <Link href="/terms" className="hover:text-[#83d2df] hover:underline transition-colors">
            {t('legal.termsOfUse')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}