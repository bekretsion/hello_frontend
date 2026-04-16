'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ProjectTimeline from '@/components/project/project-timeline';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Target,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface ProjectDetail {
  id: number;
  customer_id: number;
  customer_user_id: number;
  project_name: string;
  project_type: string;
  status: string;
  priority: string;
  assigned_team_members: number[];
  project_manager_id: number | null;
  start_date: string;
  target_completion_date: string;
  actual_completion_date: string | null;
  budget: number;
  actual_cost: number;
  description: string;
  requirements: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  project_manager_name: string | null;
  project_manager_email: string | null;
  team_members_details: TeamMember[];
  milestones: Milestone[];
}

interface TeamMember {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Milestone {
  id: number;
  milestone_name: string;
  description: string;
  due_date: string;
  completed_date: string | null;
  status: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  checklist_items: ChecklistItem[];
  completion_percentage: number;
  is_critical: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  testing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  on_hold: 'bg-gray-100 text-gray-800'
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const milestoneStatusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProjectDetail>>({});
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);

  // Milestone management state
  const [isCreateMilestoneOpen, setIsCreateMilestoneOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    milestone_name: '',
    description: '',
    due_date: '',
    assigned_to: 'unassigned',
    is_critical: false
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectDetail();
    }
  }, [projectId]);

  const fetchProjectDetail = async () => {
    try {
      setLoading(true);

      // Fetch project details and team members in parallel
      const [projectResponse, teamResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}?t=${Date.now()}`, { cache: 'no-store' }),
        fetch('/api/projects/team-members', { cache: 'no-store' })
      ]);

      if (!projectResponse.ok) {
        if (projectResponse.status === 404) {
          toast.error('Project not found');
          router.push('/dashboard/admin/projects');
          return;
        }
        throw new Error('Failed to fetch project details');
      }

      const projectData = await projectResponse.json();
      setProject(projectData.data);
      setEditForm(projectData.data);

      // Fetch team members for milestone assignment
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setAllTeamMembers(teamData.data || []);
      } else {
        console.error('Failed to fetch team members:', teamResponse.status);
        setAllTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching project detail:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      toast.success('Project updated successfully');
      setEditing(false);
      fetchProjectDetail();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'on_hold': return <Pause className="h-4 w-4" />;
      case 'planning': return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    const rounded = Math.round(amount);
    const formatted = rounded.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return `${formatted},-kr`;
  };

  // Milestone management functions
  const resetMilestoneForm = () => {
    setMilestoneForm({
      milestone_name: '',
      description: '',
      due_date: '',
      assigned_to: 'unassigned',
      is_critical: false
    });
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/projects/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          ...milestoneForm,
          assigned_to: milestoneForm.assigned_to === "unassigned" ? null : milestoneForm.assigned_to
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Milestone created successfully');
        setIsCreateMilestoneOpen(false);
        resetMilestoneForm();
        fetchProjectDetail(); // Refresh project data
      } else {
        throw new Error(data.message || 'Failed to create milestone');
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error('Failed to create milestone');
    }
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      milestone_name: milestone.milestone_name,
      description: milestone.description || '',
      due_date: milestone.due_date ? milestone.due_date.split('T')[0] : '',
      assigned_to: milestone.assigned_to ? milestone.assigned_to.toString() : 'unassigned',
      is_critical: milestone.is_critical
    });
    setIsCreateMilestoneOpen(true);
  };

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMilestone) return;

    try {
      const response = await fetch(`/api/projects/milestones/${editingMilestone.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...milestoneForm,
          assigned_to: milestoneForm.assigned_to === "unassigned" ? null : milestoneForm.assigned_to
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Milestone updated successfully');
        setIsCreateMilestoneOpen(false);
        setEditingMilestone(null);
        resetMilestoneForm();
        fetchProjectDetail(); // Refresh project data
      } else {
        throw new Error(data.message || 'Failed to update milestone');
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/milestones/${milestoneId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Milestone deleted successfully');
        fetchProjectDetail(); // Refresh project data
      } else {
        throw new Error(data.message || 'Failed to delete milestone');
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete milestone');
    }
  };

  const handleMilestoneStatusUpdate = async (milestoneId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Milestone status updated');
        fetchProjectDetail(); // Refresh project data
      } else {
        throw new Error(data.message || 'Failed to update milestone status');
      }
    } catch (error) {
      console.error('Error updating milestone status:', error);
      toast.error('Failed to update milestone status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/dashboard/admin/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className="w-full max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/admin/projects')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                {getStatusIcon(project.status)}
                <h1 className="text-2xl font-bold">{project.project_name}</h1>
                <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                  {project.status.replace('_', ' ')}
                </Badge>
                <Badge className={priorityColors[project.priority as keyof typeof priorityColors]}>
                  {project.priority}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {project.company_name} • Created {formatDate(project.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {editing ? (
              <>
                <Button onClick={handleSaveProject}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{project.progress_percentage}%</span>
              </div>
              <Progress value={project.progress_percentage} className="w-full" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{project.milestones?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Milestones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {project.milestones?.filter(m => m.status === 'completed').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {project.milestones?.filter(m => m.status === 'in_progress').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {project.milestones?.filter(m => m.status === 'blocked').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Blocked</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Project Details */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editing ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="project_name">Project Name</Label>
                            <Input
                              id="project_name"
                              value={editForm.project_name || ''}
                              onChange={(e) => setEditForm({ ...editForm, project_name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="project_type">Type</Label>
                            <Select value={editForm.project_type} onValueChange={(value) => setEditForm({ ...editForm, project_type: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="onboarding">Onboarding</SelectItem>
                                <SelectItem value="integration">Integration</SelectItem>
                                <SelectItem value="custom_development">Custom Development</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planning">Planning</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="testing">Testing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="requirements">Requirements</Label>
                          <Textarea
                            id="requirements"
                            value={editForm.requirements || ''}
                            onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
                            rows={4}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                            <p className="font-medium capitalize">{project.project_type.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                            <Badge className={priorityColors[project.priority as keyof typeof priorityColors]}>
                              {project.priority}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                            <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Progress</Label>
                            <p className="font-medium">{project.progress_percentage}%</p>
                          </div>
                        </div>
                        {project.description && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                            <p className="mt-1">{project.description}</p>
                          </div>
                        )}
                        {project.requirements && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Requirements</Label>
                            <p className="mt-1">{project.requirements}</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Customer Info */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Customer</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const customerId = project.customer_user_id || project.customer_id;
                        if (customerId) {
                          router.push(`/dashboard/admin/customers/${customerId}`);
                        } else {
                          toast.error('Customer information not available');
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                      <p className="break-words font-medium">{project.company_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                      <p className="break-words">{project.contact_person}</p>
                    </div>
                    {project.email && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="break-all text-sm">{project.email}</p>
                      </div>
                    )}
                    {project.phone && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                        <p className="break-words">{project.phone}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          const customerId = project.customer_user_id || project.customer_id;
                          if (customerId) {
                            router.push(`/dashboard/admin/customers/${customerId}`);
                          } else {
                            toast.error('Customer information not available');
                          }
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Customer Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline & Budget */}
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline & Budget</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Timeline</Label>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Start:</span>
                          <span>{formatDate(project.start_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target:</span>
                          <span>{formatDate(project.target_completion_date)}</span>
                        </div>
                        {project.actual_completion_date && (
                          <div className="flex justify-between text-green-600">
                            <span>Completed:</span>
                            <span>{formatDate(project.actual_completion_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Budget</Label>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Allocated:</span>
                          <span className="font-medium">{formatCurrency(project.budget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Spent:</span>
                          <span>{formatCurrency(project.actual_cost)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Remaining:</span>
                          <span className="font-medium">{formatCurrency(project.budget - project.actual_cost)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Milestones</CardTitle>
                    <CardDescription>Track progress through key project milestones</CardDescription>
                  </div>
                  <Dialog open={isCreateMilestoneOpen} onOpenChange={(open) => {
                    setIsCreateMilestoneOpen(open);
                    if (!open) {
                      setEditingMilestone(null);
                      resetMilestoneForm();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Milestone
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}</DialogTitle>
                        <DialogDescription>
                          {editingMilestone ? 'Update milestone details' : 'Add a new milestone to track project progress'}
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={editingMilestone ? handleUpdateMilestone : handleCreateMilestone} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="milestone_name">Milestone Name</Label>
                          <Input
                            id="milestone_name"
                            value={milestoneForm.milestone_name}
                            onChange={(e) => setMilestoneForm(prev => ({ ...prev, milestone_name: e.target.value }))}
                            placeholder="e.g., Welcome Call"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={milestoneForm.description}
                            onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe this milestone..."
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input
                              id="due_date"
                              type="date"
                              value={milestoneForm.due_date}
                              onChange={(e) => setMilestoneForm(prev => ({ ...prev, due_date: e.target.value }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="assigned_to">Assigned To</Label>
                            <Select value={milestoneForm.assigned_to} onValueChange={(value) => setMilestoneForm(prev => ({ ...prev, assigned_to: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select team member" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {allTeamMembers?.map((member) => (
                                  <SelectItem key={member.id} value={member.id.toString()}>
                                    {member.username} ({member.role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_critical"
                            checked={milestoneForm.is_critical}
                            onChange={(e) => setMilestoneForm(prev => ({ ...prev, is_critical: e.target.checked }))}
                            className="rounded"
                          />
                          <Label htmlFor="is_critical">Mark as critical milestone</Label>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsCreateMilestoneOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {project.milestones && project.milestones.length > 0 ? (
                  <div className="space-y-4">
                    {project.milestones.map((milestone) => (
                      <div key={milestone.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{milestone.milestone_name}</h4>
                              <Select value={milestone.status} onValueChange={(value) => handleMilestoneStatusUpdate(milestone.id, value)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="blocked">Blocked</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              {milestone.is_critical && (
                                <Badge variant="destructive">Critical</Badge>
                              )}
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>Due: {formatDate(milestone.due_date)}</span>
                              {milestone.assigned_to_name && (
                                <span>Assigned: {milestone.assigned_to_name}</span>
                              )}
                              {milestone.completed_date && (
                                <span className="text-green-600">Completed: {formatDate(milestone.completed_date)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right mr-4">
                              <div className="text-lg font-semibold">{milestone.completion_percentage}%</div>
                              <Progress value={milestone.completion_percentage} className="w-20 mt-1" />
                            </div>
                            <div className="flex flex-col space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMilestone(milestone)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteMilestone(milestone.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No milestones defined for this project</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Team</CardTitle>
                <CardDescription>Team members working on this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.project_manager_name && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{project.project_manager_name}</h4>
                          <p className="text-sm text-muted-foreground">Project Manager</p>
                          {project.project_manager_email && (
                            <p className="text-sm text-muted-foreground">{project.project_manager_email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {project.team_members_details && project.team_members_details.length > 0 ? (
                    project.team_members_details.map((member) => (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-secondary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{member.username}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No team members assigned</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <ProjectTimeline project={project} />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
