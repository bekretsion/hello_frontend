'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Users,
  Bot,
  MessageSquare,
  Mic,
  Activity,
  FileText,
  Volume2,
  Save,
  Inbox,
  Phone
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateAssistantModal } from '@/components/admin/assistant-management/CreateAssistantModal';
import { AssignAssistantModal } from '@/components/admin/assistant-management/AssignAssistantModal';
import { useVoicePreview } from '@/hooks/use-voice-preview';

interface Assistant {
  id: string; // Vapi assistant ID
  name: string;
  description?: string;
  language?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  voice?: any;
  model?: any;
  transcriber?: any;
  firstMessage?: string;
  endCallMessage?: string;
  recordingEnabled?: boolean;
  // Additional fields from assignment
  assignment_type?: 'inbound' | 'outbound' | 'both';
  is_default?: number;
  assigned_users_count?: number;
  // Provider identifiers
  agent_id?: string; // ElevenLabs agent ID
  vapi_assistant_id?: string; // Vapi assistant ID
}

export default function AssistantsManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<{ el_phone_number_id: string; phone_number: string; assigned_agent_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  // removed unused sync loading state

  // Edit modals
  const [editScriptModalOpen, setEditScriptModalOpen] = useState(false);
  const [editVoiceModalOpen, setEditVoiceModalOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [editForm, setEditForm] = useState({
    scriptContent: '',
    firstMessage: '',
  });
  const [saving, setSaving] = useState(false);
  
  // Voice editing
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const { playVoice, stopVoice, isPlaying } = useVoicePreview();

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch assistants
  const fetchAssistants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assistants/v2?is_active=true&sync_vapi=true', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to fetch assistants:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to fetch assistants');
      }

      const data = await response.json();
      // logs removed
      // Show all assistants (both synced and not synced with Vapi)
      setAssistants(data.assistants || []);
      
      // Show sync status
      if (data.provider === 'elevenlabs') {
        // ElevenLabs mode - no extra toast needed
      } else if (data.vapi_sync_status === 'success') {
        // success status
      } else if (data.vapi_sync_status === 'not_configured') {
        toast.info('Vapi API not configured - showing local data only. Set VAPI_API_KEY to enable Vapi integration.');
      } else if (data.vapi_sync_status === 'failed') {
        toast.warning('Vapi sync failed - showing local data only');
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load assistants');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  const fetchPhoneNumbers = useCallback(async () => {
    try {
      const res = await fetch('/api/el-phone-numbers', {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPhoneNumbers(data.phone_numbers || []);
    } catch {
      // silent — supplementary info
    }
  }, [user?.token]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAssistants();
      fetchPhoneNumbers();
    }
  }, [user, fetchAssistants, fetchPhoneNumbers]);

  // removed unused sync function

  // Filter assistants based on search and filters
  const filteredAssistants = assistants.filter(assistant => {
    const matchesSearch = assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assistant.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assistant.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || assistant.assignment_type === filterType || 
                       (filterType === 'both' && assistant.assignment_type === 'both');
    
    // Vapi-only architecture - all assistants from Vapi are active
    const matchesStatus = filterStatus === 'all' || filterStatus === 'active';

    return matchesSearch && matchesType && matchesStatus;
  });

  // debug logs removed

  // Handle assistant deletion
  const handleDeleteAssistant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assistant? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/assistants/v2/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete assistant');
      }

      toast.success('Assistant deleted successfully');
      fetchAssistants();
    } catch (error) {
      // error
      toast.error('Failed to delete assistant');
    }
  };

  // Fetch available voices from Vapi
  const fetchAvailableVoices = async () => {
    try {
      const response = await fetch('/api/voices/available-vapi-voices', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available voices');
      }

      const data = await response.json();
      // Normalize: ElevenLabs returns voice_id, VAPI returns id
      const voices = (data.voices || []).map((v: any) => ({
        ...v,
        id: v.voice_id || v.id,
        provider: data.source === 'elevenlabs' ? 'elevenlabs' : (v.provider || '11labs'),
        type: v.gender || v.type
      }));
      setAvailableVoices(voices);
    } catch (error) {
      // error
      toast.error('Failed to load available voices');
    }
  };

  // Handle edit script click
  const handleEditScriptClick = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setEditForm({
      scriptContent: assistant.model?.messages?.[0]?.content || '',
      firstMessage: assistant.firstMessage || '',
    });
    setEditScriptModalOpen(true);
  };

  // Handle save script
  const handleSaveScript = async () => {
    if (!editingAssistant) return;

    if (!editForm.scriptContent.trim()) {
      toast.error('Script content is required');
      return;
    }

    try {
      setSaving(true);
      
      // Update assistant directly in Vapi
      const response = await fetch(`/api/assistants/v2/${editingAssistant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          model: {
            provider: editingAssistant.model?.provider || 'openai',
            model: editingAssistant.model?.model || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: editForm.scriptContent
              }
            ]
          },
          firstMessage: editForm.firstMessage || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update script in Vapi');
      }

      toast.success('Script updated in Vapi! 🎉');
      setEditScriptModalOpen(false);
      fetchAssistants();
    } catch (error) {
      // error
      toast.error(error instanceof Error ? error.message : 'Failed to update script');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit voice click
  const handleEditVoiceClick = async (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setSelectedVoiceId(assistant.voice?.voiceId || '');
    setEditVoiceModalOpen(true);
    await fetchAvailableVoices();
  };

  // Handle save voice
  const handleSaveVoice = async () => {
    if (!editingAssistant) return;

    if (!selectedVoiceId) {
      toast.error('Please select a voice');
      return;
    }

    try {
      setSaving(true);
      
      // Find the selected voice details
      const selectedVoice = availableVoices.find(v => v.id === selectedVoiceId);
      
      // Update assistant directly in Vapi
      const response = await fetch(`/api/assistants/v2/${editingAssistant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          voice: {
            provider: selectedVoice?.provider || '11labs',
            voiceId: selectedVoiceId,
            name: selectedVoice?.name || undefined
          }
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update voice in Vapi');
      }

      toast.success('Voice updated in Vapi! 🎤');
      setEditVoiceModalOpen(false);
      fetchAssistants();
    } catch (error) {
      // error
      toast.error(error instanceof Error ? error.message : 'Failed to update voice');
    } finally {
      setSaving(false);
    }
  };


  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inbound': return 'bg-blue-100 text-blue-800';
      case 'outbound': return 'bg-green-100 text-green-800';
      case 'both': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <PageContainer scrollable={true}>
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assistant Management</h1>
          <p className="text-muted-foreground">
            Create and manage AI assistants for your users
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/admin/assistant-requests')}
          >
            <Inbox className="h-4 w-4 mr-2" />
            View Requests
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/admin/assistant-edit-requests')}
          >
            <Inbox className="h-4 w-4 mr-2" />
            Edit Requests
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assistant
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center">
              <Bot className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Assistants</p>
                <p className="text-xl md:text-2xl font-bold">{assistants.length}</p>
                <p className="text-xs text-muted-foreground">
                  From Database
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center">
              <Activity className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Recording Enabled</p>
                <p className="text-xl md:text-2xl font-bold">
                  {assistants.filter(a => a.recordingEnabled).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center">
              <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">With First Message</p>
                <p className="text-xl md:text-2xl font-bold">
                  {assistants.filter(a => a.firstMessage).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center">
              <Mic className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">With Voice Config</p>
                <p className="text-xl md:text-2xl font-bold">
                  {assistants.filter(a => a.voice).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assistants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assistants Grid */}
      {filteredAssistants.length === 0 ? (
        <Card>
          <CardContent className="p-10 md:p-12 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assistants found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first assistant'
              }
            </p>
            {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assistant
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filteredAssistants.map((assistant) => {
            // debug log removed
            return (
            <Card key={assistant.id}>
              <CardHeader className="pb-2 p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg mb-1 truncate">{assistant.name}</CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                      {assistant.description || assistant.firstMessage || 'No description provided'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleEditScriptClick(assistant)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Edit Script
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleEditVoiceClick(assistant)}
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Edit Voice
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedAssistant(assistant);
                          setAssignModalOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Assignments
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteAssistant(assistant.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete from Vapi
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-5 pt-0">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center gap-2">
                    {assistant.assignment_type && (
                      <Badge className={getTypeColor(assistant.assignment_type || 'both')}>
                        {assistant.assignment_type || 'both'}
                      </Badge>
                    )}
                    {assistant.recordingEnabled && (
                      <Badge variant="outline">Recording</Badge>
                    )}
                    {assistant.is_default === 1 && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{assistant.voice?.name || assistant.voice?.voiceId || 'Not set'}</div>
                      <div className="text-muted-foreground">Voice</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{assistant.model?.model || 'N/A'}</div>
                      <div className="text-muted-foreground">Model</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="truncate">ID: {assistant.id}</div>
                    {assistant.language && <div>Language: {assistant.language.toUpperCase()}</div>}
                    <div>Created: {new Date(assistant.createdAt).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${assistant.agent_id ? 'bg-purple-500' : assistant.vapi_assistant_id ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span>{assistant.agent_id ? 'ElevenLabs' : assistant.vapi_assistant_id ? 'Vapi' : 'Local Only'}</span>
                    </div>
                  </div>
                </div>
                {(() => {
                  const assignedPhone = phoneNumbers.find(p => p.assigned_agent_id && p.assigned_agent_id === assistant.agent_id);
                  return assignedPhone ? (
                    <div className="mt-3 flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/50">
                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-mono text-xs font-semibold">{assignedPhone.phone_number}</span>
                      <Badge variant="outline" className="ml-auto text-xs shrink-0">Active</Badge>
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

        {/* Modals */}
        <CreateAssistantModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={fetchAssistants}
        />
        
        {selectedAssistant && (
          <AssignAssistantModal
            open={assignModalOpen}
            onOpenChange={setAssignModalOpen}
            assistant={selectedAssistant}
            onSuccess={fetchAssistants}
          />
        )}

        {/* Edit Script Modal */}
        <Dialog open={editScriptModalOpen} onOpenChange={setEditScriptModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Script Content for {editingAssistant?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>🚀 Direct Vapi Sync:</strong> Changes will be applied directly to Vapi. The script content becomes the assistant&apos;s system prompt.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="edit-script-content">Script Content / System Prompt</Label>
                <Textarea
                  id="edit-script-content"
                  value={editForm.scriptContent}
                  onChange={(e) => setEditForm({ ...editForm, scriptContent: e.target.value })}
                  placeholder="Enter script content..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>This content will be used as the system prompt for your AI assistant in Vapi.</span>
                  <span>{editForm.scriptContent.length} characters</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-first-message">First Message (Optional)</Label>
                <Textarea
                  id="edit-first-message"
                  value={editForm.firstMessage}
                  onChange={(e) => setEditForm({ ...editForm, firstMessage: e.target.value })}
                  placeholder="What should the assistant say when the call starts? (e.g., 'Hello! How can I help you today?')"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This is the greeting message your assistant will say at the start of each call.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditScriptModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveScript}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving & Syncing...' : 'Save & Sync to Vapi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Voice Modal */}
        <Dialog open={editVoiceModalOpen} onOpenChange={setEditVoiceModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Voice for {editingAssistant?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>🎤 Direct Vapi Sync:</strong> Voice changes will be applied directly to Vapi.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="voice-select">Select Voice</Label>
                {availableVoices.length === 0 ? (
                  <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                    Loading voices...
                  </div>
                ) : (
                  <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
                    <SelectTrigger id="voice-select">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center gap-2">
                            <Mic className="h-3 w-3" />
                            <span>{voice.name}</span>
                            {voice.type && (
                              <Badge variant="outline" className="text-xs ml-2">
                                {voice.type}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  {availableVoices.length} voices available from Vapi (11Labs)
                </p>
              </div>

              {/* Test Voice Button */}
              {selectedVoiceId && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const voice = availableVoices.find(v => v.id === selectedVoiceId);
                      if (voice) {
                        if (isPlaying) {
                          stopVoice();
                        } else {
                          playVoice(voice.id, voice.name, voice.provider);
                        }
                      }
                    }}
                    className="w-full"
                  >
                    {isPlaying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Playing... (Click to Stop)
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Test Voice
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditVoiceModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveVoice}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving & Syncing...' : 'Save & Sync to Vapi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
