'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Target,
  Activity,
  Building2,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerMetrics {
  total_customers: number;
  new_customers_7d: number;
  new_customers_30d: number;
  blocked_customers: number;
  active_customers: number;
  inactive_customers: number;
  avg_customer_value: number;
  total_customer_value: number;
  avg_minutes_remaining: number;
}

interface ProjectMetrics {
  total_projects: number;
  completed_projects: number;
  active_projects: number;
  on_hold_projects: number;
  cancelled_projects: number;
  avg_progress: number;
  total_budget: number;
  total_actual_cost: number;
  avg_duration_days: number;
  on_time_completions: number;
}

interface RevenueMetrics {
  paying_customers: number;
  total_purchases: number;
  total_revenue: number;
  avg_purchase_value: number;
  topup_revenue: number;
  package_revenue: number;
  total_minutes_sold: number;
  avg_minutes_per_purchase: number;
}

interface DistributionItem {
  [key: string]: any;
  count: number;
  avg_value?: number;
}

interface TrendItem {
  month: string;
  [key: string]: any;
}

interface TopCustomer {
  id: number;
  email: string;
  display_name: string;
  customer_tier: string;
  industry: string;
  total_revenue: number;
  total_minutes: number;
  project_count: number;
  purchase_count: number;
  joined_date: string;
  total_minutes_remaining: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('customers');

  // Data states
  const [customerData, setCustomerData] = useState<{
    metrics: CustomerMetrics;
    tierDistribution: DistributionItem[];
    industryDistribution: DistributionItem[];
    growthData: TrendItem[];
  } | null>(null);

  const [projectData, setProjectData] = useState<{
    metrics: ProjectMetrics;
    typeDistribution: DistributionItem[];
    statusDistribution: DistributionItem[];
    projectTrend: TrendItem[];
  } | null>(null);

  const [revenueData, setRevenueData] = useState<{
    metrics: RevenueMetrics;
    packageRevenue: DistributionItem[];
    revenueTrend: TrendItem[];
    customerSegments: DistributionItem[];
  } | null>(null);

  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchAllData();
  }, [user, timeframe]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch all analytics data in parallel
      const [customerRes, projectRes, revenueRes, topCustomersRes] =
        await Promise.all([
          fetch(`/api/analytics/customers?timeframe=${timeframe}`),
          fetch(`/api/analytics/projects?timeframe=${timeframe}`),
          fetch(`/api/analytics/revenue?timeframe=${timeframe}`),
          fetch(`/api/analytics/top-customers?limit=10&sort_by=revenue`)
        ]);

      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomerData(data.data);
      } else {
        console.error('Customer analytics failed:', customerRes.status);
        toast.error('Failed to load customer analytics');
      }

      if (projectRes.ok) {
        const data = await projectRes.json();
        setProjectData(data.data);
      } else {
        console.error('Project analytics failed:', projectRes.status);
        toast.error('Failed to load project analytics');
      }

      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenueData(data.data);
      } else {
        console.error('Revenue analytics failed:', revenueRes.status);
        toast.error('Failed to load revenue analytics');
      }

      if (topCustomersRes.ok) {
        const data = await topCustomersRes.json();
        setTopCustomers(data.data);
      } else {
        console.error('Top customers failed:', topCustomersRes.status);
        toast.error('Failed to load top customers');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numValue = parseFloat(String(amount || 0));
    const value = isNaN(numValue) ? 0 : Math.round(numValue);
    const formatted = value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return `${formatted},-kr`;
  };

  const formatNumber = (num: number | string | null | undefined) => {
    const numValue = parseFloat(String(num || 0));
    return new Intl.NumberFormat('en-US').format(
      isNaN(numValue) ? 0 : numValue
    );
  };

  const formatPercentage = (num: number | string | null | undefined) => {
    const numValue = parseFloat(String(num || 0));
    return `${numValue.toFixed(1)}%`;
  };

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case '7':
        return 'Last 7 days';
      case '30':
        return 'Last 30 days';
      case '90':
        return 'Last 90 days';
      case '365':
        return 'Last 12 months';
      case '0':
        return 'All time';
      default:
        return 'Last 30 days';
    }
  };

  const handleExport = async (
    type: 'customers' | 'projects' | 'revenue' | 'analytics-summary',
    format: 'csv' | 'json' = 'csv'
  ) => {
    setExporting(type);
    try {
      const params = new URLSearchParams({
        format,
        timeframe
      });

      const response = await fetch(`/api/export/${type}?${params.toString()}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      if (format === 'csv') {
        // Handle CSV download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          response.headers
            .get('content-disposition')
            ?.split('filename=')[1]
            ?.replace(/"/g, '') || `${type}_export.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(
          `${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`
        );
      } else {
        // Handle JSON download
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(
          `${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${type} data`);
    } finally {
      setExporting(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <PageContainer>
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='text-center'>
            <AlertTriangle className='mx-auto mb-4 h-16 w-16 text-red-500' />
            <h2 className='mb-2 text-xl font-semibold'>Access Denied</h2>
            <p className='text-muted-foreground'>
              You don't have permission to view reports.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='mx-auto w-full max-w-7xl space-y-6'>
        {/* Header */}
        <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Analytics & Reports
            </h1>
            <p className='text-muted-foreground'>
              Comprehensive insights into your business performance
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className='w-40'>
                <Calendar className='mr-2 h-4 w-4' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='7'>Last 7 days</SelectItem>
                <SelectItem value='30'>Last 30 days</SelectItem>
                <SelectItem value='90'>Last 90 days</SelectItem>
                <SelectItem value='365'>Last 12 months</SelectItem>
                <SelectItem value='0'>All time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchAllData}
              className='border-primary cursor-pointer border'
              variant='outline'
              size='sm'
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh
            </Button>
            <Button
              onClick={() => handleExport('analytics-summary', 'csv')}
              disabled={loading || exporting === 'analytics-summary'}
              variant='outline'
              size='sm'
            >
              <Download
                className={`mr-2 h-4 w-4 ${exporting === 'analytics-summary' ? 'animate-spin' : ''}`}
              />
              Export Summary
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='w-full space-y-2 sm:space-y-4'
        >
          <TabsList className='grid h-auto w-full min-w-0 grid-cols-1 items-stretch gap-2 md:grid-cols-2 lg:grid-cols-4'>
            <TabsTrigger
              value='customers'
              className='w-full min-w-0 justify-center py-2 text-center text-xs whitespace-normal sm:py-3 sm:text-sm'
            >
              Customer Analytics
            </TabsTrigger>
            <TabsTrigger
              value='projects'
              className='w-full min-w-0 justify-center py-2 text-center text-xs whitespace-normal sm:py-3 sm:text-sm'
            >
              Project Performance
            </TabsTrigger>
            <TabsTrigger
              value='revenue'
              className='w-full min-w-0 justify-center py-2 text-center text-xs whitespace-normal sm:py-3 sm:text-sm'
            >
              Revenue Insights
            </TabsTrigger>
            <TabsTrigger
              value='overview'
              className='w-full min-w-0 justify-center py-2 text-center text-xs whitespace-normal sm:py-3 sm:text-sm'
            >
              Executive Summary
            </TabsTrigger>
          </TabsList>

          {/* Customer Analytics Tab */}
          <TabsContent value='customers' className='space-y-6'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <h2 className='text-2xl font-semibold'>Customer Analytics</h2>
              <Button
                onClick={() => handleExport('customers', 'csv')}
                className='border-primary cursor-pointer border'
                disabled={loading || exporting === 'customers'}
                variant='outline'
                size='sm'
              >
                <Download
                  className={`mr-2 h-4 w-4 ${exporting === 'customers' ? 'animate-spin' : ''}`}
                />
                Export Customers
              </Button>
            </div>
            {loading ? (
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className='pb-2'>
                      <div className='h-4 w-24 animate-pulse rounded bg-gray-200' />
                    </CardHeader>
                    <CardContent>
                      <div className='mb-2 h-8 w-16 animate-pulse rounded bg-gray-200' />
                      <div className='h-3 w-32 animate-pulse rounded bg-gray-200' />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Customer Metrics */}
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Total Customers
                      </CardTitle>
                      <Users className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatNumber(
                          customerData?.metrics.total_customers || 0
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        +{customerData?.metrics.new_customers_7d || 0} this week
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Active Customers
                      </CardTitle>
                      <CheckCircle2 className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatNumber(
                          customerData?.metrics.active_customers || 0
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {customerData?.metrics.inactive_customers || 0} inactive
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Avg Customer Value
                      </CardTitle>
                      <DollarSign className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatCurrency(
                          customerData?.metrics.avg_customer_value || 0
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {formatCurrency(
                          customerData?.metrics.total_customer_value || 0
                        )}{' '}
                        total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Issues
                      </CardTitle>
                      <AlertTriangle className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold text-red-600'>
                        {customerData?.metrics.blocked_customers || 0}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Blocked customers
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Distribution */}
                <div className='grid gap-6 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Tiers</CardTitle>
                      <CardDescription>
                        Distribution by customer tier
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {customerData?.tierDistribution.map((tier, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between'
                          >
                            <div className='flex items-center space-x-2'>
                              <Crown
                                className={`h-4 w-4 ${tier.tier === 'enterprise'
                                    ? 'text-purple-600'
                                    : tier.tier === 'premium'
                                      ? 'text-blue-600'
                                      : 'text-gray-600'
                                  }`}
                              />
                              <span className='font-medium capitalize'>
                                {tier.tier || 'Basic'}
                              </span>
                            </div>
                            <div className='text-right'>
                              <div className='font-medium'>{tier.count}</div>
                              <div className='text-muted-foreground text-xs'>
                                {formatCurrency(tier.avg_value)} avg
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Industries</CardTitle>
                      <CardDescription>Customers by industry</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {customerData?.industryDistribution
                          .slice(0, 5)
                          .map((industry, index) => (
                            <div
                              key={index}
                              className='flex items-center justify-between'
                            >
                              <div className='flex items-center space-x-2'>
                                <Building2 className='text-muted-foreground h-4 w-4' />
                                <span className='font-medium'>
                                  {industry.industry}
                                </span>
                              </div>
                              <div className='text-right'>
                                <div className='font-medium'>
                                  {industry.count}
                                </div>
                                <div className='text-muted-foreground text-xs'>
                                  {formatCurrency(industry.avg_value)} avg
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Project Performance Tab */}
          <TabsContent value='projects' className='space-y-6'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <h2 className='text-2xl font-semibold'>Project Performance</h2>
              <Button
                onClick={() => handleExport('projects', 'csv')}
                className='border-primary cursor-pointer border'
                disabled={loading || exporting === 'projects'}
                variant='outline'
                size='sm'
              >
                <Download
                  className={`mr-2 h-4 w-4 ${exporting === 'projects' ? 'animate-spin' : ''}`}
                />
                Export Projects
              </Button>
            </div>
            {loading ? (
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className='pb-2'>
                      <div className='h-4 w-24 animate-pulse rounded bg-gray-200' />
                    </CardHeader>
                    <CardContent>
                      <div className='mb-2 h-8 w-16 animate-pulse rounded bg-gray-200' />
                      <div className='h-3 w-32 animate-pulse rounded bg-gray-200' />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Project Metrics */}
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Total Projects
                      </CardTitle>
                      <Target className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatNumber(projectData?.metrics.total_projects || 0)}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {projectData?.metrics.active_projects || 0} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Completion Rate
                      </CardTitle>
                      <CheckCircle2 className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {projectData?.metrics.total_projects
                          ? formatPercentage(
                            (projectData.metrics.completed_projects /
                              projectData.metrics.total_projects) *
                            100
                          )
                          : '0%'}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {projectData?.metrics.completed_projects || 0} completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Total Budget
                      </CardTitle>
                      <DollarSign className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatCurrency(projectData?.metrics.total_budget || 0)}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {formatCurrency(
                          projectData?.metrics.total_actual_cost || 0
                        )}{' '}
                        spent
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        On-Time Delivery
                      </CardTitle>
                      <Clock className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {projectData?.metrics.completed_projects
                          ? formatPercentage(
                            (projectData.metrics.on_time_completions /
                              projectData.metrics.completed_projects) *
                            100
                          )
                          : '0%'}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {formatNumber(
                          projectData?.metrics.avg_duration_days || 0
                        )}{' '}
                        days avg
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Project Distribution */}
                <div className='grid gap-6 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Types</CardTitle>
                      <CardDescription>
                        Distribution by project type
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {projectData?.typeDistribution.map((type, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between'
                          >
                            <div className='flex items-center space-x-2'>
                              <BarChart3 className='text-muted-foreground h-4 w-4' />
                              <span className='font-medium capitalize'>
                                {type.project_type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className='text-right'>
                              <div className='font-medium'>{type.count}</div>
                              <div className='text-muted-foreground text-xs'>
                                {formatCurrency(type.total_budget)} budget
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Project Status</CardTitle>
                      <CardDescription>
                        Current project status distribution
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {projectData?.statusDistribution.map(
                          (status, index) => (
                            <div
                              key={index}
                              className='flex items-center justify-between'
                            >
                              <div className='flex items-center space-x-2'>
                                <Activity
                                  className={`h-4 w-4 ${status.status === 'completed'
                                      ? 'text-green-600'
                                      : status.status === 'in_progress'
                                        ? 'text-blue-600'
                                        : status.status === 'on_hold'
                                          ? 'text-yellow-600'
                                          : 'text-red-600'
                                    }`}
                                />
                                <span className='font-medium capitalize'>
                                  {status.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className='text-right'>
                                <div className='font-medium'>
                                  {status.count}
                                </div>
                                <div className='text-muted-foreground text-xs'>
                                  {formatPercentage(status.avg_progress)} avg
                                  progress
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Revenue Insights Tab */}
          <TabsContent value='revenue' className='space-y-6'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <h2 className='text-2xl font-semibold'>Revenue Insights</h2>
              <Button
                onClick={() => handleExport('revenue', 'csv')}
                className='border-primary cursor-pointer border'
                disabled={loading || exporting === 'revenue'}
                variant='outline'
                size='sm'
              >
                <Download
                  className={`mr-2 h-4 w-4 ${exporting === 'revenue' ? 'animate-spin' : ''}`}
                />
                Export Revenue
              </Button>
            </div>
            {loading ? (
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className='pb-2'>
                      <div className='h-4 w-24 animate-pulse rounded bg-gray-200' />
                    </CardHeader>
                    <CardContent>
                      <div className='mb-2 h-8 w-16 animate-pulse rounded bg-gray-200' />
                      <div className='h-3 w-32 animate-pulse rounded bg-gray-200' />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Revenue Metrics */}
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Total Revenue
                      </CardTitle>
                      <DollarSign className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatCurrency(
                          revenueData?.metrics.total_revenue || 0
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {revenueData?.metrics.total_purchases || 0} purchases
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Paying Customers
                      </CardTitle>
                      <Users className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatNumber(
                          revenueData?.metrics.paying_customers || 0
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {formatCurrency(
                          revenueData?.metrics.avg_purchase_value || 0
                        )}{' '}
                        avg purchase
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Package Revenue
                      </CardTitle>
                      <TrendingUp className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatCurrency(
                          revenueData?.metrics.package_revenue || 0
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {formatCurrency(
                          revenueData?.metrics.topup_revenue || 0
                        )}{' '}
                        from top-ups
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Minutes Sold
                      </CardTitle>
                      <Clock className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {formatNumber(
                          revenueData?.metrics.total_minutes_sold || 0
                        )}
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {formatNumber(
                          revenueData?.metrics.avg_minutes_per_purchase || 0
                        )}{' '}
                        avg per purchase
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Distribution */}
                <div className='grid gap-6 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Packages</CardTitle>
                      <CardDescription>Revenue by package type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {revenueData?.packageRevenue
                          .slice(0, 5)
                          .map((pkg, index) => (
                            <div
                              key={index}
                              className='flex items-center justify-between'
                            >
                              <div className='flex items-center space-x-2'>
                                <PieChart className='text-muted-foreground h-4 w-4' />
                                <span className='font-medium'>
                                  {pkg.package_name}
                                </span>
                              </div>
                              <div className='text-right'>
                                <div className='font-medium'>
                                  {formatCurrency(pkg.total_revenue)}
                                </div>
                                <div className='text-muted-foreground text-xs'>
                                  {pkg.purchase_count} sales
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Segments</CardTitle>
                      <CardDescription>
                        Revenue by customer value
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {revenueData?.customerSegments.map((segment, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between'
                          >
                            <div className='flex items-center space-x-2'>
                              <Users className='text-muted-foreground h-4 w-4' />
                              <span className='font-medium'>
                                {segment.segment}
                              </span>
                            </div>
                            <div className='text-right'>
                              <div className='font-medium'>
                                {segment.customer_count}
                              </div>
                              <div className='text-muted-foreground text-xs'>
                                {formatCurrency(segment.segment_revenue)} total
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Executive Summary Tab */}
          <TabsContent value='overview' className='space-y-6'>
            {/* Top Customers */}
            <Card>
              <CardHeader className='flex justify-between'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <CardTitle>Top Performing Customers</CardTitle>
                  <CardDescription>
                    Highest revenue customers ({getTimeframeLabel(timeframe)})
                  </CardDescription>
                </div>
                <div>
                  <Button
                    className='border-primary cursor-pointer border'
                    onClick={() => handleExport('analytics-summary', 'csv')}
                    disabled={loading || exporting === 'analytics-summary'}
                    variant='outline'
                    size='sm'
                  >
                    <Download
                      className={`mr-2 h-4 w-4 ${exporting === 'analytics-summary' ? 'animate-spin' : ''}`}
                    />
                    Export Summary
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='space-y-3'>
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between rounded border p-3'
                      >
                        <div className='space-y-2'>
                          <div className='h-4 w-32 animate-pulse rounded bg-gray-200' />
                          <div className='h-3 w-24 animate-pulse rounded bg-gray-200' />
                        </div>
                        <div className='h-6 w-20 animate-pulse rounded bg-gray-200' />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {topCustomers.slice(0, 10).map((customer, index) => (
                      <div
                        key={customer.id}
                        className='hover:bg-muted/50 flex items-center justify-between rounded border p-3 transition-colors'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full'>
                            <span className='text-primary text-sm font-medium'>
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <div className='font-medium'>
                              {customer.display_name}
                            </div>
                            <div className='text-muted-foreground flex items-center space-x-2 text-sm'>
                              <span>{customer.email}</span>
                              {customer.customer_tier && (
                                <Badge variant='outline' className='text-xs'>
                                  {customer.customer_tier}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='font-medium'>
                            {formatCurrency(customer.total_revenue)}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {customer.project_count} projects •{' '}
                            {formatNumber(customer.total_minutes)} mins
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Summary */}
            <div className='grid gap-4 md:grid-cols-3'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Customer Health</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Active Customers</span>
                    <span className='font-medium'>
                      {formatNumber(
                        customerData?.metrics.active_customers || 0
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Blocked Customers</span>
                    <span className='font-medium text-red-600'>
                      {customerData?.metrics.blocked_customers || 0}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Avg Customer Value</span>
                    <span className='font-medium'>
                      {formatCurrency(
                        customerData?.metrics.avg_customer_value || 0
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Project Status</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Active Projects</span>
                    <span className='font-medium'>
                      {formatNumber(projectData?.metrics.active_projects || 0)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Completion Rate</span>
                    <span className='font-medium'>
                      {projectData?.metrics.total_projects
                        ? formatPercentage(
                          (projectData.metrics.completed_projects /
                            projectData.metrics.total_projects) *
                          100
                        )
                        : '0%'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Total Budget</span>
                    <span className='font-medium'>
                      {formatCurrency(projectData?.metrics.total_budget || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Total Revenue</span>
                    <span className='font-medium'>
                      {formatCurrency(revenueData?.metrics.total_revenue || 0)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Paying Customers</span>
                    <span className='font-medium'>
                      {formatNumber(revenueData?.metrics.paying_customers || 0)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Avg Purchase</span>
                    <span className='font-medium'>
                      {formatCurrency(
                        revenueData?.metrics.avg_purchase_value || 0
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
