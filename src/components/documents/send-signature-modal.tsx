'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { documentsApi } from '@/services/documents.api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SendSignatureModalProps {
    documentId: number | string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface User {
    id: number;
    username: string;
    email: string;
}

export function SendSignatureModal({
    documentId,
    open,
    onOpenChange,
    onSuccess
}: SendSignatureModalProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    // User selection state
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    // Fetch users when modal opens
    useEffect(() => {
        if (open) {
            const fetchUsers = async () => {
                try {
                    setLoadingUsers(true);
                    const response = await fetch('/api/users');
                    const data = await response.json();
                    if (data.users) {
                        setUsers(data.users);
                    }
                } catch (error) {
                    console.error('Failed to fetch users:', error);
                    // Silent error, just don't show users
                } finally {
                    setLoadingUsers(false);
                }
            };
            fetchUsers();
        }
    }, [open]);

    // Handle user selection
    const handleUserSelect = (userId: string) => {
        const user = users.find(u => u.id.toString() === userId);
        if (user) {
            setSelectedUserId(userId);
            setName(user.username || '');
            setEmail(user.email || '');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !name) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            await documentsApi.sendForHelloSign(documentId, {
                recipient_email: email,
                recipient_name: name
            });

            toast.success('Document sent for signature via HelloSign');
            onSuccess();
            onOpenChange(false);
            // Reset form
            setEmail('');
            setName('');
            setSelectedUserId('');
        } catch (error: any) {
            console.error('Failed to send for signature:', error);
            // Extract error message from response
            const errorMessage = error?.response?.data?.message || 
                                error?.message || 
                                'Failed to send document for signature';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Send for Signature</DialogTitle>
                    <DialogDescription>
                        Send this document to a recipient for electronic signature via HelloSign.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* User Selection Dropdown */}
                    <div className="space-y-2">
                        <Label>Select User (Optional)</Label>
                        <Select
                            value={selectedUserId}
                            onValueChange={handleUserSelect}
                            disabled={loadingUsers}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a user"} />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.username} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Recipient Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Recipient Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
