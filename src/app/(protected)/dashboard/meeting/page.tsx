'use client';

import { useTranslations } from 'next-intl';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import MeetingsClient from './meetings-client';


export default function MeetingsPage() {
  const t = useTranslations('meetings');

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-3 sm:space-y-4 p-2 sm:p-0'>
        <div data-tour="page-header">
          <Heading
            title={t('title')}
            description={t('description')}
          />
        </div>
        <Separator />
        <div data-tour="calendar-view" className='w-full overflow-hidden'>
          <MeetingsClient />
        </div>
      </div>
    </PageContainer>
  );
}