'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Crown,
  MessageSquare,
  FileText,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Script {
  id: number;
  name: string;
  content: string;
  script_type: string;
  is_default: boolean;
  is_active: boolean;
  created_by_name: string;
  created_at: string;
  is_applied_to_vapi?: boolean;
}

interface Assistant {
  id: number;
  name: string;
  vapi_assistant_id?: string;
}

export default function ScriptsManagementPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    content: '',
    script_type: 'custom',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch scripts for this assistant
  const fetchScripts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assistants/${params.id}/scripts`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scripts');
      }

      const data = await response.json();
      setScripts(data.scripts || []);
      setAssistant(data.assistant);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast.error('Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && params.id) {
      fetchScripts();
    }
  }, [user, params.id]);

  // Filter scripts based on search
  const filteredScripts = scripts.filter(script =>
    script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    script.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScriptTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-orange-100 text-orange-800';
      case 'onboarding': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSetDefault = async (scriptId: number) => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to set default script');
      }

      toast.success('Default script updated successfully');
      fetchScripts();
    } catch (error) {
      console.error('Error setting default script:', error);
      toast.error('Failed to set default script');
    }
  };

  const handleDeleteScript = async (scriptId: number, scriptName: string) => {
    if (!confirm(`Are you sure you want to delete the script "${scriptName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete script');
      }

      toast.success('Script deleted successfully');
      fetchScripts();
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete script');
    }
  };

  const handleEditClick = (script: Script) => {
    setEditingScript(script);
    setEditForm({
      name: script.name,
      content: script.content,
      script_type: script.script_type,
      is_active: script.is_active
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingScript) return;

    if (!editForm.name.trim() || !editForm.content.trim()) {
      toast.error('Name and content are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/scripts/${editingScript.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update script');
      }

      const data = await response.json();
      
      // Show appropriate success message based on Vapi sync status
      if (data.vapi_sync_status === 'success') {
        toast.success('Script updated and synced to Vapi! 🎉');
      } else if (data.vapi_sync_status === 'failed') {
        toast.warning('Script updated locally, but failed to sync to Vapi');
      } else {
        toast.success('Script updated successfully');
      }

      setEditModalOpen(false);
      fetchScripts();
    } catch (error) {
      console.error('Error updating script:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update script');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/admin/assistants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assistants
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Scripts Management</h1>
          <p className="text-muted-foreground">
            Manage scripts for {assistant?.name || 'Assistant'}
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/admin/assistants/${params.id}/scripts/create`)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Script
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>✨ Auto-Sync Enabled:</strong> When you edit or mark a script as "default", it automatically syncs to Vapi! 
          The script's content becomes the assistant's system prompt in Vapi, so your voice assistant will use the updated prompt immediately.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search scripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scripts List */}
      {filteredScripts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scripts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'This assistant doesn\'t have any scripts yet'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => router.push(`/dashboard/admin/assistants/${params.id}/scripts/create`)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Script
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredScripts.map((script) => (
            <Card key={script.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 flex items-center gap-2">
                      {script.name}
                      {script.is_default && (
                        <span title="Default script">
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getScriptTypeColor(script.script_type)}>
                        {script.script_type}
                      </Badge>
                      <Badge variant={script.is_active ? "default" : "secondary"}>
                        {script.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleEditClick(script)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Script
                      </DropdownMenuItem>
                      {!script.is_default && (
                        <DropdownMenuItem onClick={() => handleSetDefault(script.id)}>
                          <Crown className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDeleteScript(script.id, script.name)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {script.content}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <div>Created by: {script.created_by_name}</div>
                    <div>Created: {new Date(script.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Script Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Script</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Script Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter script name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-type">Script Type</Label>
              <Select 
                value={editForm.script_type} 
                onValueChange={(value) => setEditForm({ ...editForm, script_type: value })}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select script type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Script Content</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Enter script content..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This content will be used as the system prompt for the AI assistant.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-active" className="text-sm font-normal cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
