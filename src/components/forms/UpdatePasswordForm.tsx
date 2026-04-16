'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function UpdatePasswordForm() {
  const t = useTranslations('updatePassword');

  // Dynamic validation schema with translations
  const formSchema = z
    .object({
      oldPassword: z
        .string()
        .min(1, { message: t('validation.currentPasswordRequired') }),
      newPassword: z
        .string()
        .min(8, { message: t('validation.newPasswordMinLength') }),
      confirmPassword: z
        .string()
        .min(1, { message: t('validation.confirmPasswordRequired') })
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('validation.passwordsNoMatch'),
      path: ['confirmPassword']
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const { isSubmitting } = form.formState;

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t('errors.unexpectedError'));
      }

      toast.success(t('messages.passwordUpdated'));
      form.reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('errors.tryAgain');
      toast.error(t('errors.updateFailed'), {
        description: errorMessage
      });
    }
  }

  return (
    <Card className='w-full'>
      <CardHeader className='flex-col justify-center'>
        <CardTitle className='flex justify-center'>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='oldPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.currentPassword')}</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showOldPassword ? 'text' : 'password'}
                        placeholder={t('placeholders.password')}
                        className='pr-10'
                        {...field}
                      />
                      <button
                        type='button'
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3'
                        aria-label={t('accessibility.togglePassword')}
                      >
                        {showOldPassword ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.newPassword')}</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder={t('placeholders.password')}
                        className='pr-10'
                        {...field}
                      />
                      <button
                        type='button'
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3'
                        aria-label={t('accessibility.togglePassword')}
                      >
                        {showNewPassword ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.confirmNewPassword')}</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('placeholders.password')}
                        className='pr-10'
                        {...field}
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3'
                        aria-label={t('accessibility.togglePassword')}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-center'>
              <Button
                type='submit'
                className='inline-flex items-center'
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                {t('buttons.updatePassword')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
