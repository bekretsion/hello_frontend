'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Bot, 
  MessageSquare, 
  Mic, 
  AlertCircle, 
  CheckCircle2,
  Settings,
  Play
} from 'lucide-react';

interface Assistant {
  id: number;
  vapi_assistant_id: string;
  name: string;
  description: string;
  language: string;
  assistant_type: string;
  assignment_type: string;
  is_default: boolean;
  scripts_count: number;
  voices_count: number;
  has_complete_setup: boolean;
  default_script: Script | null;
  default_voice: Voice | null;
}

interface Script {
  id: number;
  name: string;
  content: string;
  script_type: string;
  is_default: boolean;
}

interface Voice {
  id: number;
  name: string;
  vapi_voice_id: string;
  voice_type: string;
  language: string;
  is_default: boolean;
}

interface AssistantSelectorProps {
  callType: 'inbound' | 'outbound';
  onSelectionChange: (selection: {
    assistant: Assistant | null;
    script: Script | null;
    voice: Voice | null;
  }) => void;
  disabled?: boolean;
}

export function AssistantSelector({ callType, onSelectionChange, disabled = false }: AssistantSelectorProps) {
  const t = useTranslations('assistants');
  const { user } = useAuth();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(false);

  // Fetch user's assigned assistants
  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assistants/my-assistants?assignment_type=${callType}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assistants');
      }

      const data = await response.json();
      const fetchedAssistants = data.assistants || [];
      setAssistants(fetchedAssistants);

      // Auto-select default assistant if available
      const defaultAssistant = fetchedAssistants.find((a: Assistant) => a.is_default);
      if (defaultAssistant && callType === 'outbound') {
        handleAssistantSelect(defaultAssistant);
      } else if (callType === 'inbound' && defaultAssistant) {
        // For inbound calls, use default script and voice automatically
        setSelectedAssistant(defaultAssistant);
        setSelectedScript(defaultAssistant.default_script);
        setSelectedVoice(defaultAssistant.default_voice);
        onSelectionChange({
          assistant: defaultAssistant,
          script: defaultAssistant.default_script,
          voice: defaultAssistant.default_voice,
        });
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
      toast.error('Failed to load assistants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAssistants();
    }
  }, [user, callType]);

  // Fetch scripts for selected assistant
  const fetchScripts = async (assistantId: number) => {
    try {
      setLoadingScripts(true);
      const response = await fetch(`/api/assistants/${assistantId}/scripts`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scripts');
      }

      const data = await response.json();
      const fetchedScripts = data.scripts || [];
      setScripts(fetchedScripts);

      // Auto-select default script
      const defaultScript = fetchedScripts.find((s: Script) => s.is_default) || fetchedScripts[0];
      if (defaultScript) {
        setSelectedScript(defaultScript);
        return defaultScript;
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast.error('Failed to load scripts');
    } finally {
      setLoadingScripts(false);
    }
    return null;
  };

  // Fetch voices for selected assistant
  const fetchVoices = async (assistantId: number) => {
    try {
      setLoadingVoices(true);
      const response = await fetch(`/api/assistants/${assistantId}/voices`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      const fetchedVoices = data.voices || [];
      setVoices(fetchedVoices);

      // Auto-select default voice
      const defaultVoice = fetchedVoices.find((v: Voice) => v.is_default) || fetchedVoices[0];
      if (defaultVoice) {
        setSelectedVoice(defaultVoice);
        return defaultVoice;
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      toast.error('Failed to load voices');
    } finally {
      setLoadingVoices(false);
    }
    return null;
  };

  // Handle assistant selection
  const handleAssistantSelect = async (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setSelectedScript(null);
    setSelectedVoice(null);
    setScripts([]);
    setVoices([]);

    if (callType === 'outbound') {
      // For outbound calls, fetch scripts and voices for selection
      const [defaultScript, defaultVoice] = await Promise.all([
        fetchScripts(assistant.id),
        fetchVoices(assistant.id),
      ]);

      // Update selection
      onSelectionChange({
        assistant,
        script: defaultScript,
        voice: defaultVoice,
      });
    } else {
      // For inbound calls, use defaults automatically
      setSelectedScript(assistant.default_script);
      setSelectedVoice(assistant.default_voice);
      onSelectionChange({
        assistant,
        script: assistant.default_script,
        voice: assistant.default_voice,
      });
    }
  };

  // Handle script selection
  const handleScriptSelect = (scriptId: string) => {
    const script = scripts.find(s => s.id.toString() === scriptId) || null;
    setSelectedScript(script);
    onSelectionChange({
      assistant: selectedAssistant,
      script,
      voice: selectedVoice,
    });
  };

  // Handle voice selection
  const handleVoiceSelect = (voiceId: string) => {
    const voice = voices.find(v => v.id.toString() === voiceId) || null;
    setSelectedVoice(voice);
    onSelectionChange({
      assistant: selectedAssistant,
      script: selectedScript,
      voice,
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inbound': return 'bg-blue-100 text-blue-800';
      case 'outbound': return 'bg-green-100 text-green-800';
      case 'both': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScriptTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-orange-100 text-orange-800';
      case 'onboarding': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVoiceTypeColor = (type: string) => {
    switch (type) {
      case 'male': return 'bg-blue-100 text-blue-800';
      case 'female': return 'bg-pink-100 text-pink-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isSelectionComplete = selectedAssistant && selectedScript && selectedVoice;
  const hasIncompleteSetup = selectedAssistant && !selectedAssistant.has_complete_setup;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading assistants...</p>
        </CardContent>
      </Card>
    );
  }

  if (assistants.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('noAssistantsAvailable.title')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('noAssistantsAvailable.description', { callType: t(`filters.${callType}`) })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assistant Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Select Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAssistant?.id === assistant.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && handleAssistantSelect(assistant)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{assistant.name}</h4>
                  {assistant.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {assistant.description || 'No description provided'}
                </p>
                <div className="flex items-center justify-between">
                  <Badge className={getTypeColor(assistant.assistant_type)}>
                    {assistant.assistant_type}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{assistant.scripts_count} scripts</span>
                    <span>{assistant.voices_count} voices</span>
                  </div>
                </div>
                {!assistant.has_complete_setup && (
                  <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Incomplete setup
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Script & Voice Selection (for Outbound calls) */}
      {callType === 'outbound' && selectedAssistant && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Script Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Select Script
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingScripts ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : scripts.length > 0 ? (
                <Select 
                  value={selectedScript?.id.toString() || ''} 
                  onValueChange={handleScriptSelect}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a script" />
                  </SelectTrigger>
                  <SelectContent>
                    {scripts.map((script) => (
                      <SelectItem key={script.id} value={script.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{script.name}</span>
                          {script.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                          <Badge className={getScriptTypeColor(script.script_type)}>
                            {script.script_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No scripts available for this assistant. Please contact your administrator.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Voice Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Select Voice
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVoices ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : voices.length > 0 ? (
                <Select 
                  value={selectedVoice?.id.toString() || ''} 
                  onValueChange={handleVoiceSelect}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{voice.name}</span>
                          {voice.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                          <Badge className={getVoiceTypeColor(voice.voice_type)}>
                            {voice.voice_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No voices available for this assistant. Please contact your administrator.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inbound Call Info */}
      {callType === 'inbound' && selectedAssistant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Inbound Call Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                For inbound calls, the system automatically uses the default script and voice 
                configured for your assigned assistant.
              </AlertDescription>
            </Alert>
            {selectedAssistant.default_script && selectedAssistant.default_voice && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Default Script</Label>
                  <div className="mt-1 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedAssistant.default_script.name}</span>
                      <Badge className={getScriptTypeColor(selectedAssistant.default_script.script_type)}>
                        {selectedAssistant.default_script.script_type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Default Voice</Label>
                  <div className="mt-1 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedAssistant.default_voice.name}</span>
                      <Badge className={getVoiceTypeColor(selectedAssistant.default_voice.voice_type)}>
                        {selectedAssistant.default_voice.voice_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selection Status */}
      {selectedAssistant && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {isSelectionComplete ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Selection Complete</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-600 font-medium">
                    {callType === 'outbound' 
                      ? 'Please select script and voice to continue'
                      : 'Incomplete assistant setup - contact administrator'
                    }
                  </span>
                </>
              )}
            </div>
            {hasIncompleteSetup && (
              <p className="text-sm text-muted-foreground mt-1">
                This assistant is missing default script or voice configuration.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
