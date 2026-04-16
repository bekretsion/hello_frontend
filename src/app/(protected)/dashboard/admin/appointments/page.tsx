'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  Loader2, 
  CheckCircle2,
  XCircle,
  User,
  Mail,
  Phone,
  Building,
  Video,
  FileText,
  Send
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Appointment {
  id: number;
  user_id: number;
  slot_id: number;
  status: string;
  customer_notes: string | null;
  admin_notes: string | null;
  attended_by_username: string | null;
  created_at: string;
  // User details
  username: string;
  email: string;
  company_name: string;
  full_name: string;
  phone_number: string | null;
  // Slot details
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  meeting_type: string;
  meeting_link: string | null;
  slot_description: string | null;
  // Receipt/Status details
  user_signup_status?: string | null;
  latest_receipt_status?: string | null;
  latest_receipt_paid_at?: string | null;
}

export default function AppointmentsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isMarkingAttended, setIsMarkingAttended] = useState(false);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'attended' | 'no-show'>('attended');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Receipt assignment state
  const [assignReceiptDialogOpen, setAssignReceiptDialogOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [receipts, setReceipts] = useState<any[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [isAssigningReceipt, setIsAssigningReceipt] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/appointments/all', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (appointment: Appointment, type: 'attended' | 'no-show') => {
    setSelectedAppointment(appointment);
    setDialogType(type);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const handleMarkAsAttended = async () => {
    if (!selectedAppointment) return;

    try {
      setIsMarkingAttended(true);
      const response = await fetch(`/api/admin/appointments/${selectedAppointment.id}/attend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: adminNotes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark as attended');
      }

      toast.success('Appointment marked as attended');
      setDialogOpen(false);
      fetchAppointments();
    } catch (error: any) {
      console.error('Mark attended error:', error);
      toast.error(error.message || 'Failed to mark as attended');
    } finally {
      setIsMarkingAttended(false);
    }
  };

  const handleMarkAsNoShow = async () => {
    if (!selectedAppointment) return;

    try {
      setIsMarkingNoShow(true);
      const response = await fetch(`/api/admin/appointments/${selectedAppointment.id}/no-show`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: adminNotes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark as no-show');
      }

      toast.success('Appointment marked as no-show');
      setDialogOpen(false);
      fetchAppointments();
    } catch (error: any) {
      console.error('Mark no-show error:', error);
      toast.error(error.message || 'Failed to mark as no-show');
    } finally {
      setIsMarkingNoShow(false);
    }
  };

  const openAssignReceiptDialog = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedReceiptId('');
    setAssignReceiptDialogOpen(true);
    
    // Fetch available receipts (draft or unassigned)
    try {
      setReceiptsLoading(true);
      const response = await fetch('/api/admin/receipts');
      if (response.ok) {
        const data = await response.json();
        // Filter receipts that are draft or assigned (not paid)
        const availableReceipts = (data.data || []).filter((r: any) => 
          r.status === 'draft' || (r.status === 'assigned' && !r.assigned_user_id)
        );
        setReceipts(availableReceipts);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('Failed to load receipts');
    } finally {
      setReceiptsLoading(false);
    }
  };

  const handleAssignReceipt = async () => {
    if (!selectedAppointment || !selectedReceiptId) {
      toast.error('Please select a receipt');
      return;
    }

    try {
      setIsAssigningReceipt(true);
      const response = await fetch('/api/admin/receipts/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId: parseInt(selectedReceiptId),
          userId: selectedAppointment.user_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign receipt');
      }

      toast.success('Receipt assigned successfully');
      setAssignReceiptDialogOpen(false);
      fetchAppointments();
    } catch (error: any) {
      console.error('Assign receipt error:', error);
      toast.error(error.message || 'Failed to assign receipt');
    } finally {
      setIsAssigningReceipt(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'booked':
        return <Badge variant="outline" className="border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">Booked</Badge>;
      case 'attended':
        return <Badge variant="default" className="bg-primary">Attended</Badge>;
      case 'no_show':
        return <Badge variant="secondary" className="border">No Show</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const bookedAppointments = appointments.filter(a => a.status === 'booked');
  const attendedAppointments = appointments.filter(a => a.status === 'attended');
  const noShowAppointments = appointments.filter(a => a.status === 'no_show');

  return (
    <PageContainer scrollable={true}>
      <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 pb-8">
        {/* Header */}
        <div className="text-center space-y-2 md:space-y-3 px-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Manage and track customer appointments
          </p>
        </div>

        <Separator />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 px-2">
          <Card className="text-center">
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6">
              <CardDescription className="text-xs md:text-sm">Total</CardDescription>
              <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold">{appointments.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="text-center border-cyan-500/20 bg-cyan-50 dark:bg-cyan-950/20">
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6">
              <CardDescription className="text-xs md:text-sm">Booked</CardDescription>
              <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold text-cyan-600 dark:text-cyan-400">
                {bookedAppointments.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="text-center border-primary/20 bg-primary/5">
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6">
              <CardDescription className="text-xs md:text-sm">Attended</CardDescription>
              <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
                {attendedAppointments.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="text-center border-muted">
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6">
              <CardDescription className="text-xs md:text-sm">No Show</CardDescription>
              <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold text-muted-foreground">
                {noShowAppointments.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Appointments List */}
        <Card className="mx-2">
          <CardHeader className="px-4 md:px-6">
            <CardTitle className="text-xl md:text-2xl">All Appointments</CardTitle>
            <CardDescription className="text-sm md:text-base">View and manage all customer appointments</CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No appointments scheduled yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id} className="overflow-hidden">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base md:text-lg font-semibold truncate">{appointment.full_name || appointment.username}</h3>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{appointment.email}</span>
                            </div>
                            {appointment.phone_number && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span>{appointment.phone_number}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{appointment.company_name}</span>
                            </div>
                          </div>
                        </div>
                        {appointment.status === 'booked' && (
                          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => openDialog(appointment, 'attended')}
                              className="bg-primary hover:bg-primary/90 text-xs md:text-sm"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                              Mark Attended
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(appointment, 'no-show')}
                              className="border-muted-foreground/30 hover:bg-muted text-xs md:text-sm"
                            >
                              <XCircle className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                              No Show
                            </Button>
                          </div>
                        )}
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm md:text-base">
                              {format(new Date(appointment.date), 'MMMM dd, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm md:text-base">
                              {appointment.start_time} - {appointment.end_time} ({appointment.timezone})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{appointment.meeting_type}</Badge>
                          </div>
                          {appointment.meeting_link && (
                            <div className="flex items-center gap-2 min-w-0">
                              <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <a
                                href={appointment.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs md:text-sm text-primary hover:underline truncate"
                              >
                                {appointment.meeting_link}
                              </a>
                            </div>
                          )}
                        </div>

                        {(appointment.customer_notes || appointment.admin_notes) && (
                          <div className="space-y-3">
                            {appointment.customer_notes && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Customer Notes</p>
                                <p className="text-xs md:text-sm bg-muted p-2 rounded break-words">
                                  {appointment.customer_notes}
                                </p>
                              </div>
                            )}
                            {appointment.admin_notes && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Admin Notes</p>
                                <p className="text-xs md:text-sm bg-primary/5 p-2 rounded break-words">
                                  {appointment.admin_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Payment/Activation badges */}
                      {(appointment.user_signup_status || appointment.latest_receipt_status) && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {(appointment.user_signup_status === 'paid' || appointment.latest_receipt_status === 'paid') && (
                            <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">paid</span>
                          )}
                          {appointment.user_signup_status === 'receipt_assigned' && (
                            <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">receipt assigned</span>
                          )}
                          {appointment.user_signup_status === 'assistant_ready' && (
                            <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-xs">assistant ready</span>
                          )}
                          {appointment.latest_receipt_paid_at && (
                            <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">paid at {new Date(appointment.latest_receipt_paid_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}

                      {appointment.attended_by_username && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Attended by: <span className="font-medium">{appointment.attended_by_username}</span>
                          </p>
                        </div>
                      )}

                      {appointment.status === 'attended' && (
                        <div className="mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAssignReceiptDialog(appointment)}
                            className="w-full sm:w-auto"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Assign Receipt
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              {dialogType === 'attended' ? 'Mark as Attended' : 'Mark as No-Show'}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {dialogType === 'attended'
                ? 'Confirm that the customer attended this meeting. This will allow them to proceed to the next step.'
                : 'Mark this appointment as a no-show. The slot will become available again.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs md:text-sm font-medium mb-2 block">
                Notes (Optional)
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this appointment..."
                rows={4}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button
              onClick={dialogType === 'attended' ? handleMarkAsAttended : handleMarkAsNoShow}
              disabled={isMarkingAttended || isMarkingNoShow}
              className={`w-full sm:w-auto text-sm ${dialogType === 'attended' ? 'bg-primary hover:bg-primary/90' : ''}`}
              variant={dialogType === 'attended' ? 'default' : 'outline'}
            >
              {(isMarkingAttended || isMarkingNoShow) ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  <span className="text-xs md:text-sm">Processing...</span>
                </>
              ) : (
                <>
                  {dialogType === 'attended' ? (
                    <>
                      <CheckCircle2 className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="text-xs md:text-sm">Mark Attended</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="text-xs md:text-sm">Mark No-Show</span>
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Receipt Dialog */}
      <Dialog open={assignReceiptDialogOpen} onOpenChange={setAssignReceiptDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              Assign Receipt to Customer
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Select a receipt to assign to {selectedAppointment?.full_name || selectedAppointment?.username || 'this customer'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs md:text-sm font-medium mb-2 block">
                Select Receipt
              </Label>
              {receiptsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No available receipts. Please create a receipt first.
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => window.open('/dashboard/admin/receipts', '_blank')}
                  >
                    Create Receipt
                  </Button>
                </div>
              ) : (
                <Select value={selectedReceiptId} onValueChange={setSelectedReceiptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a receipt" />
                  </SelectTrigger>
                  <SelectContent>
                    {receipts.map((receipt) => (
                      <SelectItem key={receipt.id} value={String(receipt.id)}>
                        {receipt.receipt_number} - ${parseFloat(receipt.total).toFixed(2)} ({receipt.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setAssignReceiptDialogOpen(false)} 
              className="w-full sm:w-auto text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignReceipt}
              disabled={isAssigningReceipt || !selectedReceiptId || receiptsLoading || receipts.length === 0}
              className="w-full sm:w-auto text-sm bg-primary hover:bg-primary/90"
            >
              {isAssigningReceipt ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-xs md:text-sm">Assigning...</span>
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  <span className="text-xs md:text-sm">Assign Receipt</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

