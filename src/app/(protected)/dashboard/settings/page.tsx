'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heading } from '@/components/ui/heading';
import { UpdatePasswordForm } from '@/components/forms/UpdatePasswordForm';
import { ProfileCompletionForm } from '@/components/forms/ProfileCompletionForm';
import { DeleteAccountForm } from '@/components/forms/DeleteAccountForm';
import BillingSettings from '@/components/billing/billing-settings';
import AlertSettings from '@/components/billing/alert-settings';
import AccountSettings from '@/components/settings/account-settings';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [shouldScrollToNotifications, setShouldScrollToNotifications] = useState(false);

  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const tabParam = searchParams.get('tab');
    if (
      tabParam === 'billing' ||
      tabParam === 'account' ||
      tabParam === 'security' ||
      tabParam === 'alerts' ||
      tabParam === 'profile'
    ) {
      setActiveTab(tabParam);
    }

    // Check if we should scroll to notifications
    const scrollTo = searchParams.get('scrollTo');
    if (scrollTo === 'notifications' && tabParam === 'billing') {
      setShouldScrollToNotifications(true);
    }
  }, [searchParams]);

  // Handle CTA click to scroll to notifications card
  const handleScrollToNotifications = useCallback(() => {
    // Switch to billing tab and trigger scroll
    setActiveTab('billing');
    setShouldScrollToNotifications(true);
  }, []);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col p-2 pt-4 sm:p-4 sm:pt-6 md:p-8'>
        {/* Header with CTA */}
        <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
          <Heading
            title={t('title')}
            description={t('description')}
            data-tour='page-header'
          />
          {/* CTA Link to Notifications Card */}
          <button
            onClick={handleScrollToNotifications}
            className='flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 hover:underline transition-colors whitespace-nowrap self-start'
          >
            <ExternalLink className='h-4 w-4' />
            {t('changeNotificationsLink')}
          </button>
        </div>
        <Separator />
        <div className='pt-3 sm:pt-4'>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-tour="settings-tabs">
            <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-5 gap-1 sm:gap-2">
              <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
              <TabsTrigger value="account">{t('tabs.account')}</TabsTrigger>
              <TabsTrigger value="security">{t('tabs.security')}</TabsTrigger>
              <TabsTrigger value="billing">{t('tabs.billing')}</TabsTrigger>
              <TabsTrigger value="alerts">{t('tabs.alerts')}</TabsTrigger>
            </TabsList>
            <TabsContent value='profile' className='mt-4 sm:mt-6'>
              <ProfileCompletionForm />
            </TabsContent>
            <TabsContent value='account' className='mt-4 sm:mt-6' data-tour='account-settings'>
              <AccountSettings />
            </TabsContent>
            <TabsContent value="security" className="mt-4 sm:mt-6">
              <div className="w-full lg:w-1/2 mx-auto space-y-6">
                <UpdatePasswordForm />
                <DeleteAccountForm />
              </div>
            </TabsContent>

            <TabsContent value='billing' className='mt-4 sm:mt-6'>
              <BillingSettings scrollToNotifications={shouldScrollToNotifications} />
            </TabsContent>
            <TabsContent
              value='alerts'
              className='mt-4 sm:mt-6'
              data-tour='notification-settings'
            >
              <AlertSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  );
}
