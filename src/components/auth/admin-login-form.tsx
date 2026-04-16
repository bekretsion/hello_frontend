// File: components/auth/admin-login-form.tsx

'use client';

// (All imports are the same as your LoginForm)
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldAlert } from 'lucide-react'; // Changed icon for admin
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoginInput, LoginSchema } from '@/lib/schema';
import { useAuth } from '@/hooks/use-auth';

export function AdminLoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations('auth.adminLogin');

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' }
  });

  const {
    formState: { isSubmitting }
  } = form;

  const onSubmit = async (data: LoginInput) => {
    try {
      const response = await fetch('/api/login/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to login as admin');
      }

      const { user, token } = result;

      // The session handling remains the same
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      login(user);

      toast.success('Admin Login Successful!', {
        description: `Welcome, Administrator ${user.name}. Redirecting...`
      });

      router.refresh();
      router.push('/dashboard/users');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';
      toast.error('Admin Login Failed', { description: errorMessage });
      // Admin login error handled by toast
    }
  };

  return (
    <div className="w-full max-w-md">
<Card className='border-primary/50 w-full max-w-md shadow-lg'>
        {' '}
        {/* Added a border to distinguish */}
        <CardHeader className='text-center'>
          <div className='bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
            {/* Using a different icon for the admin login */}
            <ShieldAlert className='text-primary h-8 w-8' />
          </div>
          <CardTitle className='text-3xl font-bold'>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            {/* The form structure is identical, so no need to repeat the code here */}
            {/* We just copy the <form>...</form> part from your original LoginForm */}
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('adminEmail')}</FormLabel>
                    <div className='relative'>
                      <Mail className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                      <FormControl>
                        <Input
                          placeholder={t('adminEmailPlaceholder')}
                          className='pl-10'
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <div className='relative'>
                      <Lock className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder='••••••••'
                          className='pr-10 pl-10'
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='text-muted-foreground absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 hover:bg-transparent'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {t('authenticating')}
                  </>
                ) : (
                  t('signInAsAdmin')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground w-full text-center text-sm'>
            {t('restrictedArea')}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}