'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Eye, Calendar, User, Building, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';

interface OnboardingData {
  id: number;
  user_id: number;
  status: string;
  // User info
  email: string;
  full_name: string;
  company_name: string;
  // Business Info
  role: string;
  organization_number: string;
  industry: string;
  languages: string[];
  websites: string[];
  social_media: string[];
  goals: string[];
  // Assistant Info
  assistant_name: string;
  welcome_message: string;
  voice: string;
  script_files: { url: string; category: string }[];
  faq_files: { url: string; category: string }[];
  automations: string[];
  integrations: string;
  has_api_key: string;
  // Dates
  created_at: string;
  reviewed_at: string;
  reviewed_by: number;
}

export default function OnboardingSubmissionsPage() {
  const [onboardings, setOnboardings] = useState<OnboardingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOnboardings = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all'
        ? '/api/admin/onboarding/all'
        : `/api/admin/onboarding/all?status=${statusFilter}`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch onboarding submissions');
      }

      const data = await response.json();
      setOnboardings(data.onboardings || []);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to load onboarding data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/onboarding/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status Updated', {
        description: `Onboarding status changed to ${newStatus}`,
      });

      fetchOnboardings();
      setDetailsOpen(false);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update status',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Approve user - grants dashboard access
  const approveUser = async (userId: number) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to approve user');
      }

      toast.success('User Approved!', {
        description: 'User now has full dashboard access. Approval email sent.',
      });

      fetchOnboardings();
      setDetailsOpen(false);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to approve user',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Reject user - requires reason
  const rejectUser = async (userId: number) => {
    const reason = prompt('Enter rejection reason (required):');
    if (!reason || reason.trim().length === 0) {
      toast.error('Rejection reason is required');
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reject user');
      }

      toast.success('User Rejected', {
        description: 'Rejection email sent to user.',
      });

      fetchOnboardings();
      setDetailsOpen(false);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to reject user',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      submitted: { label: 'Submitted', variant: 'default' },
      in_review: { label: 'In Review', variant: 'secondary' },
      under_review: { label: 'Under Review', variant: 'secondary' },
      pending: { label: 'Pending', variant: 'secondary' },
      approved: { label: 'Approved', variant: 'default' },
      setup_complete: { label: 'Setup Complete', variant: 'default' },
      rejected: { label: 'Rejected', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const parseJSONField = (field: any) => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return field || [];
  };

  const viewDetails = (onboarding: OnboardingData) => {
    // Parse JSON fields
    const parsed = {
      ...onboarding,
      languages: parseJSONField(onboarding.languages),
      websites: parseJSONField(onboarding.websites),
      social_media: parseJSONField(onboarding.social_media),
      goals: parseJSONField(onboarding.goals),
      script_files: parseJSONField(onboarding.script_files),
      faq_files: parseJSONField(onboarding.faq_files),
      automations: parseJSONField(onboarding.automations),
    };
    setSelectedOnboarding(parsed);
    setDetailsOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Onboarding Submissions</h2>
          <p className="text-muted-foreground">Review and manage new user onboarding requests</p>
        </div>
        <Button onClick={fetchOnboardings} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Filter by Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Submissions</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : onboardings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">No onboarding submissions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {onboardings.map((onboarding) => (
            <Card key={onboarding.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {onboarding.full_name || 'N/A'}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {onboarding.company_name || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {onboarding.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(onboarding.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assistant Name</p>
                    <p className="text-sm">{onboarding.assistant_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Industry</p>
                    <p className="text-sm">{onboarding.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(onboarding.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button onClick={() => viewDetails(onboarding)} size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="!max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <DialogHeader>
            <DialogTitle>User Onboarding Details</DialogTitle>
            <DialogDescription>
              Review all submitted information for {selectedOnboarding?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedOnboarding && (
            <div className="space-y-6">
              {/* SECTION 1: Sign-up Information (Account Creation) */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Sign-up Information
                  <span className="text-xs font-normal text-muted-foreground ml-2">(Account creation)</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Email Address</p>
                    <p className="font-mono text-xs">{selectedOnboarding.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Account Created</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedOnboarding.created_at ? new Date(selectedOnboarding.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Profile Completion Information */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-500" />
                  Profile Completion Information
                  <span className="text-xs font-normal text-muted-foreground ml-2">(Submitted during onboarding)</span>
                </h3>

                {/* Personal Info */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 border-b pb-1">Personal Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Full Name</p>
                      <p>{selectedOnboarding.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Role</p>
                      <p>{selectedOnboarding.role || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 border-b pb-1">Business Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Company Name</p>
                      <p>{selectedOnboarding.company_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Organization Number</p>
                      <p className="font-mono">{selectedOnboarding.organization_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Industry</p>
                      <p>{selectedOnboarding.industry || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Languages</p>
                      <p>{(() => {
                        const langs = selectedOnboarding.languages;
                        if (!langs) return 'N/A';
                        if (Array.isArray(langs)) return langs.join(', ') || 'N/A';
                        if (typeof langs === 'string') {
                          try { return JSON.parse(langs).join(', ') || 'N/A'; } catch { return langs || 'N/A'; }
                        }
                        return 'N/A';
                      })()}</p>
                    </div>
                  </div>
                </div>

                {/* Online Presence */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 border-b pb-1">Online Presence</h4>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Websites</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(() => {
                          const sitesRaw = selectedOnboarding.websites;
                          if (!sitesRaw) return <span className="text-muted-foreground">N/A</span>;
                          let sitesArr: string[];
                          if (typeof sitesRaw === 'string') {
                            try { sitesArr = JSON.parse(sitesRaw); } catch { sitesArr = [sitesRaw]; }
                          } else if (Array.isArray(sitesRaw)) {
                            sitesArr = sitesRaw;
                          } else {
                            return <span className="text-muted-foreground">N/A</span>;
                          }
                          if (sitesArr.length === 0) return <span className="text-muted-foreground">N/A</span>;
                          return sitesArr.map((url: string, i: number) => (
                            <a key={i} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                              {url}
                            </a>
                          ));
                        })()}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Social Media</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(() => {
                          const socialRaw = selectedOnboarding.social_media;
                          if (!socialRaw) return <span className="text-muted-foreground">N/A</span>;
                          let socialArr: string[];
                          if (typeof socialRaw === 'string') {
                            try { socialArr = JSON.parse(socialRaw); } catch { socialArr = [socialRaw]; }
                          } else if (Array.isArray(socialRaw)) {
                            socialArr = socialRaw;
                          } else {
                            return <span className="text-muted-foreground">N/A</span>;
                          }
                          if (socialArr.length === 0) return <span className="text-muted-foreground">N/A</span>;
                          return socialArr.map((url: string, i: number) => (
                            <a key={i} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                              {url}
                            </a>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assistant Configuration Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Assistant Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Assistant Name</p>
                    <p>{selectedOnboarding.assistant_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Voice</p>
                    <p>{selectedOnboarding.voice || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-muted-foreground">Welcome Message</p>
                    <p>{selectedOnboarding.welcome_message || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Script Files</p>
                    <p>{selectedOnboarding.script_files?.length || 0} file(s)</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">FAQ Files</p>
                    <p>{selectedOnboarding.faq_files?.length || 0} file(s)</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-muted-foreground">Automations</p>
                    <p>{selectedOnboarding.automations?.join(', ') || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Integrations Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Integrations</h3>
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">Required Integrations</p>
                  <p>{selectedOnboarding.integrations || 'None specified'}</p>
                </div>
                <div className="mt-2 text-sm">
                  <p className="font-medium text-muted-foreground">API Key Provided</p>
                  <p>{selectedOnboarding.has_api_key === 'yes' ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Update User Review Status</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  This will update the user&apos;s review status and allow/deny dashboard access.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => approveUser(selectedOnboarding.user_id)}
                    disabled={updatingStatus}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve (Grant Dashboard Access)
                  </Button>
                  <Button
                    onClick={() => rejectUser(selectedOnboarding.user_id)}
                    disabled={updatingStatus}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

