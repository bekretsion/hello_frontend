'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { Loader2, Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type FormValues = z.infer<typeof formSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { currentLanguage } = useLanguage();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const { formState: { isSubmitting } } = form;

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setIsValidToken(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token/${token}`);
        const result = await response.json();
        
        setIsValidToken(result.valid === true);
      } catch (error) {
        setIsValidToken(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          newPassword: values.password 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      setIsSuccess(true);
      toast.success('Password reset successful!', {
        description: 'You can now log in with your new password'
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      toast.error('Failed to reset password', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div key={`verifying-${currentLanguage}`} className="min-h-screen w-full flex relative bg-gray-50">
        <div className="w-full flex flex-col justify-center items-center p-8">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!isValidToken) {
    return (
      <div key={`invalid-${currentLanguage}`} className="min-h-screen w-full flex relative bg-gray-50">
        <div className="w-full flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border border-gray-100 rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <KeyRound className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Invalid or Expired Link</CardTitle>
                <CardDescription className="text-gray-600">
                  This password reset link is invalid or has expired
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Password reset links expire after 1 hour for security reasons.
                  </p>
                </div>

                <Link href="/forgot-password" className="block">
                  <Button className="w-full">
                    Request New Reset Link
                  </Button>
                </Link>

                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div key={`success-${currentLanguage}`} className="min-h-screen w-full flex relative bg-gray-50">
        <div className="w-full flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border border-gray-100 rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Password Reset Complete!</CardTitle>
                <CardDescription className="text-gray-600">
                  Your password has been successfully reset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    You can now log in with your new password. Redirecting to login page...
                  </p>
                </div>

                <Link href="/login" className="block">
                  <Button className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div key={currentLanguage} className="min-h-screen w-full flex relative bg-gray-50">

      
      <div className="w-full flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border border-gray-100 rounded-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* New Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                          <FormControl>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              {...field}
                              disabled={isSubmitting}
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

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                          <FormControl>
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800 font-medium mb-1">Password Requirements:</p>
                    <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                      <li>At least 6 characters long</li>
                      <li>Both passwords must match</li>
                    </ul>
                  </div>

                  {/* Submit */}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}