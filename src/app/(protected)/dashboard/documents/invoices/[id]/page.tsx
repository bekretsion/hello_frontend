'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { invoicesApi } from '@/services/invoices.api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Send, CheckCircle } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
}

export default function InvoiceDetailPage() {
  const t = useTranslations('documents.invoices.detail');
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const invoiceId = params?.id;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const { user } = useAuth();
  const userRole = user?.role || '';
  const isPrivileged =
    userRole === 'admin' || userRole === 'sales' || userRole === 'finance';

  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;
    try {
      const response = await invoicesApi.getInvoice(invoiceId);
      setInvoice(response.data);
    } catch (error) {
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [invoiceId, t]);

  useEffect(() => {
    if (showSendModal) {
      const fetchUsers = async () => {
        try {
          setLoadingUsers(true);
          const response = await fetch('/api/users');
          const data = await response.json();
          if (data.users) {
            setUsers(data.users);
          }
        } catch (error) {
          console.error('Failed to fetch users:', error);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();

      if (invoice?.customer_email) {
        setRecipientEmail(invoice.customer_email);
      }
      if (invoice?.customer_name) {
        setRecipientName(invoice.customer_name);
      }
    }
  }, [showSendModal, invoice]);

  useEffect(() => {
    fetchInvoice();

    const paymentStatus = searchParams?.get('payment');
    if (paymentStatus === 'success') {
      toast.success(t('success.paymentSuccess'));
      fetchInvoice();
    } else if (paymentStatus === 'cancelled') {
      toast.info(t('success.paymentCancelled'));
    }
  }, [fetchInvoice, searchParams, t]);

  const handleUserSelect = (userId: string) => {
    const selectedUser = users.find((u) => u.id.toString() === userId);
    if (selectedUser) {
      setSelectedUserId(userId);
      setRecipientName(selectedUser.username || '');
      setRecipientEmail(selectedUser.email || '');
    }
  };

  const openSendModal = () => {
    setShowSendModal(true);
  };

  const handleSendInvoice = async () => {
    if (!recipientEmail) {
      toast.error(t('errors.enterEmail'));
      return;
    }

    try {
      setSendingInvoice(true);
      await invoicesApi.sendInvoice(invoice.id, {
        recipient_email: recipientEmail
      });
      toast.success(t('success.invoiceSent'));
      setShowSendModal(false);
      setRecipientEmail('');
      setRecipientName('');
      setSelectedUserId('');
      await fetchInvoice();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.sendFailed')
      );
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      setMarkingPaid(true);
      await invoicesApi.markAsPaid(invoice.id);
      toast.success(t('success.markedPaid'));
      await fetchInvoice();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.markPaidFailed')
      );
    } finally {
      setMarkingPaid(false);
    }
  };

  const handlePayInvoice = async () => {
    try {
      setProcessingPayment(true);
      const response = await invoicesApi.createPaymentSession(invoice.id);
      window.location.href = response.data.checkout_url;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        t('errors.paymentFailed')
      );
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='mr-2 h-6 w-6 animate-spin' />
        <p className='text-muted-foreground'>{t('loading')}</p>
      </div>
    );
  }

  if (!invoice) {
    return <p className='text-destructive'>{t('notFound')}</p>;
  }

  const lineItems = invoice.line_items || [];
  const isPaid = invoice.status === 'paid';
  const canSend = !sendingInvoice && invoice.status !== 'paid';
  const canMarkPaid = !markingPaid && !isPaid;

  return (
    <div className="space-y-8">
      {/* Invoice Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-gray-600 dark:text-gray-300">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Invoice #{invoice.invoice_number || invoice.id}
              </p>
              <h1 className="text-3xl font-bold mt-1">{invoice.customer_name}</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Issue Date</p>
            <p className="font-medium">
              {invoice.created_at
                ? new Date(invoice.created_at).toLocaleDateString()
                : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className='text-muted-foreground text-sm'>
              {t('summary.dueDate')}
            </p>
            <p className='font-medium'>
              {invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="text-xl font-semibold capitalize">{invoice.status || 'draft'}</p>
              </div>
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <div className={`h-3 w-3 rounded-full ${invoice.status === 'paid' ? 'bg-green-500' : invoice.status === 'sent' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-xl font-semibold">
                  {invoice.total_amount
                    ? `$${Number(invoice.total_amount).toFixed(2)}`
                    : '—'}
                </p>
              </div>
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign text-gray-600 dark:text-gray-300">
                  <line x1="12" x2="12" y1="2" y2="22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Subtotal</p>
                <p className="text-xl font-semibold">
                  {invoice.total_amount
                    ? `$${(Number(invoice.total_amount) / (1 + (invoice.vat_rate || 0) / 100)).toFixed(2)}`
                    : '—'}
                </p>
              </div>
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator text-gray-600 dark:text-gray-300">
                  <rect width="16" height="20" x="4" y="2" rx="2" />
                  <line x1="8" x2="16" y1="6" y2="6" />
                  <line x1="16" x2="16" y1="14" y2="18" />
                  <path d="M12 10h.01" />
                  <path d="M8 10h.01" />
                  <path d="M12 14h.01" />
                  <path d="M8 14h.01" />
                  <path d="M10 18h.01" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">VAT</p>
                <p className="text-xl font-semibold">
                  {invoice.total_amount
                    ? `$${(Number(invoice.total_amount) - (Number(invoice.total_amount) / (1 + (invoice.vat_rate || 0) / 100))).toFixed(2)}`
                    : '—'}
                </p>
              </div>
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-percent text-gray-600 dark:text-gray-300">
                  <line x1="19" x2="5" y1="5" y2="19" />
                  <circle cx="6.5" cy="6.5" r="2.5" />
                  <circle cx="17.5" cy="17.5" r="2.5" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card className="p-6 border">
        <div className="flex flex-wrap gap-3 justify-between">
          <div className="flex flex-wrap gap-3">
            {isPrivileged ? (
              <>
                <div>
                  <p className='text-muted-foreground text-sm uppercase tracking-wider font-semibold'>
                    {t('summary.total')}
                  </p>
                  <p className='text-2xl font-bold mt-1 text-primary'>
                    {invoice.total_amount
                      ? `$${Number(invoice.total_amount).toFixed(2)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm uppercase tracking-wider font-semibold'>
                    {t('summary.actions')}
                  </p>
                  <div className='mt-2 flex flex-wrap gap-3'>
                    <Button
                      variant='outline'
                      onClick={openSendModal}
                      disabled={!canSend}
                      className="flex items-center gap-2 h-10 shadow-sm"
                    >
                      <Send className='h-4 w-4' />
                      {t('actions.send')}
                    </Button>
                    <Button
                      variant={isPaid ? 'secondary' : 'default'}
                      onClick={handleMarkPaid}
                      disabled={!canMarkPaid}
                      className={`${isPaid ? 'cursor-not-allowed opacity-60' : ''} flex items-center gap-2 h-10 shadow-sm`}
                    >
                      {markingPaid ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          {t('actions.processing')}
                        </>
                      ) : isPaid ? (
                        <>
                          <CheckCircle className='mr-2 h-4 w-4 text-green-500' />
                          {t('actions.alreadyPaid')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className='mr-2 h-4 w-4' />
                          {t('actions.markPaid')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Show Pay button for non-privileged users (customers)
              !isPaid &&
              (invoice.status === 'sent' || invoice.status === 'draft') &&
              invoice.total_amount > 0 && (
                <div className="flex flex-col">
                  <p className='text-muted-foreground text-sm uppercase tracking-wider font-semibold mb-2'>
                    Payment
                  </p>
                  <Button
                    onClick={handlePayInvoice}
                    disabled={processingPayment}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 h-11 px-8 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                        Pay ${Number(invoice.total_amount).toFixed(2)} Now
                      </>
                    )}
                  </Button>
                </div>
              )
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="flex items-center gap-2 h-10 px-4 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Download PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-10 px-4 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect width="12" height="8" x="6" y="14" rx="2" />
              </svg>
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card className="border">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list">
              <line x1="8" x2="21" y1="6" y2="6" />
              <line x1="8" x2="21" y1="12" y2="12" />
              <line x1="8" x2="21" y1="18" y2="18" />
              <line x1="3" x2="3.01" y1="6" y2="6" />
              <line x1="3" x2="3.01" y1="12" y2="12" />
              <line x1="3" x2="3.01" y1="18" y2="18" />
            </svg>
            {t('lineItems.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {lineItems.length === 0 ? (
            <p className='text-muted-foreground'>{t('lineItems.noItems')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className='bg-primary/30 hover:bg-primary/30 border-b'>
                    <TableHead className="font-semibold py-4 px-4 text-muted-foreground">{t('lineItems.description')}</TableHead>
                    <TableHead className="text-right font-semibold py-4 px-4 text-muted-foreground">{t('lineItems.quantity')}</TableHead>
                    <TableHead className="text-right font-semibold py-4 px-4 text-muted-foreground">{t('lineItems.unitPrice')}</TableHead>
                    <TableHead className="text-right font-semibold py-4 px-4 text-muted-foreground">{t('lineItems.vat')}</TableHead>
                    <TableHead className="text-right font-semibold py-4 px-4 text-muted-foreground">{t('lineItems.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item: any, index: number) => (
                    <TableRow key={index} className="border-b border-border/50 last:border-b-0 hover:bg-muted/10 transition-colors duration-150">
                      <TableCell className="py-4 px-4 font-medium">{item.description}</TableCell>
                      <TableCell className="py-4 px-4 text-right">{item.quantity}</TableCell>
                      <TableCell className="py-4 px-4 text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                      <TableCell className="py-4 px-4 text-right">{item.vat_rate || 0}%</TableCell>
                      <TableCell className="py-4 px-4 text-right font-medium">
                        $
                        {(
                          item.quantity *
                          item.unit_price *
                          (1 + (item.vat_rate || 0) / 100)
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{t('send.title')}</DialogTitle>
            <DialogDescription>{t('send.description')}</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>{t('send.selectUser')}</Label>
              <Select
                value={selectedUserId}
                onValueChange={handleUserSelect}
                disabled={loadingUsers}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingUsers
                        ? t('send.loadingUsers')
                        : t('send.selectUserPlaceholder')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.username} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='recipientName'>{t('send.recipientName')}</Label>
              <Input
                id='recipientName'
                placeholder='John Doe'
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='recipientEmail'>{t('send.recipientEmail')}</Label>
              <Input
                id='recipientEmail'
                type='email'
                placeholder='john@example.com'
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setShowSendModal(false)}
              disabled={sendingInvoice}
            >
              {t('send.cancel')}
            </Button>
            <Button
              onClick={handleSendInvoice}
              disabled={sendingInvoice || !recipientEmail}
            >
              {sendingInvoice ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('send.sending')}
                </>
              ) : (
                <>
                  <Send className='mr-2 h-4 w-4' />
                  {t('send.sendInvoice')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
