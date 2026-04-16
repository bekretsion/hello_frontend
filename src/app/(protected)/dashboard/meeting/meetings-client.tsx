'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  Clock,
  Users,
  Link as LinkIcon,
  Loader2,
  PlusCircle,
  Trash2,
  Pencil,
  MoreHorizontal,
  Settings,
  X
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Fragment } from 'react';
import { useLanguage } from '@/hooks/use-language';
import WheelTimePicker from './wheeltime-picker';
import { TooltipArrow } from '@radix-ui/react-tooltip';

export type GoogleMeeting = {
  id: string;
  summary?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: { email: string; responseStatus: string }[];
  hangoutLink?: string;
};

interface IntegrationStatus {
  google: {
    name: string;
    connected: boolean;
    hasAccessToken: boolean;
    tokenExpiry: number | null;
  };
  outlook: {
    name: string;
    connected: boolean;
    hasAccessToken: boolean;
    tokenExpiry: number | null;
  };
}

// Helper to format date for time input
const formatTimeForInput = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Update your getMeetingColorClass function to handle all color options
const getMeetingColorClass = (color: string) => {
  const colorMap: { [key: string]: string } = {
    default: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    purple:
      'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
    orange:
      'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
    pink: 'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200',
    indigo:
      'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
    teal: 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200',
    google: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    outlook:
      'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200'
  };

  return colorMap[color] || colorMap['default'];
};

export default function MeetingsClient() {
  const t = useTranslations('meetings');
  const { currentLanguage } = useLanguage();
  const locale = currentLanguage === 'no' ? 'nb-NO' : 'en-US';

  // Calendar provider state - 'google' or 'outlook'
  const [calendarProvider, setCalendarProvider] = useState<
    'google' | 'outlook'
  >('google');

  // State for the selected date filter, defaults to today
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calendar view options
  const [calendarView, setCalendarView] = useState<'1day' | '7days' | '1month'>(
    '7days'
  );

  // Track expanded days in month view (store date strings)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const colorOptions = [
    { value: 'default', color: 'bg-primary', label: 'Hello' },
    { value: 'green', color: 'bg-green-500', label: 'Green' },
    { value: 'red', color: 'bg-red-500', label: 'Red' },
    { value: 'purple', color: 'bg-purple-500', label: 'Purple' },
    { value: 'orange', color: 'bg-orange-500', label: 'Orange' },
    { value: 'pink', color: 'bg-pink-500', label: 'Pink' },
    { value: 'indigo', color: 'bg-indigo-500', label: 'Indigo' },
    { value: 'teal', color: 'bg-teal-500', label: 'Teal' }
  ];

  // In your form state, add meetingColor for the current event
  // Add this to your form state initialization:
  const [meetingColor, setMeetingColor] = useState('default');

  // // Meeting color theme
  // const [meetingColor, setMeetingColor] = useState<
  //   'default' | 'google' | 'outlook'
  // >('default');

  const [meetings, setMeetings] = useState<GoogleMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [integrationStatus, setIntegrationStatus] =
    useState<IntegrationStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [googleReauthRequired, setGoogleReauthRequired] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GoogleMeeting | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');

  // Fetch integration status
  const fetchIntegrationStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/status');
      if (!response.ok) {
        throw new Error('Failed to fetch integration status');
      }
      const data = await response.json();
      setIntegrationStatus(data.integrations);
    } catch (error) {
      console.error('Error fetching integration status:', error);
    }
  }, []);

  // Fetches meetings for a specific date or date range
  const fetchMeetings = useCallback(
    async (dateToFetch: Date) => {
      setIsLoading(true);
      try {
        const apiEndpoint =
          calendarProvider === 'google'
            ? '/api/meetings'
            : '/api/outlook-meetings';
        let allMeetings: GoogleMeeting[] = [];

        // Helper to fetch a single day and detect reauth errors
        const fetchDay = async (dateString: string) => {
          const response = await fetch(`${apiEndpoint}?date=${dateString}`);
          if (!response.ok) {
            const errorData = await response.json();
            // Detect Google token expiration / revocation (401 with code)
            if (response.status === 401 && errorData.code === 'GOOGLE_REAUTH_REQUIRED') {
              setGoogleReauthRequired(true);
              throw new Error('GOOGLE_REAUTH_REQUIRED');
            }
            // Defensive: also detect invalid_grant from any status (e.g. 500)
            const errMsg = (errorData.message || '').toLowerCase();
            if (
              errMsg.includes('invalid_grant') ||
              errMsg.includes('token has been expired or revoked') ||
              errMsg.includes('google authorization expired')
            ) {
              setGoogleReauthRequired(true);
              throw new Error('GOOGLE_REAUTH_REQUIRED');
            }
            throw new Error(errorData.message || t('errors.fetchFailed'));
          }
          return response.json();
        };

        // Calculate date range based on calendar view
        if (calendarView === '1day') {
          // Fetch single day
          const dateString = dateToFetch.toISOString().split('T')[0];
          const data: GoogleMeeting[] = await fetchDay(dateString);
          allMeetings = data;
        } else if (calendarView === '7days') {
          // Fetch 7 days starting from selected date
          const promises = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(dateToFetch);
            date.setDate(date.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            promises.push(fetchDay(dateString));
          }

          const results = await Promise.all(promises);
          allMeetings = results.flat();
        } else if (calendarView === '1month') {
          // Fetch 30 days starting from selected date
          const promises = [];
          for (let i = 0; i < 30; i++) {
            const date = new Date(dateToFetch);
            date.setDate(date.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            promises.push(fetchDay(dateString));
          }

          const results = await Promise.all(promises);
          allMeetings = results.flat();
        }

        // Remove duplicates and cancelled meetings
        const uniqueMeetings = allMeetings
          .filter((m) => m.status !== 'cancelled')
          .filter(
            (meeting, index, self) =>
              index ===
              self.findIndex(
                (m) =>
                  m.id === meeting.id &&
                  m.start.dateTime === meeting.start.dateTime
              )
          );

        setMeetings(uniqueMeetings);
        // If we got here successfully, clear any previous reauth state
        setGoogleReauthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === 'GOOGLE_REAUTH_REQUIRED') {
          // Don't show generic toast — the UI will show a reconnect prompt
          setMeetings([]);
        } else {
          toast.error(t('errors.fetchFailed'));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [t, calendarProvider, calendarView]
  );

  // Check if current provider is connected
  const isCurrentProviderConnected = () => {
    if (!integrationStatus) return false;
    return calendarProvider === 'google'
      ? integrationStatus.google.connected
      : integrationStatus.outlook.connected;
  };

  // Auto-scroll to 7AM in 7-day view
  useEffect(() => {
    if (calendarView === '7days' && scrollRef.current) {
      const hourHeight = 48; // your row height
      const scrollPosition = 7 * hourHeight; // 7AM

      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [calendarView, selectedDate, isLoading]);

  // Handle Google OAuth redirect results (?google=connected|error|denied)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleStatus = urlParams.get('google');
    const reason = urlParams.get('reason');

    if (googleStatus === 'connected') {
      toast.success(
        currentLanguage === 'no'
          ? 'Google Kalender koblet til!'
          : 'Google Calendar connected successfully!'
      );
      // Clear reauth state since we just reconnected
      setGoogleReauthRequired(false);
    } else if (googleStatus === 'error') {
      if (reason === 'invalid_grant') {
        toast.error(
          currentLanguage === 'no'
            ? 'Google-autorisasjonen mislyktes. Vennligst prøv å koble til på nytt via Integrasjoner.'
            : 'Google authorization failed (invalid_grant). Please try reconnecting from Integrations.'
        );
        setGoogleReauthRequired(true);
      } else {
        toast.error(
          currentLanguage === 'no'
            ? 'Kunne ikke koble til Google Kalender. Prøv igjen.'
            : 'Failed to connect Google Calendar. Please try again.'
        );
      }
    } else if (googleStatus === 'denied') {
      toast.error(
        currentLanguage === 'no'
          ? 'Google-tilgang ble avvist.'
          : 'Google access was denied.'
      );
    }

    // Clean URL params
    if (googleStatus) {
      window.history.replaceState({}, '', window.location.pathname);
      fetchIntegrationStatus();
    }
  }, [currentLanguage, fetchIntegrationStatus]);

  // Fetch integration status on mount and when page becomes visible
  useEffect(() => {
    fetchIntegrationStatus();

    // Refetch when user returns to the page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchIntegrationStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchIntegrationStatus]);

  // Re-fetch meetings whenever the selectedDate or calendarProvider changes
  useEffect(() => {
    if (selectedDate && isCurrentProviderConnected()) {
      fetchMeetings(selectedDate);
    } else {
      // If provider is not connected, ensure loading state is false
      setIsLoading(false);
    }
  }, [selectedDate, calendarProvider, fetchMeetings, integrationStatus]);

  // Clear expanded days when calendar view changes
  useEffect(() => {
    setExpandedDays(new Set());
  }, [calendarView]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(undefined);
    setTime('');
    setDuration('60');
    setParticipants([]);
    setCurrentEmail('');
    setEditingEvent(null);
  };

  function stripHtml(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Pre-populates the form when an event is selected for editing
  useEffect(() => {
    if (editingEvent) {
      const startDate = new Date(editingEvent.start.dateTime);
      const endDate = new Date(editingEvent.end.dateTime);
      const durationInMinutes =
        (endDate.getTime() - startDate.getTime()) / 60000;

      setTitle(editingEvent.summary || '');
      // setDescription((editingEvent as any).description || '');
      setDescription(stripHtml((editingEvent as any).description) || '');

      setDate(startDate);
      setTime(formatTimeForInput(startDate));
      setDuration(durationInMinutes.toString());
      setParticipants(editingEvent.attendees?.map((a) => a.email) || []);
      setCurrentEmail('');
      setIsFormModalOpen(true);
    }
  }, [editingEvent]);

  // Helper function to convert 24h to 12h for display
  const convertToDisplayTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const hourNum = parseInt(hours, 10);

    if (hourNum === 0) {
      return `12:${minutes} AM`;
    } else if (hourNum === 12) {
      return `12:${minutes} PM`;
    } else if (hourNum > 12) {
      return `${(hourNum - 12).toString().padStart(2, '0')}:${minutes} PM`;
    } else {
      return `${hourNum.toString().padStart(2, '0')}:${minutes} AM`;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) {
      toast.error(t('errors.missingInfoTitle'), {
        description: t('errors.missingInfoDescription')
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const [hours, minutes] = time.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(
        startTime.getTime() + parseInt(duration, 10) * 60000
      );

      const meetingData = {
        title,
        description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        participants: participants
      };

      const isEditing = !!editingEvent;
      const baseUrl =
        calendarProvider === 'google'
          ? '/api/meetings'
          : '/api/outlook-meetings';
      const url = isEditing ? `${baseUrl}/${editingEvent.id}` : baseUrl;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
          (isEditing
            ? 'Failed to update meeting'
            : 'Failed to schedule meeting')
        );
      }

      toast.success(
        isEditing
          ? 'Meeting updated successfully!'
          : t('success.meetingScheduled')
      );
      fetchMeetings(selectedDate);
      resetForm();
      setIsFormModalOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(
        editingEvent
          ? 'Failed to update meeting'
          : t('errors.schedulingFailedTitle'),
        {
          description: errorMessage
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModifyClick = (meeting: GoogleMeeting) => {
    setEditingEvent(meeting);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm(t('actions.deleteConfirmation'))) return;
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const baseUrl =
        calendarProvider === 'google'
          ? '/api/meetings'
          : '/api/outlook-meetings';
      const response = await fetch(`${baseUrl}/${meetingId}`, {
        method: 'DELETE'
      });
      if (response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete meeting.');
      }

      toast.success(t('actions.deleteMeetingTitle'));
      fetchMeetings(selectedDate);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error('Deletion Failed', { description: errorMessage });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setDate(selectedDate);
    setIsFormModalOpen(true);
  };

  // Email chip handlers
  const addEmailChip = (email: string) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && !participants.includes(trimmedEmail)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(trimmedEmail)) {
        setParticipants([...participants, trimmedEmail]);
        setCurrentEmail('');
      } else {
        toast.error('Invalid email format');
      }
    }
  };

  const removeEmailChip = (emailToRemove: string) => {
    setParticipants(participants.filter((email) => email !== emailToRemove));
  };

  const handleEmailInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (currentEmail.trim()) {
        addEmailChip(currentEmail);
      }
    } else if (
      e.key === 'Backspace' &&
      !currentEmail &&
      participants.length > 0
    ) {
      // Remove last chip if backspace is pressed with empty input
      setParticipants(participants.slice(0, -1));
    }
  };

  // Check if any integration is connected
  const hasAnyIntegration =
    integrationStatus?.google.connected || integrationStatus?.outlook.connected;

  if (!integrationStatus || isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  // Show message if no integrations are enabled
  if (!hasAnyIntegration) {
    return (
      <div className='w-full space-y-6'>
        <div className='bg-card flex h-96 flex-col items-center justify-center rounded-lg border p-8 text-center'>
          <Settings className='text-muted-foreground mb-4 h-16 w-16' />
          <h2 className='mb-2 text-2xl font-bold'>
            {t('noIntegration.title')}
          </h2>
          <p className='text-muted-foreground mb-6 max-w-md'>
            {t('noIntegration.description')}
          </p>
          <Button asChild>
            <Link href='/dashboard/integrations'>
              <Settings className='mr-2 h-4 w-4' />
              {t('noIntegration.buttonText')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show message if current selected provider is not connected
  if (!isCurrentProviderConnected()) {
    return (
      <div className='w-full space-y-6'>
        {/* Calendar Selection */}
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant={calendarProvider === 'google' ? 'default' : 'outline'}
            onClick={() => setCalendarProvider('google')}
            size='sm'
            disabled={!integrationStatus.google.connected}
          >
            Google Calendar
          </Button>
          <Button
            variant={calendarProvider === 'outlook' ? 'default' : 'outline'}
            onClick={() => setCalendarProvider('outlook')}
            size='sm'
            disabled={!integrationStatus.outlook.connected}
          >
            Outlook Calendar
          </Button>
        </div>

        <div className='bg-card flex h-96 flex-col items-center justify-center rounded-lg border p-8 text-center'>
          <Settings className='text-muted-foreground mb-4 h-16 w-16' />
          {calendarProvider === 'google' ? (
            <>
              <h2 className='mb-2 text-2xl font-bold'>
                {currentLanguage === 'no'
                  ? 'Google Kalender er ikke koblet til'
                  : 'Google Calendar is not connected'}
              </h2>
              <p className='text-muted-foreground mb-6 max-w-md'>
                {currentLanguage === 'no'
                  ? 'Koble til Google Kalender i Integrasjoner for å planlegge eller se møter.'
                  : 'Connect Google Calendar in Integrations to schedule or view meetings.'}
              </p>
            </>
          ) : (
            <>
              <h2 className='mb-2 text-2xl font-bold'>
                {t('notConnected.outlookTitle')}
              </h2>
              <p className='text-muted-foreground mb-6 max-w-md'>
                {t('notConnected.outlookDescription')}
              </p>
            </>
          )}
          <Button asChild>
            <Link href='/dashboard/integrations'>
              <Settings className='mr-2 h-4 w-4' />
              {t('notConnected.buttonText')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show reconnect prompt when Google token has expired / been revoked
  if (googleReauthRequired && calendarProvider === 'google') {
    return (
      <div className='w-full space-y-6'>
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant='default'
            onClick={() => setCalendarProvider('google')}
            size='sm'
          >
            Google Calendar
          </Button>
          <Button
            variant='outline'
            onClick={() => setCalendarProvider('outlook')}
            size='sm'
            disabled={!integrationStatus.outlook.connected}
          >
            Outlook Calendar
          </Button>
        </div>

        <div className='bg-card flex h-96 flex-col items-center justify-center rounded-lg border p-8 text-center'>
          <Settings className='text-muted-foreground mb-4 h-16 w-16' />
          <h2 className='mb-2 text-2xl font-bold'>
            {currentLanguage === 'no'
              ? 'Google-tilkoblingen har utløpt'
              : 'Google Connection Expired'}
          </h2>
          <p className='text-muted-foreground mb-6 max-w-md'>
            {currentLanguage === 'no'
              ? 'Din Google-autorisasjon er ikke lenger gyldig. Vennligst koble til Google Kalender på nytt i Integrasjoner.'
              : 'Your Google authorization is no longer valid. Please reconnect your Google Calendar in Integrations.'}
          </p>
          <Button asChild>
            <Link href='/dashboard/integrations'>
              <Settings className='mr-2 h-4 w-4' />
              {currentLanguage === 'no'
                ? 'Koble til på nytt'
                : 'Reconnect Google'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full p-2 sm:p-4 md:p-6'>
      <div className='mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto'>
          <h2 className='text-xl sm:text-2xl font-bold tracking-tight'>{t('title')}</h2>
          {/* Calendar Selection Toggle */}
          <div className='flex items-center gap-2'>
            <Button
              variant={calendarProvider === 'google' ? 'default' : 'outline'}
              onClick={() => setCalendarProvider('google')}
              size='sm'
              disabled={!integrationStatus.google.connected}
              className='text-xs sm:text-sm'
            >
              Google
            </Button>
            <Button
              variant={calendarProvider === 'outlook' ? 'default' : 'outline'}
              onClick={() => setCalendarProvider('outlook')}
              size='sm'
              disabled={!integrationStatus.outlook.connected}
              className='text-xs sm:text-sm'
            >
              Outlook
            </Button>
          </div>
          {/* Calendar View Dropdown */}
          <Select
            value={calendarView}
            onValueChange={(value: any) => setCalendarView(value)}
          >
            <SelectTrigger className='w-full sm:w-[140px] text-xs sm:text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1day'>
                <div className='flex items-center gap-2'>
                  <Clock className='h-4 w-4' />
                  <span>{t('calendarViews.oneDay')}</span>
                </div>
              </SelectItem>
              <SelectItem value='7days'>
                <div className='flex items-center gap-2'>
                  <CalendarIcon className='h-4 w-4' />
                  <span>{t('calendarViews.sevenDays')}</span>
                </div>
              </SelectItem>
              <SelectItem value='1month'>
                <div className='flex items-center gap-2'>
                  <CalendarIcon className='h-4 w-4' />
                  <span>{t('calendarViews.oneMonth')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-2 w-full sm:w-auto'>
          <Button onClick={handleOpenCreateModal} className='w-full sm:w-auto text-xs sm:text-sm'>
            <PlusCircle className='mr-2 h-4 w-4' />
            <span className='hidden sm:inline'>{t('schedule.scheduleButton')}</span>
            <span className='sm:hidden'>Schedule</span>
          </Button>
        </div>
      </div>

      {/* --- CREATE/EDIT MODAL --- */}
      <Dialog
        open={isFormModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            resetForm();
          }
          setIsFormModalOpen(isOpen);
        }}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? t('modify.title') : t('schedule.title')}
              </DialogTitle>
              <DialogDescription>
                {editingEvent
                  ? t('modify.description')
                  : t('schedule.description')}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='title'>{t('schedule.meetingTitle')}</Label>
                <Input
                  id='title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='description'>{t('schedule.description')}</Label>
                <textarea
                  id='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  placeholder={t('schedule.descriptionPlaceholder')}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='date'>{t('schedule.date')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {date ? (
                          date.toLocaleDateString()
                        ) : (
                          <span>{t('schedule.pickDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar
                        mode='single'
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='time'>{t('schedule.time')}</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !time && 'text-muted-foreground'
                        )}
                      >
                        <Clock className='mr-2 h-4 w-4' />
                        {time ? (
                          convertToDisplayTime(time)
                        ) : (
                          <span>--:-- --</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className='dark:bg-background w-36 rounded-lg border p-0 shadow-lg'
                      align='start'
                    >
                      <WheelTimePicker
                        value={time}
                        onChange={(val) => {
                          setTime(val);
                          setOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='meetingColor'>Event color</Label>
                <Select
                  value={meetingColor}
                  onValueChange={(value: string) => setMeetingColor(value)}
                >
                  <SelectTrigger id='meetingColor' className='pl-3'>
                    <SelectValue>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`h-4 w-4 rounded-full ${colorOptions.find((opt) => opt.value === meetingColor)?.color || 'bg-blue-500'}`}
                        />
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <div className='grid grid-cols-4 gap-2 p-2'>
                      {colorOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className='p-0 pr-0 data-[state=checked]:!pr-0 [&>span]:flex [&>span]:h-full [&>span]:w-full [&>span]:items-center [&>span]:justify-center'
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`h-5 w-5 cursor-pointer rounded-full ${option.color} transition-transform hover:scale-110 ${meetingColor === option.value ? 'ring-2 ring-black ring-offset-2' : ''}`}
                                />
                              </TooltipTrigger>
                              <TooltipContent className='bg-gray-500 text-white'>
                                <p>{option.label}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='duration'>{t('schedule.duration')}</Label>
                <Select onValueChange={setDuration} value={duration}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('schedule.selectDuration')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='15'>
                      {t('schedule.duration15')}
                    </SelectItem>
                    <SelectItem value='30'>
                      {t('schedule.duration30')}
                    </SelectItem>
                    <SelectItem value='45'>
                      {t('schedule.duration45')}
                    </SelectItem>
                    <SelectItem value='60'>
                      {t('schedule.duration60')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='participants'>
                  {t('schedule.participants')}
                </Label>
                <div className='border-input bg-background ring-offset-background focus-within:ring-ring min-h-[38px] w-full rounded-md border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-offset-2'>
                  <div className='flex flex-wrap items-center gap-2'>
                    {participants.map((email) => (
                      <div
                        key={email}
                        className='inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      >
                        <span className='font-medium'>{email}</span>
                        <button
                          type='button'
                          onClick={() => removeEmailChip(email)}
                          className='rounded-full p-0.5 transition-colors hover:bg-blue-200 dark:hover:bg-blue-800'
                          aria-label={`Remove ${email}`}
                        >
                          <X className='h-3 w-3' />
                        </button>
                      </div>
                    ))}
                    <input
                      id='participants'
                      type='text'
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      onKeyDown={handleEmailInputKeyDown}
                      onBlur={() => {
                        if (currentEmail.trim()) {
                          addEmailChip(currentEmail);
                        }
                      }}
                      placeholder={
                        participants.length === 0 ? 'guest1@example.com' : ''
                      }
                      className='min-w-[120px] flex-1 bg-transparent outline-none'
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                {editingEvent
                  ? t('modify.updateButton')
                  : t('schedule.scheduleButton')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Main Layout --- */}
      <div className={cn(calendarView === '1day' ? 'lg:col-span-2' : 'w-full')}>
        {isLoading ? (
          <div className='flex h-64 items-center justify-center rounded-lg border-2 border-dashed'>
            <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
          </div>
        ) : calendarView === '7days' ? (
          // Weekly Calendar View (7 Days) - Scrollable from 7:00 AM
          (() => {
            const weekDays = Array.from({ length: 7 }, (_, i) => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() + i);
              return date;
            });

            // Define hours from 7:00 AM to 11:00 PM, but keep 1-6 AM for scrolling
            const visibleStartHour = 7;
            const visibleEndHour = 23;
            const allHours = Array.from({ length: 24 }, (_, i) => i);
            const visibleHours = Array.from(
              { length: visibleEndHour - visibleStartHour + 1 },
              (_, i) => i + visibleStartHour
            );

            return (
              <>
                {/* Mobile View - List of Days */}
                <div className='block md:hidden space-y-4'>
                  {weekDays.map((date, dayIndex) => {
                    const dayMeetings = meetings.filter((meeting) => {
                      const meetingDate = new Date(meeting.start.dateTime);
                      return meetingDate.toDateString() === date.toDateString();
                    });

                    return (
                      <Card key={dayIndex}>
                        <CardHeader className='pb-3'>
                          <CardTitle className='text-base'>
                            {date.toLocaleDateString(locale, {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                          {dayMeetings.length > 0 ? (
                            dayMeetings.map((meeting, idx) => {
                              const startTime = new Date(meeting.start.dateTime);
                              const endTime = new Date(meeting.end.dateTime);
                              return (
                                <div
                                  key={`${meeting.id}-${meeting.start.dateTime}-${idx}`}
                                  className={cn(
                                    'rounded-lg p-3 cursor-pointer transition-colors',
                                    getMeetingColorClass(meetingColor)
                                  )}
                                  onClick={() => handleModifyClick(meeting)}
                                >
                                  <div className='font-semibold text-sm mb-1'>
                                    {meeting.summary || 'No title'}
                                  </div>
                                  <div className='text-xs opacity-90'>
                                    {startTime.toLocaleTimeString([], {
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}{' '}
                                    -{' '}
                                    {endTime.toLocaleTimeString([], {
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className='text-center py-4 text-sm text-muted-foreground'>
                              {t('schedule.titleForDay')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Desktop View - Grid Calendar */}
                <Card className='hidden md:block w-full overflow-x-auto'>
                  <div className='min-w-[900px]'>
                    <div className='relative'>
                      {/* Fixed Header */}
                      <div className='bg-background sticky top-0 z-10 grid h-16 grid-cols-8 gap-0 border-b'>
                        <div className='text-muted-foreground p-2 text-center text-xs font-medium tracking-wide uppercase'>
                          Time
                        </div>
                        {weekDays.map((date, index) => (
                          <div
                            key={index}
                            className='text-muted-foreground border-l p-2 text-center text-xs font-medium tracking-wide uppercase first:border-l-0'
                          >
                            <div>
                              {date.toLocaleDateString(locale, {
                                weekday: 'short'
                              })}
                            </div>
                            <div className='text-foreground mt-1 text-lg font-semibold normal-case'>
                              {date.getDate()}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Scrollable Content Area */}
                      <div
                        ref={scrollRef}
                        className='max-h-[70vh] overflow-y-auto'
                      >
                        <div className='pt-16'>
                          {allHours.map((hour) => (
                            <div
                              key={hour}
                              className={cn(
                                'grid min-h-[48px] grid-cols-8 border-b transition-colors'
                              )}
                            >
                              <div
                                className={cn(
                                  'text-muted-foreground bg-background sticky left-0 z-5 border-r p-2 text-center text-sm font-medium'
                                )}
                              >
                                {hour === 0
                                  ? '12 AM'
                                  : hour < 12
                                    ? `${hour} AM`
                                    : hour === 12
                                      ? '12 PM'
                                      : `${hour - 12} PM`}
                              </div>
                              {weekDays.map((date, dayIndex) => {
                                const dayMeetings = meetings.filter((meeting) => {
                                  const meetingDate = new Date(
                                    meeting.start.dateTime
                                  );
                                  const meetingHour = meetingDate.getHours();
                                  return (
                                    meetingDate.toDateString() ===
                                    date.toDateString() && meetingHour === hour
                                  );
                                });

                                return (
                                  <div
                                    key={dayIndex}
                                    className='group relative border-l p-0.5 first:border-l-0'
                                    onClick={(e) => {
                                      handleOpenCreateModal();
                                    }}
                                  >
                                    {/* Clickable empty area overlay */}
                                    <div className='hover:bg-primary/5 absolute inset-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100' />

                                    {dayMeetings.map((meeting, idx) => {
                                      const startTime = new Date(
                                        meeting.start.dateTime
                                      );
                                      const endTime = new Date(
                                        meeting.end.dateTime
                                      );
                                      const duration =
                                        (endTime.getTime() -
                                          startTime.getTime()) /
                                        (1000 * 60); // minutes
                                      const height = (duration / 60) * 48; // 48px per hour

                                      return (
                                        <div
                                          key={`${meeting.id}-${meeting.start.dateTime}-${idx}`}
                                          className={cn(
                                            'absolute right-0.5 left-0.5 z-10 cursor-pointer overflow-hidden rounded px-2 py-1 text-xs shadow-sm transition-colors',
                                            getMeetingColorClass(meetingColor)
                                          )}
                                          style={{
                                            height: `${height}px`,
                                            minHeight: '24px'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleModifyClick(meeting);
                                          }}
                                        >
                                          <div className='truncate text-[11px] font-medium'>
                                            {meeting.summary || 'No title'}
                                          </div>
                                          <div className='truncate text-[10px] opacity-90'>
                                            {startTime.toLocaleTimeString([], {
                                              hour: 'numeric',
                                              minute: '2-digit'
                                            })}{' '}
                                            -{' '}
                                            {endTime.toLocaleTimeString([], {
                                              hour: 'numeric',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {/* Show hint for empty cells during visible hours */}
                                    {dayMeetings.length === 0 && (
                                      <div className='absolute inset-0 flex items-center justify-center'>
                                        <div className='group-hover:text-muted-foreground cursor-pointer text-[10px] text-transparent transition-colors'>
                                          Click to add event
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            );
          })()
        ) : calendarView === '1month' ? (
          // Monthly Calendar View (30 Days)
          (() => {
            const monthDays = Array.from({ length: 30 }, (_, i) => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() + i);
              return date;
            });

            // Group days into weeks
            const weeks: Date[][] = [];
            let currentWeek: Date[] = [];

            monthDays.forEach((date, index) => {
              if (index === 0) {
                // Fill empty days at the start of the first week
                const dayOfWeek = date.getDay();
                for (let i = 0; i < dayOfWeek; i++) {
                  currentWeek.push(new Date(0)); // placeholder
                }
              }

              currentWeek.push(date);

              if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
              }
            });

            if (currentWeek.length > 0) {
              while (currentWeek.length < 7) {
                currentWeek.push(new Date(0)); // placeholder
              }
              weeks.push(currentWeek);
            }

            return (
              <>
                {/* Mobile View - List of Days */}
                <div className='block md:hidden space-y-4'>
                  {monthDays.map((date, dayIndex) => {
                    const dayMeetings = meetings.filter((meeting) => {
                      const meetingDate = new Date(meeting.start.dateTime);
                      return meetingDate.toDateString() === date.toDateString();
                    });

                    return (
                      <Card key={dayIndex}>
                        <CardHeader className='pb-3'>
                          <CardTitle className='text-base'>
                            {date.toLocaleDateString(locale, {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                          {dayMeetings.length > 0 ? (
                            dayMeetings.map((meeting, idx) => {
                              const startTime = new Date(meeting.start.dateTime);
                              const endTime = new Date(meeting.end.dateTime);
                              return (
                                <div
                                  key={`${meeting.id}-${meeting.start.dateTime}-${idx}`}
                                  className={cn(
                                    'rounded-lg p-3 cursor-pointer transition-colors',
                                    getMeetingColorClass(meetingColor)
                                  )}
                                  onClick={() => handleModifyClick(meeting)}
                                >
                                  <div className='font-semibold text-sm mb-1'>
                                    {meeting.summary || 'No title'}
                                  </div>
                                  <div className='text-xs opacity-90'>
                                    {startTime.toLocaleTimeString([], {
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}{' '}
                                    -{' '}
                                    {endTime.toLocaleTimeString([], {
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className='text-center py-4 text-sm text-muted-foreground'>
                              {t('schedule.titleForDay')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Desktop View - Grid Calendar */}
                <Card className='hidden md:block w-full'>
                  <div className='min-w-full'>
                    {/* Weekday Headers */}
                    <div className='bg-muted/50 grid grid-cols-7 border-b'>
                      {Array.from({ length: 7 }, (_, idx) => {
                        const date = new Date(2024, 0, 7 + idx); // Sunday -> Saturday
                        return date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
                      }).map((day) => (
                          <div
                            key={day}
                            className='p-2 text-center text-xs font-medium'
                          >
                            {day}
                          </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className='grid grid-cols-7 border-b'>
                        {week.map((date, dayIndex) => {
                          const isPlaceholder = date.getTime() === 0;
                          const dayMeetings = isPlaceholder
                            ? []
                            : meetings.filter((meeting) => {
                              const meetingDate = new Date(
                                meeting.start.dateTime
                              );
                              return (
                                meetingDate.toDateString() ===
                                date.toDateString()
                              );
                            });

                          return (
                            <div
                              key={dayIndex}
                              className={cn(
                                'group relative min-h-[100px] border-l p-2',
                                isPlaceholder && 'bg-muted/20'
                              )}
                              onClick={(e) => {
                                handleOpenCreateModal();
                              }}
                            >
                              {/* Clickable overlay for empty areas */}
                              {!isPlaceholder && (
                                <div className='hover:bg-primary/5 absolute inset-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100' />
                              )}

                              {!isPlaceholder && (
                                <>
                                  <div className='relative z-10 mb-1 text-sm font-medium'>
                                    {date.getDate()}
                                  </div>
                                  <div className='relative z-10 space-y-1'>
                                    {(() => {
                                      const dateStr = date
                                        .toISOString()
                                        .split('T')[0];
                                      const isExpanded =
                                        expandedDays.has(dateStr);
                                      const meetingsToShow = isExpanded
                                        ? dayMeetings
                                        : dayMeetings.slice(0, 3);

                                      return (
                                        <>
                                          {meetingsToShow.map((meeting, idx) => {
                                            const startTime = new Date(
                                              meeting.start.dateTime
                                            );
                                            return (
                                              <div
                                                key={`${meeting.id}-${meeting.start.dateTime}-${idx}`}
                                                className={cn(
                                                  'relative z-20 cursor-pointer truncate rounded px-1 py-0.5 text-[10px] transition-colors',
                                                  getMeetingColorClass(
                                                    meetingColor
                                                  )
                                                )}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleModifyClick(meeting);
                                                }}
                                              >
                                                <span className='font-medium'>
                                                  {startTime.toLocaleTimeString(
                                                    [],
                                                    {
                                                      hour: 'numeric',
                                                      minute: '2-digit'
                                                    }
                                                  )}
                                                </span>{' '}
                                                {meeting.summary || 'No title'}
                                              </div>
                                            );
                                          })}
                                          {dayMeetings.length > 3 && (
                                            <div
                                              className='text-primary relative z-20 cursor-pointer px-1 text-[10px] font-medium hover:underline'
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedDays((prev) => {
                                                  const newSet = new Set(prev);
                                                  if (newSet.has(dateStr)) {
                                                    newSet.delete(dateStr);
                                                  } else {
                                                    newSet.add(dateStr);
                                                  }
                                                  return newSet;
                                                });
                                              }}
                                            >
                                              {isExpanded
                                                ? 'Show less'
                                                : `+${dayMeetings.length - 3} more`}
                                            </div>
                                          )}
                                          {dayMeetings.length === 0 && (
                                            <div className='group-hover:text-muted-foreground py-2 text-center text-[10px] text-transparent transition-colors'>
                                              Click to add event
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            );
          })()
        ) : meetings.length > 0 ? (
          <div className='space-y-6'>
            {calendarView === '1day' ? (
              // Single day view - show meetings in grid
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                {meetings.map((meeting, index) => (
                  <Card
                    key={`${meeting.id}-${meeting.start.dateTime}-${index}`}
                  >
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <CardTitle className='pr-4 text-lg'>
                          {meeting.summary || t('calendar.noTitle')}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreHorizontal className='h-5 w-5' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => handleModifyClick(meeting)}
                            >
                              <Pencil className='mr-2 h-4 w-4' />
                              <span>{t('actions.modify')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className='text-red-600 focus:bg-red-50 focus:text-red-600'
                              disabled={isDeleting}
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              <span>{t('actions.delete')}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='text-muted-foreground flex items-center text-sm'>
                        <Clock className='mr-3 h-4 w-4' />
                        <span>
                          {`${new Date(
                            meeting.start.dateTime
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - ${new Date(
                            meeting.end.dateTime
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`}
                        </span>
                      </div>
                      <div className='text-muted-foreground flex items-center text-sm'>
                        <Users className='mr-3 h-4 w-4' />
                        <span>
                          {meeting.attendees
                            ? `${meeting.attendees.length} attendee(s)`
                            : t('details.justYou')}
                        </span>
                      </div>
                    </CardContent>
                    {meeting.hangoutLink && (
                      <CardFooter>
                        <Button asChild className='w-full'>
                          <a
                            href={meeting.hangoutLink}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <LinkIcon className='mr-2 h-4 w-4' />{' '}
                            {t('actions.joinMeet')}
                          </a>
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className='flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed'>
            <h3 className='text-lg font-semibold'>
              {calendarView === '1day'
                ? t('schedule.titleForDay')
                : calendarView === '7days'
                  ? t('schedule.noMeetings7Days')
                  : t('schedule.noMeetingsMonth')}
            </h3>
            <p className='text-muted-foreground mt-1'>
              {t('schedule.descriptionForDay')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
