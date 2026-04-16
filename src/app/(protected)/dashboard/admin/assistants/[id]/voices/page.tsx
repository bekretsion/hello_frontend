'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useVoicePreview } from '@/hooks/use-voice-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Mic,
  AlertCircle,
  Save,
  CheckCircle
} from 'lucide-react';

interface Voice {
  id: number;
  name: string;
  vapi_voice_id: string;
  voice_type: string;
  language: string;
  accent: string;
  is_default: boolean;
  is_active: boolean;
}

interface Assistant {
  id: number;
  name: string;
  vapi_assistant_id: string;
}

interface VapiVoice {
  id: string;
  name: string;
  type: string;
  language: string;
  provider: string;
  description?: string;
}

export default function VoicesManagementPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { playVoice, stopVoice, isPlaying, error: voicePreviewError } = useVoicePreview();
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [currentVoice, setCurrentVoice] = useState<Voice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<VapiVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch current voice and assistant info
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assistants/${params.id}/voices`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voice data');
      }

      const data = await response.json();
      setAssistant(data.assistant);
      
      // Find the default voice
      const defaultVoice = data.voices?.find((v: Voice) => v.is_default);
      setCurrentVoice(defaultVoice || null);
      setSelectedVoiceId(defaultVoice?.vapi_voice_id || '');
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load voice data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available Vapi voices
  const fetchAvailableVoices = async () => {
    try {
      setLoadingVoices(true);
      const response = await fetch('/api/voices/available-vapi-voices', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available voices');
      }

      const data = await response.json();
      setAvailableVoices(data.voices || []);
      
      if (data.source === 'default') {
        toast.info('Showing default voices (Vapi connection unavailable)');
      }
    } catch (error) {
      console.error('Error fetching available voices:', error);
      toast.error('Failed to load available voices');
    } finally {
      setLoadingVoices(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && params.id) {
      fetchData();
      fetchAvailableVoices();
    }
  }, [user, params.id]);

  // Save voice selection
  const handleSaveVoice = async () => {
    if (!currentVoice) {
      toast.error('No current voice found');
      return;
    }

    if (!selectedVoiceId) {
      toast.error('Please select a voice');
      return;
    }

    try {
      setSaving(true);
      
      // Find the selected voice details
      const selectedVoice = availableVoices.find(v => v.id === selectedVoiceId);
      
      const response = await fetch(`/api/voices/${currentVoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          vapi_voice_id: selectedVoiceId,
          name: selectedVoice?.name || selectedVoiceId,
          voice_type: selectedVoice?.type || 'neutral',
          language: selectedVoice?.language || 'en',
          is_default: true,
          is_active: true
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update voice');
      }

      const data = await response.json();
      
      // Show appropriate success message based on Vapi sync status
      if (data.vapi_sync_status === 'success') {
        toast.success('Voice updated and synced to Vapi! 🎤');
      } else if (data.vapi_sync_status === 'failed') {
        toast.warning('Voice updated locally, but failed to sync to Vapi');
      } else if (data.vapi_sync_status === 'not_configured') {
        toast.warning('Voice updated locally (Vapi not configured)');
      } else {
        toast.success('Voice updated successfully!');
      }

      fetchData();
    } catch (error) {
      console.error('Error updating voice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update voice');
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
    <div className="space-y-6 pb-8 overflow-y-auto max-h-screen px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/admin/assistants')}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assistants
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">Voice Configuration</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Change voice for {assistant?.name || 'Assistant'}
          </p>
        </div>
      </div>

      {/* Voice Selection Card - Centered */}
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Select Voice</CardTitle>
                <CardDescription className="text-sm">
                  Choose from available Vapi voices (11Labs)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <AlertDescription className="text-blue-900 text-sm">
                <strong>🎤 Voice Selection:</strong> Choose from real Vapi voices. Changes sync automatically to Vapi.
                {currentVoice && (() => {
                  const matchedVoice = availableVoices.find(v => v.id === currentVoice.vapi_voice_id);
                  const displayName = matchedVoice ? matchedVoice.name : currentVoice.name;
                  return (
                    <div className="mt-2 text-xs sm:text-sm">
                      Current: <strong>{displayName}</strong>
                      {matchedVoice && matchedVoice.type && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {matchedVoice.type}
                        </Badge>
                      )}
                    </div>
                  );
                })()}
              </AlertDescription>
            </Alert>

            {/* Voice Selector */}
            <div className="space-y-2">
              <Label htmlFor="voice-select" className="text-sm sm:text-base">Select Voice</Label>
              {loadingVoices ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-xs sm:text-sm text-muted-foreground">Loading voices from Vapi...</span>
                </div>
              ) : (
                <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
                  <SelectTrigger id="voice-select" className="w-full">
                    <SelectValue placeholder="Select a voice">
                      {selectedVoiceId && (() => {
                        const selectedVoice = availableVoices.find(v => v.id === selectedVoiceId);
                        return selectedVoice ? (
                          <div className="flex items-center gap-2">
                            <Mic className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{selectedVoice.name}</span>
                            {selectedVoice.type && (
                              <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">
                                {selectedVoice.type}
                              </Badge>
                            )}
                          </div>
                        ) : selectedVoiceId;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <Mic className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{voice.name}</span>
                          {voice.type && (
                            <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                              {voice.type}
                            </Badge>
                          )}
                          {voice.language && voice.language !== 'en' && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({voice.language})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                {availableVoices.length} voices available from Vapi (11Labs)
              </p>
            </div>

            {/* Voice Preview */}
            {selectedVoiceId && availableVoices.length > 0 && (
              <div className="p-3 sm:p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="font-medium text-xs sm:text-sm">Selected Voice Preview:</div>
                {(() => {
                  const voice = availableVoices.find(v => v.id === selectedVoiceId);
                  return voice ? (
                    <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 font-medium">{voice.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2 font-medium">{voice.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Language:</span>
                        <span className="ml-2 font-medium">{voice.language.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="ml-2 font-medium">{voice.provider}</span>
                      </div>
                      {voice.description && (
                        <div className="col-span-1 sm:col-span-2">
                          <span className="text-muted-foreground">Description:</span>
                          <p className="mt-1 text-xs">{voice.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Test Voice Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (isPlaying) {
                          stopVoice();
                        } else {
                          playVoice(voice.id, voice.name, voice.provider);
                        }
                      }}
                      disabled={isPlaying && !voice}
                      className="w-full"
                    >
                      {isPlaying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Playing... (Click to Stop)
                        </>
                      ) : (
                        <>
                          🔊 Test Voice
                        </>
                      )}
                    </Button>

                    {voicePreviewError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs sm:text-sm">
                          {voicePreviewError}
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-xs sm:text-sm text-muted-foreground text-center">
                      Click the button to hear a live preview of this voice
                    </p>
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">Voice not found</p>
                );
              })()}
            </div>
          )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/admin/assistants')}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveVoice}
                disabled={saving || !selectedVoiceId || selectedVoiceId === currentVoice?.vapi_voice_id}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="hidden sm:inline">Saving & Syncing...</span>
                    <span className="sm:hidden">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Voice
                  </>
                )}
              </Button>
            </div>

            {/* Assistant Info */}
            {assistant && (
              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-start sm:items-center gap-2">
                    <CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="break-words">Assistant: <strong>{assistant.name}</strong></span>
                  </div>
                  <div className="flex items-start sm:items-center gap-2">
                    <CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="break-all">Vapi ID: <code className="text-xs">{assistant.vapi_assistant_id}</code></span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
