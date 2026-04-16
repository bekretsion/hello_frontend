'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Phone,
  UserPlus,
  UserMinus,
  PhoneCall,
  Filter
} from 'lucide-react';

interface PhoneNumber {
  id: number;
  phone_number: string;
  provider: 'twilio' | 'telnyx' | 'vapi' | 'other';
  provider_number_id: string | null;
  country_code: string;
  assigned_user_id: number | null;
  assigned_user_name: string | null;
  assigned_user_email: string | null;
  is_active: boolean;
  notes: string | null;
  created_by_name: string;
  assistants_count: number;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface PhoneRequest {
  id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
  email?: string;
}

export default function PhoneNumbersManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [phoneRequests, setPhoneRequests] = useState<PhoneRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<PhoneNumber | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PhoneRequest | null>(null);
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);
  const [updatingRequest, setUpdatingRequest] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    phone_number: '',
    provider: 'twilio' as 'twilio' | 'telnyx' | 'vapi' | 'other',
    provider_number_id: '',
    country_code: '+1',
    assigned_user_id: '',
    notes: ''
  });

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  const fetchPhoneRequests = async () => {
    try {
      const response = await fetch('/api/admin/phone-requests/pending');
      if (response.ok) {
        const data = await response.json();
        setPhoneRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching phone requests:', error);
      toast.error('Failed to load requested phones');
    }
  };

  // Fetch phone numbers
  const fetchPhoneNumbers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phonenumbers/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPhoneNumbers(data.phoneNumbers || []);
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for assignment
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/non-admins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPhoneNumbers();
      fetchUsers();
      fetchPhoneRequests();
    }
  }, [user]);

  // Create phone number
  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phonenumbers/admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          assigned_user_id: formData.assigned_user_id ? parseInt(formData.assigned_user_id) : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Phone number added successfully');
        setCreateModalOpen(false);
        fetchPhoneNumbers();
        resetForm();
      } else {
        toast.error(data.message || 'Failed to add phone number');
      }
    } catch (error) {
      console.error('Error creating phone number:', error);
      toast.error('An error occurred');
    }
  };

  // Update phone number
  const handleUpdate = async () => {
    if (!selectedPhoneNumber) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phonenumbers/admin/${selectedPhoneNumber.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          assigned_user_id: formData.assigned_user_id ? parseInt(formData.assigned_user_id) : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Phone number updated successfully');
        setEditModalOpen(false);
        fetchPhoneNumbers();
        resetForm();
      } else {
        toast.error(data.message || 'Failed to update phone number');
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast.error('An error occurred');
    }
  };

  // Assign phone number
  const handleAssign = async (userId: number) => {
    if (!selectedPhoneNumber) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phonenumbers/admin/${selectedPhoneNumber.id}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Phone number assigned successfully');
        setAssignModalOpen(false);
        fetchPhoneNumbers();
      } else {
        toast.error(data.message || 'Failed to assign phone number');
      }
    } catch (error) {
      console.error('Error assigning phone number:', error);
      toast.error('An error occurred');
    }
  };

  // Unassign phone number
  const handleUnassign = async (phoneNumberId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phonenumbers/admin/${phoneNumberId}/unassign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Phone number unassigned successfully');
        fetchPhoneNumbers();
      } else {
        toast.error(data.message || 'Failed to unassign phone number');
      }
    } catch (error) {
      console.error('Error unassigning phone number:', error);
      toast.error('An error occurred');
    }
  };

  // Delete phone number
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phonenumbers/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Phone number deleted successfully');
        fetchPhoneNumbers();
      } else {
        toast.error(data.message || 'Failed to delete phone number');
      }
    } catch (error) {
      console.error('Error deleting phone number:', error);
      toast.error('An error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      phone_number: '',
      provider: 'twilio',
      provider_number_id: '',
      country_code: '+1',
      assigned_user_id: '',
      notes: ''
    });
    setSelectedPhoneNumber(null);
  };

  const openEditModal = (phoneNumber: PhoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
    setFormData({
      phone_number: phoneNumber.phone_number,
      provider: phoneNumber.provider,
      provider_number_id: phoneNumber.provider_number_id || '',
      country_code: phoneNumber.country_code,
      assigned_user_id: phoneNumber.assigned_user_id?.toString() || '',
      notes: phoneNumber.notes || ''
    });
    setEditModalOpen(true);
  };

  const openAssignModal = (phoneNumber: PhoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
    setAssignModalOpen(true);
  };

  // Filter phone numbers
  const filteredPhoneNumbers = phoneNumbers.filter(pn => {
    const matchesSearch = pn.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pn.assigned_user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = filterProvider === 'all' || pn.provider === filterProvider;
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'assigned' && pn.assigned_user_id !== null) ||
                          (filterStatus === 'unassigned' && pn.assigned_user_id === null);
    return matchesSearch && matchesProvider && matchesStatus;
  });

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  const stats = {
    total: phoneNumbers.length,
    assigned: phoneNumbers.filter(pn => pn.assigned_user_id !== null).length,
    unassigned: phoneNumbers.filter(pn => pn.assigned_user_id === null).length,
    inUse: phoneNumbers.filter(pn => pn.assistants_count > 0).length
  };

  return (
    <PageContainer scrollable={true}>
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Phone Number Management</h1>
            <p className="text-muted-foreground">
              Manage phone numbers for customer assistants
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchPhoneRequests();
                setRequestsDialogOpen(true);
              }}
            >
              <PhoneCall className="h-4 w-4 mr-2" />
              Requested Phones
            </Button>
            <Button onClick={() => { resetForm(); setCreateModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Phone Number
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unassigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inUse}</div>
            </CardContent>
          </Card>

        {/* Requested Phones Dialog */}
        <Dialog open={requestsDialogOpen} onOpenChange={setRequestsDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Requested Phone Numbers</DialogTitle>
              <DialogDescription>
                Approve requests and optionally assign a phone number to the user.
              </DialogDescription>
            </DialogHeader>

            {phoneRequests.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No pending phone number requests.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phoneRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{request.username || 'Unknown'}</div>
                      </TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingRequest}
                          onClick={async () => {
                            try {
                              setUpdatingRequest(true);
                              const response = await fetch(
                                `/api/admin/phone-requests/${request.id}/status`,
                                {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'approved' })
                                }
                              );
                              const data = await response.json();
                              if (!response.ok) {
                                throw new Error(data.message || 'Failed to approve request');
                              }
                              toast.success('Phone request approved');
                              fetchPhoneRequests();
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to approve request');
                            } finally {
                              setUpdatingRequest(false);
                            }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            // Open assign modal and pre-select this user
                            const matchingUser = users.find(
                              (u) => u.email === request.email
                            );
                            if (matchingUser) {
                              // Ensure there's a selected phone number before assigning
                              if (!selectedPhoneNumber) {
                                toast.error(
                                  'Select a phone number from the table to assign first.'
                                );
                                return;
                              }
                              setAssignModalOpen(true);
                            } else {
                              toast.error(
                                'User not found in users list. Please create the user first.'
                              );
                            }
                          }}
                        >
                          Assign Phone
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search phone numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="telnyx">Telnyx</SelectItem>
                  <SelectItem value="vapi">Vapi</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Phone Numbers Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Assistants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPhoneNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No phone numbers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPhoneNumbers.map((phoneNumber) => (
                    <TableRow key={phoneNumber.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {phoneNumber.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {phoneNumber.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {phoneNumber.assigned_user_name ? (
                          <div>
                            <div className="font-medium">{phoneNumber.assigned_user_name}</div>
                            <div className="text-sm text-muted-foreground">{phoneNumber.assigned_user_email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {phoneNumber.assistants_count > 0 ? (
                          <Badge variant="secondary">
                            {phoneNumber.assistants_count} {phoneNumber.assistants_count === 1 ? 'assistant' : 'assistants'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={phoneNumber.is_active ? "default" : "secondary"}
                          className={phoneNumber.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                        >
                          {phoneNumber.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(phoneNumber)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {phoneNumber.assigned_user_id ? (
                              <DropdownMenuItem onClick={() => handleUnassign(phoneNumber.id)}>
                                <UserMinus className="h-4 w-4 mr-2" />
                                Unassign
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openAssignModal(phoneNumber)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign to Customer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(phoneNumber.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        <Dialog open={createModalOpen || editModalOpen} onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false);
            setEditModalOpen(false);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editModalOpen ? 'Edit Phone Number' : 'Add Phone Number'}</DialogTitle>
              <DialogDescription>
                {editModalOpen ? 'Update phone number details' : 'Add a new phone number to the system'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">Provider *</Label>
                  <Select 
                    value={formData.provider} 
                    onValueChange={(value: any) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="telnyx">Telnyx</SelectItem>
                      <SelectItem value="vapi">Vapi</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country_code">Country Code</Label>
                  <Input
                    id="country_code"
                    placeholder="+1"
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="provider_number_id">Provider Number ID</Label>
                <Input
                  id="provider_number_id"
                  placeholder="Provider-specific ID (optional)"
                  value={formData.provider_number_id}
                  onChange={(e) => setFormData({ ...formData, provider_number_id: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="assigned_user">Assign to Customer (Optional)</Label>
                <Select 
                  value={formData.assigned_user_id} 
                  onValueChange={(value) => setFormData({ ...formData, assigned_user_id: value })}
                >
                  <SelectTrigger id="assigned_user">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- None --</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional notes about this number"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={editModalOpen ? handleUpdate : handleCreate}>
                {editModalOpen ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Modal */}
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Phone Number</DialogTitle>
              <DialogDescription>
                Assign {selectedPhoneNumber?.phone_number} to a customer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {users.map((user) => (
                <Card key={user.id} className="cursor-pointer hover:bg-accent" onClick={() => handleAssign(user.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}

