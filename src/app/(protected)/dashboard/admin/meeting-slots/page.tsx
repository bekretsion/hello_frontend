'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface MeetingSlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  meeting_type: string;
  description: string | null;
  meeting_link: string | null;
  is_available: boolean;
  bookings_count: number;
  slot_capacity: number;
  created_at: string;
}

export default function MeetingSlotsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    timezone: 'UTC',
    meeting_type: 'onboarding',
    description: '',
    meeting_link: '',
    slot_capacity: 1
  });

  const [errors, setErrors] = useState<{
    date?: string;
    start_time?: string;
    end_time?: string;
  }>({});

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/meeting-slots/all');

      if (!response.ok) {
        throw new Error('Failed to fetch slots');
      }

      const data = await response.json();
      setSlots(data.data || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load meeting slots');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // --- Date validation ---
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = 'Please select a future date';
      }
    }

    // --- Time validation ---
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time) {
      const start = new Date(`1970-01-01T${formData.start_time}`);
      const end = new Date(`1970-01-01T${formData.end_time}`);

      if (end <= start) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    // --- Prevent past time when date is today ---
    if (formData.date && formData.start_time) {
      const selectedDate = new Date(formData.date);
      const now = new Date();

      const isToday = selectedDate.toDateString() === now.toDateString();

      if (isToday) {
        const [sh, sm] = formData.start_time.split(':').map(Number);

        const startTimeToday = new Date(now);
        startTimeToday.setHours(sh, sm, 0, 0);

        if (startTimeToday <= now) {
          newErrors.start_time = 'Start time must be in the future';
        }
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSlot = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before creating the slot');
      return;
    }

    try {
      const response = await fetch('/api/admin/meeting-slots/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create slot');
      }

      toast.success('Meeting slot created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchSlots();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create slot');
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/meeting-slots/${slotId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete slot');
      }

      toast.success('Meeting slot deleted successfully');
      fetchSlots();
    } catch (error: any) {
      console.error('Delete slot error:', error);
      toast.error(error.message || 'Failed to delete slot');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      start_time: '',
      end_time: '',
      timezone: 'UTC',
      meeting_type: 'onboarding',
      description: '',
      meeting_link: '',
      slot_capacity: 1
    });
    setSelectedSlot(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <PageContainer scrollable={true}>
      <div className='mx-auto w-full max-w-7xl space-y-6 pb-8 md:space-y-8'>
        {/* Header */}
        <div className='space-y-2 px-2 text-center md:space-y-3'>
          <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
            Meeting Slots
          </h1>
          <p className='text-muted-foreground text-base md:text-lg'>
            Manage available time slots for customer meetings
          </p>
          <Button onClick={openCreateDialog} size='lg' className='mt-3 md:mt-4'>
            <Plus className='mr-2 h-4 w-4 md:h-5 md:w-5' />
            Add Slot
          </Button>
        </div>

        <Separator />

        {/* Stats Cards */}
        <div className='grid grid-cols-2 gap-3 px-2 md:gap-4 lg:grid-cols-4 lg:gap-6'>
          <Card className='text-center'>
            <CardHeader className='px-3 pb-2 md:px-6 md:pb-3'>
              <CardDescription className='text-xs md:text-sm'>
                Total Slots
              </CardDescription>
              <CardTitle className='text-2xl font-bold md:text-3xl lg:text-4xl'>
                {slots.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className='border-primary/20 bg-primary/5 text-center'>
            <CardHeader className='px-3 pb-2 md:px-6 md:pb-3'>
              <CardDescription className='text-xs md:text-sm'>
                Available
              </CardDescription>
              <CardTitle className='text-primary text-2xl font-bold md:text-3xl lg:text-4xl'>
                {
                  slots.filter((s) => s.is_available && s.bookings_count === 0)
                    .length
                }
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className='border-cyan-500/20 bg-cyan-50 text-center dark:bg-cyan-950/20'>
            <CardHeader className='px-3 pb-2 md:px-6 md:pb-3'>
              <CardDescription className='text-xs md:text-sm'>
                Booked
              </CardDescription>
              <CardTitle className='text-2xl font-bold text-cyan-600 md:text-3xl lg:text-4xl dark:text-cyan-400'>
                {slots.filter((s) => s.bookings_count > 0).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className='border-muted text-center'>
            <CardHeader className='px-3 pb-2 md:px-6 md:pb-3'>
              <CardDescription className='text-xs md:text-sm'>
                Unavailable
              </CardDescription>
              <CardTitle className='text-muted-foreground text-2xl font-bold md:text-3xl lg:text-4xl'>
                {slots.filter((s) => !s.is_available).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Slots List */}
        <Card className='mx-2'>
          <CardHeader className='px-4 md:px-6'>
            <CardTitle className='text-xl md:text-2xl'>
              All Meeting Slots
            </CardTitle>
            <CardDescription className='text-sm md:text-base'>
              View and manage all meeting slots
            </CardDescription>
          </CardHeader>
          <CardContent className='px-4 md:px-6'>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
              </div>
            ) : slots.length === 0 ? (
              <div className='py-12 text-center'>
                <Calendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='text-muted-foreground'>
                  No meeting slots created yet
                </p>
                <Button onClick={openCreateDialog} className='mt-4'>
                  Create Your First Slot
                </Button>
              </div>
            ) : (
              <div className='space-y-3'>
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className='hover:bg-accent flex flex-col justify-between gap-3 rounded-lg border p-3 transition-colors md:flex-row md:items-center md:p-4'
                  >
                    <div className='flex-1 space-y-2'>
                      <div className='flex flex-col gap-2 sm:flex-row sm:items-center md:gap-3'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='text-muted-foreground h-4 w-4 flex-shrink-0' />
                          <span className='text-sm font-semibold md:text-base'>
                            {format(new Date(slot.date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Clock className='text-muted-foreground h-4 w-4 flex-shrink-0' />
                          <span className='text-sm md:text-base'>
                            {slot.start_time} - {slot.end_time}
                          </span>
                        </div>
                        <Badge variant='outline' className='w-fit text-xs'>
                          {slot.timezone}
                        </Badge>
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge variant='secondary' className='text-xs'>
                          {slot.meeting_type}
                        </Badge>
                        {slot.bookings_count > 0 ? (
                          <Badge variant='default' className='text-xs'>
                            <Users className='mr-1 h-3 w-3' />
                            {slot.bookings_count} / {slot.slot_capacity} Booked
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='text-primary border-primary text-xs'
                          >
                            <CheckCircle2 className='mr-1 h-3 w-3' />
                            Available
                          </Badge>
                        )}
                        {!slot.is_available && (
                          <Badge variant='secondary' className='border text-xs'>
                            <XCircle className='mr-1 h-3 w-3' />
                            Unavailable
                          </Badge>
                        )}
                      </div>
                      {slot.description && (
                        <p className='text-muted-foreground text-xs md:text-sm'>
                          {slot.description}
                        </p>
                      )}
                    </div>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={isDeleting || slot.bookings_count > 0}
                        className='hover:bg-destructive/10 hover:text-destructive h-8 w-8'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Slot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='mx-4 max-h-[90vh] max-w-md overflow-y-auto sm:mx-0'>
          <DialogHeader>
            <DialogTitle className='text-lg md:text-xl'>
              Create Meeting Slot
            </DialogTitle>
            <DialogDescription className='text-xs md:text-sm'>
              Add a new time slot for customer meetings
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='date' className='text-xs md:text-sm'>
                Date
              </Label>
              <Input
                id='date'
                type='date'
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  setErrors((prev) => ({ ...prev, date: undefined }));
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
              />

              {errors.date && (
                <p className='text-destructive mt-1 text-xs'>{errors.date}</p>
              )}
            </div>
            <div className='grid grid-cols-2 gap-3 md:gap-4'>
              <div>
                <Label htmlFor='start_time' className='text-xs md:text-sm'>
                  Start Time
                </Label>
                <Input
                  id='start_time'
                  type='time'
                  min={
                    formData.date === format(new Date(), 'yyyy-MM-dd')
                      ? format(new Date(), 'HH:mm')
                      : undefined
                  }
                  value={formData.start_time}
                  onChange={(e) => {
                    setFormData({ ...formData, start_time: e.target.value });
                    setErrors((prev) => ({ ...prev, start_time: undefined }));
                  }}
                />

                {errors.start_time && (
                  <p className='text-destructive mt-1 text-xs'>
                    {errors.start_time}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='end_time' className='text-xs md:text-sm'>
                  End Time
                </Label>
                <Input
                  id='end_time'
                  type='time'
                  value={formData.end_time}
                  onChange={(e) => {
                    setFormData({ ...formData, end_time: e.target.value });
                    setErrors((prev) => ({ ...prev, end_time: undefined }));
                  }}
                />

                {errors.end_time && (
                  <p className='text-destructive mt-1 text-xs'>
                    {errors.end_time}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor='timezone' className='text-xs md:text-sm'>
                Timezone
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData({ ...formData, timezone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='UTC'>UTC</SelectItem>
                  <SelectItem value='America/New_York'>EST</SelectItem>
                  <SelectItem value='America/Chicago'>CST</SelectItem>
                  <SelectItem value='America/Los_Angeles'>PST</SelectItem>
                  <SelectItem value='Europe/Oslo'>CET (Oslo)</SelectItem>
                  <SelectItem value='Europe/London'>GMT (London)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='meeting_type' className='text-xs md:text-sm'>
                Meeting Type
              </Label>
              <Select
                value={formData.meeting_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, meeting_type: value })
                }
              >
                <SelectTrigger className='text-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='onboarding' className='text-sm'>
                    Onboarding
                  </SelectItem>
                  <SelectItem value='demo' className='text-sm'>
                    Demo
                  </SelectItem>
                  <SelectItem value='consultation' className='text-sm'>
                    Consultation
                  </SelectItem>
                  <SelectItem value='support' className='text-sm'>
                    Support
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='meeting_link' className='text-xs md:text-sm'>
                Meeting Link (Optional)
              </Label>
              <Input
                id='meeting_link'
                type='url'
                placeholder='https://meet.google.com/...'
                value={formData.meeting_link}
                onChange={(e) =>
                  setFormData({ ...formData, meeting_link: e.target.value })
                }
                className='text-sm'
              />
            </div>
            <div>
              <Label htmlFor='description' className='text-xs md:text-sm'>
                Description (Optional)
              </Label>
              <Input
                id='description'
                placeholder='Brief description of the meeting'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className='text-sm'
              />
            </div>
          </div>
          <DialogFooter className='flex-col gap-2 sm:flex-row'>
            <Button
              variant='outline'
              onClick={() => setIsDialogOpen(false)}
              className='w-full text-sm sm:w-auto'
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSlot}
              className='w-full text-sm sm:w-auto'
            >
              Create Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
