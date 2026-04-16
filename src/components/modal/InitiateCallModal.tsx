// components/modals/InitiateCallModal.tsx

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
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
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMinuteBundleCheck } from '@/hooks/use-minute-bundle-check';

// This interface defines the clean, transformed data structure for the dropdown.
interface UserPhoneNumber {
  id: string; // This will be the phone_number_id
  alias: string; // This will be the alias_number
}

// Add a type for the raw item from the API to improve type safety
interface RawPhoneNumberItem {
  id: number;
  phone_number_id: string;
  alias_number: string;
  // ... other properties from the API that we don't need here
}

interface InitiateCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerPhoneNumber: string;
  onConfirm: (payload: {
    customerNumber: string;
    yourNumberId: string;
  }) => void;
}

export function InitiateCallModal({
  isOpen,
  onClose,
  customerPhoneNumber,
  onConfirm
}: InitiateCallModalProps) {
  const t = useTranslations('modals.initiateCall');
  const tBilling = useTranslations('billing');
  const router = useRouter();
  const { requireMinuteBundle } = useMinuteBundleCheck();
  const [yourNumbers, setYourNumbers] = useState<UserPhoneNumber[]>([]);
  const [selectedYourNumberId, setSelectedYourNumberId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchYourNumbers = async () => {
        setIsLoading(true);
        setError(null);
        setYourNumbers([]); // Clear previous results
        setSelectedYourNumberId(''); // Reset selection

        try {
          // CHANGE 1: Call the new, specific API endpoint.
          const response = await fetch('/api/phonenumbers/my-numbers');
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch phone numbers.');
          }

          // CHANGE 2: Access the nested 'phonenumbers' array from the new response structure.
          const transformedData = result.data.phonenumbers.map(
            (item: RawPhoneNumberItem) => ({
              id: item.phone_number_id, // The value for the dropdown item
              alias: item.alias_number // The text displayed in the dropdown
            })
          );

          setYourNumbers(transformedData);

          // If there's only one number, pre-select it for convenience.
          if (transformedData.length === 1) {
            setSelectedYourNumberId(transformedData[0].id);
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'An unknown error occurred.';
          setError(errorMessage);
          toast.error(t('messages.loadNumbersError'), {
            description: errorMessage
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchYourNumbers();
    }
  }, [isOpen, t]);

  const handleConfirmClick = () => {
    if (!selectedYourNumberId) {
      toast.warning(t('messages.selectNumberWarning'));
      return;
    }
    requireMinuteBundle(() => {
      onConfirm({
        customerNumber: customerPhoneNumber,
        yourNumberId: selectedYourNumberId
      });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='customer-number' className='text-right'>
              {t('labels.customer')}
            </Label>
            <Input
              id='customer-number'
              value={customerPhoneNumber}
              disabled
              className='col-span-3'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='your-number' className='text-right'>
              {t('labels.callFrom')}
            </Label>
            <Select
              value={selectedYourNumberId}
              onValueChange={setSelectedYourNumberId}
              disabled={isLoading || !!error}
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue
                  placeholder={
                    isLoading ? t('placeholders.loadingNumbers') : t('placeholders.selectNumber')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {isLoading && (
                  <div className='flex items-center justify-center p-2'>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {t('messages.loading')}
                  </div>
                )}
                {!isLoading && yourNumbers.length === 0 && !error && (
                  <div className='text-muted-foreground p-2 text-center text-sm'>
                    {t('messages.noNumbers')}
                  </div>
                )}
                {yourNumbers.map((num) => (
                  <SelectItem key={num.id} value={num.id}>
                    {num.alias}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>{t('error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
          <Button
            onClick={handleConfirmClick}
            disabled={!selectedYourNumberId || isLoading}
          >
            {t('buttons.confirmCall')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}