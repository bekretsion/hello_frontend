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
import { CalendarIcon, Loader2, AlertTriangle, Bot, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Heading } from '@/components/ui/heading';
import { useMinuteBundleCheck } from '@/hooks/use-minute-bundle-check';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AssistantSelector } from '@/components/assistant/AssistantSelector';

interface UserPhoneNumber {
  id: number;
  user_id: number;
  phone_number_id: string;
  alias_number: string;
}

interface Assistant {
  id: number;
  vapi_assistant_id: string;
  name: string;
  description: string;
}

interface Script {
  id: number;
  name: string;
  content: string;
  script_type: string;
}

interface Voice {
  id: number;
  name: string;
  vapi_voice_id: string;
  voice_type: string;
}

interface AssistantSelection {
  assistant: Assistant | null;
  script: Script | null;
  voice: Voice | null;
}

const MAX_PENDING_CALLS = 10;

export default function EnhancedScheduleCallPage() {
  const router = useRouter();
  const t = useTranslations('scheduleCall');
  const { dataToSchedule, setDataToSchedule } = useExcelData();
  const { requireMinuteBundle } = useMinuteBundleCheck();

  const [userPhoneNumbers, setUserPhoneNumbers] = useState<UserPhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [vapiPhoneNumberId, setVapiPhoneNumberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingCallCount, setPendingCallCount] = useState(0);
  
  // Assistant selection state
  const [assistantSelection, setAssistantSelection] = useState<AssistantSelection>({
    assistant: null,
    script: null,
    voice: null,
  });

  useEffect(() => {
    if (dataToSchedule.length === 0) {
      router.replace('/dashboard/preview');
      return;
    }

    fetchUserPhoneNumbers();
    fetchPendingCallCount();
  }, [dataToSchedule, router]);

  const fetchUserPhoneNumbers = async () => {
    try {
      const response = await fetch('/api/phonenumbers/my-numbers');
      if (response.ok) {
        const data = await response.json();
        setUserPhoneNumbers(data.phoneNumbers || []);
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to load phone numbers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingCallCount = async () => {
    try {
      const response = await fetch('/api/vapi/scheduled-calls?status=pending');
      if (response.ok) {
        const data = await response.json();
        setPendingCallCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error('Error fetching pending call count:', error);
    }
  };

  const validateForm = (): string | null => {
    if (!assistantSelection.assistant) {
      return 'Please select an assistant';
    }
    if (!assistantSelection.script) {
      return 'Please select a script';
    }
    if (!assistantSelection.voice) {
      return 'Please select a voice';
    }
    if (!date) {
      return 'Please select a date';
    }
    if (!time) {
      return 'Please select a time';
    }
    if (!vapiPhoneNumberId) {
      return 'Please select a phone number to call from';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    requireMinuteBundle(async () => {
      if (isLimitExceeded) {
        toast.error(`Cannot schedule calls. You would exceed the limit of ${MAX_PENDING_CALLS} pending calls.`);
        return;
      }

      setIsSubmitting(true);
      const toastId = toast.loading('Scheduling calls...');

      try {
      const scheduledDateTime = new Date(date!);
      const [hours, minutes] = time.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      // Prepare customers data with phone numbers
      const customers = dataToSchedule
        .filter(contact => contact['Phone number 1'] || contact['Phone Number 2'])
        .map(contact => ({
          number: contact['Phone number 1'] || contact['Phone Number 2'],
          name: `${contact['First Name'] || ''} ${contact['Last Name'] || ''}`.trim(),
        }));

      if (customers.length === 0) {
        throw new Error('No valid phone numbers found in the selected contacts');
      }

      const requestBody = {
        customers,
        scheduledTime: scheduledDateTime.toISOString(),
        vapiPhoneNumberId,
        // Include assistant, script, and voice information
        assistantId: assistantSelection.assistant!.id,
        scriptId: assistantSelection.script!.id,
        voiceId: assistantSelection.voice!.id,
      };

      const response = await fetch('/api/vapi/calls/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule calls');
      }

      toast.success(
        `Successfully scheduled ${data.data?.scheduledCount || customers.length} calls for ${format(scheduledDateTime, 'PPP p')}`,
        { id: toastId }
      );

      // Clear the scheduled data
      setDataToSchedule([]);
      
        // Redirect to scheduled calls page
        router.push('/dashboard/scheduled-calls');
      } catch (error: any) {
        toast.error('Failed to schedule calls', { 
          id: toastId, 
          description: error.message 
        });
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const isLimitExceeded = pendingCallCount + dataToSchedule.length > MAX_PENDING_CALLS;
  const remainingSlots = MAX_PENDING_CALLS - pendingCallCount;
  const isFormValid = assistantSelection.assistant && assistantSelection.script && assistantSelection.voice && date && time && vapiPhoneNumberId;

  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-6 p-4 pt-6 md:p-8'>
      <Heading 
        title="Enhanced Call Scheduling" 
        description="Schedule calls with full assistant, script, and voice configuration" 
      />

      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${assistantSelection.assistant ? 'text-green-600' : 'text-muted-foreground'}`}>
              <Bot className="h-4 w-4" />
              <span className="text-sm font-medium">Assistant</span>
              {assistantSelection.assistant && <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div className={`flex items-center gap-2 ${assistantSelection.script ? 'text-green-600' : 'text-muted-foreground'}`}>
              <span className="text-sm font-medium">Script</span>
              {assistantSelection.script && <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div className={`flex items-center gap-2 ${assistantSelection.voice ? 'text-green-600' : 'text-muted-foreground'}`}>
              <span className="text-sm font-medium">Voice</span>
              {assistantSelection.voice && <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div className={`flex items-center gap-2 ${date && time && vapiPhoneNumberId ? 'text-green-600' : 'text-muted-foreground'}`}>
              <span className="text-sm font-medium">Schedule</span>
              {date && time && vapiPhoneNumberId && <CheckCircle2 className="h-4 w-4" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Assistant Selection */}
        <AssistantSelector
          callType="outbound"
          onSelectionChange={setAssistantSelection}
          disabled={isSubmitting}
        />

        {/* Call Scheduling Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Schedule Details</CardTitle>
              <CardDescription>
                Configure when and how to make calls to {dataToSchedule.length} contacts
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Limit Warning */}
              {isLimitExceeded && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Call Limit Exceeded</AlertTitle>
                  <AlertDescription>
                    You can only have {MAX_PENDING_CALLS} pending calls. You currently have {pendingCallCount} 
                    pending calls and are trying to add {dataToSchedule.length}. 
                    You can schedule up to {remainingSlots > 0 ? remainingSlots : 0} more calls.
                  </AlertDescription>
                </Alert>
              )}

              {/* Contacts to Schedule */}
              <div>
                <Label>Contacts to Schedule ({dataToSchedule.length})</Label>
                <div className='mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-md border p-2'>
                  {dataToSchedule.map((contact, index) => (
                    <Badge key={index} variant='secondary'>
                      {`${contact['First Name'] || ''} ${contact['Last Name'] || ''}`.trim() ||
                        'Unnamed Contact'}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Phone Number Selection */}
              <div className='space-y-2'>
                <Label htmlFor='vapi-phone-number'>Call From Number</Label>
                <Select
                  onValueChange={setVapiPhoneNumberId}
                  value={vapiPhoneNumberId}
                  disabled={userPhoneNumbers.length === 0 || isSubmitting}
                >
                  <SelectTrigger id='vapi-phone-number'>
                    <SelectValue placeholder="Select a phone number to call from" />
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
                        No phone numbers found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Date and Time */}
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='date'>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                        disabled={isSubmitting}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='time'>Time</Label>
                  <Input
                    id='time'
                    type='time'
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Selected Configuration Summary */}
              {assistantSelection.assistant && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Configuration Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Assistant:</span>
                        <div className="text-muted-foreground">{assistantSelection.assistant.name}</div>
                      </div>
                      {assistantSelection.script && (
                        <div>
                          <span className="font-medium">Script:</span>
                          <div className="text-muted-foreground">{assistantSelection.script.name}</div>
                        </div>
                      )}
                      {assistantSelection.voice && (
                        <div>
                          <span className="font-medium">Voice:</span>
                          <div className="text-muted-foreground">{assistantSelection.voice.name}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/dashboard/preview')}
                disabled={isSubmitting}
              >
                Back to Preview
              </Button>
              <Button 
                type="submit" 
                disabled={!isFormValid || isLimitExceeded || isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule {dataToSchedule.length} Calls
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
