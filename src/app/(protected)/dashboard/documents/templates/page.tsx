'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTemplates } from '@/hooks/use-templates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export default function TemplatesPage() {
  const t = useTranslations('documents.templates');
  const { templates, loading } = useTemplates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/documents/templates/create">{t('newTemplate')}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('library')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{t('loading')}</p>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground">{t('noTemplates')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.type')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.lastUpdated')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/documents/templates/${template.id}`}
                        className="text-primary hover:underline"
                      >
                        {template.name}
                      </Link>
                    </TableCell>
                    <TableCell className="uppercase">
                      {template.type}
                    </TableCell>
                    <TableCell>
                      {template.is_active ? t('table.status') : 'Inactive'}
                    </TableCell>
                    <TableCell>
                      {new Date(template.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}