// src/app/dashboard/upload/page.tsx
'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import UploadPageClient from '@/app/(protected)/dashboard/upload/upload-client';

export default function UploadPage() {
  const t = useTranslations('upload');

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title={t('title')}
          description={t('description')}
        />
        <Separator />
        <UploadPageClient />
      </div>
    </PageContainer>
  );
}