'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentsTable } from '@/components/documents/documents-table';
import { useDocuments } from '@/hooks/use-documents';

export default function SignedDocumentsPage() {
  const t = useTranslations('documents.signed');
  const { documents, loading } = useDocuments({
    is_signed: true
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentsTable documents={documents} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}