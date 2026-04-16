'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Heading } from '@/components/ui/heading';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { UserData } from '@/app/(protected)/dashboard/users/users-table-client';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const t = useTranslations('editUser');
  const tCommon = useTranslations('common');
  const tUsers = useTranslations('users');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Create Zod schema with translated validation messages
  const formSchema = z.object({
    username: z.string().min(2, {
      message: t('validation.usernameMin')
    }),
    email: z.string().email({
      message: t('validation.emailInvalid')
    }),
    password: z
      .string()
      .min(8, { message: t('validation.passwordMin') })
      .optional()
      .or(z.literal('')),
    role: z.enum([
      'admin',
      'inbound_basic',
      'outbound_basic',
      'inbound_advanced',
      'outbound_advanced',
      'inbound_outbound_basic',
      'inbound_outbound_advanced'
    ]),
    AssistantId: z.string().optional()
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      AssistantId: ''
    }
  });

  // Role options with translations — disabled = coming soon / not yet available
  const roleOptions = [
    { value: 'admin', label: t('roles.admin'), disabled: false },
    { value: 'inbound_basic', label: t('roles.inboundBasic'), disabled: false },
    { value: 'outbound_basic', label: t('roles.outboundBasic'), disabled: true },
    { value: 'inbound_advanced', label: t('roles.inboundAdvanced'), disabled: false },
    { value: 'outbound_advanced', label: t('roles.outboundAdvanced'), disabled: true },
    { value: 'inbound_outbound_basic', label: t('roles.inboundOutboundBasic'), disabled: true },
    { value: 'inbound_outbound_advanced', label: t('roles.inboundOutboundAdvanced'), disabled: true }
  ];

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t('errors.fetchFailed'));
        }

        const user: UserData & { AssistantId?: string; password?: string } =
          data.user;

        form.reset({
          username: user.username,
          email: user.email,
          role: user.role as any,
          AssistantId: user.AssistantId || '',
          password: ''
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : tCommon('error');
        setError(errorMessage);
        toast.error(t('errors.loadFailed'), { description: errorMessage });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, form, t, tCommon]);

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const updatePayload: Partial<typeof values> = { ...values };
      if (!updatePayload.password) {
        delete updatePayload.password;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t('errors.updateFailed'));
      }

      toast.success(t('success.userUpdated'), {
        description: t('success.userUpdatedDesc', { username: result.user.username })
      });
      router.push('/dashboard/users');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : tCommon('error');
      toast.error(t('errors.updateFailed'), {
        description: errorMessage
      });
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Heading title={t('title')} description={t('loadingDesc')} />
        <Separator />
        <Card className='mx-auto'>
          <CardHeader>
            <Skeleton className='h-8 w-1/3' />
            <Skeleton className='h-4 w-2/3' />
          </CardHeader>
          <CardContent className='space-y-6 p-6'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Heading title={tCommon('error')} description={error} />
        <Separator />
        <Button onClick={() => router.push('/dashboard/users')}>
          {t('backToUsers')}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title={t('title')}
          description={t('description')}
        />

        <Card className='mx-2 flex flex-1 flex-col space-y-4 rounded-2xl border px-6 py-8 shadow-sm'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.username')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('placeholders.username')}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('placeholders.email')}
                        type='email'
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.newPassword')}</FormLabel>
                    <div className='relative'>
                      <FormControl>
                        <Input
                          placeholder={t('placeholders.password')}
                          type={isPasswordVisible ? 'text' : 'password'}
                          autoComplete='new-password'
                          {...field}
                          disabled={isSubmitting}
                          className='pr-10'
                        />
                      </FormControl>
                      <button
                        type='button'
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className='absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3'
                        aria-label={t('togglePassword')}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className='h-5 w-5 text-gray-500' />
                        ) : (
                          <Eye className='h-5 w-5 text-gray-500' />
                        )}
                      </button>
                    </div>
                    <FormDescription>
                      {t('passwordDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.role')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('placeholders.selectRole')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem
                            key={role.value}
                            value={role.value}
                            disabled={role.disabled}
                            className={role.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                          >
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='pt-2'>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full'
                >
                  {isSubmitting && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {t('updateUser')}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </PageContainer>
  );
}