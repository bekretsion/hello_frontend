'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
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

const formSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.'
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.'
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.'
  }),
  role: z.enum(
    [
      'admin',
      'inbound_basic',
      'outbound_basic',
      'inbound_advanced',
      'outbound_advanced',
      'inbound_outbound_basic',
      'inbound_outbound_advanced'
    ],
    {
      required_error: 'You need to select a user role.'
    }
  ),
  apiKey: z.string().min(1, {
    message: 'API key is required.'
  }),
  AssistantId: z.string().optional()
});

export default function CreateUserPage() {
  const t = useTranslations('createUser');
  const tCommon = useTranslations('common');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'inbound_basic',
      apiKey: '',
      AssistantId: ''
    }
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch('/api/users/admin-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t('errors.createFailed'));
      }

      toast.success(t('success.userCreated'), {
        description: t('success.userCreatedDesc', { 
          username: result.user.username, 
          role: result.user.role 
        })
      });
      form.reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : tCommon('error');
      toast.error(t('errors.creationFailed'), {
        description: errorMessage
      });
    }
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <Heading
          title={t('title')}
          description={t('description')}
        />
        <Separator />

        <Card className='mx-auto max-w-xl rounded-2xl border px-6 py-8 shadow-sm'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div>
                <h3 className='mb-2 text-lg font-medium'>{t('userDetails')}</h3>
                <p className='text-muted-foreground mb-4 text-sm'>
                  {t('formDescription')}
                </p>
              </div>

              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      {t('fields.username')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('placeholders.username')}
                        {...field}
                        disabled={isSubmitting}
                        className='hover:border-primary focus-visible:ring-primary transition focus-visible:ring-1'
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
                    <FormLabel className='text-sm font-medium'>{t('fields.email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('placeholders.email')}
                        type='email'
                        {...field}
                        disabled={isSubmitting}
                        className='hover:border-primary focus-visible:ring-primary transition focus-visible:ring-1'
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
                    <FormLabel className='text-sm font-medium'>
                      {t('fields.password')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('placeholders.password')}
                        type='password'
                        {...field}
                        disabled={isSubmitting}
                        className='hover:border-primary focus-visible:ring-primary transition focus-visible:ring-1'
                      />
                    </FormControl>
                    <FormDescription className='text-muted-foreground text-sm'>
                      {t('descriptions.password')}
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
                    <FormLabel className='text-sm font-medium'>{t('fields.role')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className='hover:border-primary focus:ring-primary transition focus:ring-1'>
                          <SelectValue placeholder={t('placeholders.selectRole')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='admin'>{t('roles.admin')}</SelectItem>
                        <SelectItem value='inbound_basic'>
                          {t('roles.inboundBasic')}
                        </SelectItem>
                        <SelectItem value='outbound_basic'>
                          {t('roles.outboundBasic')}
                        </SelectItem>
                        <SelectItem value='inbound_advanced'>
                          {t('roles.inboundAdvanced')}
                        </SelectItem>
                        <SelectItem value='outbound_advanced'>
                          {t('roles.outboundAdvanced')}
                        </SelectItem>
                        <SelectItem value='inbound_outbound_basic'>
                          {t('roles.inboundOutboundBasic')}
                        </SelectItem>
                        <SelectItem value='inbound_outbound_advanced'>
                          {t('roles.inboundOutboundAdvanced')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='apiKey'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      {t('fields.apiKey')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('placeholders.apiKey')}
                        {...field}
                        disabled={isSubmitting}
                        className='hover:border-primary focus-visible:ring-primary transition focus-visible:ring-1'
                      />
                    </FormControl>
                    <FormDescription className='text-muted-foreground text-sm'>
                      {t('descriptions.apiKey')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='AssistantId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      {t('fields.assistantId')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('placeholders.assistantId')}
                        {...field}
                        value={field.value ?? ''} // Handle null/undefined
                        disabled={isSubmitting}
                        className='hover:border-primary focus-visible:ring-primary transition focus-visible:ring-1'
                      />
                    </FormControl>
                    <FormDescription className='text-muted-foreground text-sm'>
                      {t('descriptions.assistantId')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='pt-2'>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='bg-primary hover:bg-primary/90 w-full text-white transition'
                >
                  {isSubmitting && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {t('createUser')}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </PageContainer>
  );
}