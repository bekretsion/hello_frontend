'use client';

import { useTranslations } from 'next-intl';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import IntegrationsClient from './integrations-client';
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

export default function IntegrationsPage() {
  const t = useTranslations('integrations');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-3 sm:space-y-4 p-2 sm:p-0'>
        <div data-tour="page-header" className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
          <Heading
            title={t('title')}
            description={t('description')}
          />
          <Button 
            onClick={() => setIsRequestModalOpen(true)}
            className='w-full sm:w-auto'
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            <span className='hidden sm:inline'>{t('request.buttonText')}</span>
            <span className='sm:hidden'>Request</span>
          </Button>
        </div>
        <Separator />
        <div data-tour="integrations-view" className='w-full overflow-hidden'>
          <IntegrationsClient 
            isRequestModalOpen={isRequestModalOpen}
            setIsRequestModalOpen={setIsRequestModalOpen}
          />
        </div>
      </div>
    </PageContainer>
  );
}

