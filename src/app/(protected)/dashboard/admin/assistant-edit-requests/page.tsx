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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Bot,
  Clock,
  Eye,
  FileText,
  RefreshCw,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth-store';
import { dismissNotifications } from '@/lib/notification-dismissal';

interface AssistantEditRequest {
  id: number;
  user_id: number;
  assistant_id: string;
  assistant_name: string;
  updated_fields: any;
  files?: {
    name: string;
    url: string;
    bytes: number;
    mimeType: string;
  }[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  username?: string;
  email?: string;
}

export default function AssistantEditRequestsPage() {
  const { user } = useAuthStore();
  const [pendingRequests, setPendingRequests] = useState<AssistantEditRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<AssistantEditRequest[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<AssistantEditRequest[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingApproved, setIsLoadingApproved] = useState(true);
  const [isLoadingRejected, setIsLoadingRejected] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssistantEditRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedFirstMessage, setEditedFirstMessage] = useState('');
  const [editedScriptContent, setEditedScriptContent] = useState('');

  const fetchPendingRequests = useCallback(async () => {
    setIsLoadingPending(true);
    try {
      const response = await fetch('/api/admin/assistant-edit-requests/pending');
      if (!response.ok) {
        throw new Error('Failed to fetch pending assistant edit requests');
      }
      const data = await response.json();
      setPendingRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching pending edit requests:', error);
      toast.error('Failed to fetch pending assistant edit requests');
    } finally {
      setIsLoadingPending(false);
    }
  }, []);

  const fetchApprovedRequests = useCallback(async () => {
    setIsLoadingApproved(true);
    try {
      const response = await fetch('/api/admin/assistant-edit-requests/approved');
      if (!response.ok) {
        throw new Error('Failed to fetch approved assistant edit requests');
      }
      const data = await response.json();
      setApprovedRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching approved edit requests:', error);
      toast.error('Failed to fetch approved assistant edit requests');
    } finally {
      setIsLoadingApproved(false);
    }
  }, []);

  const fetchRejectedRequests = useCallback(async () => {
    setIsLoadingRejected(true);
      try {
      const response = await fetch('/api/admin/assistant-edit-requests/rejected');
        if (!response.ok) {
        throw new Error('Failed to fetch rejected assistant edit requests');
        }
        const data = await response.json();
      setRejectedRequests(data.requests || []);
      } catch (error) {
      console.error('Error fetching rejected edit requests:', error);
      toast.error('Failed to fetch rejected assistant edit requests');
      } finally {
      setIsLoadingRejected(false);
      }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
    fetchApprovedRequests();
    fetchRejectedRequests();
  }, [fetchPendingRequests, fetchApprovedRequests, fetchRejectedRequests]);

  const refreshAllData = () => {
    fetchPendingRequests();
    fetchApprovedRequests();
    fetchRejectedRequests();
  };

  const updateStatus = async (id: number, status: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/assistant-edit-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      // Handle different response scenarios
      if (response.status === 207 && data.partialSuccess) {
        // Partial success - voice timed out but other changes applied
        toast.warning('Partial Success', {
          description: data.message || 'Changes applied but voice update timed out. The voice may take a few more seconds to propagate.'
        });
      } else if (response.status === 200) {
        // Full success
        toast.success('Success', {
          description: data.message || 'Status updated successfully'
        });
      }

      // Dismiss the notification for this request so it disappears from the bell
      if ((status === 'approved' || status === 'rejected') && user?.id) {
        dismissNotifications(user.id, [`er-${id}`]);
      }

      refreshAllData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update status'
      });
    } finally {
      setIsUpdating(false);
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

  const handleRowClick = (request: AssistantEditRequest) => {
    setSelectedRequest(request);
    const fields = request.updated_fields || {};
    setEditedFirstMessage(fields.first_message || '');
    setEditedScriptContent(fields.script_content || '');
    setIsEditing(false);
    setDetailsDialogOpen(true);
  };

  const saveContentChanges = async () => {
    if (!selectedRequest) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/assistants/v2/edit-requests/${selectedRequest.id}/content`, {
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
      const updatedFields = { ...selectedRequest.updated_fields };
      updatedFields.first_message = editedFirstMessage;
      updatedFields.script_content = editedScriptContent;
      
      setSelectedRequest({
        ...selectedRequest,
        updated_fields: updatedFields
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

  const stats = {
    total: pendingRequests.length + approvedRequests.length + rejectedRequests.length,
    pending: pendingRequests.length,
    approved: approvedRequests.length,
    rejected: rejectedRequests.length
  };

  const renderRequestsTable = (requests: AssistantEditRequest[], isLoading: boolean, emptyMessage: string) => {
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
            <TableHead className="text-center">Assistant</TableHead>
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
              <TableCell className="font-medium text-center">
                {request.assistant_name}
                <div className="text-xs text-muted-foreground mt-1">
                  ID: {request.assistant_id}
                </div>
                </TableCell>
              <TableCell className="text-center">{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-center">
                {format(new Date(request.created_at), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
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
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
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
            title="Assistant Edit Requests"
            description="Review and manage requested changes to existing assistants"
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Edit Requests</CardTitle>
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
                <CardTitle>Pending Edit Requests</CardTitle>
                <CardDescription>
                  Change requests awaiting review
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRequestsTable(pendingRequests, isLoadingPending, 'No pending edit requests')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Edit Requests</CardTitle>
                <CardDescription>
                  Requests that have been approved
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRequestsTable(approvedRequests, isLoadingApproved, 'No approved edit requests')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Edit Requests</CardTitle>
                <CardDescription>
                  Requests that have been declined
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRequestsTable(rejectedRequests, isLoadingRejected, 'No rejected edit requests')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedRequest?.assistant_name}</DialogTitle>
              <DialogDescription>
                Requested changes for this assistant
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6 py-4 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-center block">Requested By</Label>
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedRequest.username || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{selectedRequest.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Requested:</span>
                        <span className="font-medium">{format(new Date(selectedRequest.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                  <div className="space-y-2">
                  <Label className="text-base font-semibold text-center block">Updated Fields</Label>
                  <Card className="p-4 bg-muted/40">
                    {(() => {
                      // Safely parse updated_fields if it's a string (defensive parsing)
                      let fields = selectedRequest.updated_fields || {};
                      if (typeof selectedRequest.updated_fields === 'string') {
                        try {
                          fields = JSON.parse(selectedRequest.updated_fields);
                        } catch (e) {
                          console.error('Failed to parse updated_fields JSON:', e);
                          fields = {};
                        }
                      }

                      const fieldEntries = Object.entries(fields);
                      if (fieldEntries.length === 0) {
                        return <p className="text-sm text-muted-foreground text-center">No fields updated</p>;
                      }

                      return (
                        <div className="space-y-4">
                          {fields.name && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                              <p className="text-sm">{fields.name}</p>
                            </div>
                          )}
                          {fields.description && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                              <p className="text-sm">{fields.description}</p>
                            </div>
                          )}
                          {(fields.first_message !== undefined || isEditing) && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">First Message</Label>
                              {isEditing ? (
                                <Textarea
                                  value={editedFirstMessage}
                                  onChange={(e) => setEditedFirstMessage(e.target.value)}
                                  className="min-h-[100px]"
                                  placeholder="Enter first message..."
                                />
                              ) : (
                                <p className="text-sm">{fields.first_message}</p>
                              )}
                            </div>
                          )}
                          {fields.endCallMessage && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">End Call Message</Label>
                              <p className="text-sm">{fields.endCallMessage}</p>
                            </div>
                          )}
                          {(fields.script_content !== undefined || isEditing) && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">System Prompt / Script Content</Label>
                              {isEditing ? (
                                <Textarea
                                  value={editedScriptContent}
                                  onChange={(e) => setEditedScriptContent(e.target.value)}
                                  className="min-h-[200px] font-mono text-sm"
                                  placeholder="Enter script content..."
                                />
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{fields.script_content}</p>
                              )}
                            </div>
                          )}
                          {fields.model?.messages?.[0]?.content && !fields.script_content && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">System Prompt</Label>
                              <p className="text-sm whitespace-pre-wrap">{fields.model.messages[0].content}</p>
                            </div>
                          )}
                          {(fields.voice || fields.voice_name) && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">Voice</Label>
                              <p className="text-sm">
                                {fields.voice_name || fields.voice} 
                                {fields.voice_provider && ` (${fields.voice_provider})`}
                              </p>
                            </div>
                          )}
                          {fields.model && !fields.model.messages && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">Model</Label>
                              <p className="text-sm">
                                {fields.model.model} ({fields.model.provider})
                                {fields.model.temperature && ` - Temperature: ${fields.model.temperature}`}
                              </p>
                            </div>
                          )}
                          {fields.transcriber && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">Transcriber</Label>
                              <p className="text-sm">
                                {fields.transcriber.model} ({fields.transcriber.provider})
                                {fields.transcriber.language && ` - ${fields.transcriber.language}`}
                              </p>
                            </div>
                          )}
                          {(fields.silenceTimeoutSeconds !== undefined || fields.maxDurationSeconds !== undefined || fields.backgroundSound !== undefined) && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">Call Settings</Label>
                              <div className="text-sm space-y-1">
                                {fields.silenceTimeoutSeconds !== undefined && (
                                  <p>Silence Timeout: {fields.silenceTimeoutSeconds}s</p>
                                )}
                                {fields.maxDurationSeconds !== undefined && (
                                  <p>Max Duration: {fields.maxDurationSeconds}s</p>
                                )}
                                {fields.backgroundSound !== undefined && (
                                  <p>Background Sound: {fields.backgroundSound}</p>
                                )}
                              </div>
                            </div>
                          )}
                          {fields.endCallPhrases && Array.isArray(fields.endCallPhrases) && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">End Call Phrases</Label>
                              <p className="text-sm">{fields.endCallPhrases.join(', ')}</p>
                            </div>
                          )}
                          {fields.recordingEnabled !== undefined && (
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">Recording</Label>
                              <p className="text-sm">{fields.recordingEnabled ? 'Enabled' : 'Disabled'}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    </Card>
                  </div>

                {(() => {
                  // Safely parse files if it's a string (defensive parsing)
                  let filesArray: any[] = [];
                  if (selectedRequest.files) {
                    if (typeof selectedRequest.files === 'string') {
                      try {
                        filesArray = JSON.parse(selectedRequest.files);
                      } catch (e) {
                        console.error('Failed to parse files JSON:', e);
                        filesArray = [];
                      }
                    } else if (Array.isArray(selectedRequest.files)) {
                      filesArray = selectedRequest.files;
                    }
                  }

                  return filesArray.length > 0 ? (
                  <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        Uploaded PDFs / Documents
                    </Label>
                    <Card className="p-4">
                        <ul className="space-y-2 text-sm">
                          {filesArray.map((file, idx) => (
                            <li key={idx} className="flex items-center justify-between gap-4">
                              <div className="flex-1 truncate">
                                <span className="font-medium">{file.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {file.bytes ? `${(file.bytes / 1024 / 1024).toFixed(2)} MB` : ''}
                            </span>
                              </div>
                              {file.url && (
                                <Button asChild variant="outline" size="sm">
                                  <a href={file.url} target="_blank" rel="noreferrer">
                                    View
                                  </a>
                                </Button>
                              )}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                  ) : null;
                })()}

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
                          const fields = selectedRequest.updated_fields || {};
                          setEditedFirstMessage(fields.first_message || '');
                          setEditedScriptContent(fields.script_content || '');
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
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            Approve Edit
                          </Button>
                      <Button
                        onClick={() => {
                          updateStatus(selectedRequest.id, 'rejected');
                          setDetailsDialogOpen(false);
                        }}
                        className="flex-1"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Edit
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
