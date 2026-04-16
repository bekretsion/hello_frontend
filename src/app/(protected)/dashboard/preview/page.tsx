'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useExcelData, ExcelRow } from '@/context/ExcelDataContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Phone, CalendarPlus, Loader2, Trash2 } from 'lucide-react'; // Added Trash2 icon
import { toast } from 'sonner';
import { InitiateCallModal } from '@/components/modal/InitiateCallModal';
import { useMinuteBundleCheck } from '@/hooks/use-minute-bundle-check';

export default function PreviewPage() {
  const router = useRouter();
  const { setDataToSchedule } = useExcelData();
  const t = useTranslations('preview');
  const tAlert = useTranslations('alerts'); // For alert dialog translations
  const tBilling = useTranslations('billing');
  const { requireMinuteBundle } = useMinuteBundleCheck();

  const [contacts, setContacts] = useState<ExcelRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation

  // ... (other states remain the same)
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<ExcelRow | null>(null);

  // ... (useEffect for fetching contacts remains the same)
  useEffect(() => {
    const fetchContacts = async () => {
      // ... same logic
      try {
        setIsLoading(true);
        const response = await fetch('/api/contacts');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch contacts.');
        }

        const fetchedContacts = result.data || [];
        if (fetchedContacts.length === 0) {
          router.replace('/dashboard/upload');
          return;
        }
        setContacts(fetchedContacts);
      } catch (error: any) {
        toast.error('Error loading contacts', { description: error.message });
        router.replace('/dashboard/upload');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, [router]);

  // --- NEW: Function to handle clearing all contacts ---
  const handleClearAllContacts = async () => {
    setIsDeleting(true);
    const toastId = toast.loading(tAlert('deletingContacts'));

    try {
      const response = await fetch('/api/contacts', {
        method: 'DELETE'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to clear contacts.');
      }

      toast.success(result.message, { id: toastId });
      // Redirect to upload page after successful deletion
      router.push('/dashboard/upload');

    } catch (error: any) {
      toast.error(tAlert('deleteFailed'), { id: toastId, description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // ... (All other handlers like handleSelectAll, handleRowSelection, etc. remain the same)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(
        contacts.map((row) => row._id).filter((id) => id !== undefined) as number[]
      );
      setSelectedRowIds(allIds);
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleRowSelection = (rowId: number) => {
    const newSelection = new Set(selectedRowIds);
    if (newSelection.has(rowId)) newSelection.delete(rowId);
    else newSelection.add(rowId);
    setSelectedRowIds(newSelection);
  };
  const handleInitiateCallForRow = (row: ExcelRow) => {
    if (!row['Phone number 1']) {
      toast.error(t('messages.noPhoneNumber'));
      return;
    }
    setCurrentCustomer(row);
    setIsModalOpen(true);
  };

  const handleConfirmAndMakeCall = async ({
                                            customerNumber,
                                            yourNumberId
                                          }: {
    customerNumber: string;
    yourNumberId: string;
  }) => {
    requireMinuteBundle(async () => {
      const toastId = toast.loading(
        t('messages.initiatingCall', { phoneNumber: customerNumber })
      );
      try {
        const response = await fetch('/api/vapi/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: customerNumber,
            vapiPhoneNumberId: yourNumberId
          })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || t('messages.callFailed'));
        toast.success(t('messages.callInitiated'), { id: toastId });
      } catch (error: any) {
        toast.error(error.message || t('messages.unexpectedError'), { id: toastId });
      } finally {
        setIsModalOpen(false);
      }
    });
  };

  const handleScheduleCall = () => {
    requireMinuteBundle(() => {
      const selectedData = contacts.filter(
        (row) => row._id !== undefined && selectedRowIds.has(row._id)
      );
      if (selectedData.length === 0) {
        toast.warning(t('messages.noRowsSelected'));
        return;
      }
      setDataToSchedule(selectedData);
      router.push('/dashboard/schedule-call');
    });
  };

  const isAllSelected = contacts.length > 0 && selectedRowIds.size === contacts.length;
  const isSomeSelected = selectedRowIds.size > 0 && !isAllSelected;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </div>
            {/* --- NEW: Alert Dialog with Trigger Button --- */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {t('buttons.clearAll')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tAlert('confirmDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tAlert('confirmDeleteDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tAlert('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllContacts}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {tAlert('confirmDeleteButton')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* ... (Table remains the same) ... */}
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[50px]'>
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      data-state={
                        isSomeSelected ? 'indeterminate' : isAllSelected ? 'checked' : 'unchecked'
                      }
                      aria-label={t('accessibility.selectAll')}
                    />
                  </TableHead>
                  <TableHead>{t('table.fullName')}</TableHead>
                  <TableHead>{t('table.company')}</TableHead>
                  <TableHead>{t('table.title')}</TableHead>
                  <TableHead>{t('table.phoneNumber1')}</TableHead>
                  <TableHead>{t('table.phoneNumber2')}</TableHead>
                  <TableHead className='text-right'>{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((row) => (
                  <TableRow
                    key={row._id}
                    data-state={row._id !== undefined && selectedRowIds.has(row._id) ? 'selected' : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={row._id !== undefined && selectedRowIds.has(row._id)}
                        onCheckedChange={() => row._id !== undefined && handleRowSelection(row._id)}
                        aria-label={t('accessibility.selectRow')}
                      />
                    </TableCell>
                    <TableCell className='font-medium'>{`${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim()}</TableCell>
                    <TableCell>{row.Company}</TableCell>
                    <TableCell>{row.Title}</TableCell>
                    <TableCell>{row['Phone number 1']}</TableCell>
                    <TableCell>{row['Phone Number 2']}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleInitiateCallForRow(row)}
                        aria-label={t('accessibility.initiateCallButton')}
                        disabled={!row['Phone number 1']}
                      >
                        <Phone className='h-4 w-4' />
                        <span className='sr-only'>{t('buttons.initiateCall')}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end gap-4'>
          <Button onClick={handleScheduleCall} disabled={selectedRowIds.size === 0}>
            <CalendarPlus className='mr-2 h-4 w-4' />
            {t('buttons.scheduleSelected')} ({selectedRowIds.size})
          </Button>
        </CardFooter>
      </Card>

      {currentCustomer && (
        <InitiateCallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          customerPhoneNumber={currentCustomer['Phone number 1'] || ''}
          onConfirm={handleConfirmAndMakeCall}
        />
      )}
    </div>
  );
}