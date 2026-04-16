'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreHorizontal, Trash2, CheckCircle2, XCircle, Link2, Package, Clock, ThumbsUp, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationRequest {
  id: number;
  user_id: number;
  integration_name: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  username?: string;
  email?: string;
}

export default function IntegrationRequestsPage() {
  const [requests, setRequests] = useState<IntegrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/requests/all');
      if (!response.ok) {
        throw new Error('Failed to fetch integration requests');
      }
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch integration requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/integrations/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status updated successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteRequest = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/integrations/requests/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete request');
      }

      toast.success('Request deleted successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      completed: { variant: 'outline', label: 'Completed' }
    };
    
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div>
          <Heading
            title='Integration Requests'
            description='View and manage user requests for new integrations'
          />
        </div>
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>All Integration Requests</CardTitle>
            <CardDescription>
              Users can request new integrations from the Integrations page. Review and manage them here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='flex h-64 items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : requests.length === 0 ? (
              <div className='flex h-64 flex-col items-center justify-center text-center'>
                <p className='text-lg font-semibold'>No Integration Requests</p>
                <p className='text-muted-foreground mt-2'>
                  Integration requests from users will appear here.
                </p>
              </div>
            ) : (
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Integration Name</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-2'>
                            <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10'>
                              <Link2 className='h-4 w-4 text-primary' />
                            </div>
                            <span>{request.integration_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className='font-medium'>{request.username}</div>
                            <div className='text-sm text-muted-foreground'>
                              {request.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='max-w-xs'>
                          <div className='truncate' title={request.notes}>
                            {request.notes || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                disabled={isUpdating}
                              >
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              {request.status === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => updateStatus(request.id, 'approved')}
                                  >
                                    <CheckCircle2 className='mr-2 h-4 w-4 text-green-600' />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateStatus(request.id, 'rejected')}
                                  >
                                    <XCircle className='mr-2 h-4 w-4 text-red-600' />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {request.status === 'approved' && (
                                <DropdownMenuItem
                                  onClick={() => updateStatus(request.id, 'completed')}
                                >
                                  <CheckCircle2 className='mr-2 h-4 w-4 text-blue-600' />
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => deleteRequest(request.id)}
                                className='text-red-600 focus:text-red-600'
                              >
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Requests</CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{requests.length}</div>
              <p className='text-xs text-muted-foreground mt-1'>All integration requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Pending</CardTitle>
              <Clock className='h-4 w-4 text-yellow-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {requests.filter((r) => r.status === 'pending').length}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Approved</CardTitle>
              <ThumbsUp className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {requests.filter((r) => r.status === 'approved').length}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>Work in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Completed</CardTitle>
              <CheckCheck className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {requests.filter((r) => r.status === 'completed').length}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>Integration deployed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}


