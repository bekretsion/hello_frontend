'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Users, Search, UserX, UserCheck, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Assistant {
  id: string; // Vapi assistant ID (string)
  name: string;
  assignment_type?: 'inbound' | 'outbound' | 'both'; // Optional, from Vapi
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  assigned_users_count?: number;
}

interface AssignedUser {
  id: number;
  username: string;
  email: string;
  role: string;
  assignment_type: string;
  is_default: boolean;
  assigned_at: string;
  assigned_by_name: string;
}

interface AssignAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: Assistant;
  onSuccess: () => void;
}

export function AssignAssistantModal({ open, onOpenChange, assistant, onSuccess }: AssignAssistantModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [assignmentType, setAssignmentType] = useState<'inbound' | 'outbound' | 'both'>('both');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'assign' | 'manage'>('assign');
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Utility function for assignment type colors
  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case 'inbound': return 'bg-blue-100 text-blue-800';
      case 'outbound': return 'bg-green-100 text-green-800';
      case 'both': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch available users and assigned users
  const fetchData = async () => {
    setFetchingUsers(true);
    try {
      // Fetch all users (for assignment)
      const usersResponse = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setAvailableUsers(usersData.users?.filter((u: User) => u.role !== 'admin') || []);
      } else {
        console.error('Failed to fetch users:', usersResponse.status);
        toast.error('Failed to load users');
      }

      // Fetch assigned users for this assistant
      const assignedResponse = await fetch(`/api/assistants/v2/${assistant.id}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (assignedResponse.ok) {
        const assignedData = await assignedResponse.json();
        setAssignedUsers(assignedData.assistant?.assigned_users || []);
      } else {
        console.error('Failed to fetch assigned users:', assignedResponse.status);
        toast.error('Failed to load assigned users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load user data');
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
      setSelectedUsers([]);
      setSearchTerm('');
      setActiveTab('assign');
    }
  }, [open, assistant.id]);

  // Filter available users (exclude already assigned)
  const filteredAvailableUsers = availableUsers
    .filter(u => !assignedUsers.some(au => au.id === u.id))
    .filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Filter assigned users for search
  const filteredAssignedUsers = assignedUsers.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle user selection
  const handleUserSelect = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Handle assignment
  const handleAssignUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to assign');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/assistants/v2/${assistant.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          user_ids: selectedUsers,
          assignment_type: assignmentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign users');
      }

      toast.success(data.message);
      await fetchData(); // Refresh data
      setSelectedUsers([]);
      onSuccess();
    } catch (error) {
      console.error('Error assigning users:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign users');
    } finally {
      setLoading(false);
    }
  };

  // Handle unassignment
  const handleUnassignUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to unassign ${username} from this assistant?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/assistants/v2/${assistant.id}/unassign/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to unassign user');
      }

      toast.success(`${username} has been unassigned from this assistant`);
      await fetchData(); // Refresh data
      onSuccess();
    } catch (error) {
      console.error('Error unassigning user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unassign user');
    }
  };

  // Handle setting default
  const handleSetDefault = async (userId: number, username: string) => {
    try {
      const response = await fetch(`/api/assistants/v2/${assistant.id}/set-default/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to set default assistant');
      }

      toast.success(`${assistant.name} is now the default assistant for ${username}`);
      await fetchData(); // Refresh data
      onSuccess();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set default assistant');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Users - {assistant.name}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'assign' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('assign')}
          >
            Assign Users ({filteredAvailableUsers.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'manage' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('manage')}
          >
            Assigned Users ({assignedUsers.length})
          </button>
        </div>

        {fetchingUsers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {activeTab === 'assign' ? (
              <>
                {/* Assignment Type Selection */}
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <Select 
                    value={assignmentType} 
                    onValueChange={(value: 'inbound' | 'outbound' | 'both') => setAssignmentType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both (Inbound & Outbound)</SelectItem>
                      <SelectItem value="inbound">Inbound Only</SelectItem>
                      <SelectItem value="outbound">Outbound Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Available Users */}
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {filteredAvailableUsers.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <UserCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            {searchTerm 
                              ? 'No users found matching your search'
                              : 'All users are already assigned to this assistant'
                            }
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredAvailableUsers.map((availableUser) => (
                        <Card key={availableUser.id} className="p-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedUsers.includes(availableUser.id)}
                              onCheckedChange={(checked) => 
                                handleUserSelect(availableUser.id, checked as boolean)
                              }
                            />
                            <div className="flex-1">
                              <div className="font-medium">{availableUser.username}</div>
                              <div className="text-sm text-muted-foreground">
                                {availableUser.email}
                              </div>
                            </div>
                            <Badge variant="outline">{availableUser.role}</Badge>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              /* Assigned Users */
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {filteredAssignedUsers.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <UserX className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          {searchTerm 
                            ? 'No assigned users found matching your search'
                            : 'No users are assigned to this assistant yet'
                          }
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredAssignedUsers.map((assignedUser) => (
                      <Card key={assignedUser.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{assignedUser.username}</span>
                                {assignedUser.is_default && (
                                  <span title="Default assistant for this user">
                                    <Crown className="h-4 w-4 text-yellow-500" />
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {assignedUser.email}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{assignedUser.role}</Badge>
                                <Badge className={getAssignmentTypeColor(assignedUser.assignment_type)}>
                                  {assignedUser.assignment_type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!assignedUser.is_default && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetDefault(assignedUser.id, assignedUser.username)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnassignUser(assignedUser.id, assignedUser.username)}
                            >
                              Unassign
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {activeTab === 'assign' && selectedUsers.length > 0 && (
            <Button onClick={handleAssignUsers} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Selected ({selectedUsers.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}