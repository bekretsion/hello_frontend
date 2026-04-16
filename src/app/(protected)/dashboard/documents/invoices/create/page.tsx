'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { invoicesApi } from '@/services/invoices.api';
import { toast } from 'sonner';

interface Customer {
  id: number;
  company_name?: string;
  username?: string;
  email?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

export default function InvoiceCreationPage() {
  const t = useTranslations('documents.invoices.create');
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_id: '',
    due_date: '',
    notes: '',
    currency: 'USD'
  });
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, vat_rate: 25 }
  ]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/admin/customers?limit=1000');
        if (!response.ok) {
          throw new Error('Failed to load customers');
        }
        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('errors.createFailed')
        );
      }
    };

    fetchCustomers();
  }, [t]);

  const total = items.reduce((sum, item) => {
    const lineAmount = item.quantity * item.unit_price;
    const vatAmount = lineAmount * (item.vat_rate / 100);
    return sum + lineAmount + vatAmount;
  }, 0);

  const updateItem = (index: number, update: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...update } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: 1, unit_price: 0, vat_rate: 25 }
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!form.customer_id) {
      toast.error(t('errors.selectCustomer'));
      return;
    }

    try {
      setSubmitting(true);
      await invoicesApi.createInvoice({
        customer_id: form.customer_id,
        due_date: form.due_date,
        currency: form.currency,
        notes: form.notes,
        line_items: items
      });
      toast.success(t('success.invoiceCreated'));
      router.push('/dashboard/documents/invoices');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.createFailed')
      );
    } finally {
      setSubmitting(false);
    }
  };

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
          <CardTitle>{t('details.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('details.customer')}</Label>
              <Select
                value={form.customer_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, customer_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('details.selectCustomer')} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.company_name || customer.username || customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('details.dueDate')}</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, due_date: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('details.currency')}</Label>
              <Select
                value={form.currency}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="NOK">NOK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('details.notes')}</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('lineItems.title')}</CardTitle>
          <Button variant="outline" onClick={addItem}>
            {t('lineItems.addItem')}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('lineItems.description')}</TableHead>
                <TableHead>{t('lineItems.qty')}</TableHead>
                <TableHead>{t('lineItems.unitPrice')}</TableHead>
                <TableHead>{t('lineItems.vat')}</TableHead>
                <TableHead>{t('lineItems.total')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, { description: event.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, {
                          quantity: Number(event.target.value)
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={item.unit_price}
                      onChange={(event) =>
                        updateItem(index, {
                          unit_price: Number(event.target.value)
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={item.vat_rate}
                      onChange={(event) =>
                        updateItem(index, { vat_rate: Number(event.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {(
                      item.quantity * item.unit_price * (1 + item.vat_rate / 100)
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      {t('lineItems.remove')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('lineItems.totalLabel')}</p>
              <p className="text-2xl font-semibold">${total.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? t('buttons.saving') : t('buttons.createInvoice')}
        </Button>
      </div>
    </div>
  );
}