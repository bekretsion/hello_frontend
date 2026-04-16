'use client';

import { useEffect, useState, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MoreHorizontal, CheckCircle2, XCircle, Bot, Clock, Eye, FileText, MessageSquare, RefreshCw, ExternalLink, Paperclip, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth-store';
import { dismissNotifications } from '@/lib/notification-dismissal';

interface AssistantRequest {
  id: number;
  user_id: number;
  assistant_name: string;
  assistant_type: string;
  language: string;
  description: string;
  notes: string;
  first_message?: string;
  script_content?: string;
  voice_preference?: string;
  file_urls?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  assigned_assistant_id: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
  email?: string;
}

export default function AssistantRequestsPage() {
  const { user } = useAuthStore();
  const [pendingRequests, setPendingRequests] = useState<AssistantRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<AssistantRequest[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<AssistantRequest[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingApproved, setIsLoadingApproved] = useState(true);
  const [isLoadingRejected, setIsLoadingRejected] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AssistantRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedFirstMessage, setEditedFirstMessage] = useState('');
  const [editedScriptContent, setEditedScriptContent] = useState('');
  const [voiceName, setVoiceName] = useState<string>('');

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    setIsLoadingPending(true);
    try {
      const response = await fetch('/api/admin/assistant-requests/pending');
      if (!response.ok) {
        throw new Error('Failed to fetch pending assistant requests');
      }
      const data = await response.json();
      setPendingRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Failed to fetch pending assistant requests');
    } finally {
      setIsLoadingPending(false);
    }
  }, []);

  // Fetch approved requests
  const fetchApprovedRequests = useCallback(async () => {
    setIsLoadingApproved(true);
    try {
      const response = await fetch('/api/admin/assistant-requests/approved');
      if (!response.ok) {
        throw new Error('Failed to fetch approved assistant requests');
      }
      const data = await response.json();
      setApprovedRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching approved requests:', error);
      toast.error('Failed to fetch approved assistant requests');
    } finally {
      setIsLoadingApproved(false);
    }
  }, []);

  // Fetch rejected requests
  const fetchRejectedRequests = useCallback(async () => {
    setIsLoadingRejected(true);
    try {
      const response = await fetch('/api/admin/assistant-requests/rejected');
      if (!response.ok) {
        throw new Error('Failed to fetch rejected assistant requests');
      }
      const data = await response.json();
      setRejectedRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching rejected requests:', error);
      toast.error('Failed to fetch rejected assistant requests');
    } finally {
      setIsLoadingRejected(false);
    }
  }, []);

  // Fetch all on mount
  useEffect(() => {
    fetchPendingRequests();
    fetchApprovedRequests();
    fetchRejectedRequests();
  }, [fetchPendingRequests, fetchApprovedRequests, fetchRejectedRequests]);

  // Refresh data after status change
  const refreshAllData = () => {
    fetchPendingRequests();
    fetchApprovedRequests();
    fetchRejectedRequests();
  };

  const updateStatus = async (id: number, status: string) => {
    setIsUpdating(true);
    setUpdatingRequestId(id);
    
    // Optimistically update the UI
    const updateRequestInList = (requests: AssistantRequest[]) => 
      requests.map(req => req.id === id ? { ...req, status: status as any } : req);
    
    const originalPending = [...pendingRequests];
    const originalApproved = [...approvedRequests];
    const originalRejected = [...rejectedRequests];
    
    // Optimistically move the request to the new status
    if (status === 'approved') {
      const request = pendingRequests.find(r => r.id === id) || rejectedRequests.find(r => r.id === id);
      if (request) {
        setPendingRequests(prev => prev.filter(r => r.id !== id));
        setRejectedRequests(prev => prev.filter(r => r.id !== id));
        setApprovedRequests(prev => [...prev, { ...request, status: 'approved' }]);
      }
    } else if (status === 'rejected') {
      const request = pendingRequests.find(r => r.id === id) || approvedRequests.find(r => r.id === id);
      if (request) {
        setPendingRequests(prev => prev.filter(r => r.id !== id));
        setApprovedRequests(prev => prev.filter(r => r.id !== id));
        setRejectedRequests(prev => [...prev, { ...request, status: 'rejected' }]);
      }
    } else if (status === 'pending') {
      const request = approvedRequests.find(r => r.id === id) || rejectedRequests.find(r => r.id === id);
      if (request) {
        setApprovedRequests(prev => prev.filter(r => r.id !== id));
        setRejectedRequests(prev => prev.filter(r => r.id !== id));
        setPendingRequests(prev => [...prev, { ...request, status: 'pending' }]);
      }
    }
    
    try {
      const response = await fetch(`/api/admin/assistant-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Revert optimistic update on error
        setPendingRequests(originalPending);
        setApprovedRequests(originalApproved);
        setRejectedRequests(originalRejected);
        
        const errorMsg = data.message || 'Failed to update status';
        throw new Error(errorMsg);
      }

      toast.success(
        status === 'approved' && data.assigned_assistant_id
          ? `Approved! Assistant created: ${String(data.assigned_assistant_id).slice(0, 8)}…`
          : 'Status updated successfully'
      );

      // Dismiss the notification for this request so it disappears from the bell
      if ((status === 'approved' || status === 'rejected') && user?.id) {
        dismissNotifications(user.id, [`ar-${id}`]);
      }

      // Refresh to get the latest data from server
      setTimeout(() => refreshAllData(), 500);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
      setUpdatingRequestId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRowClick = (request: AssistantRequest) => {
    setSelectedRequest(request);
    setEditedFirstMessage(request.first_message || '');
    setEditedScriptContent(request.script_content || '');
    setIsEditing(false);
    setDetailsDialogOpen(true);
    
    // Fetch voice name if voice_preference is set
    if (request.voice_preference && request.voice_preference !== 'no_preference') {
      fetchVoiceName(request.voice_preference);
    } else {
      setVoiceName('No Preference');
    }
  };

  const fetchVoiceName = async (voicePreference: string) => {
    try {
      // Extract voice ID (format can be "voice_id" or "voice_id|owner_id")
      const voiceId = voicePreference.split('|')[0];
      
      console.log('Fetching voice name for:', voiceId);
      
      const response = await fetch(`/api/voices/available-vapi-voices?include_voice_id=${encodeURIComponent(voiceId)}`);
      
      console.log('Voice API response status:', response.ok);
      
      if (!response.ok) {
        console.error('Failed to fetch voice, using fallback');
        setVoiceName('Custom Voice');
        return;
      }
      
      const data = await response.json();
      console.log('Voice API data:', data);
      
      const voice = data.voices?.find((v: any) => v.id === voiceId);
      
      if (voice) {
        console.log('Found voice:', voice.name);
        setVoiceName(voice.name || 'Custom Voice');
      } else {
        console.log('Voice not found in response');
        setVoiceName('Custom Voice');
      }
    } catch (error) {
      console.error('Error fetching voice name:', error);
      setVoiceName('Custom Voice');
    }
  };

  const saveContentChanges = async () => {
    if (!selectedRequest) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/assistants/requests/${selectedRequest.id}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_message: editedFirstMessage,
          script_content: editedScriptContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      toast.success('Changes saved successfully');
      
      // Update the local state
      setSelectedRequest({
        ...selectedRequest,
        first_message: editedFirstMessage,
        script_content: editedScriptContent
      });
      
      setIsEditing(false);
      refreshAllData();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const formatVoicePreference = (pref?: string) => {
    if (!pref || pref === 'no_preference') return 'No Preference';
    return pref.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const stats = {
    total: pendingRequests.length + approvedRequests.length + rejectedRequests.length,
    pending: pendingRequests.length,
    approved: approvedRequests.length,
    rejected: rejectedRequests.length
  };

  // Render requests table
  const renderRequestsTable = (requests: AssistantRequest[], isLoading: boolean, emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">User</TableHead>
            <TableHead className="text-center">Assistant Name</TableHead>
            <TableHead className="text-center">Type</TableHead>
            <TableHead className="text-center">Language</TableHead>
            <TableHead className="text-center">Description</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Requested</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow
              key={request.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(request)}
            >
              <TableCell className="text-center">
                <div>
                  <div className="font-medium">{request.username || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{request.email}</div>
                </div>
              </TableCell>
              <TableCell className="font-medium text-center">{request.assistant_name}</TableCell>
              <TableCell className="capitalize text-center">{request.assistant_type}</TableCell>
              <TableCell className="uppercase text-center">{request.language}</TableCell>
              <TableCell className="max-w-xs truncate text-center">{request.description || '-'}</TableCell>
              <TableCell className="text-center">{getStatusBadge(request.status)}</TableCell>
              <TableCell className="text-center">{format(new Date(request.created_at), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating && updatingRequestId === request.id}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {updatingRequestId === request.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(request);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {request.status === 'pending' && (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(request.id, 'approved');
                          }}
                          className="text-green-600"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(request.id, 'rejected');
                          }}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(request.id, 'completed');
                        }}
                        className="text-blue-600"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </DropdownMenuItem>
                    )}
                    {request.status !== 'completed' && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(request.id, 'pending');
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Set to Pending
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Assistant Requests"
            description="Manage user requests for new AI assistants"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            disabled={isLoadingPending || isLoadingApproved || isLoadingRejected}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingPending || isLoadingApproved || isLoadingRejected) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <Separator />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${activeTab === 'pending' ? 'ring-2 ring-yellow-400' : 'hover:bg-muted/50'}`}
            onClick={() => setActiveTab('pending')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${activeTab === 'approved' ? 'ring-2 ring-green-400' : 'hover:bg-muted/50'}`}
            onClick={() => setActiveTab('approved')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${activeTab === 'rejected' ? 'ring-2 ring-red-400' : 'hover:bg-muted/50'}`}
            onClick={() => setActiveTab('rejected')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Requests View */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({stats.rejected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>
                  Requests awaiting review and approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRequestsTable(pendingRequests, isLoadingPending, 'No pending requests')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Requests</CardTitle>
                <CardDescription>
                  Requests that have been approved and are being processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRequestsTable(approvedRequests, isLoadingApproved, 'No approved requests')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Requests</CardTitle>
                <CardDescription>
                  Requests that have been declined
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRequestsTable(rejectedRequests, isLoadingRejected, 'No rejected requests')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedRequest?.assistant_name}</DialogTitle>
              <DialogDescription>
                Complete details for this assistant request
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6 py-4 overflow-y-auto overflow-x-hidden flex-1">
                {/* User Info */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-center block">Requested By</Label>
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium break-words text-right">{selectedRequest.username || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium break-all text-right">{selectedRequest.email}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-muted-foreground">Requested:</span>
                        <span className="font-medium">{format(new Date(selectedRequest.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Basic Info */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-center block">Basic Information</Label>
                  <Card className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <span className="text-sm text-muted-foreground block">Type</span>
                        <div className="font-medium capitalize mt-1">{selectedRequest.assistant_type}</div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-muted-foreground block">Language</span>
                        <div className="font-medium uppercase mt-1">{selectedRequest.language}</div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-muted-foreground block">Status</span>
                        <div className="mt-1 flex justify-center">{getStatusBadge(selectedRequest.status)}</div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-muted-foreground block">Voice Preference</span>
                        <div className="font-medium mt-1 break-all px-2">{voiceName || formatVoicePreference(selectedRequest.voice_preference)}</div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* First Message */}
                {(selectedRequest.first_message || isEditing) && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center justify-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      First Message (Opening Greeting)
                    </Label>
                    <Card className="p-4">
                      {isEditing ? (
                        <Textarea
                          value={editedFirstMessage}
                          onChange={(e) => setEditedFirstMessage(e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Enter first message..."
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words text-center">{selectedRequest.first_message}</p>
                      )}
                    </Card>
                  </div>
                )}

                {/* Script Content */}
                {(selectedRequest.script_content || isEditing) && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4" />
                      System Prompt / Script Content
                    </Label>
                    <Card className="p-4 bg-muted/30">
                      {isEditing ? (
                        <Textarea
                          value={editedScriptContent}
                          onChange={(e) => setEditedScriptContent(e.target.value)}
                          className="min-h-[200px] font-mono text-sm"
                          placeholder="Enter script content..."
                        />
                      ) : (
                        <pre className="text-sm font-mono whitespace-pre-wrap break-words text-left overflow-x-auto">{selectedRequest.script_content}</pre>
                      )}
                    </Card>
                  </div>
                )}

                {/* Use Case Description */}
                {selectedRequest.description && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-center block">Use Case Description</Label>
                    <Card className="p-4">
                      <p className="text-sm text-center break-words">{selectedRequest.description}</p>
                    </Card>
                  </div>
                )}

                {/* Additional Notes */}
                {selectedRequest.notes && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-center block">Additional Notes</Label>
                    <Card className="p-4">
                      <p className="text-sm text-center break-words">{selectedRequest.notes}</p>
                    </Card>
                  </div>
                )}

                {/* Uploaded Files */}
                {(() => {
                  const files = (() => {
                    try { return selectedRequest.file_urls ? JSON.parse(selectedRequest.file_urls) : []; }
                    catch { return []; }
                  })();
                  if (!files.length) return null;
                  return (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center justify-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Uploaded Files ({files.length})
                      </Label>
                      <Card className="p-4">
                        <div className="space-y-2">
                          {files.map((file: { name: string; url: string; size: number; format?: string }, i: number) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <span className="text-sm font-medium truncate">{file.name}</span>
                                {file.format && (
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                                    {file.format}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {file.size && (
                                  <span className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(0)} KB
                                  </span>
                                )}
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </Card>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={saveContentChanges}
                        className="flex-1"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditedFirstMessage(selectedRequest.first_message || '');
                          setEditedScriptContent(selectedRequest.script_content || '');
                          setIsEditing(false);
                        }}
                        variant="outline"
                        className="flex-1"
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="flex-1"
                      >
                        Edit Content
                      </Button>
                      {selectedRequest.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => {
                              updateStatus(selectedRequest.id, 'approved');
                              setDetailsDialogOpen(false);
                            }}
                            className="flex-1"
                            variant="default"
                            disabled={isUpdating && updatingRequestId === selectedRequest.id}
                          >
                            {updatingRequestId === selectedRequest.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve Request
                              </>
                            )}
                          </Button>
                      <Button
                        onClick={() => {
                          updateStatus(selectedRequest.id, 'rejected');
                          setDetailsDialogOpen(false);
                        }}
                        className="flex-1"
                        variant="destructive"
                        disabled={isUpdating && updatingRequestId === selectedRequest.id}
                      >
                        {updatingRequestId === selectedRequest.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Request
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {selectedRequest.status === 'approved' && (
                    <Button
                      onClick={() => {
                        updateStatus(selectedRequest.id, 'completed');
                        setDetailsDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>
                  )}
                  {selectedRequest.status === 'rejected' && (
                    <Button
                      onClick={() => {
                        updateStatus(selectedRequest.id, 'pending');
                        setDetailsDialogOpen(false);
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Move Back to Pending
                    </Button>
                  )}
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
