'use client';

import { useTranslations } from 'next-intl';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import UsersTableClient from './users-table-client';

export default function UsersPage() {
  const t = useTranslations('users');
  
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title={t('title')}
          description={t('description')}
        />
        <Separator />
        <UsersTableClient />
      </div>
    </PageContainer>
  );
}