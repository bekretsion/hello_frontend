'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Copy, PlusCircle, Trash2, ShieldAlert, PhoneCall } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export interface PhoneNumberData {
  id: number;
  user_id: number;
  phone_number_id: string;
  alias_number: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface PhoneRequest {
  id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
  email?: string;
}

export default function PhoneNumbersTableClient() {
  const t = useTranslations('phoneNumbers');
  const tCommon = useTranslations('common');

  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredPhoneNumbers, setFilteredPhoneNumbers] = useState<
    PhoneNumberData[]
  >([]);
  const [search, setSearch] = useState('');
  const [phoneRequests, setPhoneRequests] = useState<PhoneRequest[]>([]);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [updatingRequest, setUpdatingRequest] = useState(false);

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/phonenumbers');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || t('errors.fetchFailed'));
        }
        setPhoneNumbers(result.data || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : tCommon('error');
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPhoneNumbers();
  }, [t, tCommon]);

  const fetchPhoneRequests = async () => {
    try {
      const response = await fetch('/api/admin/phone-requests/pending');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch phone requests');
      }

      setPhoneRequests(result.requests || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : tCommon('error');
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    const searchTerm = search.toLowerCase();
    if (!searchTerm) {
      setFilteredPhoneNumbers(phoneNumbers);
      return;
    }
    const filtered = phoneNumbers.filter(
      (num) =>
        num.alias_number.toLowerCase().includes(searchTerm) ||
        num.phone_number_id.toLowerCase().includes(searchTerm) ||
        num.username.toLowerCase().includes(searchTerm) ||
        num.email.toLowerCase().includes(searchTerm)
    );
    setFilteredPhoneNumbers(filtered);
  }, [search, phoneNumbers]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('copySuccess', { label }));
  };

  const handleDelete = async (id: number) => {
    toast.loading(t('deleting'));
    try {
      const response = await fetch(`/api/phonenumbers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || t('errors.deleteFailed'));
      }

      setPhoneNumbers((current) => current.filter((num) => num.id !== id));
      toast.success(t('deleteSuccess'));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : tCommon('error');
      toast.error(t('errors.deletionFailed'), { description: errorMessage });
    }
  };

  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={5} />;
  }

  if (error) {
    return (
      <div className='bg-card flex h-64 items-center justify-center rounded-md border text-center'>
        <div>
          <p className='text-destructive text-xl font-semibold'>
            {t('errors.fetchError')}
          </p>
          <p className='text-muted-foreground'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='bg-card flex items-center justify-between space-x-4 rounded-md border p-4'>
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-md'
        />
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={async () => {
              await fetchPhoneRequests();
              setRequestsOpen(true);
            }}
          >
            <PhoneCall className='mr-2 h-4 w-4' />
            Requested Phones
          </Button>
          <Button asChild>
            <Link href='/dashboard/phonenumbers/create'>
              <PlusCircle className='mr-2 h-4 w-4' />
              {t('addNewNumber')}
            </Link>
          </Button>
        </div>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.aliasNumber')}</TableHead>
              <TableHead>{t('table.phoneNumberId')}</TableHead>
              <TableHead>{t('table.assignedUser')}</TableHead>
              <TableHead>{t('table.created')}</TableHead>
              <TableHead className='text-right'>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPhoneNumbers.length > 0 ? (
              filteredPhoneNumbers.map((num) => (
                <TableRow key={num.id}>
                  <TableCell className='font-mono font-medium'>
                    <div className='flex items-center gap-2'>
                      <span>{num.alias_number}</span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() =>
                          handleCopy(num.alias_number, t('labels.aliasNumber'))
                        }
                      >
                        <Copy className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    <div className='flex items-center gap-2'>
                      <span>{num.phone_number_id}</span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() =>
                          handleCopy(num.phone_number_id, t('labels.phoneNumberId'))
                        }
                      >
                        <Copy className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='font-medium'>{num.username}</span>
                      <span className='text-muted-foreground text-xs'>
                        {num.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(num.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='destructive'
                          size='icon'
                          className='h-8 w-8'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className='flex items-center gap-2'>
                            <ShieldAlert className='text-destructive h-6 w-6' />
                            {t('deleteDialog.title')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('deleteDialog.description', {
                              aliasNumber: num.alias_number,
                              email: num.email
                            })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(num.id)}
                            className='bg-destructive hover:bg-destructive/90'
                          >
                            {t('deleteDialog.confirm')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  {t('noNumbersFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogContent className='sm:max-w-[700px]'>
          <DialogHeader>
            <DialogTitle>Requested Phone Numbers</DialogTitle>
            <DialogDescription>
              View users who have requested a phone number and approve their requests.
            </DialogDescription>
          </DialogHeader>
          {phoneRequests.length === 0 ? (
            <div className='py-6 text-center text-sm text-muted-foreground'>
              No pending phone number requests.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.username || 'Unknown'}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className='text-right space-x-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={updatingRequest}
                        onClick={async () => {
                          try {
                            setUpdatingRequest(true);
                            const response = await fetch(
                              `/api/admin/phone-requests/${request.id}/status`,
                              {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'approved' })
                              }
                            );
                            const data = await response.json();
                            if (!response.ok) {
                              throw new Error(
                                data.message || 'Failed to approve request'
                              );
                            }
                            toast.success('Phone request approved');
                            fetchPhoneRequests();
                          } catch (err: any) {
                            toast.error(
                              err?.message || 'Failed to approve request'
                            );
                          } finally {
                            setUpdatingRequest(false);
                          }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        disabled={updatingRequest}
                        onClick={async () => {
                          try {
                            setUpdatingRequest(true);
                            const response = await fetch(
                              `/api/admin/phone-requests/${request.id}/status`,
                              {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'rejected' })
                              }
                            );
                            const data = await response.json();
                            if (!response.ok) {
                              throw new Error(
                                data.message || 'Failed to reject request'
                              );
                            }
                            toast.success('Phone request rejected');
                            fetchPhoneRequests();
                          } catch (err: any) {
                            toast.error(
                              err?.message || 'Failed to reject request'
                            );
                          } finally {
                            setUpdatingRequest(false);
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}