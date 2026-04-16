'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Clock, 
  CheckSquare, 
  Users,
  FileText,
  Settings
} from 'lucide-react';

interface ProjectTemplate {
  id: number;
  template_name: string;
  project_type: string;
  description: string;
  default_milestones: Array<{
    name: string;
    duration: number;
    description: string;
  }>;
  estimated_duration_days: number;
  checklist_template: string[];
  usage_count: number;
  is_active: boolean;
  created_by_name: string;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [formData, setFormData] = useState({
    template_name: '',
    project_type: 'onboarding',
    description: '',
    estimated_duration_days: 30,
    default_milestones: [
      { name: '', duration: 1, description: '' }
    ],
    checklist_template: ['']
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/projects/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTemplate 
        ? `/api/projects/templates/${editingTemplate.id}`
        : '/api/projects/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          default_milestones: formData.default_milestones.filter(m => m.name.trim()),
          checklist_template: formData.checklist_template.filter(item => item.trim())
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        setIsCreateDialogOpen(false);
        setEditingTemplate(null);
        resetForm();
        fetchTemplates();
      } else {
        throw new Error(data.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const resetForm = () => {
    setFormData({
      template_name: '',
      project_type: 'onboarding',
      description: '',
      estimated_duration_days: 30,
      default_milestones: [{ name: '', duration: 1, description: '' }],
      checklist_template: ['']
    });
  };

  const handleEdit = (template: ProjectTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      project_type: template.project_type,
      description: template.description,
      estimated_duration_days: template.estimated_duration_days,
      default_milestones: template.default_milestones.length > 0 
        ? template.default_milestones 
        : [{ name: '', duration: 1, description: '' }],
      checklist_template: template.checklist_template.length > 0 
        ? template.checklist_template 
        : ['']
    });
    setIsCreateDialogOpen(true);
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      default_milestones: [...prev.default_milestones, { name: '', duration: 1, description: '' }]
    }));
  };

  const updateMilestone = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      default_milestones: prev.default_milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      default_milestones: prev.default_milestones.filter((_, i) => i !== index)
    }));
  };

  const addChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      checklist_template: [...prev.checklist_template, '']
    }));
  };

  const updateChecklistItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      checklist_template: prev.checklist_template.map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist_template: prev.checklist_template.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <PageContainer scrollable={true}>
        <div className="w-full max-w-6xl mx-auto space-y-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading templates...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className="w-full max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Project Templates</h1>
            <p className="text-muted-foreground">Manage reusable project templates with automated checklists</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                <DialogDescription>
                  {editingTemplate ? 'Update the template details' : 'Create a reusable project template with milestones and checklists'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_name">Template Name</Label>
                    <Input
                      id="template_name"
                      value={formData.template_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                      placeholder="e.g., Customer Onboarding"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_type">Project Type</Label>
                    <Select value={formData.project_type} onValueChange={(value) => setFormData(prev => ({ ...prev, project_type: value }))}>
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

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this template is used for..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_duration_days">Estimated Duration (Days)</Label>
                  <Input
                    id="estimated_duration_days"
                    type="number"
                    value={formData.estimated_duration_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_days: parseInt(e.target.value) || 30 }))}
                    min="1"
                    max="365"
                  />
                </div>

                {/* Milestones */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Default Milestones</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Milestone
                    </Button>
                  </div>
                  
                  {formData.default_milestones.map((milestone, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Milestone Name</Label>
                          <Input
                            value={milestone.name}
                            onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                            placeholder="e.g., Welcome Call"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (Days)</Label>
                          <Input
                            type="number"
                            value={milestone.duration}
                            onChange={(e) => updateMilestone(index, 'duration', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                        </div>
                        <div className="space-y-2 flex items-end">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeMilestone(index)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          placeholder="Describe this milestone..."
                          rows={2}
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Checklist */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Checklist Template</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  {formData.checklist_template.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateChecklistItem(index, e.target.value)}
                        placeholder="e.g., Send welcome email"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeChecklistItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <CardDescription className="capitalize">{template.project_type.replace('_', ' ')}</CardDescription>
                  </div>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{template.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{template.estimated_duration_days} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{template.usage_count} uses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{template.default_milestones.length} milestones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{template.checklist_template.length} tasks</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(template)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project template to standardize your workflows
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
