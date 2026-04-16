'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Printer, FileText } from 'lucide-react';
import type { Document } from '@/types/documents';
import { useTranslations } from 'next-intl';

interface DocumentViewerProps {
  document: Document;
  showActions?: boolean;
}

export function DocumentViewer({
  document,
  showActions = true
}: DocumentViewerProps) {
  const t = useTranslations('documents.detail.preview');

  const handleDownload = () => {
    if (document.file_path) {
      // Open file in new tab for download
      window.open(document.file_path, '_blank');
    } else if (document.content) {
      // Create a blob and download HTML content
      const blob = new Blob([document.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title || document.file_name || 'document'}.html`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (document.file_path) {
      // For PDFs, open in new window and print
      const printWindow = window.open(document.file_path, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else if (document.content) {
      // For HTML content, create print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.title || 'Document'}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              ${document.content}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const isPDF =
    document.file_path?.toLowerCase().endsWith('.pdf') ||
    document.mime_type === 'application/pdf';

  return (
    <Card className='flex h-full w-full flex-col'>
      <CardHeader className='flex flex-shrink-0 flex-col items-start justify-between gap-3 border-b px-4 pt-4 pb-3 sm:flex-row sm:items-center sm:gap-0 sm:px-6 sm:pt-6 sm:pb-4'>
        <CardTitle className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
          <FileText className='h-4 w-4 sm:h-5 sm:w-5' />
          {t('title')}
        </CardTitle>
        {showActions && (
          <div className='flex w-full gap-2 sm:w-auto'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleDownload}
              className='flex-1 sm:flex-none'
            >
              <Download className='mr-2 h-3 w-3 sm:h-4 sm:w-4' />
              <span className='xs:inline hidden'>{t('download')}</span>
              <span className='xs:hidden'>{t('downloadShort')}</span>
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handlePrint}
              className='flex-1 sm:flex-none'
            >
              <Printer className='mr-2 h-3 w-3 sm:h-4 sm:w-4' />
              <span className='xs:inline hidden'>{t('print')}</span>
              <span className='xs:hidden'>{t('printShort')}</span>
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col overflow-hidden p-0'>
        {document.content ? (
          <div className='flex-1 overflow-auto p-4 sm:p-6'>
            <div
              className='prose prose-sm sm:prose-base dark:prose-invert max-w-none'
              dangerouslySetInnerHTML={{ __html: document.content }}
            />
          </div>
        ) : document.file_path ? (
          <div className='flex min-h-0 w-full flex-1 flex-col'>
            {isPDF ? (
              <div
                className='flex min-h-0 flex-1 flex-col border-t'
                style={{ minHeight: '600px' }}
              >
                <iframe
                  title={t('iframeTitle')}
                  src={document.file_path}
                  className='w-full flex-1 border-0'
                  style={{
                    minHeight: '600px'
                  }}
                />
              </div>
            ) : (
              <div className='flex flex-1 flex-col items-center justify-center border-t px-4 py-12 sm:py-16'>
                <div className='bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full sm:h-16 sm:w-16'>
                  <FileText className='text-muted-foreground h-6 w-6 sm:h-8 sm:w-8' />
                </div>
                <p className='text-muted-foreground mb-4 text-center text-sm font-medium sm:text-base'>
                  {t('previewNotAvailable')}
                </p>
                <Button
                  variant='outline'
                  onClick={handleDownload}
                  size='sm'
                  className='w-full sm:w-auto'
                >
                  <Download className='mr-2 h-4 w-4' />
                  {t('downloadFile')}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className='flex flex-1 flex-col items-center justify-center border-t px-4 py-12 text-center sm:py-16'>
            <div className='bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full sm:h-16 sm:w-16'>
              <FileText className='text-muted-foreground h-6 w-6 sm:h-8 sm:w-8' />
            </div>
            <p className='text-muted-foreground text-sm font-medium sm:text-base'>
              {t('noPreviewableContent')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
