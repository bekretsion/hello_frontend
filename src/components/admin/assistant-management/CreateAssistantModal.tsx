'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Bot, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  language: string;
  assistant_type: 'inbound' | 'outbound' | 'both';
  systemPrompt: string;
  firstMessage: string;
}

export function CreateAssistantModal({ open, onOpenChange, onSuccess }: CreateAssistantModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    language: 'en',
    assistant_type: 'both',
    systemPrompt: '',
    firstMessage: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Assistant name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Assistant name must be at least 3 characters long';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.systemPrompt && formData.systemPrompt.length > 2000) {
      newErrors.systemPrompt = 'System prompt must be less than 2000 characters';
    }

    if (formData.firstMessage && formData.firstMessage.length > 500) {
      newErrors.firstMessage = 'First message must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/assistants/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create assistant');
      }

      toast.success('Assistant created successfully in Vapi! Default script and voice have been added.');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        language: 'en',
        assistant_type: 'both',
        systemPrompt: '',
        firstMessage: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating assistant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFormData({
      name: '',
      description: '',
      language: 'en',
      assistant_type: 'both',
      systemPrompt: '',
      firstMessage: '',
    });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Create New Assistant
          </DialogTitle>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will create a real assistant in Vapi and automatically add it to your local database. 
            A default script and voice will be created for this assistant.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="name">
              Assistant Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Sales Assistant"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of what this assistant does..."
              className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">
              System Prompt
            </Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
              placeholder="Define the assistant's behavior, personality, and capabilities..."
              className={`resize-none ${errors.systemPrompt ? 'border-red-500' : ''}`}
              rows={4}
            />
            {errors.systemPrompt && (
              <p className="text-sm text-red-500">{errors.systemPrompt}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.systemPrompt.length}/2000 characters. Leave empty for default behavior.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstMessage">
              First Message
            </Label>
            <Textarea
              id="firstMessage"
              value={formData.firstMessage}
              onChange={(e) => handleInputChange('firstMessage', e.target.value)}
              placeholder="The first message the assistant will say when a call starts..."
              className={`resize-none ${errors.firstMessage ? 'border-red-500' : ''}`}
              rows={2}
            />
            {errors.firstMessage && (
              <p className="text-sm text-red-500">{errors.firstMessage}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.firstMessage.length}/500 characters. Leave empty for default greeting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">
                Language
              </Label>
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
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="pl">Polish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assistant_type">
                Assistant Type
              </Label>
              <Select 
                value={formData.assistant_type} 
                onValueChange={(value: 'inbound' | 'outbound' | 'both') => handleInputChange('assistant_type', value)}
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
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Assistant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
