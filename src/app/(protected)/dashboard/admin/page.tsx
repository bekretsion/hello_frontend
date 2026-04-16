'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardMetrics {
  total_customers: number;
  new_customers_today: number;
  blocked_customers: number;
  revenue_today: number;
  revenue_30days: number;
  overdue_invoices: number;
  active_projects: number;
  total_active_minutes: number;
}

interface RecentActivity {
  type: string;
  email: string;
  timestamp: string;
}

interface AttentionNeeded {
  id: number;
  email: string;
  username: string;
  company_name: string;
  reason: string;
  details: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [attentionNeeded, setAttentionNeeded] = useState<AttentionNeeded[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingValues, setUpdatingValues] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setRecentActivities(data.recentActivities);
      setAttentionNeeded(data.attentionNeeded);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const rounded = Math.round(amount);
    const formatted = rounded.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return `${formatted},-kr`;
  };

  const handleUpdateCustomerValues = async () => {
    try {
      setUpdatingValues(true);
      const response = await fetch('/api/admin/update-customer-values', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update customer values');
      }

      const data = await response.json();
      toast.success(`Customer values updated for ${data.updated_count} customers`);

      // Refresh dashboard data to show updated values
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating customer values:', error);
      toast.error('Failed to update customer values');
    } finally {
      setUpdatingValues(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'payment_received':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'package_purchase':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'billing_log':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'project_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'low_minutes':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Low Minutes</Badge>;
      case 'no_minutes':
        return <Badge variant="outline" className="text-red-600 border-red-600">No Minutes</Badge>;
      case 'calls_blocked':
        return <Badge variant="outline" className="text-red-600 border-red-600">Calls Blocked</Badge>;
      case 'overdue_payment':
        return <Badge variant="outline" className="text-red-600 border-red-600">Overdue Payment</Badge>;
      default:
        return <Badge variant="outline">{reason.replace('_', ' ')}</Badge>;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-52 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your Hello platform
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total_customers || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{metrics?.new_customers_today || 0} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics?.revenue_today || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(metrics?.revenue_30days || 0)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.active_projects || 0}</div>
              <p className="text-xs text-muted-foreground">
                Projects in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(metrics?.blocked_customers || 0) + (metrics?.overdue_invoices || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.blocked_customers || 0} blocked, {metrics?.overdue_invoices || 0} overdue
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest activities across your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.type === 'user_signup' ? 'New signup' :
                            activity.type === 'package_purchase' ? 'Package purchased' :
                              activity.type === 'billing_log' ? 'Billing activity' :
                                activity.type.replace('_', ' ')} • {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customers Needing Attention */}
          <Card>
            <CardHeader>
              <CardTitle>Needs Attention</CardTitle>
              <CardDescription>
                Customers that require immediate action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attentionNeeded.length > 0 ? (
                  attentionNeeded.slice(0, 5).map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {customer.company_name || customer.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getReasonBadge(customer.reason)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/admin/customers/${customer.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">All customers are in good standing</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/admin/customers')}
                className="justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Customers
              </Button>
              <Button
                variant="outline"
                onClick={handleUpdateCustomerValues}
                className="justify-start"
                disabled={updatingValues}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                {updatingValues ? 'Updating...' : 'Update Customer Values'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/admin/controls')}
                className="justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin Controls
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
