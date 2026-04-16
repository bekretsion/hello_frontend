'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useInvoices } from '@/hooks/use-invoices';
import { useAuth } from '@/hooks/use-auth';
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

export default function InvoicesPage() {
  const t = useTranslations('documents.invoices');
  const { invoices, loading } = useInvoices();
  const { user } = useAuth();
  const userRole = user?.role || '';
  const isPrivileged =
    userRole === 'admin' || userRole === 'sales' || userRole === 'finance';

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold'>{t('title')}</h1>
          <p className='text-muted-foreground'>{t('description')}</p>
        </div>
        {isPrivileged && (
          <Button asChild>
            <Link href='/dashboard/documents/invoices/create'>
              {t('newInvoice')}
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className='text-muted-foreground'>{t('loading')}</p>
          ) : invoices.length === 0 ? (
            <p className='text-muted-foreground'>{t('noInvoices')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='bg-primary/30 hover:bg-primary/30'>
                  <TableHead>{t('table.invoice')}</TableHead>
                  <TableHead>{t('table.customer')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.dueDate')}</TableHead>
                  <TableHead>{t('table.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/documents/invoices/${invoice.id}`}
                        className='text-primary hover:underline'
                      >
                        {invoice.invoice_number || `Invoice #${invoice.id}`}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.customer_name || '—'}</TableCell>
                    <TableCell className='capitalize'>
                      {invoice.status || 'draft'}
                    </TableCell>
                    <TableCell>
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {invoice.total_amount
                        ? `$${Number(invoice.total_amount).toFixed(2)}`
                        : '—'}
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
