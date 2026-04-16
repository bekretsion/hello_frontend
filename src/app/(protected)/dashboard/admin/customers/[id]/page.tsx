'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Package,
  MessageSquare,
  FileText,
  Settings,
  Plus,
  Edit,
  FolderOpen,
  TrendingUp,
  Target,
  Activity,
  ExternalLink,
  CreditCard,
  RefreshCw,
  Ban,
  History
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerDetail {
  id: number;
  email: string;
  username: string;
  user_created_at: string;
  subscription_status: string;
  total_minutes_remaining: number;
  calls_blocked: boolean;
  company_name: string;
  industry: string;
  contact_person: string;
  phone: string;
  address: string;
  timezone: string;
  customer_tier: string;
  onboarding_status: string;
  customer_value: number;
  last_contact_date: string;
  next_follow_up_date: string;
  account_manager_name: string;
  account_manager_email: string;
  abuse_prevention_count: number;
  abuse_prevention_reset_at: string;
}

interface Bundle {
  id: number;
  package_name: string;
  minutes_purchased: number;
  minutes_remaining: number;
  purchase_price: number;
  purchased_at: string;
  expires_at: string;
  status: string;
  is_topup: boolean;
}

// Removed Communication interface - no longer needed

interface Note {
  id: number;
  note_type: string;
  title: string;
  content: string;
  is_important: boolean;
  admin_name: string;
  created_at: string;
}

interface Project {
  id: number;
  project_name: string;
  project_type: string;
  status: string;
  priority: string;
  progress_percentage: number;
  budget: number;
  actual_cost: number;
  start_date: string;
  target_completion_date: string;
  actual_completion_date: string | null;
  project_manager_name: string | null;
  project_manager_email: string | null;
  total_milestones: number;
  completed_milestones: number;
  active_milestones: number;
  overdue_milestones: number;
  created_at: string;
}

interface BillingSettings {
  user_id: number;
  auto_topup_enabled: boolean;
  auto_charge_enabled: boolean;
  auto_renewal_enabled: boolean;
  auto_retry_enabled: boolean;
  auto_renewal_trigger_hours: number;
  low_minutes_threshold: number;
  topup_amount: number;
  notification_email: string;
  email: string;
  username: string;
  total_minutes_remaining: number;
  calls_blocked: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface PaymentRetry {
  id: number;
  user_id: number;
  payment_type: string;
  retry_count: number;
  max_retries: number;
  next_retry_at: string;
  status: string;
  last_error_message: string;
  created_at: string;
  updated_at: string;
}

interface BillingLog {
  id: number;
  user_id: number;
  event_type: string;
  amount: number;
  minutes_involved: number;
  bundle_id: number;
  description: string;
  created_at: string;
}

export default function CustomerDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<CustomerDetail>>({});

  // Admin action dialogs
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [showTopupDialog, setShowTopupDialog] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);

  // Billing data
  const [billingSettings, setBillingSettings] =
    useState<BillingSettings | null>(null);
  const [paymentRetries, setPaymentRetries] = useState<PaymentRetry[]>([]);
  const [billingLogs, setBillingLogs] = useState<BillingLog[]>([]);

  // Admin action forms
  const [packageForm, setPackageForm] = useState({
    packageType: 'existing',
    packageId: '',
    customMinutes: '',
    customPrice: '',
    customValidityDays: '',
    reason: ''
  });

  const [blockForm, setBlockForm] = useState({
    blocked: false,
    reason: ''
  });

  const [noteForm, setNoteForm] = useState({
    note_type: 'general',
    title: '',
    content: '',
    is_important: false
  });

  const [billingForm, setBillingForm] = useState({
    autoChargeEnabled: false,
    autoRenewalEnabled: false,
    autoRetryEnabled: true,
    autoRenewalTriggerHours: 5,
    lowMinutesThreshold: 20,
    topupAmount: 100,
    notificationEmail: '',
    reason: ''
  });

  const [topupForm, setTopupForm] = useState({
    topupType: 'existing',
    packageId: '',
    customMinutes: '',
    customPrice: '',
    reason: ''
  });

  // Tab state management
  const [activeTab, setActiveTab] = useState('profile');

  // Package minutes validation error
  const [packageMinutesError, setPackageMinutesError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin' || !customerId) {
      return;
    }
    fetchCustomerDetail();
    fetchPackages();
    fetchBillingData();
  }, [user, customerId]);

  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = Date.now();
      const response = await fetch(
        `/api/admin/customers/${customerId}?t=${cacheBuster}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache'
          }
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch customer details');
      }

      const data = await response.json();
      setCustomer(data.customer);
      setBundles(data.bundles || []);
      setProjects(data.projects || []);
      setNotes(data.notes || []);
      setProfileForm(data.customer);
      setBlockForm({
        blocked: data.customer.calls_blocked,
        reason: ''
      });
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      } else {
        console.error(
          'Failed to fetch packages:',
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      // Don't show error toast as this is not critical
    }
  };

  const fetchBillingData = async () => {
    try {
      // Fetch billing settings
      const billingResponse = await fetch(
        `/api/admin/users/${customerId}/billing-settings`
      );
      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        setBillingSettings(billingData);
        setBillingForm({
          autoChargeEnabled: billingData.auto_charge_enabled || false,
          autoRenewalEnabled: billingData.auto_renewal_enabled || false,
          autoRetryEnabled: billingData.auto_retry_enabled || true,
          autoRenewalTriggerHours: billingData.auto_renewal_trigger_hours || 5,
          lowMinutesThreshold: billingData.low_minutes_threshold || 20,
          topupAmount: billingData.topup_amount || 100,
          notificationEmail:
            billingData.notification_email || billingData.email || '',
          reason: ''
        });
      }

      // Fetch payment retries
      const retriesResponse = await fetch(
        `/api/admin/users/${customerId}/payment-retries`
      );
      if (retriesResponse.ok) {
        const retriesData = await retriesResponse.json();
        setPaymentRetries(retriesData);
      }

      // Fetch billing logs
      const logsResponse = await fetch(
        `/api/admin/users/${customerId}/billing-logs?limit=50`
      );
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setBillingLogs(logsData);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      // Don't show error toast as this is not critical
    }
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update customer profile');
      }

      toast.success('Customer profile updated successfully');
      setIsEditingProfile(false);
      fetchCustomerDetail();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update customer profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignPackage = async () => {
    try {
      setSaving(true);

      if (packageForm.packageType === 'custom') {
        const minutes = Number(packageForm.customMinutes);
        if (!minutes || minutes <= 0) {
          toast.error('Minutes should be a positive number');
          setSaving(false);
          return;
        }
      }

      // Validate form
      if (packageForm.packageType === 'existing') {
        if (!packageForm.packageId || packageForm.packageId === 'loading') {
          toast.error('Please select a valid package');
          setSaving(false);
          return;
        }
      } else {
        if (
          !packageForm.customMinutes ||
          !packageForm.customPrice ||
          !packageForm.customValidityDays
        ) {
          toast.error('Please fill in all custom package fields');
          setSaving(false);
          return;
        }
      }

      const payload =
        packageForm.packageType === 'existing'
          ? { packageId: packageForm.packageId, reason: packageForm.reason }
          : {
            customMinutes: parseInt(packageForm.customMinutes),
            customPrice: parseFloat(packageForm.customPrice),
            customValidityDays: parseInt(packageForm.customValidityDays),
            reason: packageForm.reason
          };

      const response = await fetch(
        `/api/admin/users/${customerId}/assign-package`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to assign package');
      }

      toast.success('Package assigned successfully');
      setShowPackageDialog(false);
      setPackageForm({
        packageType: 'existing',
        packageId: '',
        customMinutes: '',
        customPrice: '',
        customValidityDays: '',
        reason: ''
      });
      // Refresh customer data to show the new package
      // Add small delay to ensure database transaction is fully committed
      setTimeout(() => {
        fetchCustomerDetail();
      }, 500);
    } catch (error) {
      console.error('Error assigning package:', error);
      toast.error('Failed to assign package');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/users/${customerId}/block-calls`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blockForm)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update call status');
      }

      toast.success(
        `Calls ${blockForm.blocked ? 'blocked' : 'unblocked'} successfully`
      );
      setShowBlockDialog(false);
      setBlockForm({ blocked: false, reason: '' });
      fetchCustomerDetail();
    } catch (error) {
      console.error('Error updating call status:', error);
      toast.error('Failed to update call status');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/customers/${customerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteForm)
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      toast.success('Note added successfully');
      setShowNoteDialog(false);
      setNoteForm({
        note_type: 'general',
        title: '',
        content: '',
        is_important: false
      });
      fetchCustomerDetail();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const rounded = Math.round(amount);
    const formatted = rounded.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return `${formatted},-kr`;
  };

  const handleUpdateBillingSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/users/${customerId}/billing-settings`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(billingForm)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update billing settings');
      }

      toast.success('Billing settings updated successfully');
      setShowBillingDialog(false);
      fetchBillingData();
    } catch (error) {
      console.error('Error updating billing settings:', error);
      toast.error('Failed to update billing settings');
    } finally {
      setSaving(false);
    }
  };

  const handleManualTopup = async () => {
    try {
      setSaving(true);

      // Validate form
      if (topupForm.topupType === 'existing') {
        if (!topupForm.packageId || topupForm.packageId === 'loading') {
          toast.error('Please select a valid package');
          setSaving(false);
          return;
        }
      } else {
        if (!topupForm.customMinutes || !topupForm.customPrice) {
          toast.error('Please fill in all custom top-up fields');
          setSaving(false);
          return;
        }
      }

      const requestBody =
        topupForm.topupType === 'existing'
          ? { packageId: topupForm.packageId, reason: topupForm.reason }
          : {
            customMinutes: parseInt(topupForm.customMinutes),
            customPrice: parseFloat(topupForm.customPrice),
            reason: topupForm.reason
          };

      const response = await fetch(
        `/api/admin/users/${customerId}/manual-topup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process manual top-up');
      }

      const result = await response.json();
      toast.success(`Manual top-up completed: ${result.minutes} minutes added`);
      setShowTopupDialog(false);
      setTopupForm({
        topupType: 'existing',
        packageId: '',
        customMinutes: '',
        customPrice: '',
        reason: ''
      });
      fetchCustomerDetail();
      fetchBillingData();
    } catch (error) {
      console.error('Error processing manual top-up:', error);
      toast.error('Failed to process manual top-up');
    } finally {
      setSaving(false);
    }
  };

  const handleRetryPayment = async (retryId: number) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/payment-retries/${retryId}/retry`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to retry payment');
      }

      toast.success('Payment retry initiated successfully');
      fetchBillingData();
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error('Failed to retry payment');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTierBadge = (tier: string) => {
    const variants = {
      basic: 'outline',
      premium: 'secondary',
      enterprise: 'default'
    } as const;

    return (
      <Badge variant={variants[tier as keyof typeof variants] || 'outline'}>
        {tier?.charAt(0).toUpperCase() + tier?.slice(1) || 'Basic'}
      </Badge>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <PageContainer>
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='text-center'>
            <XCircle className='mx-auto mb-4 h-16 w-16 text-red-500' />
            <h2 className='mb-2 text-xl font-semibold'>Access Denied</h2>
            <p className='text-muted-foreground'>
              You don't have permission to view customer details.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className='mx-auto max-w-7xl space-y-6'>
          <div className='flex items-center space-x-4'>
            <div className='h-8 w-8 animate-pulse rounded bg-gray-200' />
            <div className='h-8 w-48 animate-pulse rounded bg-gray-200' />
          </div>
          <div className='grid gap-6 lg:grid-cols-3'>
            <div className='space-y-6 lg:col-span-2'>
              <Card>
                <CardHeader>
                  <div className='h-6 w-32 animate-pulse rounded bg-gray-200' />
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className='h-4 w-full animate-pulse rounded bg-gray-200'
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <div className='h-6 w-24 animate-pulse rounded bg-gray-200' />
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className='h-8 w-full animate-pulse rounded bg-gray-200'
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer>
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='text-center'>
            <User className='text-muted-foreground mx-auto mb-4 h-16 w-16' />
            <h2 className='mb-2 text-xl font-semibold'>Customer Not Found</h2>
            <p className='text-muted-foreground'>
              The customer you're looking for doesn't exist.
            </p>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/admin/customers')}
              className='mt-4'
            >
              Back to Customers
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='mx-auto max-w-7xl space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push('/dashboard/admin/customers')}
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                {customer.company_name || customer.username}
              </h1>
              <p className='text-muted-foreground'>{customer.email}</p>
              <div className='mt-2 flex items-center space-x-2'>
                <DollarSign className='h-4 w-4 text-green-600' />
                <span className='text-sm font-medium text-green-600'>
                  Lifetime Value: $
                  {Number(customer.customer_value || 0).toFixed(2)}
                </span>
              </div>
            </div>
            {getTierBadge(customer.customer_tier)}
            {customer.calls_blocked && (
              <Badge variant='destructive'>Calls Blocked</Badge>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <Dialog
              open={showPackageDialog}
              onOpenChange={setShowPackageDialog}
            >
              <DialogTrigger asChild>
                <Button variant='outline'>
                  <Package className='mr-2 h-4 w-4' />
                  Assign Package
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Package</DialogTitle>
                  <DialogDescription>
                    Assign a package to this customer manually
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='space-y-1'>
                    <Label>Package Type</Label>
                    <Select
                      value={packageForm.packageType}
                      onValueChange={(value) =>
                        setPackageForm((prev) => ({
                          ...prev,
                          packageType: value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='existing'>
                          Existing Package
                        </SelectItem>
                        <SelectItem value='custom'>Custom Package</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {packageForm.packageType === 'existing' ? (
                    <div className='space-y-1'>
                      <Label>Package</Label>
                      <Select
                        value={packageForm.packageId}
                        onValueChange={(value) =>
                          setPackageForm((prev) => ({
                            ...prev,
                            packageId: value
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select a package' />
                        </SelectTrigger>
                        <SelectContent>
                          {packages.length > 0 ? (
                            packages.map((pkg) => (
                              <SelectItem key={pkg.id} value={pkg.id}>
                                {pkg.name} - ${pkg.price}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value='loading' disabled>
                              Loading packages...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                      <div className='grid grid-cols-3 gap-4'>
                        <div className='space-y-1'>
                          <Label>Minutes</Label>
                          <Input
                            type='number'
                            placeholder='100'
                            min='0'
                            value={packageForm.customMinutes}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPackageForm((prev) => ({
                                ...prev,
                                customMinutes: val
                              }));
                              // validate immediately
                              if (val !== '' && Number(val) < 0) {
                                setPackageMinutesError(
                                  'Minutes should be a positive number'
                                );
                              } else {
                                setPackageMinutesError('');
                              }
                            }}
                          />
                          {packageMinutesError && (
                            <p className='mt-1 text-xs text-red-600'>
                              {packageMinutesError}
                            </p>
                          )}
                        </div>
                        <div className='space-y-1'>
                          <Label>Price ($)</Label>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='29.99'
                            value={packageForm.customPrice}
                            onChange={(e) =>
                              setPackageForm((prev) => ({
                                ...prev,
                                customPrice: e.target.value
                              }))
                            }
                          />
                        </div>
                        <div className='space-y-1'>
                          <Label>Validity (days)</Label>
                          <Input
                            type='number'
                            placeholder='30'
                            value={packageForm.customValidityDays}
                            onChange={(e) =>
                              setPackageForm((prev) => ({
                                ...prev,
                                customValidityDays: e.target.value
                              }))
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className='space-y-1'>
                    <Label>Reason</Label>
                    <Textarea
                      placeholder='Reason for manual assignment...'
                      value={packageForm.reason}
                      onChange={(e) =>
                        setPackageForm((prev) => ({
                          ...prev,
                          reason: e.target.value
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setShowPackageDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAssignPackage} disabled={saving}>
                    {saving ? 'Assigning...' : 'Assign Package'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showTopupDialog} onOpenChange={setShowTopupDialog}>
              <DialogTrigger asChild>
                <Button variant='outline'>
                  <Plus className='mr-2 h-4 w-4' />
                  Manual Top-up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manual Top-up</DialogTitle>
                  <DialogDescription>
                    Add minutes to customer account manually
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label>Top-up Type</Label>
                    <Select
                      value={topupForm.topupType}
                      onValueChange={(value) =>
                        setTopupForm((prev) => ({ ...prev, topupType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='existing'>
                          Existing Package
                        </SelectItem>
                        <SelectItem value='custom'>Custom Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {topupForm.topupType === 'existing' ? (
                    <div>
                      <Label>Select Package</Label>
                      <Select
                        value={topupForm.packageId}
                        onValueChange={(value) =>
                          setTopupForm((prev) => ({
                            ...prev,
                            packageId: value
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Choose a package...' />
                        </SelectTrigger>
                        <SelectContent>
                          {packages.length > 0 ? (
                            packages.map((pkg) => (
                              <SelectItem key={pkg.id} value={pkg.id}>
                                {pkg.name} - {pkg.minutes} minutes -{' '}
                                {formatCurrency(pkg.price)}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value='loading' disabled>
                              Loading packages...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label>Minutes</Label>
                        <Input
                          type='number'
                          placeholder='100'
                          value={topupForm.customMinutes}
                          onChange={(e) =>
                            setTopupForm((prev) => ({
                              ...prev,
                              customMinutes: e.target.value
                            }))
                          }
                          min='1'
                        />
                      </div>
                      <div>
                        <Label>Price ($)</Label>
                        <Input
                          type='number'
                          step='0.01'
                          placeholder='10.00'
                          value={topupForm.customPrice}
                          onChange={(e) =>
                            setTopupForm((prev) => ({
                              ...prev,
                              customPrice: e.target.value
                            }))
                          }
                          min='0.01'
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      placeholder='Reason for manual top-up...'
                      value={topupForm.reason}
                      onChange={(e) =>
                        setTopupForm((prev) => ({
                          ...prev,
                          reason: e.target.value
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setShowTopupDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleManualTopup} disabled={saving}>
                    {saving ? 'Processing...' : 'Add Top-up'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
              <DialogTrigger asChild>
                <Button
                  variant={customer.calls_blocked ? 'default' : 'destructive'}
                >
                  <Shield className='mr-2 h-4 w-4' />
                  {customer.calls_blocked ? 'Unblock Calls' : 'Block Calls'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {customer.calls_blocked ? 'Unblock Calls' : 'Block Calls'}
                  </DialogTitle>
                  <DialogDescription>
                    {customer.calls_blocked
                      ? 'Allow this customer to make and receive calls again'
                      : 'Prevent this customer from making and receiving calls'}
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      placeholder='Reason for blocking/unblocking calls...'
                      value={blockForm.reason}
                      onChange={(e) =>
                        setBlockForm((prev) => ({
                          ...prev,
                          reason: e.target.value,
                          blocked: !customer.calls_blocked
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setShowBlockDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={customer.calls_blocked ? 'default' : 'destructive'}
                    onClick={handleToggleBlock}
                    disabled={saving}
                  >
                    {saving
                      ? 'Updating...'
                      : customer.calls_blocked
                        ? 'Unblock'
                        : 'Block'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Main Content */}
          <div className='space-y-6 lg:col-span-2'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-6'>
                <TabsTrigger value='profile'>Profile</TabsTrigger>
                <TabsTrigger value='projects'>Projects</TabsTrigger>
                <TabsTrigger value='bundles'>Packages</TabsTrigger>
                <TabsTrigger value='billing'>Billing</TabsTrigger>
                <TabsTrigger value='payments'>Payments</TabsTrigger>
                <TabsTrigger value='notes'>Notes</TabsTrigger>
              </TabsList>

              <TabsContent value='profile' className='space-y-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle>Customer Profile</CardTitle>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                    >
                      <Edit className='mr-2 h-4 w-4' />
                      {isEditingProfile ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isEditingProfile ? (
                      <div className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <Label>Company Name</Label>
                            <Input
                              value={profileForm.company_name || ''}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  company_name: e.target.value
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Industry</Label>
                            <Input
                              value={profileForm.industry || ''}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  industry: e.target.value
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Contact Person</Label>
                            <Input
                              value={profileForm.contact_person || ''}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  contact_person: e.target.value
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={profileForm.phone || ''}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  phone: e.target.value
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Customer Tier</Label>
                            <Select
                              value={profileForm.customer_tier || 'basic'}
                              onValueChange={(value) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  customer_tier: value
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='basic'>Basic</SelectItem>
                                <SelectItem value='premium'>Premium</SelectItem>
                                <SelectItem value='enterprise'>
                                  Enterprise
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Timezone</Label>
                            <Input
                              value={profileForm.timezone || ''}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  timezone: e.target.value
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Textarea
                            value={profileForm.address || ''}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                address: e.target.value
                              }))
                            }
                          />
                        </div>
                        <div className='flex space-x-2'>
                          <Button onClick={handleProfileSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button
                            variant='outline'
                            onClick={() => setIsEditingProfile(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-3'>
                          <div className='flex items-center space-x-2'>
                            <Building2 className='text-muted-foreground h-4 w-4' />
                            <span className='text-sm font-medium'>
                              Company:
                            </span>
                            <span className='text-sm'>
                              {customer.company_name || 'Not specified'}
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <User className='text-muted-foreground h-4 w-4' />
                            <span className='text-sm font-medium'>
                              Contact:
                            </span>
                            <span className='text-sm'>
                              {customer.contact_person || 'Not specified'}
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Phone className='text-muted-foreground h-4 w-4' />
                            <span className='text-sm font-medium'>Phone:</span>
                            <span className='text-sm'>
                              {customer.phone || 'Not specified'}
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Mail className='text-muted-foreground h-4 w-4' />
                            <span className='text-sm font-medium'>Email:</span>
                            <span className='text-sm'>{customer.email}</span>
                          </div>
                        </div>
                        <div className='space-y-3'>
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm font-medium'>
                              Industry:
                            </span>
                            <span className='text-sm'>
                              {customer.industry || 'Not specified'}
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm font-medium'>
                              Timezone:
                            </span>
                            <span className='text-sm'>
                              {customer.timezone || 'Not specified'}
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Calendar className='text-muted-foreground h-4 w-4' />
                            <span className='text-sm font-medium'>Joined:</span>
                            <span className='text-sm'>
                              {formatDate(customer.user_created_at)}
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm font-medium'>
                              Account Manager:
                            </span>
                            <span className='text-sm'>
                              {customer.account_manager_name || 'Not assigned'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='projects' className='space-y-4'>
                {/* Project Statistics */}
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Total Projects
                      </CardTitle>
                      <FolderOpen className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {projects.length}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        All time projects
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Active Projects
                      </CardTitle>
                      <Activity className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {
                          projects.filter((p) =>
                            ['planning', 'in_progress', 'testing'].includes(
                              p.status
                            )
                          ).length
                        }
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Currently running
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Project Value
                      </CardTitle>
                      <TrendingUp className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        $
                        {projects
                          .reduce((sum, p) => sum + (p.budget || 0), 0)
                          .toLocaleString()}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Total project budgets
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Completion Rate
                      </CardTitle>
                      <Target className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {projects.length > 0
                          ? Math.round(
                            (projects.filter((p) => p.status === 'completed')
                              .length /
                              projects.length) *
                            100
                          )
                          : 0}
                        %
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Projects completed
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Projects List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project History</CardTitle>
                    <CardDescription>
                      All projects associated with this customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projects.length > 0 ? (
                      <div className='space-y-4'>
                        {projects.map((project) => (
                          <div
                            key={project.id}
                            className='hover:bg-muted/50 flex items-start gap-4 rounded-lg border p-4 transition-colors'
                          >
                            <div className='mt-1'>
                              {project.status === 'completed' ? (
                                <CheckCircle2 className='h-4 w-4 text-green-600' />
                              ) : project.status === 'in_progress' ? (
                                <Activity className='h-4 w-4 text-blue-600' />
                              ) : project.status === 'on_hold' ? (
                                <Clock className='h-4 w-4 text-yellow-600' />
                              ) : project.status === 'cancelled' ? (
                                <XCircle className='h-4 w-4 text-red-600' />
                              ) : (
                                <Target className='h-4 w-4 text-gray-600' />
                              )}
                            </div>

                            <div className='min-w-0 flex-1 space-y-2'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  <h4 className='font-medium'>
                                    {project.project_name}
                                  </h4>
                                  <Badge
                                    variant={
                                      project.status === 'completed'
                                        ? 'default'
                                        : project.status === 'in_progress'
                                          ? 'secondary'
                                          : project.status === 'on_hold'
                                            ? 'outline'
                                            : project.status === 'cancelled'
                                              ? 'destructive'
                                              : 'outline'
                                    }
                                  >
                                    {project.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge
                                    variant='outline'
                                    className='capitalize'
                                  >
                                    {project.priority}
                                  </Badge>
                                </div>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/admin/projects/${project.id.toString()}`
                                    )
                                  }
                                >
                                  <ExternalLink className='h-4 w-4' />
                                </Button>
                              </div>

                              <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                                <span className='capitalize'>
                                  {project.project_type.replace('_', ' ')}
                                </span>
                                {project.project_manager_name && (
                                  <span>
                                    Manager: {project.project_manager_name}
                                  </span>
                                )}
                                <span>
                                  Budget: $
                                  {project.budget?.toLocaleString() || 0}
                                </span>
                              </div>

                              <div className='text-muted-foreground flex items-center gap-4 text-xs'>
                                <span>
                                  Started:{' '}
                                  {new Date(
                                    project.start_date
                                  ).toLocaleDateString()}
                                </span>
                                <span>
                                  Due:{' '}
                                  {new Date(
                                    project.target_completion_date
                                  ).toLocaleDateString()}
                                </span>
                                {project.actual_completion_date && (
                                  <span className='text-green-600'>
                                    Completed:{' '}
                                    {new Date(
                                      project.actual_completion_date
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              {project.total_milestones > 0 && (
                                <div className='flex items-center gap-4 text-xs'>
                                  <span className='text-muted-foreground'>
                                    Milestones: {project.completed_milestones}/
                                    {project.total_milestones}
                                  </span>
                                  {project.active_milestones > 0 && (
                                    <span className='text-blue-600'>
                                      {project.active_milestones} active
                                    </span>
                                  )}
                                  {project.overdue_milestones > 0 && (
                                    <span className='text-red-600'>
                                      {project.overdue_milestones} overdue
                                    </span>
                                  )}
                                </div>
                              )}

                              {project.progress_percentage > 0 && (
                                <div className='space-y-1'>
                                  <div className='flex items-center justify-between text-xs'>
                                    <span className='text-muted-foreground'>
                                      Progress
                                    </span>
                                    <span className='font-medium'>
                                      {project.progress_percentage}%
                                    </span>
                                  </div>
                                  <div className='bg-muted h-1 w-full rounded-full'>
                                    <div
                                      className='bg-primary h-1 rounded-full transition-all duration-300'
                                      style={{
                                        width: `${project.progress_percentage}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='py-8 text-center'>
                        <FolderOpen className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                        <p className='text-muted-foreground'>
                          No projects found for this customer
                        </p>
                        <Button
                          variant='outline'
                          className='mt-4'
                          onClick={() =>
                            router.push('/dashboard/admin/projects')
                          }
                        >
                          Create New Project
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='bundles' className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle>Active Packages</CardTitle>
                    <CardDescription>
                      Current minute bundles and packages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bundles.length > 0 ? (
                      <div className='space-y-4'>
                        {bundles.map((bundle) => (
                          <div
                            key={bundle.id}
                            className='flex items-center justify-between rounded-lg border p-4'
                          >
                            <div>
                              <h4 className='font-medium'>
                                {bundle.package_name}
                              </h4>
                              <p className='text-muted-foreground text-sm'>
                                {bundle.minutes_remaining} of{' '}
                                {bundle.minutes_purchased} minutes remaining
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                Expires: {formatDate(bundle.expires_at)}
                              </p>
                            </div>
                            <div className='text-right'>
                              <p className='font-medium'>
                                {formatCurrency(bundle.purchase_price)}
                              </p>
                              <Badge
                                variant={
                                  bundle.is_topup ? 'secondary' : 'outline'
                                }
                              >
                                {bundle.is_topup ? 'Top-up' : 'Package'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground py-8 text-center'>
                        No active packages
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='billing' className='space-y-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <div>
                      <CardTitle>Auto-Charge & Renewal Settings</CardTitle>
                      <CardDescription>
                        Manage customer's billing preferences and thresholds
                      </CardDescription>
                    </div>
                    <Dialog
                      open={showBillingDialog}
                      onOpenChange={setShowBillingDialog}
                    >
                      <DialogTrigger asChild>
                        <Button size='sm'>
                          <Settings className='mr-2 h-4 w-4' />
                          Update Settings
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='max-w-2xl'>
                        <DialogHeader>
                          <DialogTitle>Update Billing Settings</DialogTitle>
                          <DialogDescription>
                            Modify auto-charge and renewal preferences for this
                            customer
                          </DialogDescription>
                        </DialogHeader>
                        <div className='space-y-4'>
                          <div className='grid grid-cols-2 gap-4'>
                            <div className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id='autoCharge'
                                checked={billingForm.autoChargeEnabled}
                                onChange={(e) =>
                                  setBillingForm((prev) => ({
                                    ...prev,
                                    autoChargeEnabled: e.target.checked
                                  }))
                                }
                                className='rounded'
                              />
                              <Label htmlFor='autoCharge'>
                                Enable Auto-Charge
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id='autoRenewal'
                                checked={billingForm.autoRenewalEnabled}
                                onChange={(e) =>
                                  setBillingForm((prev) => ({
                                    ...prev,
                                    autoRenewalEnabled: e.target.checked
                                  }))
                                }
                                className='rounded'
                              />
                              <Label htmlFor='autoRenewal'>
                                Enable Auto-Renewal
                              </Label>
                            </div>
                          </div>
                          <div className='grid grid-cols-2 gap-4'>
                            <div>
                              <Label>Low Minutes Threshold</Label>
                              <Input
                                type='number'
                                value={billingForm.lowMinutesThreshold}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  // Handle empty input
                                  if (value === '') {
                                    setBillingForm((prev) => ({
                                      ...prev,
                                      lowMinutesThreshold: 0
                                    }));
                                    return;
                                  }

                                  // Parse as number and remove leading zeros
                                  const numValue = parseInt(value, 10);

                                  // Only update if it's a valid number within range
                                  if (
                                    !isNaN(numValue) &&
                                    numValue >= 0 &&
                                    numValue <= 1000
                                  ) {
                                    setBillingForm((prev) => ({
                                      ...prev,
                                      lowMinutesThreshold: numValue
                                    }));
                                  }
                                }}
                                onFocus={(e) => {
                                  // Select all text when focused for easy replacement
                                  e.target.select();
                                }}
                                onInput={(e) => {
                                  // Clean up leading zeros in real-time
                                  const input = e.target as HTMLInputElement;
                                  const value = input.value;

                                  // If value starts with "0" and has more digits, remove leading zeros
                                  if (
                                    value.length > 1 &&
                                    value.startsWith('0') &&
                                    !value.startsWith('0.')
                                  ) {
                                    const cleanValue = parseInt(
                                      value,
                                      10
                                    ).toString();
                                    if (cleanValue !== 'NaN') {
                                      input.value = cleanValue;
                                    }
                                  }
                                }}
                                min='0'
                                max='1000'
                              />
                            </div>
                            <div>
                              <Label>Top-up Amount ($)</Label>
                              <Input
                                type='number'
                                value={billingForm.topupAmount}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  // Handle empty input
                                  if (value === '') {
                                    setBillingForm((prev) => ({
                                      ...prev,
                                      topupAmount: 10
                                    }));
                                    return;
                                  }

                                  // Parse as number and remove leading zeros
                                  const numValue = parseInt(value, 10);

                                  // Only update if it's a valid number within range
                                  if (
                                    !isNaN(numValue) &&
                                    numValue >= 10 &&
                                    numValue <= 1000
                                  ) {
                                    setBillingForm((prev) => ({
                                      ...prev,
                                      topupAmount: numValue
                                    }));
                                  }
                                }}
                                onFocus={(e) => {
                                  e.target.select();
                                }}
                                onInput={(e) => {
                                  // Clean up leading zeros in real-time
                                  const input = e.target as HTMLInputElement;
                                  const value = input.value;

                                  // If value starts with "0" and has more digits, remove leading zeros
                                  if (
                                    value.length > 1 &&
                                    value.startsWith('0') &&
                                    !value.startsWith('0.')
                                  ) {
                                    const cleanValue = parseInt(
                                      value,
                                      10
                                    ).toString();
                                    if (cleanValue !== 'NaN') {
                                      input.value = cleanValue;
                                    }
                                  }
                                }}
                                min='10'
                                max='1000'
                              />
                            </div>
                            <div>
                              <Label>Auto-Renewal Trigger (hours)</Label>
                              <Input
                                type='number'
                                value={billingForm.autoRenewalTriggerHours}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  // Handle empty input
                                  if (value === '') {
                                    setBillingForm((prev) => ({
                                      ...prev,
                                      autoRenewalTriggerHours: 1
                                    }));
                                    return;
                                  }

                                  // Parse as number and remove leading zeros
                                  const numValue = parseInt(value, 10);

                                  // Only update if it's a valid number within range
                                  if (
                                    !isNaN(numValue) &&
                                    numValue >= 1 &&
                                    numValue <= 24
                                  ) {
                                    setBillingForm((prev) => ({
                                      ...prev,
                                      autoRenewalTriggerHours: numValue
                                    }));
                                  }
                                }}
                                onFocus={(e) => {
                                  e.target.select();
                                }}
                                onInput={(e) => {
                                  // Clean up leading zeros in real-time
                                  const input = e.target as HTMLInputElement;
                                  const value = input.value;

                                  // If value starts with "0" and has more digits, remove leading zeros
                                  if (
                                    value.length > 1 &&
                                    value.startsWith('0') &&
                                    !value.startsWith('0.')
                                  ) {
                                    const cleanValue = parseInt(
                                      value,
                                      10
                                    ).toString();
                                    if (cleanValue !== 'NaN') {
                                      input.value = cleanValue;
                                    }
                                  }
                                }}
                                min='1'
                                max='24'
                              />
                            </div>
                            <div>
                              <Label>Notification Email</Label>
                              <Input
                                type='email'
                                value={billingForm.notificationEmail}
                                onChange={(e) =>
                                  setBillingForm((prev) => ({
                                    ...prev,
                                    notificationEmail: e.target.value
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Reason for Change</Label>
                            <Textarea
                              placeholder='Reason for updating billing settings...'
                              value={billingForm.reason}
                              onChange={(e) =>
                                setBillingForm((prev) => ({
                                  ...prev,
                                  reason: e.target.value
                                }))
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant='outline'
                            onClick={() => setShowBillingDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateBillingSettings}
                            disabled={saving}
                          >
                            {saving ? 'Updating...' : 'Update Settings'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {billingSettings ? (
                      <div className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='flex items-center justify-between rounded-lg border p-3'>
                            <span className='text-sm font-medium'>
                              Auto-Charge
                            </span>
                            <Badge
                              variant={
                                billingSettings.auto_charge_enabled
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {billingSettings.auto_charge_enabled
                                ? 'Enabled'
                                : 'Disabled'}
                            </Badge>
                          </div>
                          <div className='flex items-center justify-between rounded-lg border p-3'>
                            <span className='text-sm font-medium'>
                              Auto-Renewal
                            </span>
                            <Badge
                              variant={
                                billingSettings.auto_renewal_enabled
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {billingSettings.auto_renewal_enabled
                                ? 'Enabled'
                                : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='rounded-lg border p-3'>
                            <div className='mb-1 text-sm font-medium'>
                              Top-up Amount
                            </div>
                            <div className='text-lg'>
                              {formatCurrency(billingSettings.topup_amount)}
                            </div>
                          </div>
                          <div className='rounded-lg border p-3'>
                            <div className='mb-1 text-sm font-medium'>
                              Low Minutes Alert
                            </div>
                            <div className='text-lg'>
                              {billingSettings.low_minutes_threshold} minutes
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className='text-muted-foreground py-8 text-center'>
                        Loading billing settings...
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='payments' className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Retry History & Billing Logs</CardTitle>
                    <CardDescription>
                      Failed payments, retry attempts, and billing activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paymentRetries.length > 0 || billingLogs.length > 0 ? (
                      <div className='space-y-6'>
                        {paymentRetries.length > 0 && (
                          <div>
                            <h4 className='mb-3 font-medium'>
                              Payment Retries
                            </h4>
                            <div className='space-y-3'>
                              {paymentRetries.map((retry) => (
                                <div
                                  key={retry.id}
                                  className='flex items-center justify-between rounded-lg border p-3'
                                >
                                  <div className='flex-1'>
                                    <div className='mb-1 flex items-center space-x-2'>
                                      <CreditCard className='h-4 w-4' />
                                      <span className='text-sm font-medium'>
                                        {retry.payment_type}
                                      </span>
                                      <Badge
                                        variant={
                                          retry.status === 'failed'
                                            ? 'destructive'
                                            : 'secondary'
                                        }
                                      >
                                        {retry.status}
                                      </Badge>
                                    </div>
                                    <div className='text-muted-foreground text-xs'>
                                      Retry {retry.retry_count} of{' '}
                                      {retry.max_retries} •{' '}
                                      {formatDate(retry.created_at)}
                                    </div>
                                  </div>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => handleRetryPayment(retry.id)}
                                    disabled={saving}
                                  >
                                    <RefreshCw className='mr-1 h-4 w-4' />
                                    Retry
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {billingLogs.length > 0 && (
                          <div>
                            <h4 className='mb-3 font-medium'>
                              Billing Activity
                            </h4>
                            <div className='space-y-2'>
                              {billingLogs.slice(0, 10).map((log) => (
                                <div
                                  key={log.id}
                                  className='flex items-center justify-between rounded border p-2'
                                >
                                  <div className='flex items-center space-x-2'>
                                    <History className='text-muted-foreground h-3 w-3' />
                                    <span className='text-sm'>
                                      {log.event_type.replace(/_/g, ' ')}
                                    </span>
                                    <span className='text-muted-foreground text-xs'>
                                      {formatDate(log.created_at)}
                                    </span>
                                  </div>
                                  {log.amount > 0 && (
                                    <span className='text-sm font-medium'>
                                      {formatCurrency(log.amount)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className='text-muted-foreground py-8 text-center'>
                        No payment or billing activity
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='notes' className='space-y-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <div>
                      <CardTitle>Internal Notes</CardTitle>
                      <CardDescription>
                        Admin-only notes about this customer
                      </CardDescription>
                    </div>
                    <Dialog
                      open={showNoteDialog}
                      onOpenChange={setShowNoteDialog}
                    >
                      <DialogTrigger asChild>
                        <Button size='sm'>
                          <Plus className='mr-2 h-4 w-4' />
                          Add Note
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Internal Note</DialogTitle>
                          <DialogDescription>
                            Add a private note about this customer
                          </DialogDescription>
                        </DialogHeader>
                        <div className='space-y-4'>
                          <div>
                            <Label>Note Type</Label>
                            <Select
                              value={noteForm.note_type}
                              onValueChange={(value) =>
                                setNoteForm((prev) => ({
                                  ...prev,
                                  note_type: value
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='general'>General</SelectItem>
                                <SelectItem value='billing'>Billing</SelectItem>
                                <SelectItem value='support'>Support</SelectItem>
                                <SelectItem value='sales'>Sales</SelectItem>
                                <SelectItem value='technical'>
                                  Technical
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Title</Label>
                            <Input
                              placeholder='Note title...'
                              value={noteForm.title}
                              onChange={(e) =>
                                setNoteForm((prev) => ({
                                  ...prev,
                                  title: e.target.value
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Content</Label>
                            <Textarea
                              placeholder='Note content...'
                              value={noteForm.content}
                              onChange={(e) =>
                                setNoteForm((prev) => ({
                                  ...prev,
                                  content: e.target.value
                                }))
                              }
                              rows={4}
                            />
                          </div>
                          <div className='flex items-center space-x-2'>
                            <input
                              type='checkbox'
                              id='important'
                              checked={noteForm.is_important}
                              onChange={(e) =>
                                setNoteForm((prev) => ({
                                  ...prev,
                                  is_important: e.target.checked
                                }))
                              }
                            />
                            <Label htmlFor='important'>Mark as important</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant='outline'
                            onClick={() => setShowNoteDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleAddNote} disabled={saving}>
                            {saving ? 'Adding...' : 'Add Note'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {notes.length > 0 ? (
                      <div className='space-y-4'>
                        {notes.map((note) => (
                          <div key={note.id} className='rounded-lg border p-4'>
                            <div className='mb-2 flex items-center justify-between'>
                              <div className='flex items-center space-x-2'>
                                <FileText className='h-4 w-4' />
                                <span className='font-medium'>
                                  {note.title}
                                </span>
                                <Badge variant='outline'>
                                  {note.note_type}
                                </Badge>
                                {note.is_important && (
                                  <Badge
                                    variant='destructive'
                                    className='text-xs'
                                  >
                                    Important
                                  </Badge>
                                )}
                              </div>
                              <span className='text-muted-foreground text-sm'>
                                {formatDate(note.created_at)}
                              </span>
                            </div>
                            <p className='text-muted-foreground mb-2 text-sm'>
                              By: {note.admin_name}
                            </p>
                            <p className='text-sm'>{note.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground py-8 text-center'>
                        No notes yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Clock className='text-muted-foreground h-4 w-4' />
                    <span className='text-sm'>Minutes Remaining</span>
                  </div>
                  <span className='font-medium'>
                    {customer.total_minutes_remaining}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <DollarSign className='text-muted-foreground h-4 w-4' />
                    <span className='text-sm'>Customer Value</span>
                  </div>
                  <span className='font-medium'>
                    {formatCurrency(customer.customer_value || 0)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Package className='text-muted-foreground h-4 w-4' />
                    <span className='text-sm'>Active Bundles</span>
                  </div>
                  <span className='font-medium'>{bundles.length}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <AlertTriangle className='text-muted-foreground h-4 w-4' />
                    <span className='text-sm'>Abuse Counter</span>
                  </div>
                  <span
                    className={`font-medium ${customer?.abuse_prevention_count > 3 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {customer?.abuse_prevention_count || 0}/5
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `/api/admin/users/${customerId}/reset-abuse-counter`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            reason: 'Manual reset from customer detail page'
                          })
                        }
                      );

                      if (!response.ok) {
                        throw new Error('Failed to reset abuse counter');
                      }

                      toast.success('Abuse counter reset successfully');
                      // Refresh customer data to show updated values
                      setTimeout(() => {
                        fetchCustomerDetail();
                      }, 500);
                    } catch (error) {
                      console.error('Error resetting abuse counter:', error);
                      toast.error('Failed to reset abuse counter');
                    }
                  }}
                >
                  <Settings className='mr-2 h-4 w-4' />
                  Reset Abuse Counter
                </Button>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={() => {
                    setActiveTab('bundles');
                    toast.success(
                      'Switched to Packages tab to view billing history'
                    );
                  }}
                >
                  <DollarSign className='mr-2 h-4 w-4' />
                  View Billing History
                </Button>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={() => {
                    setActiveTab('projects');
                    toast.success('Switched to Projects tab');
                  }}
                >
                  <FileText className='mr-2 h-4 w-4' />
                  Manage Projects
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Status</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Onboarding</span>
                  {customer.onboarding_status === 'completed' ? (
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                  ) : (
                    <Clock className='h-4 w-4 text-orange-500' />
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Calls</span>
                  {customer.calls_blocked ? (
                    <XCircle className='h-4 w-4 text-red-500' />
                  ) : (
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Minutes</span>
                  {customer.total_minutes_remaining > 20 ? (
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                  ) : customer.total_minutes_remaining > 0 ? (
                    <AlertTriangle className='h-4 w-4 text-orange-500' />
                  ) : (
                    <XCircle className='h-4 w-4 text-red-500' />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
