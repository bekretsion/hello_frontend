'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  BarChart3, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  Target
} from 'lucide-react';

interface Project {
  id: number;
  project_name: string;
  project_type: string;
  status: string;
  priority: string;
  progress_percentage: number;
  company_name: string;
  contact_person: string;
  project_manager_name: string;
  start_date: string;
  target_completion_date: string;
  total_milestones: number;
  completed_milestones: number;
  milestone_progress: number;
  created_at: string;
}

interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  on_hold_projects: number;
  overdue_projects: number;
  avg_progress: number;
}

interface ProjectTemplate {
  id: number;
  template_name: string;
  project_type: string;
  description: string;
  estimated_duration_days: number;
}

interface TeamMember {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Customer {
  id: number;
  email: string;
  username: string;
  company_name: string;
  contact_person: string;
  customer_tier: string;
  onboarding_status: string;
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

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Create project form state
  const [newProject, setNewProject] = useState({
    customer_id: '',
    project_name: '',
    project_type: 'onboarding',
    priority: 'medium',
    project_manager_id: '',
    assigned_team_members: [] as number[],
    start_date: '',
    target_completion_date: '',
    budget: '',
    description: '',
    requirements: '',
    template_id: 'none'
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter && typeFilter !== 'all') params.append('project_type', typeFilter);
      
      // Fetch all data in parallel
      const [projectsRes, statsRes, templatesRes, teamRes, customersRes] = await Promise.all([
        fetch(`/api/projects?${params.toString()}`),
        fetch('/api/projects/stats'),
        fetch('/api/projects/templates'),
        fetch('/api/projects/team-members'),
        fetch('/api/admin/customers?limit=1000')
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.data?.projects || []);
      } else {
        console.error('Failed to fetch projects:', projectsRes.status);
        setProjects([]);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data?.overview || null);
      } else {
        console.error('Failed to fetch stats:', statsRes.status);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.data || []);
      } else {
        console.error('Failed to fetch templates:', templatesRes.status);
        setTemplates([]);
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(teamData.data || []);
      } else {
        console.error('Failed to fetch team members:', teamRes.status);
        setTeamMembers([]);
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData.customers || []);
      } else {
        console.error('Failed to fetch customers:', customersRes.status);
        setCustomers([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProject,
          budget: parseFloat(newProject.budget) || 0,
          template_id: newProject.template_id === 'none' ? null : newProject.template_id || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      toast.success('Project created successfully');
      setIsCreateDialogOpen(false);
      setNewProject({
        customer_id: '',
        project_name: '',
        project_type: 'onboarding',
        priority: 'medium',
        project_manager_id: '',
        assigned_team_members: [],
        start_date: '',
        target_completion_date: '',
        budget: '',
        description: '',
        requirements: '',
        template_id: 'none'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    }
  };

  const filteredProjects = (projects || []).filter(project =>
    project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'on_hold': return <Pause className="h-4 w-4" />;
      case 'planning': return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">Manage customer projects, timelines, and team assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project for a customer with optional template
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={newProject.customer_id} onValueChange={(value) => setNewProject({...newProject, customer_id: value})}>
                    <SelectTrigger className="w-full
                                              min-w-0
                                              overflow-hidden
                                              [&_[data-slot=select-value]]:truncate
                                              [&_[data-slot=select-value]]:min-w-0
                                            ">
                                            
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {(customers || []).map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.company_name || customer.username} - {customer.contact_person || customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="template">Template (Optional)</Label>
                  <Select value={newProject.template_id} onValueChange={(value) => setNewProject({...newProject, template_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="none">No template</SelectItem>
                      {(templates || []).map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.template_name} ({template.estimated_duration_days} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name</Label>
                <Input
                  id="project_name"
                  value={newProject.project_name}
                  onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                  placeholder="Enter project name"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_type">Type</Label>
                  <Select value={newProject.project_type} onValueChange={(value) => setNewProject({...newProject, project_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="custom_development">Custom Development</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newProject.priority} onValueChange={(value) => setNewProject({...newProject, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_completion_date">Target Completion</Label>
                  <Input
                    id="target_completion_date"
                    type="date"
                    value={newProject.target_completion_date}
                    onChange={(e) => setNewProject({...newProject, target_completion_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_manager">Project Manager</Label>
                <Select value={newProject.project_manager_id} onValueChange={(value) => setNewProject({...newProject, project_manager_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project manager" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {(teamMembers || []).map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.username} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Project description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={newProject.requirements}
                  onChange={(e) => setNewProject({...newProject, requirements: e.target.value})}
                  placeholder="Project requirements..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={!newProject.customer_id || !newProject.project_name}>
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_projects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_projects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed_projects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue_projects}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects or customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
                <SelectItem value="custom_development">Custom Development</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No projects found</p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/dashboard/admin/projects/${project.id}`)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(project.status)}
                          <h3 className="font-semibold text-lg">{project.project_name}</h3>
                          <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={priorityColors[project.priority as keyof typeof priorityColors]}>
                            {project.priority}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p><strong>Customer:</strong> {project.company_name}</p>
                            <p><strong>Contact:</strong> {project.contact_person}</p>
                          </div>
                          <div>
                            <p><strong>Manager:</strong> {project.project_manager_name || 'Unassigned'}</p>
                            <p><strong>Type:</strong> {project.project_type.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p><strong>Start:</strong> {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
                            <p><strong>Target:</strong> {project.target_completion_date ? new Date(project.target_completion_date).toLocaleDateString() : 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{project.progress_percentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          {project.completed_milestones}/{project.total_milestones} milestones
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${project.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </PageContainer>
  );
}
