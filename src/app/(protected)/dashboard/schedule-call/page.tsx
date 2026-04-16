'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useExcelData } from '@/context/ExcelDataContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Heading } from '@/components/ui/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMinuteBundleCheck } from '@/hooks/use-minute-bundle-check';

interface UserPhoneNumber {
  id: number;
  user_id: number;
  phone_number_id: string; // Vapi ID
  alias_number: string;
}

const MAX_PENDING_CALLS = 10; // Share the constant with the frontend

export default function ScheduleCallPage() {
  const router = useRouter();
  const t = useTranslations('scheduleCall');
  const { dataToSchedule, setDataToSchedule } = useExcelData();
  const { requireMinuteBundle } = useMinuteBundleCheck();

  const [userPhoneNumbers, setUserPhoneNumbers] = useState<UserPhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [vapiPhoneNumberId, setVapiPhoneNumberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NEW STATE ---
  const [pendingCallCount, setPendingCallCount] = useState(0);

  useEffect(() => {
    if (dataToSchedule.length === 0) {
      router.replace('/dashboard/preview');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch both user numbers and pending calls in parallel
        const [numbersResponse, pendingCallsResponse] = await Promise.all([
          fetch('/api/phonenumbers/my-numbers'),
          fetch('/api/vapi/calls/schedule?status=pending') // Use the existing endpoint
        ]);

        // Process phone numbers
        if (!numbersResponse.ok) {
          const err = await numbersResponse.json();
          throw new Error(err.message || t('errors.loadNumbersFailed'));
        }
        const numbersResult = await numbersResponse.json();
        const numbers = numbersResult.data?.phonenumbers || [];
        setUserPhoneNumbers(numbers);
        if (numbers.length > 0) {
          setVapiPhoneNumberId(numbers[0].phone_number_id);
        }

        // Process pending calls count
        if (!pendingCallsResponse.ok) {
          // Non-critical, so we can just log it and continue
          console.error("Could not fetch pending calls count.");
          setPendingCallCount(0);
        } else {
          const pendingCallsResult = await pendingCallsResponse.json();
          setPendingCallCount(pendingCallsResult?.length || 0);
        }

      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataToSchedule, router, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !vapiPhoneNumberId) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }

    requireMinuteBundle(async () => {
      // --- NEW: Pre-submission check on the client ---
      if (pendingCallCount + dataToSchedule.length > MAX_PENDING_CALLS) {
        toast.error(t('errors.limitExceededTitle'), {
          description: t('errors.limitExceededDescription', {
            max: MAX_PENDING_CALLS,
            current: pendingCallCount,
            new: dataToSchedule.length
          })
        });
        return;
      }

      setIsSubmitting(true);
    const toastId = toast.loading(t('messages.schedulingCalls'));

    try {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDateTime = new Date(date);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const customers = dataToSchedule
        .map((contact) => ({
          number: String(contact['Phone number 1'])
        }))
        .filter((c) => c.number);

      if (customers.length === 0) {
        throw new Error(t('errors.noPhoneNumbers'));
      }

      const payload = {
        customers,
        scheduledTime: scheduledDateTime.toISOString(),
        vapiPhoneNumberId
      };

      const response = await fetch('/api/vapi/calls/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        // Use the detailed message from the backend if available
        throw new Error(result.details || result.message || 'Scheduling failed');
      }

        toast.success(result.message, { id: toastId });
        setDataToSchedule([]);
        router.push('/dashboard/preview'); // Or redirect to a "scheduled calls" page
      } catch (error: any) {
        toast.error(t('errors.schedulingFailed'), { id: toastId, description: error.message });
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  // --- NEW: Derived state to check if the limit is exceeded ---
  const isLimitExceeded = pendingCallCount + dataToSchedule.length > MAX_PENDING_CALLS;
  const remainingSlots = MAX_PENDING_CALLS - pendingCallCount;

  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <Heading title={t('title')} description={t('description')} />

      <div className='flex justify-center'>
        <Card className='w-full max-w-2xl'>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>{t('form.title')}</CardTitle>
              <CardDescription>
                {t('form.description', { count: dataToSchedule.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-8'>
              {/* --- NEW: Conditional Alert for limit warning --- */}
              {isLimitExceeded && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('errors.limitExceededTitle')}</AlertTitle>
                  <AlertDescription>
                    {t('errors.limitWarning', {
                      max: MAX_PENDING_CALLS,
                      current: pendingCallCount,
                      remaining: remainingSlots > 0 ? remainingSlots : 0
                    })}
                  </AlertDescription>
                </Alert>
              )}

              {/* ... (rest of the form remains the same) ... */}
              <div>
                <Label>{t('form.contactsToSchedule')}</Label>
                <div className='mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-md border p-2'>
                  {dataToSchedule.map((contact, index) => (
                    <Badge key={index} variant='secondary'>
                      {`${contact['First Name'] || ''} ${contact['Last Name'] || ''}`.trim() ||
                        t('form.unnamedContact')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='vapi-phone-number'>{t('form.callFrom')}</Label>
                <Select
                  onValueChange={setVapiPhoneNumberId}
                  value={vapiPhoneNumberId}
                  disabled={userPhoneNumbers.length === 0}
                >
                  <SelectTrigger id='vapi-phone-number'>
                    <SelectValue placeholder={t('form.selectNumberPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {userPhoneNumbers.length > 0 ? (
                      userPhoneNumbers.map((num) => (
                        <SelectItem key={num.id} value={num.phone_number_id}>
                          {num.alias_number}
                        </SelectItem>
                      ))
                    ) : (
                      <div className='text-muted-foreground p-4 text-center text-sm'>
                        {t('form.noNumbersFound')}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='date'>{t('form.date')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {date ? format(date, 'PPP') : <span>{t('form.pickDate')}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar
                        mode='single'
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='time'>{t('form.time')}</Label>
                  <Input
                    id='time'
                    type='time'
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className='flex justify-between border-t pt-6'>
              <Button variant='ghost' type='button' onClick={() => router.back()}>
                {t('buttons.cancel')}
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting || userPhoneNumbers.length === 0 || isLimitExceeded}
              >
                {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {t('buttons.confirmSchedule')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}