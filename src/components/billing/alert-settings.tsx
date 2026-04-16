'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Clock, CreditCard } from 'lucide-react';

interface AlertSettings {
  low_minutes_warning_enabled: boolean;
  low_minutes_threshold: number;
  expiry_warning_enabled: boolean;
  expiry_warning_hours: number;
  failed_payment_warning_enabled: boolean;
}

export default function AlertSettings() {
  const [settings, setSettings] = useState<AlertSettings>({
    low_minutes_warning_enabled: true,
    low_minutes_threshold: 20,
    expiry_warning_enabled: true,
    expiry_warning_hours: 24,
    failed_payment_warning_enabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedRef = useRef(false);
  const t = useTranslations('billing.alerts');

  useEffect(() => {
    const cacheKey = 'alert_settings_loaded';
    const hasLoaded = sessionStorage.getItem(cacheKey) === 'true';
    
    if (hasLoaded) {
      // Already loaded before, fetch silently without showing loading
      setIsLoading(false);
      fetchSettings();
      return;
    }

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      sessionStorage.setItem(cacheKey, 'true');
      fetchSettings();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/minutes/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          low_minutes_warning_enabled:
            data.low_minutes_warning_enabled !== false,
          low_minutes_threshold: data.low_minutes_threshold || 20,
          expiry_warning_enabled: data.expiry_warning_enabled !== false,
          expiry_warning_hours: data.expiry_warning_hours || 24,
          failed_payment_warning_enabled:
            data.failed_payment_warning_enabled !== false
        });
      }
    } catch (error) {
      toast.error(t('messages.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/minutes/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowMinutesWarningEnabled: settings.low_minutes_warning_enabled,
          lowMinutesThreshold: settings.low_minutes_threshold,
          expiryWarningEnabled: settings.expiry_warning_enabled,
          expiryWarningHours: settings.expiry_warning_hours,
          failedPaymentWarningEnabled: settings.failed_payment_warning_enabled
        })
      });

      if (response.ok) {
        toast.success(t('messages.saveSuccess'));
      } else {
        const error = await response.json();
        throw new Error(error.message || t('messages.saveError'));
      }
    } catch (error) {
      toast.error(t('messages.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof AlertSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInputChange = (key: keyof AlertSettings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (

    <div className='space-y-4'>

    <div className="space-y-4">
    {/* Cards Wrapper */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Low Minutes Warning */}
      <Card
        className={
          settings.low_minutes_warning_enabled
            ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20'
            : 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20'
        }
      >
        {' '}
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center space-x-2 text-base'>
            <AlertTriangle className='h-5 w-5 text-orange-500' />
            <span>{t('lowMinutes.title')}</span>
          </CardTitle>
          <CardDescription className='text-sm'>
            {t('lowMinutes.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='low-minutes-warning' className='text-sm'>{t('lowMinutes.enable')}</Label>
            <Switch
              id='low-minutes-warning'
              checked={settings.low_minutes_warning_enabled}
              onCheckedChange={() => handleToggle('low_minutes_warning_enabled')}
              className="data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-400"
            />
          </div>

          {settings.low_minutes_warning_enabled && (
            <div className='space-y-2'>
              <Label htmlFor='minutes-threshold' className='text-sm'>{t('lowMinutes.threshold')}</Label>
              <div className='flex items-center space-x-2'>
                <Input
                  id='minutes-threshold'
                  type='number'
                  min={1}
                  max={1000}
                  value={settings.low_minutes_threshold}
                  onChange={(e) => handleInputChange('low_minutes_threshold', parseInt(e.target.value) || 20)}
                  className='w-24'
                  disabled={!settings.low_minutes_warning_enabled}
                />
                <span className='text-muted-foreground text-sm'>{t('lowMinutes.unit')}</span>
              </div>
              <p className='text-muted-foreground text-xs'>{t('lowMinutes.info')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiry Warning */}
      <Card
        className={
          settings.expiry_warning_enabled
            ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20'
            : 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20'
        }
      >
        {' '}
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center space-x-2 text-base'>
            <Clock className='h-5 w-5 text-blue-500' />
            <span>{t('expiry.title')}</span>
          </CardTitle>
          <CardDescription className='text-sm'>
            {t('expiry.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='expiry-warning' className='text-sm'>{t('expiry.enable')}</Label>
            <Switch
              id='expiry-warning'
              checked={settings.expiry_warning_enabled}
              onCheckedChange={() => handleToggle('expiry_warning_enabled')}
              className="data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-400"
            />
          </div>

          {settings.expiry_warning_enabled && (
            <div className='space-y-2'>
              <Label htmlFor='expiry-hours' className='text-sm'>{t('expiry.warningTime')}</Label>
              <div className='flex items-center space-x-2'>
                <Input
                  id='expiry-hours'
                  type='number'
                  min={1}
                  max={168}
                  value={settings.expiry_warning_hours}
                  onChange={(e) => handleInputChange('expiry_warning_hours', parseInt(e.target.value) || 24)}
                  className='w-24'
                  disabled={!settings.expiry_warning_enabled}
                />
                <span className='text-muted-foreground text-sm'>{t('expiry.unit')}</span>
              </div>
              <p className='text-muted-foreground text-xs'>{t('expiry.info')}</p>
            </div>
          )}



        </CardContent>
      </Card>

      {/* Payment Failures Warning */}
      <Card
        className={
          settings.failed_payment_warning_enabled
            ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20'
            : 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20'
        }
      >
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center space-x-2 text-base'>
            <CreditCard className='h-5 w-5 text-red-500' />
            <span>{t('paymentFailures.title')}</span>
          </CardTitle>
          <CardDescription className='text-sm'>
            {t('paymentFailures.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>

          <div className='flex items-center justify-between'>
            <Label htmlFor='payment-warning' className='text-sm'>
              {t('paymentFailures.enable')}
            </Label>
            <Switch
              id='payment-warning'
              checked={settings.failed_payment_warning_enabled}
              onCheckedChange={() =>
                handleToggle('failed_payment_warning_enabled')
              }
            />
          </div>
        </CardContent>
      </Card>

    </div>
  </div>
</div>
  );
}
