'use client';

import { useTranslations } from 'next-intl';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, Calendar, RefreshCcw } from 'lucide-react';

interface IntegrationStatus {
  google: {
    name: string;
    connected: boolean;
    hasAccessToken: boolean;
    tokenExpiry: number | null;
  };
  outlook: {
    name: string;
    connected: boolean;
    hasAccessToken: boolean;
    tokenExpiry: number | null;
  };
}

interface IntegrationsClientProps {
  isRequestModalOpen: boolean;
  setIsRequestModalOpen: (open: boolean) => void;
}

export default function IntegrationsClient({ isRequestModalOpen, setIsRequestModalOpen }: IntegrationsClientProps) {
  const t = useTranslations('integrations');

  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request form state
  const [integrationName, setIntegrationName] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch integration status
  const fetchIntegrationStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/status');
      if (!response.ok) {
        throw new Error('Failed to fetch integration status');
      }
      const data = await response.json();
      setIntegrationStatus(data.integrations);
    } catch (error) {
      toast.error(t('errors.fetchStatusFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchIntegrationStatus();
  }, [fetchIntegrationStatus]);

  // Handle OAuth redirect success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('outlook') === 'connected') {
      toast.success('Successfully connected to Outlook Calendar!');
      window.history.replaceState({}, '', '/dashboard/integrations');
      fetchIntegrationStatus();
    }
  }, [fetchIntegrationStatus]);

  const handleToggle = async (provider: 'google' | 'outlook', currentStatus: boolean) => {
    if (currentStatus) {
      // Disconnect
      handleDisconnect(provider);
    } else {
      // Connect
      handleConnect(provider);
    }
  };

  const handleConnect = async (provider: 'google' | 'outlook') => {
    setIsConnecting(provider);
    try {
      // Clear any stale tokens before starting a fresh OAuth flow.
      // This prevents invalid_grant errors when reconnecting an account
      // whose refresh token was revoked or expired.
      const logoutEndpoint = provider === 'google' ? '/api/google/logout' : '/api/outlook/logout';
      try {
        await fetch(logoutEndpoint, { method: 'POST' });
      } catch {
        // Silently ignore — tokens may already be cleared
      }

      const endpoint = provider === 'google' ? '/api/google/auth' : '/api/outlook/auth';
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok || !data.redirectUrl) {
        throw new Error(data.message || t('errors.authFailed'));
      }

      window.location.href = data.redirectUrl;
    } catch (error) {
      let errorMessage = t('errors.unexpectedError');
      if (error instanceof Error) errorMessage = error.message;
      toast.error(t('errors.connectionFailedTitle'), {
        description: errorMessage
      });
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (provider: 'google' | 'outlook') => {
    if (!window.confirm(t('connection.disconnectConfirmation'))) return;

    setIsConnecting(provider);
    try {
      const endpoint = provider === 'google' ? '/api/google/logout' : '/api/outlook/logout';
      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to disconnect');
      }

      toast.success(t('connection.disconnectSuccess'));
      await fetchIntegrationStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(t('connection.disconnectFailed'), {
        description: errorMessage
      });
    } finally {
      setIsConnecting(null);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!integrationName.trim()) {
      toast.error(t('request.validationError'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/integrations/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_name: integrationName.trim(),
          notes: notes.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit request');
      }

      toast.success(t('request.successMessage'));
      setIntegrationName('');
      setNotes('');
      setIsRequestModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(t('request.errorMessage'), {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='w-full space-y-4 sm:space-y-6'>
      {/* Integration Cards */}
      <div className='grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
        {/* Google Calendar Card */}
        <Card>
          <CardHeader className='p-4 sm:p-6'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
                <div className='flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 flex-shrink-0'>
                  <Calendar className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-300' />
                </div>
                <div className='min-w-0 flex-1'>
                  <CardTitle className='text-base sm:text-lg'>{t('cards.googleTitle')}</CardTitle>
                  <CardDescription className='mt-1 text-xs sm:text-sm'>
                    {t('cards.googleDescription')}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={integrationStatus?.google.connected || false}
                  onCheckedChange={() =>
                    handleToggle('google', integrationStatus?.google.connected || false)
                  }
                  disabled={isConnecting === 'google'}
                />
                <Label className='text-xs sm:text-sm font-medium'>
                  {integrationStatus?.google.connected ? t('cards.enabled') : t('cards.disabled')}
                </Label>
              </div>
              <Badge variant={integrationStatus?.google.connected ? 'default' : 'secondary'} className='text-xs'>
                {integrationStatus?.google.connected ? t('cards.connected') : t('cards.disconnected')}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className='flex flex-col gap-2 p-4 sm:p-6 pt-0'>
            {isConnecting === 'google' ? (
              <div className='flex w-full items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>{t('cards.processing')}</span>
              </div>
            ) : integrationStatus?.google.connected ? (
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleConnect('google')}
                className='w-full text-xs sm:text-sm'
              >
                <RefreshCcw className='mr-2 h-4 w-4' />
                {t('cards.switchEmail')}
              </Button>
            ) : null}
          </CardFooter>
        </Card>

        {/* Outlook Calendar Card */}
        <Card>
          <CardHeader className='p-4 sm:p-6'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
                <div className='flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900 flex-shrink-0'>
                  <Calendar className='h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-300' />
                </div>
                <div className='min-w-0 flex-1'>
                  <CardTitle className='text-base sm:text-lg'>{t('cards.outlookTitle')}</CardTitle>
                  <CardDescription className='mt-1 text-xs sm:text-sm'>
                    {t('cards.outlookDescription')}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-0'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={integrationStatus?.outlook.connected || false}
                  onCheckedChange={() =>
                    handleToggle('outlook', integrationStatus?.outlook.connected || false)
                  }
                  disabled={isConnecting === 'outlook'}
                />
                <Label className='text-xs sm:text-sm font-medium'>
                  {integrationStatus?.outlook.connected ? t('cards.enabled') : t('cards.disabled')}
                </Label>
              </div>
              <Badge variant={integrationStatus?.outlook.connected ? 'default' : 'secondary'} className='text-xs'>
                {integrationStatus?.outlook.connected ? t('cards.connected') : t('cards.disconnected')}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className='flex flex-col gap-2 p-4 sm:p-6 pt-0'>
            {isConnecting === 'outlook' ? (
              <div className='flex w-full items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>{t('cards.processing')}</span>
              </div>
            ) : integrationStatus?.outlook.connected ? (
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleConnect('outlook')}
                className='w-full text-xs sm:text-sm'
              >
                <RefreshCcw className='mr-2 h-4 w-4' />
                {t('cards.switchEmail')}
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      </div>

      {/* Request Integration Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-[500px]'>
          <form onSubmit={handleRequestSubmit} className='flex flex-col flex-1 min-h-0'>
            <DialogHeader className='flex-shrink-0'>
              <DialogTitle>{t('request.modalTitle')}</DialogTitle>
              <DialogDescription>
                {t('request.modalDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className='flex-1 space-y-4 overflow-y-auto py-4 min-h-0'>
              <div className='space-y-2'>
                <Label htmlFor='integration-name' className='text-sm font-medium'>
                  {t('request.integrationNameLabel')} <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='integration-name'
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                  placeholder={t('request.integrationNamePlaceholder')}
                  required
                  className='w-full'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='notes' className='text-sm font-medium'>
                  {t('request.notesLabel')}
                </Label>
                <Textarea
                  id='notes'
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('request.notesPlaceholder')}
                  rows={4}
                  className='w-full resize-none'
                />
              </div>
            </div>
            <DialogFooter className='flex-shrink-0 border-t pt-4 mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsRequestModalOpen(false)}
                disabled={isSubmitting}
              >
                {t('request.cancelButton')}
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {t('request.submitButton')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

