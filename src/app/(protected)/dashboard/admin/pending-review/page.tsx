'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    CheckCircle, XCircle, Clock, User, Building2, Mail, Phone,
    Briefcase, RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PendingUser {
    id: number;
    email: string;
    fullName: string;
    companyName: string;
    phoneNumber: string;
    role: string;
    businessName: string;
    industry: string;
    submittedAt: string;
    rejectionCount: number;
}

export default function AdminReviewPage() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState<number | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const response = await fetch('/api/admin/pending-review');
            if (response.ok) {
                const data = await response.json();
                setPendingUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch pending users:', error);
            toast.error('Failed to load pending users');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: number) => {
        setActionLoading(userId);
        try {
            const response = await fetch(`/api/admin/users/${userId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to approve user');
            }

            toast.success('User approved successfully!', {
                description: 'An approval email has been sent to the user.'
            });

            // Remove from list
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            toast.error('Failed to approve user', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setActionLoading(null);
        }
    };

    const openRejectDialog = (user: PendingUser) => {
        setSelectedUser(user);
        setRejectionReason('');
        setRejectDialogOpen(true);
    };

    const handleReject = async () => {
        if (!selectedUser || !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        setActionLoading(selectedUser.id);
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to reject user');
            }

            toast.success('User rejected', {
                description: 'A rejection email has been sent to the user.'
            });

            // Remove from list
            setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setRejectDialogOpen(false);
        } catch (error) {
            toast.error('Failed to reject user', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#83d2df]" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Reviews</h1>
                    <p className="text-gray-600">Review and manage pending user applications</p>
                </div>
                <Button variant="outline" onClick={fetchPendingUsers}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-amber-100">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingUsers.length}</p>
                            <p className="text-sm text-gray-600">Pending Reviews</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Users List */}
            {pendingUsers.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
                        <p className="text-gray-600">No pending user reviews at the moment.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {pendingUsers.map((user) => (
                        <Card key={user.id} className="overflow-hidden">
                            <CardHeader
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-full bg-[#83d2df]/10">
                                            <User className="w-5 h-5 text-[#83d2df]" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{user.fullName || 'No Name'}</CardTitle>
                                            <p className="text-sm text-gray-600">{user.email}</p>
                                        </div>
                                        {user.rejectionCount > 0 && (
                                            <Badge variant="destructive" className="ml-2">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Previously rejected ({user.rejectionCount}x)
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Pending
                                        </Badge>
                                        {expandedUser === user.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {expandedUser === user.id && (
                                <CardContent className="border-t bg-gray-50 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Company</p>
                                                <p className="font-medium">{user.companyName || user.businessName || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Role</p>
                                                <p className="font-medium capitalize">{user.role || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Phone</p>
                                                <p className="font-medium">{user.phoneNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Industry</p>
                                                <p className="font-medium">{user.industry || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 justify-end">
                                        <Button
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                            onClick={() => openRejectDialog(user)}
                                            disabled={actionLoading === user.id}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprove(user.id)}
                                            disabled={actionLoading === user.id}
                                        >
                                            {actionLoading === user.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Approve
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject User Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting {selectedUser?.fullName || 'this user'}&apos;s application.
                            This will be sent to them via email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionReason.trim() || actionLoading !== null}
                        >
                            {actionLoading !== null ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Reject User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
