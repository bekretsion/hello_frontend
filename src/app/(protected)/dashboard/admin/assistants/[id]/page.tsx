'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Bot, Users } from 'lucide-react';

interface Assistant {
  id: number;
  vapi_assistant_id: string;
  name: string;
  description: string;
  language: string;
  assistant_type: string;
  is_active: boolean;
  created_by_name: string;
  assigned_users: any[];
  scripts: any[];
  voices: any[];
}

export default function EditAssistantPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'en',
    assistant_type: 'both',
    is_active: true,
  });

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch assistant details
  const fetchAssistant = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assistants/v2/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assistant');
      }

      const data = await response.json();
      const assistantData = data.assistant;
      setAssistant(assistantData);
      setFormData({
        name: assistantData.name,
        description: assistantData.description || '',
        language: assistantData.language,
        assistant_type: assistantData.assistant_type,
        is_active: assistantData.is_active,
      });
    } catch (error) {
      console.error('Error fetching assistant:', error);
      toast.error('Failed to load assistant details');
      router.push('/dashboard/admin/assistants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && params.id) {
      fetchAssistant();
    }
  }, [user, params.id]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/assistants/v2/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update assistant');
      }

      toast.success('Assistant updated successfully');
      await fetchAssistant(); // Refresh data
    } catch (error) {
      console.error('Error updating assistant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update assistant');
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

  if (!assistant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Assistant Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">The assistant you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
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
        <div>
          <h1 className="text-2xl font-bold">Edit Assistant</h1>
          <p className="text-muted-foreground">
            Modify assistant settings and configuration
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/admin/assistants/${params.id}/scripts`)}
        >
          Manage Scripts ({assistant.scripts?.length || 0})
        </Button>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/admin/assistants/${params.id}/voices`)}
        >
          Manage Voices ({assistant.voices?.length || 0})
        </Button>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/admin/assistants/${params.id}/users`)}
        >
          <Users className="h-4 w-4 mr-2" />
          Manage Users ({assistant.assigned_users?.length || 0})
        </Button>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Assistant Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assistant Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Sales Assistant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of what this assistant does..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assistant_type">Assistant Type</Label>
              <Select 
                value={formData.assistant_type} 
                onValueChange={(value) => handleInputChange('assistant_type', value)}
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

            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select 
                value={formData.is_active.toString()} 
                onValueChange={(value) => handleInputChange('is_active', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted p-3 rounded text-sm">
            <strong>VAPI Assistant ID:</strong> {assistant.vapi_assistant_id}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/admin/assistants')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
