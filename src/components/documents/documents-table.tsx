'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { DocumentStatusBadge } from './document-status-badge';
import { DocumentTypePill } from './document-type-pill';
import type { Document } from '@/types/documents';
import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';

interface DocumentsTableProps {
  documents: Document[];
  loading?: boolean;
}

export function DocumentsTable({ documents, loading }: DocumentsTableProps) {
  const t = useTranslations('documents');
  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='text-center'>
          <div className='border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2'></div>
          <p className='text-muted-foreground'>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!documents.length) {
    return (
      <div className='flex items-center justify-center py-20'>
        <p className='text-muted-foreground'>{t('noDocuments')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop view: table */}
      <div className='hidden md:block overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='bg-primary/30 hover:bg-primary/30'>
              <TableHead className='text-xs sm:text-sm'>{t('table.title')}</TableHead>
              <TableHead className='text-xs sm:text-sm'>{t('table.type')}</TableHead>
              <TableHead className='text-xs sm:text-sm'>{t('table.customer')}</TableHead>
              <TableHead className='text-xs sm:text-sm'>{t('table.status')}</TableHead>
              <TableHead className='text-xs sm:text-sm'>{t('table.updated')}</TableHead>
              <TableHead className='text-xs sm:text-sm'>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className='text-xs sm:text-sm max-w-[200px] truncate'>{doc.title || doc.file_name}</TableCell>
                <TableCell>
                  <DocumentTypePill type={doc.document_type} />
                </TableCell>
                <TableCell className='text-xs sm:text-sm'>{doc.customer_name || '—'}</TableCell>
                <TableCell>
                  <DocumentStatusBadge status={doc.document_status} />
                </TableCell>
                <TableCell className='text-xs sm:text-sm whitespace-nowrap'>
                  {doc.updated_at
                    ? new Date(doc.updated_at).toLocaleString()
                    : '—'}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/documents/${doc.id}`}
                    className='text-primary hover:underline text-xs sm:text-sm'
                  >
                    {t('view')}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view: cards */}
      <div className='space-y-3 md:hidden'>
        {documents.map((doc) => (
          <div key={doc.id} className='rounded-md border p-3 sm:p-4 shadow-sm'>
            <div className='flex flex-col gap-2 mb-3'>
              <h3 className='font-semibold text-sm sm:text-base truncate'>{doc.title || doc.file_name}</h3>
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='text-xs text-muted-foreground'>{t('table.type')}:</span>
                <DocumentTypePill type={doc.document_type} />
              </div>
            </div>
            
            <div className='space-y-2 mb-3'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground'>{t('table.customer')}:</span>
                <span className='text-xs sm:text-sm font-medium truncate ml-2'>{doc.customer_name || '—'}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground'>{t('table.status')}:</span>
                <DocumentStatusBadge status={doc.document_status} />
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground'>{t('table.updated')}:</span>
                <span className='text-xs text-muted-foreground'>
                  {doc.updated_at
                    ? new Date(doc.updated_at).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>

            <div className='pt-2 border-t'>
              <Button variant='outline' size='sm' className='w-full' asChild>
                <Link href={`/dashboard/documents/${doc.id}`}>
                  {t('view')}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
