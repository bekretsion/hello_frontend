'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Phone, Plus, Trash2, Link2, Link2Off, Loader2, RefreshCw } from 'lucide-react';

interface ElPhoneNumber {
  el_phone_number_id: string;
  phone_number: string;
  label: string;
  supports_inbound: boolean;
  supports_outbound: boolean;
  assigned_agent_id: string | null;
  assigned_agent_name: string | null;
  provider: string;
}

interface Assistant {
  id: number;
  name: string;
  agent_id: string;
  language: string;
}

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<ElPhoneNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<ElPhoneNumber | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [importForm, setImportForm] = useState({
    phone_number: '',
    label: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    region: '',
  });

  const [assignAgentId, setAssignAgentId] = useState<string>('');

  const fetchPhoneNumbers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/el-phone-numbers', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch phone numbers');
      const data = await res.json();
      setPhoneNumbers(data.phone_numbers || []);
    } catch {
      toast.error('Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssistants = useCallback(async () => {
    try {
      const res = await fetch('/api/assistants/v2', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setAssistants((data.assistants || []).filter((a: Assistant) => !!a.agent_id));
    } catch {}
  }, []);

  useEffect(() => {
    fetchPhoneNumbers();
    fetchAssistants();
  }, [fetchPhoneNumbers, fetchAssistants]);

  const handleImport = async () => {
    const { phone_number, label, twilio_account_sid, twilio_auth_token } = importForm;
    if (!phone_number || !label || !twilio_account_sid || !twilio_auth_token) {
      toast.error('All fields are required');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/el-phone-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(importForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed');
      toast.success('Phone number imported successfully');
      setImportOpen(false);
      setImportForm({ phone_number: '', label: '', twilio_account_sid: '', twilio_auth_token: '', region: '' });
      fetchPhoneNumbers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to import phone number');
    } finally {
      setSubmitting(false);
    }
  };

  const openAssign = (number: ElPhoneNumber) => {
    setSelectedNumber(number);
    setAssignAgentId(number.assigned_agent_id ?? '');
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedNumber) return;
    const agentId = assignAgentId === 'none' || !assignAgentId ? null : assignAgentId;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/el-phone-numbers/${selectedNumber.el_phone_number_id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agent_id: agentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Assignment failed');
      toast.success(data.message);
      setAssignOpen(false);
      fetchPhoneNumbers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign assistant');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (number: ElPhoneNumber) => {
    setSelectedNumber(number);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedNumber) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/el-phone-numbers/${selectedNumber.el_phone_number_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      toast.success('Phone number deleted');
      setDeleteOpen(false);
      setSelectedNumber(null);
      fetchPhoneNumbers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete phone number');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>Phone Numbers</h1>
            <p className='text-muted-foreground text-sm'>
              Import Twilio numbers and assign them to ElevenLabs assistants.
            </p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={fetchPhoneNumbers} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
            </Button>
            <Button onClick={() => setImportOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />Import number
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-4'>
          <Card>
            <CardHeader className='pb-2'><CardTitle className='text-sm font-medium text-gray-500'>Total Numbers</CardTitle></CardHeader>
            <CardContent><p className='text-3xl font-bold'>{phoneNumbers.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'><CardTitle className='text-sm font-medium text-gray-500'>Assigned</CardTitle></CardHeader>
            <CardContent><p className='text-3xl font-bold'>{phoneNumbers.filter(n => n.assigned_agent_id).length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'><CardTitle className='text-sm font-medium text-gray-500'>Unassigned</CardTitle></CardHeader>
            <CardContent><p className='text-3xl font-bold'>{phoneNumbers.filter(n => !n.assigned_agent_id).length}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className='p-0'>
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
              </div>
            ) : phoneNumbers.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <Phone className='mb-4 h-12 w-12 text-gray-300' />
                <p className='font-medium text-gray-600'>No phone numbers yet</p>
                <p className='text-muted-foreground mt-1 text-sm'>Import a Twilio number to get started.</p>
                <Button className='mt-4' onClick={() => setImportOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' />Import number
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Assistant</TableHead>
                    <TableHead>Capabilities</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phoneNumbers.map(number => (
                    <TableRow key={number.el_phone_number_id}>
                      <TableCell className='font-mono font-medium'>{number.phone_number}</TableCell>
                      <TableCell>{number.label}</TableCell>
                      <TableCell>
                        {number.assigned_agent_name ? (
                          <Badge variant='outline' className='border-green-300 text-green-700'>
                            {number.assigned_agent_name}
                          </Badge>
                        ) : (
                          <span className='text-muted-foreground text-sm'>Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-1'>
                          {number.supports_inbound && <Badge variant='secondary' className='text-xs'>Inbound</Badge>}
                          {number.supports_outbound && <Badge variant='secondary' className='text-xs'>Outbound</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button variant='outline' size='sm' onClick={() => openAssign(number)}>
                            {number.assigned_agent_id
                              ? <><Link2Off className='mr-1 h-3 w-3' />Reassign</>
                              : <><Link2 className='mr-1 h-3 w-3' />Assign</>}
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='text-red-600 hover:border-red-300 hover:text-red-700'
                            onClick={() => confirmDelete(number)}
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'><Phone className='h-5 w-5' />Import phone number from Twilio</DialogTitle>
            <DialogDescription>ElevenLabs will automatically configure the Twilio webhook.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-1.5'>
              <Label>Label</Label>
              <Input placeholder='e.g. Support Line' value={importForm.label} onChange={e => setImportForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div className='space-y-1.5'>
              <Label>Phone number</Label>
              <Input placeholder='+15551234567' value={importForm.phone_number} onChange={e => setImportForm(f => ({ ...f, phone_number: e.target.value }))} />
            </div>
            <div className='space-y-1.5'>
              <Label>Twilio Account SID</Label>
              <Input placeholder='ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' value={importForm.twilio_account_sid} onChange={e => setImportForm(f => ({ ...f, twilio_account_sid: e.target.value }))} />
            </div>
            <div className='space-y-1.5'>
              <Label>Twilio Auth Token</Label>
              <Input type='password' placeholder='Your Twilio auth token' value={importForm.twilio_auth_token} onChange={e => setImportForm(f => ({ ...f, twilio_auth_token: e.target.value }))} />
              <p className='text-muted-foreground text-xs'>Used only for this import. Not stored after submission.</p>
            </div>
            <div className='space-y-1.5'>
              <Label>Region (optional)</Label>
              <Select value={importForm.region || 'default'} onValueChange={v => setImportForm(f => ({ ...f, region: v === 'default' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder='Auto (recommended)' /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='default'>Auto (recommended)</SelectItem>
                  <SelectItem value='us1'>US (us1)</SelectItem>
                  <SelectItem value='ie1'>Europe / Ireland (ie1)</SelectItem>
                  <SelectItem value='au1'>Australia (au1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={submitting}>
              {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Assign assistant</DialogTitle>
            <DialogDescription>{selectedNumber?.phone_number} — {selectedNumber?.label}</DialogDescription>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <Label>Select assistant</Label>
            <Select value={assignAgentId || 'none'} onValueChange={setAssignAgentId}>
              <SelectTrigger><SelectValue placeholder='Select an assistant' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>— Unassign —</SelectItem>
                {assistants.map(a => (
                  <SelectItem key={a.agent_id} value={a.agent_id}>
                    {a.name}{a.language && <span className='text-muted-foreground ml-2 text-xs uppercase'>{a.language}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assistants.length === 0 && (
              <p className='text-muted-foreground text-xs'>No ElevenLabs assistants found. Create one first.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={submitting}>
              {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete phone number</DialogTitle>
            <DialogDescription>
              This will remove <strong>{selectedNumber?.phone_number}</strong> ({selectedNumber?.label}) from ElevenLabs and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant='destructive' onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
