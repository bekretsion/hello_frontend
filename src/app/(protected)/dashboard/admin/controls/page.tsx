'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Settings,
  Package,
  Shield,
  AlertTriangle,
  Clock,
  DollarSign,
  RefreshCw,
  Ban,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Search,
  Download,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface PackageTemplate {
  id: string;
  name: string;
  description: string;
  minutes: number;
  price: number;
  validity_days: number;
  is_active: boolean;
}

interface PaymentRetryLog {
  id: number;
  user_id: number;
  user_email: string;
  payment_type: string;
  retry_count: number;
  max_retries: number;
  status: string;
  last_error_message: string;
  next_retry_at: string;
  created_at: string;
}

interface AbuseCounter {
  user_id: number;
  user_email: string;
  username: string;
  abuse_prevention_count: number;
  abuse_prevention_reset_at: string;
  total_minutes_remaining: number;
  calls_blocked: boolean;
}

interface AccessOverride {
  id: number;
  user_id: number;
  user_email: string;
  override_type: string;
  reason: string;
  is_active: boolean;
  expires_at: string;
  granted_by_email: string;
  created_at: string;
}

export default function AdminControlsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [saving, setSaving] = useState(false);
  
  // Package Management States
  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [showEditPackage, setShowEditPackage] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageTemplate | null>(null);
  const [deletingPackage, setDeletingPackage] = useState<PackageTemplate | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    minutes: '',
    price: '',
    validity_days: '',
    is_promotional: false
  });

  // Payment Retry States
  const [retryLogs, setRetryLogs] = useState<PaymentRetryLog[]>([]);
  const [retryFilter, setRetryFilter] = useState('all');
  
  // Abuse Prevention States
  const [abuseCounters, setAbuseCounters] = useState<AbuseCounter[]>([]);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  
  // Access Override States
  const [accessOverrides, setAccessOverrides] = useState<AccessOverride[]>([]);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    user_id: '',
    override_type: '',
    reason: '',
    expires_hours: '24'
  });

  // Auto-charge Settings States
  const [globalSettings, setGlobalSettings] = useState({
    default_low_minutes_threshold: 20,
    default_auto_renewal_trigger_hours: 5,
    max_topups_per_day: 5,
    enable_abuse_prevention: true
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPackages(),
        fetchRetryLogs(),
        fetchAbuseCounters(),
        fetchAccessOverrides(),
        fetchGlobalSettings()
      ]);
    } catch (error) {
      console.error('Error fetching admin control data:', error);
      toast.error('Failed to load admin control data');
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
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchRetryLogs = async () => {
    try {
      const response = await fetch('/api/admin/payment-retries');
      if (response.ok) {
        const data = await response.json();
        setRetryLogs(data);
      }
    } catch (error) {
      console.error('Error fetching retry logs:', error);
      // Use mock data for now
      setRetryLogs([
        {
          id: 1,
          user_id: 1,
          user_email: 'test@example.com',
          payment_type: 'auto_topup',
          retry_count: 1,
          max_retries: 3,
          status: 'retrying',
          last_error_message: 'Card declined',
          next_retry_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const fetchAbuseCounters = async () => {
    try {
      const response = await fetch('/api/admin/abuse-counters');
      if (response.ok) {
        const data = await response.json();
        setAbuseCounters(data);
      }
    } catch (error) {
      console.error('Error fetching abuse counters:', error);
      // Use mock data for now
      setAbuseCounters([
        {
          user_id: 1,
          user_email: 'test@example.com',
          username: 'test',
          abuse_prevention_count: 3,
          abuse_prevention_reset_at: new Date().toISOString(),
          total_minutes_remaining: 50,
          calls_blocked: false
        }
      ]);
    }
  };

  const fetchAccessOverrides = async () => {
    try {
      const response = await fetch('/api/admin/access-overrides');
      if (response.ok) {
        const data = await response.json();
        setAccessOverrides(data);
      }
    } catch (error) {
      console.error('Error fetching access overrides:', error);
      // Use mock data for now
      setAccessOverrides([]);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch('/api/admin/global-settings');
      if (response.ok) {
        const data = await response.json();
        // Convert API string values to numbers and provide defaults
        setGlobalSettings(prev => ({
          ...prev,
          default_low_minutes_threshold: parseInt(data.auto_charge_threshold || '20'),
          default_auto_renewal_trigger_hours: parseInt(data.retry_interval_hours || '24'),
          max_topups_per_day: parseInt(data.abuse_prevention_limit || '5'),
          enable_abuse_prevention: data.system_maintenance_mode !== 'true'
        }));
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
    }
  };

  const handleCreatePackage = async () => {
    if (!packageForm.name || !packageForm.minutes || !packageForm.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...packageForm,
          minutes: parseInt(packageForm.minutes),
          price: parseFloat(packageForm.price),
          validity_days: parseInt(packageForm.validity_days) || 30
        })
      });

      if (response.ok) {
        toast.success('Package created successfully');
        setShowCreatePackage(false);
        setPackageForm({
          name: '',
          description: '',
          minutes: '',
          price: '',
          validity_days: '',
          is_promotional: false
        });
        fetchPackages();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create package');
      }
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error('Failed to create package');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPackage = (pkg: PackageTemplate) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description,
      minutes: pkg.minutes.toString(),
      price: pkg.price.toString(),
      validity_days: pkg.validity_days.toString(),
      is_promotional: false // This can be determined by package type
    });
    setShowEditPackage(true);
  };

  const handleUpdatePackage = async () => {
    if (!editingPackage || !packageForm.name || !packageForm.minutes || !packageForm.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/packages/${editingPackage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: packageForm.name,
          description: packageForm.description,
          minutes: parseInt(packageForm.minutes),
          price: parseFloat(packageForm.price),
          validity_days: parseInt(packageForm.validity_days) || 30,
          is_promotional: packageForm.is_promotional
        }),
      });

      if (response.ok) {
        toast.success('Package updated successfully');
        setShowEditPackage(false);
        setEditingPackage(null);
        setPackageForm({
          name: '',
          description: '',
          minutes: '',
          price: '',
          validity_days: '',
          is_promotional: false
        });
        fetchPackages(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update package');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Failed to update package');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!deletingPackage) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/packages/${deletingPackage.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Package deleted successfully');
        setShowDeleteDialog(false);
        setDeletingPackage(null);
        fetchPackages(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete package');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    } finally {
      setSaving(false);
    }
  };

  const handleRetryPayment = async (retryId: number) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/payment-retries/${retryId}/retry`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Payment retry triggered successfully');
        fetchRetryLogs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to trigger retry');
      }
    } catch (error) {
      console.error('Error triggering retry:', error);
      toast.error('Failed to trigger retry');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAbuseCounter = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${selectedUser}/reset-abuse-counter`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Abuse counter reset successfully');
        setShowResetDialog(false);
        setSelectedUser(null);
        fetchAbuseCounters();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to reset counter');
      }
    } catch (error) {
      console.error('Error resetting counter:', error);
      toast.error('Failed to reset counter');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOverride = async () => {
    if (!overrideForm.user_id || !overrideForm.override_type || !overrideForm.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(overrideForm.expires_hours));

      const response = await fetch('/api/admin/access-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...overrideForm,
          user_id: parseInt(overrideForm.user_id),
          expires_at: expiresAt.toISOString()
        })
      });

      if (response.ok) {
        toast.success('Access override granted successfully');
        setShowOverrideDialog(false);
        setOverrideForm({
          user_id: '',
          override_type: '',
          reason: '',
          expires_hours: '24'
        });
        fetchAccessOverrides();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create override');
      }
    } catch (error) {
      console.error('Error creating override:', error);
      toast.error('Failed to create override');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeOverride = async (overrideId: number) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/access-overrides/${overrideId}/revoke`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Access override revoked successfully');
        fetchAccessOverrides();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to revoke override');
      }
    } catch (error) {
      console.error('Error revoking override:', error);
      toast.error('Failed to revoke override');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGlobalSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/global-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings)
      });

      if (response.ok) {
        toast.success('Global settings updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      retrying: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      success: 'bg-green-100 text-green-800',
      max_retries_reached: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (user?.role !== 'admin') {
    return (
      <PageContainer>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Controls</h1>
          <p className="text-muted-foreground">
            Advanced administrative controls for package management, payment handling, and access control
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="packages">Package Management</TabsTrigger>
            <TabsTrigger value="retries">Payment Retries</TabsTrigger>
            <TabsTrigger value="abuse">Abuse Prevention</TabsTrigger>
            <TabsTrigger value="overrides">Access Overrides</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
          </TabsList>

          {/* Package Management Tab */}
          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Special & Promotional Packages</CardTitle>
                  <CardDescription>
                    Create custom packages for promotions, testing, or special customers
                  </CardDescription>
                </div>
                <Dialog open={showCreatePackage} onOpenChange={setShowCreatePackage}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Package
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Custom Package</DialogTitle>
                      <DialogDescription>
                        Create a special package for promotional or testing purposes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Package Name *</Label>
                        <Input
                          id="name"
                          value={packageForm.name}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Black Friday Special"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={packageForm.description}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Package description..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minutes">Minutes *</Label>
                          <Input
                            id="minutes"
                            type="number"
                            value={packageForm.minutes}
                            onChange={(e) => setPackageForm(prev => ({ ...prev, minutes: e.target.value }))}
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">Price ($) *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={packageForm.price}
                            onChange={(e) => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="19.99"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="validity">Validity (Days)</Label>
                        <Input
                          id="validity"
                          type="number"
                          value={packageForm.validity_days}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, validity_days: e.target.value }))}
                          placeholder="30"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Set to 0 for permanent/never expires. Default: 30 days
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="promotional"
                          checked={packageForm.is_promotional}
                          onCheckedChange={(checked) => setPackageForm(prev => ({ ...prev, is_promotional: checked }))}
                        />
                        <Label htmlFor="promotional">Mark as Promotional Package</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreatePackage(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePackage} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Package
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Package Dialog */}
                <Dialog open={showEditPackage} onOpenChange={setShowEditPackage}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Package</DialogTitle>
                      <DialogDescription>
                        Update the package details
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-name">Package Name *</Label>
                        <Input
                          id="edit-name"
                          value={packageForm.name}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Black Friday Special"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={packageForm.description}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Package description..."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="edit-minutes">Minutes *</Label>
                          <Input
                            id="edit-minutes"
                            type="number"
                            value={packageForm.minutes}
                            onChange={(e) => setPackageForm(prev => ({ ...prev, minutes: e.target.value }))}
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-price">Price ($) *</Label>
                          <Input
                            id="edit-price"
                            type="number"
                            step="0.01"
                            value={packageForm.price}
                            onChange={(e) => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="19.99"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-validity">Validity (days)</Label>
                          <Input
                            id="edit-validity"
                            type="number"
                            value={packageForm.validity_days}
                            onChange={(e) => setPackageForm(prev => ({ ...prev, validity_days: e.target.value }))}
                            placeholder="30"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit-promotional"
                          checked={packageForm.is_promotional}
                          onCheckedChange={(checked) => setPackageForm(prev => ({ ...prev, is_promotional: checked }))}
                        />
                        <Label htmlFor="edit-promotional">Mark as Promotional Package</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowEditPackage(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdatePackage} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Update Package
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packages.filter(pkg => pkg.id.startsWith('custom-')).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No custom packages created yet.</p>
                      <p className="text-sm">Create your first custom package above.</p>
                    </div>
                  ) : (
                    packages.filter(pkg => pkg.id.startsWith('custom-')).map((pkg) => (
                      <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{pkg.name}</h4>
                          <p className="text-sm text-muted-foreground">{pkg.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {pkg.minutes} minutes
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="mr-1 h-3 w-3" />
                              ${pkg.price}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {pkg.validity_days === 0 ? 'Never expires' : `${pkg.validity_days} days`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditPackage(pkg)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setDeletingPackage(pkg);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delete Package Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Package</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this package? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {deletingPackage && (
                  <div className="p-4 border rounded-lg bg-muted">
                    <h4 className="font-medium">{deletingPackage.name}</h4>
                    <p className="text-sm text-muted-foreground">{deletingPackage.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span>{deletingPackage.minutes} minutes</span>
                      <span>${deletingPackage.price}</span>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeletePackage} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete Package
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Payment Retries Tab */}
          <TabsContent value="retries" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Payment Retry Management</CardTitle>
                  <CardDescription>
                    Monitor and manage failed payment retries
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={retryFilter} onValueChange={setRetryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Retries</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="retrying">Retrying</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchRetryLogs}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {retryLogs
                    .filter(log => retryFilter === 'all' || log.status === retryFilter)
                    .length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No payment retries found.</p>
                      <p className="text-sm">Payment retry logs will appear here when available.</p>
                    </div>
                  ) : (
                    retryLogs
                      .filter(log => retryFilter === 'all' || log.status === retryFilter)
                      .map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{log.user_email}</span>
                              <Badge className={getStatusBadge(log.status)}>
                                {log.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Payment Type: {log.payment_type}</p>
                              <p>Retry: {log.retry_count}/{log.max_retries}</p>
                              {log.last_error_message && (
                                <p className="text-red-600">Error: {log.last_error_message}</p>
                              )}
                              <p>Next Retry: {formatDate(log.next_retry_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {log.status === 'pending' || log.status === 'retrying' ? (
                              <Button
                                size="sm"
                                onClick={() => handleRetryPayment(log.id)}
                                disabled={saving}
                              >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Retry Now
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Abuse Prevention Tab */}
          <TabsContent value="abuse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Abuse Prevention Monitoring</CardTitle>
                <CardDescription>
                  Monitor top-up frequency and manage abuse prevention counters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {abuseCounters.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No abuse prevention alerts.</p>
                      <p className="text-sm">Users with high top-up frequency will appear here.</p>
                    </div>
                  ) : (
                    abuseCounters.map((counter) => (
                      <div key={counter.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{counter.user_email}</span>
                            {counter.calls_blocked && (
                              <Badge variant="destructive">Blocked</Badge>
                            )}
                            {counter.abuse_prevention_count >= 5 && (
                              <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                At Limit
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Top-ups today: {counter.abuse_prevention_count}/5</p>
                            <p>Minutes remaining: {counter.total_minutes_remaining}</p>
                            <p>Reset at: {formatDate(counter.abuse_prevention_reset_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(counter.user_id);
                              setShowResetDialog(true);
                            }}
                          >
                            Reset Counter
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reset Counter Dialog */}
            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Abuse Counter</DialogTitle>
                  <DialogDescription>
                    This will reset the top-up counter for the selected user, allowing them to make additional purchases.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleResetAbuseCounter} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Reset Counter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Access Overrides Tab */}
          <TabsContent value="overrides" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Access Override Management</CardTitle>
                  <CardDescription>
                    Grant temporary access to users who don't meet normal requirements
                  </CardDescription>
                </div>
                <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Shield className="mr-2 h-4 w-4" />
                      Grant Override
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Grant Access Override</DialogTitle>
                      <DialogDescription>
                        Temporarily grant access to a user bypassing normal restrictions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="user_id">User ID *</Label>
                        <Input
                          id="user_id"
                          type="number"
                          value={overrideForm.user_id}
                          onChange={(e) => setOverrideForm(prev => ({ ...prev, user_id: e.target.value }))}
                          placeholder="Enter user ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="override_type">Override Type *</Label>
                        <Select value={overrideForm.override_type} onValueChange={(value) => setOverrideForm(prev => ({ ...prev, override_type: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select override type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="temporary_access">Temporary Access</SelectItem>
                            <SelectItem value="feature_unlock">Feature Unlock</SelectItem>
                            <SelectItem value="limit_increase">Limit Increase</SelectItem>
                            <SelectItem value="restriction_bypass">Restriction Bypass</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expires_hours">Expires In (Hours)</Label>
                        <Select value={overrideForm.expires_hours} onValueChange={(value) => setOverrideForm(prev => ({ ...prev, expires_hours: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Hour</SelectItem>
                            <SelectItem value="6">6 Hours</SelectItem>
                            <SelectItem value="24">24 Hours</SelectItem>
                            <SelectItem value="72">3 Days</SelectItem>
                            <SelectItem value="168">1 Week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="reason">Reason *</Label>
                        <Textarea
                          id="reason"
                          value={overrideForm.reason}
                          onChange={(e) => setOverrideForm(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Explain why this override is needed..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateOverride} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Grant Override
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accessOverrides.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No access overrides active.</p>
                      <p className="text-sm">Access overrides will appear here when granted.</p>
                    </div>
                  ) : (
                    accessOverrides.map((override) => (
                      <div key={override.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="h-4 w-4" />
                            <span className="font-medium">{override.user_email}</span>
                            <Badge variant={override.is_active ? "default" : "secondary"}>
                              {override.is_active ? "Active" : "Expired"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Type: {override.override_type.replace('_', ' ')}</p>
                            <p>Reason: {override.reason}</p>
                            <p>Expires: {formatDate(override.expires_at)}</p>
                            <p>Granted by: {override.granted_by_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {override.is_active && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRevokeOverride(override.id)}
                              disabled={saving}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Global Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Global Auto-Charge Settings</CardTitle>
                <CardDescription>
                  Configure default settings for auto-charging and abuse prevention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="low_minutes">Default Low Minutes Threshold</Label>
                    <Input
                      id="low_minutes"
                      type="number"
                      value={globalSettings.default_low_minutes_threshold || 20}
                      onChange={(e) => setGlobalSettings(prev => ({ 
                        ...prev, 
                        default_low_minutes_threshold: parseInt(e.target.value) || 0 
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Trigger auto-charge when user has less than this many minutes
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="renewal_hours">Default Auto-Renewal Trigger (Hours)</Label>
                    <Input
                      id="renewal_hours"
                      type="number"
                      value={globalSettings.default_auto_renewal_trigger_hours || 5}
                      onChange={(e) => setGlobalSettings(prev => ({ 
                        ...prev, 
                        default_auto_renewal_trigger_hours: parseInt(e.target.value) || 0 
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Hours before expiry to trigger auto-renewal
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="max_topups">Max Top-ups Per Day</Label>
                    <Input
                      id="max_topups"
                      type="number"
                      value={globalSettings.max_topups_per_day || 5}
                      onChange={(e) => setGlobalSettings(prev => ({ 
                        ...prev, 
                        max_topups_per_day: parseInt(e.target.value) || 0 
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum number of top-ups allowed per 24-hour period
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      id="abuse_prevention"
                      checked={globalSettings.enable_abuse_prevention}
                      onCheckedChange={(checked) => setGlobalSettings(prev => ({ 
                        ...prev, 
                        enable_abuse_prevention: checked 
                      }))}
                    />
                    <Label htmlFor="abuse_prevention">Enable Abuse Prevention</Label>
                  </div>
                </div>

                <Separator />

                <Button onClick={handleUpdateGlobalSettings} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
                  Update Global Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
