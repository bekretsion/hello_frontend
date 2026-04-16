'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Save, Mic, Volume2 } from 'lucide-react';

interface Assistant {
  id: number;
  name: string;
}

interface AvailableVoice {
  id: string;
  name: string;
  type: string;
  language: string;
  accent: string;
}

export default function CreateVoicePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [availableVoices, setAvailableVoices] = useState<AvailableVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    vapi_voice_id: '',
    voice_type: 'neutral',
    language: 'en',
    accent: '',
    is_default: false,
  });
  const [errors, setErrors] = useState<any>({});

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch assistant details and available voices
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch assistant details
      const assistantResponse = await fetch(`/api/assistants/v2/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!assistantResponse.ok) {
        throw new Error('Failed to fetch assistant');
      }

      const assistantData = await assistantResponse.json();
      setAssistant(assistantData.assistant);

      // Fetch available VAPI voices
      const voicesResponse = await fetch('/api/voices/available-vapi-voices', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (voicesResponse.ok) {
        const voicesData = await voicesResponse.json();
        setAvailableVoices(voicesData.voices || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      router.push('/dashboard/admin/assistants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && params.id) {
      fetchData();
    }
  }, [user, params.id]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill name when VAPI voice is selected
    if (field === 'vapi_voice_id' && typeof value === 'string') {
      const selectedVoice = availableVoices.find(v => v.id === value);
      if (selectedVoice && !formData.name) {
        setFormData(prev => ({
          ...prev,
          name: selectedVoice.name,
          voice_type: selectedVoice.type,
          language: selectedVoice.language,
          accent: selectedVoice.accent
        }));
      }
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Voice name is required';
    }

    if (!formData.vapi_voice_id.trim()) {
      newErrors.vapi_voice_id = 'VAPI Voice ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/assistants/${params.id}/voices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create voice');
      }

      toast.success('Voice created successfully');
      router.push(`/dashboard/admin/assistants/${params.id}/voices`);
    } catch (error) {
      console.error('Error creating voice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create voice');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/assistants/${params.id}/voices`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Voices
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Voice</h1>
          <p className="text-muted-foreground">
            Add a new voice for {assistant?.name || 'Assistant'}
          </p>
        </div>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vapi_voice_id">VAPI Voice *</Label>
                <Select value={formData.vapi_voice_id} onValueChange={(value) => handleInputChange('vapi_voice_id', value)}>
                  <SelectTrigger className={errors.vapi_voice_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a VAPI voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          <span>{voice.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vapi_voice_id && (
                  <p className="text-sm text-red-500">{errors.vapi_voice_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Voice Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Professional Female Voice"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voice_type">Voice Type</Label>
                <Select value={formData.voice_type} onValueChange={(value) => handleInputChange('voice_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
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

              <div className="space-y-2">
                <Label htmlFor="accent">Accent (Optional)</Label>
                <Input
                  id="accent"
                  value={formData.accent}
                  onChange={(e) => handleInputChange('accent', e.target.value)}
                  placeholder="e.g., US, UK, Australian"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => handleInputChange('is_default', checked as boolean)}
              />
              <Label htmlFor="is_default">Set as default voice for this assistant</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/admin/assistants/${params.id}/voices`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                <Save className="h-4 w-4 mr-2" />
                Create Voice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
