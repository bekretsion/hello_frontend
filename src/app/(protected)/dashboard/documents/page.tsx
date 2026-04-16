'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DocumentFilters,
  DocumentFilterState
} from '@/components/documents/document-filters';
import { DocumentsTable } from '@/components/documents/documents-table';
import { useDocuments } from '@/hooks/use-documents';
import { useAuth } from '@/hooks/use-auth';

export default function DocumentsPage() {
  const t = useTranslations('documents');
  const [filters, setFilters] = useState<DocumentFilterState>({});
  const { user } = useAuth();
  const userRole = user?.role || '';
  const isPrivileged =
    userRole === 'admin' || userRole === 'sales' || userRole === 'finance';

  const { documents, loading } = useDocuments({
    type: filters.type as any,
    status: filters.status as any,
    search: filters.search
  });

  return (
    <div className='space-y-4 sm:space-y-6 p-2 sm:p-0'>
      <div className='flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold'>{t('title')}</h1>
          <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
            {isPrivileged ? t('description') : t('descriptionCustomer')}
          </p>
        </div>
        {isPrivileged && (
          <Button asChild className='w-full sm:w-auto'>
            <Link href='/dashboard/documents/create'>{t('newDocument')}</Link>
          </Button>
        )}
      </div>

      <div className='max-w-7xl'>
        <DocumentFilters filters={filters} onChange={setFilters} />
      </div>

      <Card>
        <CardHeader className='p-4 sm:p-6'>
          <CardTitle className='text-base sm:text-lg'>{t('allDocuments')}</CardTitle>
        </CardHeader>
        <CardContent className='p-4 sm:p-6 pt-0'>
          <DocumentsTable documents={documents} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
