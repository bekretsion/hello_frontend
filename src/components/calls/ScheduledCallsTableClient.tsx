'use client';

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
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { IconFileExport, IconTrash } from '@tabler/icons-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { useTranslations } from 'next-intl';
import * as XLSX from 'xlsx';

// 1. Interface for Scheduled Call data based on your DB schema.
export interface ScheduledCallData {
  id: number;
  user_id: number;
  customer_phone_number: string;
  vapi_assistant_id: string;
  vapi_phone_number_id: string;
  scheduled_time: string; // ISO string from the database
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

// 2. Component to display the data.
export default function ScheduledCallsTableClient({
  userRole
}: {
  userRole: string;
}) {
  const t = useTranslations('scheduledCalls');
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCallData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filteredScheduledCalls, setFilteredScheduledCalls] = useState<
    ScheduledCallData[]
  >([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ++ NEW: State to manage the confirmation dialog ++
  const [callToDelete, setCallToDelete] = useState<number | null>(null);

  // 3. Fetch logic to hit the new endpoint and use statusFilter.
  const fetchScheduledCalls = useCallback(
    async (abortController: AbortController) => {
      setIsLoading(true);
      setError(null);

      let url = '/api/vapi/calls/schedule';
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }

      try {
        const response = await fetch(url, { signal: abortController.signal });

        if (!response.ok) {
          throw new Error(t('errors.fetchFailed', { status: response.status }));
        }

        const data: ScheduledCallData[] = await response.json();
        setScheduledCalls(data);
        // Also initialize the filtered list on fetch
        setFilteredScheduledCalls(data);
      } catch (err) {
        const error = err as Error;
        if (error.name !== 'AbortError') {
          setError(error.message);
          console.error('Fetch error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, t]
  );

  useEffect(() => {
    const abortController = new AbortController();
    fetchScheduledCalls(abortController);

    return () => abortController.abort();
  }, [fetchScheduledCalls]);

  // 4. Client-side search logic.
  useEffect(() => {
    const searchTerm = search.toLowerCase();

    // Apply status filter first
    let tempFiltered = scheduledCalls;
    if (statusFilter) {
      tempFiltered = tempFiltered.filter(
        (call) => call.status === statusFilter
      );
    }

    // Then apply search term
    if (!searchTerm) {
      setFilteredScheduledCalls(tempFiltered);
      return;
    }

    const finalFiltered = tempFiltered.filter((call) =>
      call.customer_phone_number.toLowerCase().includes(searchTerm)
    );

    setFilteredScheduledCalls(finalFiltered);
  }, [search, statusFilter, scheduledCalls]);

  // 5. handleExport for the new data structure.
  const handleExport = () => {
    if (filteredScheduledCalls.length === 0) {
      toast.warning(t('export.noData'));
      return;
    }

    const dataToExport = filteredScheduledCalls.map((call) => ({
      [t('export.columns.customerNumber')]: call.customer_phone_number,
      [t('export.columns.status')]: call.status,
      [t('export.columns.scheduledFor')]: new Date(call.scheduled_time).toLocaleString('en-GB'),
      [t('export.columns.assistantId')]: call.vapi_assistant_id,
      [t('export.columns.callerId')]: call.vapi_phone_number_id,
      [t('export.columns.scheduledOn')]: new Date(call.created_at).toLocaleString('en-GB'),
      [t('export.columns.recordId')]: call.id
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 40 },
      { wch: 40 },
      { wch: 25 },
      { wch: 10 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('export.sheetName'));
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${t('export.fileName')}_${today}.xlsx`);
  };

  // ++ CHANGED: This function is now triggered by the dialog's confirmation ++
  const handleDeleteConfirm = async () => {
    if (callToDelete === null) return;

    try {
      const response = await fetch(`/api/vapi/calls/schedule/${callToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('errors.deleteFailed'));
      }

      // On success, remove the call from the local state for an immediate UI update
      setScheduledCalls((prev) =>
        prev.filter((call) => call.id !== callToDelete)
      );
      setFilteredScheduledCalls((prev) =>
        prev.filter((call) => call.id !== callToDelete)
      );

      toast.success(t('messages.deleteSuccess'));
    } catch (error) {
      console.error('Deletion error:', error);
      toast.error((error as Error).message);
    } finally {
      // Always close the dialog
      setCallToDelete(null);
    }
  };

  if (isLoading && scheduledCalls.length === 0) {
    return <DataTableSkeleton columnCount={6} rowCount={10} filterCount={2} />;
  }

  if (error) {
    return (
      <div className='bg-card flex h-64 items-center justify-center rounded-md border'>
        <p className='text-destructive'>{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <>
      {/* ++ NEW: Toaster for modern notifications (place at root) ++ */}
      <Toaster position='top-right' richColors />

      <div className='flex flex-1 flex-col space-y-4'>
        <div className='bg-card flex flex-wrap items-center justify-between gap-4 rounded-md border p-4'>
          <Input
            placeholder={t('search.placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-sm'
          />
          <div className='flex items-center space-x-2'>
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('')}
            >
              {t('filters.all')}
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
            >
              {t('filters.pending')}
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('completed')}
            >
              {t('filters.completed')}
            </Button>
            <Button
              variant={statusFilter === 'failed' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('failed')}
            >
              {t('filters.failed')}
            </Button>
          </div>
          <Button onClick={handleExport} variant='outline' disabled={isLoading}>
            <IconFileExport className='mr-2 h-4 w-4' />
            {t('export.button')}
          </Button>
        </div>

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.customerNumber')}</TableHead>
                <TableHead>{t('table.scheduledFor')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.scheduledOn')}</TableHead>
                <TableHead className='text-right'>{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center'>
                    {t('loading.freshData')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredScheduledCalls.length > 0 ? (
                filteredScheduledCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className='font-medium'>
                      {call.customer_phone_number}
                    </TableCell>
                    <TableCell>
                      {new Date(call.scheduled_time).toLocaleString('en-GB')}
                    </TableCell>
                    <TableCell>{call.status}</TableCell>
                    <TableCell>
                      {new Date(call.created_at).toLocaleString('en-GB')}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setCallToDelete(call.id)}
                        disabled={call.status !== 'pending'}
                        title={t('actions.deleteCall')}
                      >
                        <IconTrash className='text-destructive h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : !isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center'>
                    {t('table.noResults')}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ++ NEW: The AlertDialog component for confirmation ++ */}
      <AlertDialog
        open={callToDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCallToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {t('deleteDialog.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}