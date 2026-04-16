'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useVoicePreview } from '@/hooks/use-voice-preview';
import { useMinuteBundleCheck } from '@/hooks/use-minute-bundle-check';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageContainer from '@/components/layout/page-container';
import NewUserBanner from '@/components/billing/new-user-banner';
import { toast } from 'sonner';
import {
  Bot,
  Mic,
  Search,
  Activity,
  AlertCircle,
  Phone,
  Crown,
  Eye,
  BarChart3,
  Edit,
  Save,
  MoreVertical,
  FileText,
  Lock,
  Plus,
  LayoutGrid,
  List,
  Type,
  X,
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react';
import '@/styles/voicewave.css';
// FileUploadArea import removed - using react-dropzone directly
import VoiceCard, { VoiceCardProps } from './voiceCard';
import { useVoiceFilters } from '@/hooks/use-voice-filters';
import VoiceFilters, { type VoiceData, nameToLangCode, langCodeToName } from './voice-filters';
import RequestAssistantWizard from '@/components/assistants/request-assistant-wizard';

interface Assistant {
  id: string; // Vapi assistant ID
  name: string;
  description?: string;
  language?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  voice?: any;
  model?: any;
  transcriber?: any;
  firstMessage?: string;
  endCallMessage?: string;
  recordingEnabled?: boolean;
  // Additional fields from assignment
  assignment_type?: string;
  is_default?: number;
  default_script?: {
    id: number;
    content: string;
    name: string;
    script_type: string;
  };
  default_voice?: {
    id: number;
    name: string;
    vapi_voice_id: string;
    voice_type: string;
    language: string;
  };
  agent_id?: string;
  elevenlabs_config?: {
    firstMessage: string;
    systemPrompt: string;
    voiceId: string;
    language: string;
  } | null;
  scripts_count?: number;
  voices_count?: number;
  phone_number?: {
    phone_number: string;
    label?: string;
    alias_number?: string;
  } | null;
}

// Removed unused Script/Voice interfaces

interface VapiVoice {
  id: string;
  name: string;
  type: string;
  language: string;
  provider: string;
  description?: string;
  previewUrl?: string;
}

interface AssistantRequest {
  id: number;
  user_id: number;
  assistant_name: string;
  assistant_type: string;
  language: string;
  description: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  assigned_assistant_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PhoneRequest {
  id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface AssistantEditRequest {
  id: number;
  user_id: number;
  assistant_id: string;
  assistant_name: string;
  updated_fields: any;
  files: any;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export default function MyAssistantsPage() {
  const { user } = useAuth();
  const t = useTranslations('assistants');
  const { requireMinuteBundle, isRestricted } = useMinuteBundleCheck();
  const {
    playVoice,
    stopVoice,
    isPlaying,
    isInitializing,
    error: voicePreviewError,
    volumeLevel
  } = useVoicePreview();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(
    null
  );
  const [viewMode, setViewMode] = useState<'grid' | 'details'>('grid');
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');

  const isOutboundAccount = user?.activeAccountType === 'outbound';
  const [hasActiveMinuteBundle, setHasActiveMinuteBundle] = useState(false);

  // Edit modals state
  const [editNameModalOpen, setEditNameModalOpen] = useState(false);
  const [editScriptModalOpen, setEditScriptModalOpen] = useState(false);
  const [editVoiceModalOpen, setEditVoiceModalOpen] = useState(false);
  // unified editor uses actionsAssistant instead
  const [editingAssistant] = useState<Assistant | null>(null);
  // Tracks the values when the modal was opened (live from ElevenLabs) for diff comparison
  const [editFormBaseline, setEditFormBaseline] = useState({
    name: '',
    description: '',
    scriptContent: '',
    firstMessage: '',
    voiceId: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    scriptContent: '',
    firstMessage: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Voice selection state
  const [availableVoices, setAvailableVoices] = useState<VapiVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [loadingAssistantData, setLoadingAssistantData] = useState(false);

  // Actions dialog state
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const [actionsAssistant, setActionsAssistant] = useState<Assistant | null>(
    null
  );

  // Assistant request state
  const [assistantRequests, setAssistantRequests] = useState<
    AssistantRequest[]
  >([]);
  const [phoneRequests, setPhoneRequests] = useState<PhoneRequest[]>([]);
  const [assistantEditRequests, setAssistantEditRequests] = useState<AssistantEditRequest[]>([]);
  const [newRequestDialogOpen, setNewRequestDialogOpen] = useState(false);
  const [editRequestDialogOpen, setEditRequestDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<AssistantRequest | null>(
    null
  );
  const [requestForm, setRequestForm] = useState({
    assistant_name: '',
    assistant_type: 'inbound',
    language: 'en',
    description: '',
    notes: '',
    first_message: '',
    script_content: '',
    voice_preference: 'no_preference'
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestFormErrors, setRequestFormErrors] = useState<{
    assistant_name?: string;
    first_message?: string;
    script_content?: string;
  }>({});

  // vapi voices for voice selection
  const [vapiAvailableVoices, setVapiAvailableVoices] = useState<VoiceData[]>(
    []
  );
  const [vapiLoadingVoices, setVapiLoadingVoices] = useState(true);
  const { filters, setFilters, filteredVoices } =
    useVoiceFilters(vapiAvailableVoices, selectedVoiceId);
  
  // Voice pagination state
  const [currentVoicePage, setCurrentVoicePage] = useState(1);
  const [voicesPerPage] = useState(12);
  const [totalVoices, setTotalVoices] = useState(0);
  const [hasMoreVoices, setHasMoreVoices] = useState(false);

  const [loadingMoreVoices, setLoadingMoreVoices] = useState(false);
  const [activeLanguageCode, setActiveLanguageCode] = useState<string>('all');
  const [activeGenderCode, setActiveGenderCode] = useState<string>('all');
  const [activeAccentCode, setActiveAccentCode] = useState<string>('all');
  const [allLanguages, setAllLanguages] = useState<{ value: string; count: number }[]>([]);
  const [availableAccents, setAvailableAccents] = useState<string[]>([]);

  // Derive display values from backend metadata
  const cachedLanguages = useMemo(() => allLanguages.map(l => langCodeToName(l.value)), [allLanguages]);
  const cachedLanguageCodes = useMemo(() => allLanguages.map(l => l.value), [allLanguages]);

  // File upload state for script files (left side)
  const [scriptFiles, setScriptFiles] = useState<File[]>([]);

  // Combined files for backward compatibility
  const uploadedFiles = scriptFiles;

  // Dropzone for script files (left side of modal)
  const {
    getRootProps: getScriptDropzoneProps,
    getInputProps: getScriptInputProps,
    isDragActive: isScriptDragActive
  } = useDropzone({
    onDropAccepted: (acceptedFiles) => {
      console.log('SCRIPT DROPZONE: Files accepted:', acceptedFiles);
      setScriptFiles(prev => [...prev, ...acceptedFiles]);
    },
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/zip': ['.zip'],
    },
    multiple: true,
    maxFiles: 5,
  });

  // Clear all uploaded files when modal closes
  const clearUploadedFiles = () => {
    setScriptFiles([]);
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please select files first!');
      return;
    }

    const formData = new FormData();
    uploadedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      alert(`Uploading ${uploadedFiles.length} file(s)...`);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Helper: submit an assistant edit request snapshot for admin review
  const submitEditRequestSnapshot = async () => {
    if (!editingAssistant) return;

    try {
      const formData = new FormData();
      formData.append('assistant_id', editingAssistant.id);
      formData.append('assistant_name', editingAssistant.name);
      formData.append(
        'updated_fields',
        JSON.stringify({
          script_content: editForm.scriptContent,
          first_message: editForm.firstMessage
        })
      );

      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });

      await fetch('/api/assistants/edit-requests', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      // We keep this silent for users; admins will see it in Edit Requests.
    } catch (error) {
      console.error('Failed to submit assistant edit request snapshot:', error);
    }
  };

  // Fetch active minute bundle status
  useEffect(() => {
    const fetchBundleStatus = async () => {
      try {
        const response = await fetch('/api/minutes/my-minutes');
        if (response.ok) {
          const data = await response.json();
          // Check multiple conditions:
          // 1. Has active bundles with remaining time
          // 2. Has total minutes > 0
          // 3. Has active packages
          const hasBundle = data.bundles?.some((bundle: { status: string; expires_at: string }) =>
            bundle.status === 'active' && new Date(bundle.expires_at) > new Date()
          ) || false;

          const hasMinutes = (data.totalMinutes || 0) > 0;

          const hasActivePackage = data.packages?.some((pkg: { status: string }) =>
            pkg.status === 'active'
          ) || false;

          // Consider user has active bundle if ANY of these conditions are true
          setHasActiveMinuteBundle(hasBundle || hasMinutes || hasActivePackage);
        }
      } catch (error) {
        console.error('Failed to fetch bundle status:', error);
        // On error, default to true to not block the user
        setHasActiveMinuteBundle(true);
      }
    };
    fetchBundleStatus();
  }, []);

  const [currentlyPlayingVoiceId, setCurrentlyPlayingVoiceId] = useState<
    string | null
  >(null);
  const [previouslyPlayingVoiceId, setPreviouslyPlayingVoiceId] = useState<
    string | null
  >(null);
  const [isStartingVoice, setIsStartingVoice] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // Ref for scrolling to current voice
  const voiceListRef = useRef<HTMLDivElement | null>(null);

  // Handle voice play/pause (supports both ElevenLabs audio URL and Vapi SDK)
  const handleVoicePlayPause = (voice: any) => {
    // If this voice is currently playing, stop it
    if (currentlyPlayingVoiceId === voice.id && (isPlaying || isAudioPlaying)) {
      setIsStartingVoice(false);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
        setIsAudioPlaying(false);
      } else {
        stopVoice();
      }
      setCurrentlyPlayingVoiceId(null);
      setPreviouslyPlayingVoiceId(voice.id);
      return;
    }

    // If another voice is playing, stop it first
    if (currentlyPlayingVoiceId && currentlyPlayingVoiceId !== voice.id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
        setIsAudioPlaying(false);
      } else {
        stopVoice();
      }
      setPreviouslyPlayingVoiceId(currentlyPlayingVoiceId);
    }

    // Start playing the new voice
    setIsStartingVoice(true);
    setCurrentlyPlayingVoiceId(voice.id);

    // ElevenLabs voices have a preview_url — play directly as audio
    if (voice.preview_url) {
  const audio = new Audio(voice.preview_url);
  audioPreviewRef.current = audio;

  audio.oncanplay = () => {
    setIsStartingVoice(false);
    setIsAudioPlaying(true);
  };

  audio.onended = () => {
    setCurrentlyPlayingVoiceId(null);
    setIsAudioPlaying(false);
    audioPreviewRef.current = null;
  };

  audio.onerror = () => {
    setCurrentlyPlayingVoiceId(null);
    setIsStartingVoice(false);
    setIsAudioPlaying(false);
  };

  audio.play().catch((err) => {
    console.error('Failed to play audio preview:', err);
    setCurrentlyPlayingVoiceId(null);
    setIsStartingVoice(false);
    setIsAudioPlaying(false);
  });
  return;
}

    // Fallback: use Vapi SDK for voice preview
    setTimeout(() => {
      playVoice(
        voice.id, // voiceId
        voice.name, // voiceName
        voice.provider // provider (defaults to '11labs' if not specified)
      ).catch((error) => {
        console.error('Failed to play voice:', error);
        setCurrentlyPlayingVoiceId(null);
        setIsStartingVoice(false);
      });
    }, 100);
  };

  useEffect(() => {
    // Only clear if we're sure playback has ended
    // Don't clear if we're in the process of starting a new voice (prevents race condition)
    if (
      !isPlaying &&
      !isAudioPlaying &&
      !isInitializing &&
      currentlyPlayingVoiceId &&
      !isStartingVoice
    ) {
      console.log('Voice stopped playing, clearing currentlyPlayingVoiceId');
      setCurrentlyPlayingVoiceId(null);
    }
  }, [isPlaying, isInitializing, currentlyPlayingVoiceId, isStartingVoice]);

  // Handle errors
  useEffect(() => {
    if (voicePreviewError) {
      console.error('Voice preview error:', voicePreviewError);
      // toast.error(voicePreviewError);

      // Clear playing state on error
      if (currentlyPlayingVoiceId) {
        setCurrentlyPlayingVoiceId(null);
      }
    }
  }, [voicePreviewError]);

  // Fetch user's assigned assistants
  const fetchAssistants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        '/api/assistants/my-assistants?sync_vapi=true',
        {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${user?.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch assistants');
      }

      const data = await response.json();
      // With Vapi-only architecture, all assistants are always synced
      setAssistants(data.assistants || []);

      // Auto-select default assistant if available
      const defaultAssistant = data.assistants?.find(
        (a: Assistant) => a.is_default
      );
      if (defaultAssistant) {
        setSelectedAssistant(defaultAssistant);
      }

      // sync status handled silently
    } catch (error) {
      // Don't toast — empty state is shown visually; new users have no assistants yet
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  // Fetch assistant requests
  const fetchAssistantRequests = async () => {
    try {
      const response = await fetch('/api/assistants/requests', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assistant requests');
      }
      const data = await response.json();
      setAssistantRequests(data.requests || []);
    } catch (error) { }
  };

  // Fetch phone number requests
  const fetchPhoneRequests = async () => {
    try {
      const response = await fetch('/api/phonenumbers/requests', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch phone number requests');
      }
      const data = await response.json();
      setPhoneRequests(data.requests || []);
    } catch (error) {
      // Silent fail – phone requests are non-critical for page load
    }
  };

  // Fetch assistant edit requests
  const fetchAssistantEditRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/assistants/edit-requests', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assistant edit requests');
      }
      const data = await response.json();
      setAssistantEditRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching assistant edit requests:', error);
      // Silent fail – edit requests are non-critical for page load
    }
  }, []);

  // Fetch available voices from Vapi with pagination
  const fetchAvailableVoices = useCallback(async (
    page = 1,
    append = false,
    languageCode?: string,
    genderCode?: string,
    accentCode?: string,
    silent = false,
  ) => {
    try {
      if (!append) {
        setLoadingVoices(true);
        setVapiLoadingVoices(true);
      } else {
        setLoadingMoreVoices(true);
      }

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(voicesPerPage));
      if (languageCode && languageCode !== 'all') {
        params.set('language', languageCode);
      }
      if (genderCode && genderCode !== 'all') {
        params.set('gender', genderCode);
      }
      if (accentCode && accentCode !== 'all') {
        params.set('accent', accentCode);
      }

      const response = await fetch(`/api/voices/available-vapi-voices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available voices');
      }

      const data = await response.json();
      const isElevenLabs = data.source === 'elevenlabs';
      // Transform the API response to match VoiceData type
      const transformedVoices: VoiceData[] = (data.voices || []).map(
        (voice: any) => ({
          id: voice.voice_id || voice.id,
          name: voice.name,
          provider: isElevenLabs ? 'elevenlabs' : (voice.provider || '11labs'),
          description: voice.description || voice.category,
          type: (voice.gender || voice.type || 'neutral') as 'male' | 'female',
          language: voice.language || 'en',
          accent: voice.accent || 'Standard',
          preview_url: voice.preview_url,
          bestFor: voice.accent || voice.description || 'General',
          public_owner_id: voice.public_owner_id || null,
        })
      );
      
      if (append) {
        setVapiAvailableVoices(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const newVoices = transformedVoices.filter(v => !existingIds.has(v.id));
          return [...prev, ...newVoices];
        });
      } else {
        setVapiAvailableVoices(transformedVoices);
      }

      // Read filter metadata from backend response
      if (data.filters?.available) {
        // Languages: only cache from initial unfiltered load (filtered responses only show the active language)
        if (!languageCode || languageCode === 'all') {
          setAllLanguages(data.filters.available.languages || []);
        }
        // Accents: always update (backend returns context-aware list scoped to active filters)
        setAvailableAccents((data.filters.available.accents || []).map((a: any) => a.value));
      }
      
      // Update pagination state
      if (data.pagination) {
        setTotalVoices(data.pagination.total);
        setHasMoreVoices(data.pagination.hasMore);
        setCurrentVoicePage(page);
      }
      
      // Also keep the raw voices with normalized id field
      const normalizedVoices = (data.voices || []).map((v: any) => ({
        ...v,
        id: v.voice_id || v.id,
        provider: isElevenLabs ? 'elevenlabs' : (v.provider || '11labs'),
        type: v.gender || v.type,
        public_owner_id: v.public_owner_id || null,
      }));
      
      if (append) {
        setAvailableVoices(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const newVoices = normalizedVoices.filter((v: any) => !existingIds.has(v.id));
          return [...prev, ...newVoices];
        });
      } else {
        setAvailableVoices(normalizedVoices);
      }

      if (data.source === 'default') {
        toast.info(t('messages.showingDefaultVoices'));
      }

      return {
        hasMore: data.pagination?.hasMore ?? false,
        page,
        voices: transformedVoices,
      };
    } catch (error) {
      if (!silent) toast.error(t('messages.failedToLoadVoices'));
      return { hasMore: false, page, voices: [] };
    } finally {
      setLoadingVoices(false);
      setVapiLoadingVoices(false);
      setLoadingMoreVoices(false);
    }
  }, [user?.token, voicesPerPage]);

  // We intentionally call specific loaders on auth change; deeper deps are managed inside
  useEffect(() => {
    if (user) {
      fetchAssistants();
      fetchAssistantRequests();
      fetchPhoneRequests();
      fetchAssistantEditRequests();
      // Ensure voices are available to resolve voiceId -> friendly name (silent — user hasn't asked)
      if (availableVoices.length === 0) {
        fetchAvailableVoices(1, false, undefined, undefined, undefined, true);
      }
    }
  }, [
    user,
    availableVoices.length,
    vapiAvailableVoices.length,
    fetchAssistants,
    fetchAvailableVoices
  ]);

  // Refresh edit requests when page becomes visible and periodically
  useEffect(() => {
    if (!user) return;

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAssistantEditRequests();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Poll every 30 seconds to catch status changes
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAssistantEditRequests();
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(pollInterval);
    };
  }, [user, fetchAssistantEditRequests]);

  // Fetch voices when dialog opens — filtering is client-side, no refetch on filter change
  useEffect(() => {
    if (actionsDialogOpen && vapiAvailableVoices.length === 0) {
      setCurrentVoicePage(1);
      fetchAvailableVoices(1, false);
    }
  }, [actionsDialogOpen]);

  // Handle new assistant request
  const handleCreateRequest = async () => {
    // Validate all required fields
    const errors: {
      assistant_name?: string;
      first_message?: string;
      script_content?: string;
    } = {};

    if (!requestForm.assistant_name.trim()) {
      errors.assistant_name = t('validation.assistantNameRequired');
    }

    if (!requestForm.first_message.trim()) {
      errors.first_message = t('validation.firstMessageRequired');
    }

    if (!requestForm.script_content.trim()) {
      errors.script_content = t('validation.scriptContentRequired');
    }

    if (Object.keys(errors).length > 0) {
      setRequestFormErrors(errors);
      // Show toast so user knows validation failed
      const errorMessages = Object.values(errors).filter(Boolean);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0]); // Show first error as toast
      }
      return;
    }

    setRequestFormErrors({});

    requireMinuteBundle(async () => {
      try {
        setSubmittingRequest(true);
        const response = await fetch('/api/assistants/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestForm)
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to submit request');
        }

        toast.success(t('request.submitSuccess'));
        setNewRequestDialogOpen(false);
        setRequestForm({
          assistant_name: '',
          assistant_type: 'inbound',
          language: 'en',
          description: '',
          notes: '',
          first_message: '',
          script_content: '',
          voice_preference: 'no_preference'
        });
        fetchAssistantRequests();
      } catch (error: any) {
        toast.error(error.message || 'Failed to submit request');
      } finally {
        setSubmittingRequest(false);
      }
    });
  };

  // Handle edit assistant request
  const handleEditRequest = async () => {
    if (!editingRequest) return;

    const errors: {
      assistant_name?: string;
      first_message?: string;
      script_content?: string;
    } = {};

    if (!requestForm.assistant_name.trim()) {
      errors.assistant_name = t('validation.assistantNameRequired');
    }

    if (!requestForm.first_message.trim()) {
      errors.first_message = t('validation.firstMessageRequired');
    }

    if (!requestForm.script_content.trim()) {
      errors.script_content = t('validation.scriptContentRequired');
    }

    if (Object.keys(errors).length > 0) {
      setRequestFormErrors(errors);
      return;
    }

    setRequestFormErrors({});

    try {
      setSubmittingRequest(true);
      const response = await fetch(
        `/api/assistants/requests/${editingRequest.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestForm)
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update request');
      }

      toast.success(t('request.updateSuccess'));
      setEditRequestDialogOpen(false);
      setEditingRequest(null);
      setRequestForm({
        assistant_name: '',
        assistant_type: 'inbound',
        language: 'en',
        description: '',
        notes: '',
        first_message: '',
        script_content: '',
        voice_preference: 'no_preference'
      });
      fetchAssistantRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Open edit request dialog
  const handleOpenEditRequest = (request: AssistantRequest) => {
    setEditingRequest(request);
    setRequestForm({
      assistant_name: request.assistant_name,
      assistant_type: request.assistant_type,
      language: request.language,
      description: request.description,
      notes: request.notes,
      first_message: '',
      script_content: '',
      voice_preference: 'no_preference'
    });
    setRequestFormErrors({});
    setEditRequestDialogOpen(true);
  };

  // Filter assistants based on search and filters
  const filteredAssistants = assistants.filter((assistant) => {
    const matchesSearch =
      assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assistant.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      assistant.assignment_type === filterType ||
      (filterType === 'both' && assistant.assignment_type === 'both');

    return matchesSearch && matchesType;
  });

  // Save assistant name and description
  const handleSaveName = async () => {
    if (!editingAssistant) return;

    if (!editForm.name.trim()) {
      toast.error(t('messages.nameRequired'));
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/assistants/${editingAssistant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update assistant');
      }

      toast.success('Assistant updated successfully!');
      setEditNameModalOpen(false);
      fetchAssistants();
    } catch (error) {
      // error
      toast.error(
        error instanceof Error ? error.message : 'Failed to update assistant'
      );
    } finally {
      setSaving(false);
    }
  };

  // Save script content - Updates directly in Vapi
  const handleSaveScript = async () => {
    if (!editingAssistant) return;

    if (!editForm.scriptContent.trim()) {
      toast.error(t('messages.scriptRequired'));
      return;
    }

    try {
      setSaving(true);

      // Update assistant directly in Vapi
      const response = await fetch(`/api/assistants/${editingAssistant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          model: {
            provider: editingAssistant.model?.provider || 'openai',
            model: editingAssistant.model?.model || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: editForm.scriptContent
              }
            ]
          },
          firstMessage: editForm.firstMessage || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update script in Vapi');
      }

      // Also send an edit-request snapshot to admin side
      await submitEditRequestSnapshot();

      toast.success(t('edit.scriptUpdated'));
      setEditScriptModalOpen(false);
      fetchAssistants();
    } catch (error) {
      // error
      toast.error(
        error instanceof Error ? error.message : 'Failed to update script'
      );
    } finally {
      setSaving(false);
    }
  };

  // removed unused handleEditVoiceClick (unified editor now)

  // Save voice selection - Updates directly in Vapi
  const handleSaveVoice = async () => {
    if (!editingAssistant) return;

    if (!selectedVoiceId) {
      toast.error(t('edit.pleaseSelectVoice'));
      return;
    }

    try {
      setSaving(true);

      // Find the selected voice details
      const selectedVoice = availableVoices.find(
        (v) => v.id === selectedVoiceId
      );

      // Update assistant directly in Vapi
      const response = await fetch(`/api/assistants/${editingAssistant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          voice: {
            provider: selectedVoice?.provider || '11labs',
            voiceId: selectedVoiceId
          }
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update voice in Vapi');
      }

      toast.success(t('edit.voiceUpdated'));
      setEditVoiceModalOpen(false);
      fetchAssistants();
    } catch (error) {
      // error
      toast.error(
        error instanceof Error ? error.message : 'Failed to update voice'
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle actions dialog
  const handleOpenActions = async (assistant: Assistant) => {
    setActionsAssistant(assistant);

    // Set initial local data immediately
    const localScript = assistant.default_script?.content || assistant.model?.messages?.[0]?.content || '';
    const localVoiceId = assistant.default_voice?.vapi_voice_id || assistant.voice?.voiceId || '';
    const initialForm = {
      name: assistant.name || '',
      description: assistant.description || '',
      scriptContent: localScript,
      firstMessage: assistant.firstMessage || ''
    };

    setEditForm(initialForm);
    setSelectedVoiceId(localVoiceId);
    setEditFormBaseline({ ...initialForm, voiceId: localVoiceId });

    // Open modal immediately with local data
    setActionsDialogOpen(true);
    setCurrentVoicePage(1); // Reset pagination when opening dialog

    // Fetch live ElevenLabs config asynchronously (non-blocking)
    if (assistant.agent_id) {
      setLoadingAssistantData(true);
      fetch(`/api/assistants/${assistant.id}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${user?.token}` }
      })
        .then(resp => resp.ok ? resp.json() : null)
        .then(data => {
          if (data?.assistant?.elevenlabs_config) {
            const cfg = data.assistant.elevenlabs_config;
            const updatedForm = {
              name: assistant.name || '',
              description: assistant.description || '',
              scriptContent: cfg.systemPrompt || localScript,
              firstMessage: cfg.firstMessage || ''
            };
            const updatedVoiceId = cfg.voiceId || localVoiceId;
            
            setEditForm(updatedForm);
            setSelectedVoiceId(updatedVoiceId);
            setEditFormBaseline({ ...updatedForm, voiceId: updatedVoiceId });
          }
        })
        .catch(() => {
          // Keep local data on error
        })
        .finally(() => {
          setLoadingAssistantData(false);
        });
    }

    // Fetch voices asynchronously (non-blocking)
    const voiceIdToInclude = localVoiceId || '';
    if (voiceIdToInclude) {
      setLoadingVoices(true);
      setVapiLoadingVoices(true);
      
      fetch(`/api/voices/available-vapi-voices?include_voice_id=${encodeURIComponent(voiceIdToInclude)}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      })
        .then(response => response.ok ? response.json() : null)
        .then(data => {
          if (data) {
            const isElevenLabs = data.source === 'elevenlabs';
            const transformedVoices: VoiceData[] = (data.voices || []).map(
              (voice: any) => ({
                id: voice.voice_id || voice.id,
                name: voice.name,
                provider: isElevenLabs ? 'elevenlabs' : (voice.provider || '11labs'),
                description: voice.description || voice.category,
                type: (voice.gender || voice.type || 'neutral') as 'male' | 'female',
                language: voice.language || 'en',
                accent: voice.accent || 'Standard',
                preview_url: voice.preview_url,
                bestFor: voice.accent || voice.description || 'General',
                public_owner_id: voice.public_owner_id || null,
              })
            );
            setVapiAvailableVoices(transformedVoices);
            const normalizedVoices = (data.voices || []).map((v: any) => ({
              ...v,
              id: v.voice_id || v.id,
              provider: isElevenLabs ? 'elevenlabs' : (v.provider || '11labs'),
              type: v.gender || v.type,
              public_owner_id: v.public_owner_id || null,
            }));
            setAvailableVoices(normalizedVoices);
          }
        })
        .catch(error => {
          console.error('Failed to fetch voices with current voice ID:', error);
        })
        .finally(() => {
          setLoadingVoices(false);
          setVapiLoadingVoices(false);
        });
    } else {
      // No current voice, just fetch normally (also non-blocking)
      fetchAvailableVoices();
    }
  };

  const getVoiceDisplayName = (a?: Assistant | null) => {
    if (!a) return t('card.notSet');
    const explicitName = a.voice?.name || a.default_voice?.name;
    if (explicitName) return explicitName;
    const id = a.voice?.voiceId || a.default_voice?.vapi_voice_id;
    if (!id) return t('card.notSet');
    const found = availableVoices.find((v) => v.id === id);
    if (found?.name) return found.name;
    if (availableVoices.length === 0) {
      return loadingVoices ? t('card.loading') : id || t('card.notSet');
    }
    return id || t('card.notSet');
  };

  // NOTE: early loading return removed — wizard must stay mounted at all times
  // to preserve form state across fetchAssistants() loading cycles.

  return (
    <PageContainer scrollable>
      <div className='mx-auto w-full max-w-7xl space-y-6'>
        {/* Header */}
        <div
          className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'
          data-tour='page-header'
        >
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              {t('myAssistants')}
            </h1>
            <p className='text-muted-foreground'>
              {t('myAssistantsDescription')} ({assistants.length} {t('total')})
            </p>
          </div>
          <div className='flex flex-wrap gap-2' data-tour='create-assistant'>
            <div
              className={isRestricted ? 'cursor-not-allowed' : ''}
              onClick={isRestricted ? () => requireMinuteBundle(() => { }) : undefined}
            >
              <Button
                variant='default'
                size='sm'
                disabled={isRestricted}
                className={isRestricted ? 'pointer-events-none opacity-50' : ''}
                onClick={isRestricted ? undefined : () => {
                  setActiveLanguageCode('all');
                  setActiveGenderCode('all');
                  setActiveAccentCode('all');
                  setCurrentVoicePage(1);
                  fetchAvailableVoices(1, false, 'all', 'all', 'all');
                  setNewRequestDialogOpen(true);
                }}
              >
                <Plus className='mr-2 h-4 w-4' />
                {t('request.requestNew')}
              </Button>
            </div>
            <div
              className={isRestricted ? 'cursor-not-allowed' : ''}
              onClick={isRestricted ? () => requireMinuteBundle(() => { }) : undefined}
            >
              <Button
                variant='outline'
                size='sm'
                disabled={phoneRequests.some((req) => req.status === 'pending') || isRestricted}
                className={isRestricted ? 'pointer-events-none opacity-50' : ''}
                onClick={isRestricted ? undefined : async () => {
                  try {
                    const response = await fetch('/api/phonenumbers/requests', {
                      method: 'POST',
                      credentials: 'include',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({})
                    });

                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.message || t('request.phoneRequestFailed'));
                    }

                    toast.success(t('request.phoneRequestSubmitted'));
                    fetchPhoneRequests();
                  } catch (error: any) {
                    toast.error(error.message || t('request.phoneRequestFailed'));
                  }
                }}
              >
                <Phone className='mr-2 h-4 w-4' />
                {t('request.requestPhoneNumber')}
              </Button>
            </div>
          </div>
        </div>

        {/* Inline loading indicator — replaces old early-return spinner */}
        {loading && (
          <div className='flex min-h-[200px] items-center justify-center'>
            <div className='text-center'>
              <div className='border-primary mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2' />
              <p className='text-muted-foreground text-sm'>{t('myAssistantsDescription')}...</p>
            </div>
          </div>
        )}

        {/* Billing status banner */}
        <NewUserBanner navigateToBilling showWelcome={false} />

        {/* Stats */}
        <div
          className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
          data-tour='assistants-grid'
        >
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('stats.myAssistants')}
              </CardTitle>
              <Bot className='text-primary h-5 w-5' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{assistants.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('stats.totalScripts')}
              </CardTitle>
              <FileText className='text-primary h-5 w-5' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {assistants.reduce((sum, a) => sum + (a.scripts_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {t('stats.totalVoices')}
              </CardTitle>
              <Mic className='text-primary h-5 w-5' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {assistants.reduce((sum, a) => sum + (a.voices_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div
          className='flex flex-col gap-3 sm:flex-row'
          data-tour='search-filter'
        >
          <div className='w-full sm:w-1/2 lg:w-1/3'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
              <Input
                placeholder={t('filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder={t('filters.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('filters.allTypes')}</SelectItem>
              <SelectItem value='inbound'>{t('filters.inbound')}</SelectItem>
              <SelectItem value='outbound' disabled className='opacity-50'>
                {t('filters.outbound')} ({t('filters.comingSoon')})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className='flex justify-start gap-2'>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className='h-4 w-4' />
          </Button>
          <Button
            variant={viewMode === 'details' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('details')}
          >
            <List className='h-4 w-4' />
          </Button>
        </div>

        {/* Assistants Display */}
        {assistants.length === 0 && assistantRequests.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='p-12 text-center'>
              <div className='mx-auto mb-6 w-fit rounded-full bg-blue-100 p-4'>
                <Bot className='h-12 w-12 text-blue-600' />
              </div>
              <h3 className='mb-3 text-2xl font-semibold'>
                {t('noAssistantsAssigned.title')}
              </h3>
              <p className='text-muted-foreground mx-auto mb-6 max-w-md'>
                {t('noAssistantsAssigned.description')}
              </p>
              <Alert className='mx-auto max-w-lg border-blue-200 bg-blue-50'>
                <AlertCircle className='h-4 w-4 text-blue-600' />
                <AlertDescription className='text-blue-800 text-left'>
                  <strong>{t('noAssistantsAssigned.needAssistants')}</strong>{' '}
                  {t('noAssistantsAssigned.needAssistantsDescription')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {/* Active Assistants First */}
            {filteredAssistants.map((assistant) => {
              const hasPendingEditRequest = assistantEditRequests.some(
                (req) => String(req.assistant_id) === String(assistant.id) && req.status === 'pending'
              );
              
              return (
              <Card
                key={assistant.id}
                className={`from-primary/40 cursor-pointer rounded-lg bg-gradient-to-br to-white transition-all hover:shadow-lg dark:to-gray-900/50 ${selectedAssistant?.id === assistant.id
                  ? 'border-primary shadow-lg'
                  : 'hover:border-muted'
                  }`}
                onClick={() => setSelectedAssistant(assistant)}
              >
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='min-w-0 flex-1'>
                      <CardTitle className='mb-2 flex items-center gap-2 text-xl'>
                        <span className='truncate'>{assistant.name}</span>
                        {assistant.is_default && (
                          <Crown className='h-5 w-5 flex-shrink-0 text-yellow-500' />
                        )}
                      </CardTitle>
                      {hasPendingEditRequest && (
                        <Badge variant='outline' className='border-blue-300 bg-blue-100 text-xs text-blue-800 mb-2'>
                          {t('request.editRequestSent')}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenActions(assistant);
                      }}
                    >
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Phone Number assigned to this assistant */}
                  {assistant.phone_number ? (
                    <div className='bg-muted dark:bg-muted/60 flex items-center justify-between rounded-lg border p-3'>
                      <div className='flex items-center gap-2'>
                        <Phone className='text-primary h-4 w-4 shrink-0' />
                        <span className='font-mono text-sm font-semibold'>
                          {assistant.phone_number.phone_number || assistant.phone_number.alias_number}
                        </span>
                      </div>
                      <Badge variant='outline' className='shrink-0'>{t('card.active')}</Badge>
                    </div>
                  ) : (
                    <div className='bg-muted/40 dark:bg-muted/20 flex items-center gap-2 rounded-lg border border-dashed p-3'>
                      <Phone className='text-muted-foreground h-4 w-4 shrink-0' />
                      <span className='text-muted-foreground text-sm'>{t('card.noPhoneAssigned')}</span>
                    </div>
                  )}

                  {/* Key Information Grid */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <div className='text-muted-foreground mb-1 text-sm'>
                        {t('card.type')}
                      </div>
                      <div className='text-lg font-semibold capitalize'>
                        {assistant.assignment_type || t('filters.both')}
                      </div>
                    </div>
                    <div>
                      <div className='text-muted-foreground mb-1 text-sm'>
                        {t('card.language')}
                      </div>
                      <div className='text-lg font-semibold uppercase'>
                        {assistant.language || 'EN'}
                      </div>
                    </div>
                  </div>

                  {/* Voice & Script Info */}
                  <div className='space-y-3 border-t pt-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Mic className='text-muted-foreground h-4 w-4' />
                        <span className='text-muted-foreground text-sm'>
                          {t('card.voice')}
                        </span>
                      </div>
                      <span className='text-sm font-medium'>
                        {getVoiceDisplayName(assistant)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <FileText className='text-muted-foreground h-4 w-4' />
                        <span className='text-muted-foreground text-sm'>
                          {t('card.script')}
                        </span>
                      </div>
                      <span className='text-sm font-medium'>
                        {assistant.default_script?.name || t('card.default')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}

            {/* Pending Phone Number Request Card */}
            {phoneRequests.some((req) => req.status === 'pending') && (
              <Card className='relative border-dashed bg-white'>
                <div className='absolute top-4 right-4 rounded-full bg-white p-2 shadow-md'>
                  <Lock className='text-muted-foreground h-6 w-6' />
                </div>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='min-w-0 flex-1'>
                      <CardTitle className='mb-2 flex items-center gap-2 text-xl'>
                        <Phone className='h-5 w-5 text-primary' />
                        <span className='truncate'>{t('card.phoneNumbers')}</span>
                      </CardTitle>
                      <Badge
                        variant='outline'
                        className='border-yellow-300 bg-yellow-100 text-yellow-800'
                      >
                        {t('request.underReview')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <p className='text-sm text-muted-foreground'>
                    {t('request.phoneRequestReviewDescription')}
                  </p>
                  <Alert className='border-yellow-200 bg-yellow-50'>
                    <AlertCircle className='h-4 w-4 text-yellow-600' />
                    <AlertDescription className='text-sm text-yellow-800'>
                      {t('request.phoneRequestNotification')}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Pending Assistant Requests */}
            {assistantRequests
              .filter((req) => req.status === 'pending')
              .map((request) => (
                <Card
                  key={`request-${request.id}`}
                  className='relative border-dashed bg-white'
                >
                  <div className='absolute top-4 right-4 rounded-full bg-white p-2 shadow-md'>
                    <Lock className='text-muted-foreground h-6 w-6' />
                  </div>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div className='min-w-0 flex-1'>
                        <CardTitle className='mb-2 flex items-center gap-2 text-xl'>
                          <span className='truncate'>
                            {request.assistant_name}
                          </span>
                        </CardTitle>
                        <Badge
                          variant='outline'
                          className='border-yellow-300 bg-yellow-100 text-yellow-800'
                        >
                          {t('request.underReview')}
                        </Badge>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 opacity-50'
                        disabled
                        aria-label='Editing disabled until approved'
                      >
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <div className='text-muted-foreground mb-1 text-sm'>
                          {t('card.type')}
                        </div>
                        <div className='text-lg font-semibold capitalize'>
                          {request.assistant_type}
                        </div>
                      </div>
                      <div>
                        <div className='text-muted-foreground mb-1 text-sm'>
                          {t('card.language')}
                        </div>
                        <div className='text-lg font-semibold uppercase'>
                          {request.language}
                        </div>
                      </div>
                    </div>
                    {request.description && (
                      <div>
                        <div className='text-muted-foreground mb-1 text-sm'>
                          {t('description')}
                        </div>
                        <p className='text-sm'>{request.description}</p>
                      </div>
                    )}
                    <Alert className='border-yellow-200 bg-yellow-50'>
                      <AlertCircle className='h-4 w-4 text-yellow-600' />
                      <AlertDescription className='text-sm text-yellow-800'>
                        {t('request.pendingApproval')}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          /* Details View */
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            {/* Assistant List */}
            <div className='lg:col-span-1'>
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <Bot className='text-primary h-6 w-6' />
                    {t('card.assistantList')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
                  <div className='space-y-1'>
                    {/* Active Assistants */}
                    {filteredAssistants.map((assistant) => {
                      const hasPendingEditRequest = assistantEditRequests.some(
                        (req) => String(req.assistant_id) === String(assistant.id) && req.status === 'pending'
                      );
                      
                      return (
                      <div
                        key={assistant.id}
                        className={`cursor-pointer border-l-4 p-3 transition-colors ${selectedAssistant?.id === assistant.id
                          ? 'bg-primary/5 border-l-primary'
                          : 'hover:bg-muted/50 border-l-transparent'
                          }`}
                        onClick={() => setSelectedAssistant(assistant)}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='truncate font-medium'>
                              {assistant.name}
                            </span>
                            {assistant.is_default && (
                              <Crown className='h-4 w-4 flex-shrink-0 text-yellow-500' />
                            )}
                          </div>
                        </div>
                        <div className='mt-2 flex items-center gap-2'>
                          <Badge variant='outline' className='text-xs'>
                            {assistant.assignment_type || 'both'}
                          </Badge>
                          {hasPendingEditRequest && (
                            <Badge variant='outline' className='border-blue-300 bg-blue-100 text-xs text-blue-800'>
                              {t('request.editRequestSent')}
                            </Badge>
                          )}
                          <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                            {assistant.phone_number ? 1 : 0}{' '}
                            {assistant.phone_number ? t('card.phone') : t('card.phones')}
                          </div>
                        </div>
                      </div>
                    );
                    })}

                    {/* Pending Requests */}
                    {assistantRequests
                      .filter((req) => req.status === 'pending')
                      .map((request) => (
                        <div
                          key={`request-${request.id}`}
                          className='border-l-4 border-l-yellow-400 bg-white p-3 opacity-75'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <Lock className='text-muted-foreground h-4 w-4' />
                              <span className='truncate text-sm font-medium'>
                                {request.assistant_name}
                              </span>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0 opacity-50'
                              disabled
                              aria-label='Editing disabled until approved'
                            >
                              <Lock className='h-3 w-3' />
                            </Button>
                          </div>
                          <div className='mt-2 flex items-center gap-2'>
                            <Badge
                              variant='outline'
                              className='border-yellow-300 bg-yellow-100 text-xs text-yellow-800'
                            >
                              {t('request.underReview')}
                            </Badge>
                            <Badge variant='outline' className='text-xs'>
                              {request.assistant_type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assistant Details */}
            <div className='lg:col-span-2'>
              {selectedAssistant ? (
                <div className='space-y-6'>
                  {/* Assistant Info */}
                  <Card className='from-primary/40 border-primary rounded-lg bg-gradient-to-br to-white shadow-lg dark:to-gray-900/50'>
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <CardTitle className='mb-2 flex items-center gap-2 text-2xl'>
                            {selectedAssistant.name}
                            {selectedAssistant.is_default && (
                              <Crown className='h-6 w-6 text-yellow-500' />
                            )}
                          </CardTitle>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleOpenActions(selectedAssistant)}
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          {t('editAssistant')}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      {/* Phone Number assigned to this assistant */}
                      {selectedAssistant.phone_number ? (
                        <div className='bg-muted dark:bg-muted/60 flex items-center justify-between rounded-lg border p-3'>
                          <div className='flex items-center gap-2'>
                            <Phone className='text-primary h-4 w-4 shrink-0' />
                            <span className='font-mono text-sm font-semibold'>
                              {selectedAssistant.phone_number.phone_number || selectedAssistant.phone_number.alias_number}
                            </span>
                          </div>
                          <Badge variant='outline' className='shrink-0'>{t('card.active')}</Badge>
                        </div>
                      ) : (
                        <div className='bg-muted/40 dark:bg-muted/20 flex items-center gap-2 rounded-lg border border-dashed p-3'>
                          <Phone className='text-muted-foreground h-4 w-4 shrink-0' />
                          <span className='text-muted-foreground text-sm'>{t('card.noPhoneAssigned')}</span>
                        </div>
                      )}

                      {/* Key Information Grid */}
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <div className='text-muted-foreground mb-1 text-sm'>
                            {t('card.type')}
                          </div>
                          <div className='text-lg font-semibold capitalize'>
                            {selectedAssistant.assignment_type || 'Both'}
                          </div>
                        </div>
                        <div>
                          <div className='text-muted-foreground mb-1 text-sm'>
                            {t('card.language')}
                          </div>
                          <div className='text-lg font-semibold uppercase'>
                            {selectedAssistant.language || 'EN'}
                          </div>
                        </div>
                      </div>

                      {/* Voice & Script Info */}
                      <div className='space-y-3 border-t pt-3'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <Mic className='text-muted-foreground h-4 w-4' />
                            <span className='text-muted-foreground text-sm'>
                              {t('card.voice')}
                            </span>
                          </div>
                          <span className='text-sm font-medium'>
                            {getVoiceDisplayName(selectedAssistant)}
                          </span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <FileText className='text-muted-foreground h-4 w-4' />
                            <span className='text-muted-foreground text-sm'>
                              {t('card.script')}
                            </span>
                          </div>
                          <span className='text-sm font-medium'>
                            {selectedAssistant.default_script?.name ||
                              'Default'}
                          </span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <BarChart3 className='text-muted-foreground h-4 w-4' />
                            <span className='text-muted-foreground text-sm'>
                              {t('card.model')}
                            </span>
                          </div>
                          <span className='text-sm font-medium'>
                            {selectedAssistant.model?.model || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* VAPI ID - Less Prominent */}
                      <div className='border-t pt-3'>
                        <div className='text-muted-foreground mb-1 text-xs'>
                          {t('card.vapiAssistantId')}
                        </div>
                        <code className='text-muted-foreground font-mono text-xs'>
                          {selectedAssistant.id}
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className='border-dashed'>
                  <CardContent className='p-12 text-center'>
                    <div className='bg-muted/50 mx-auto mb-4 w-fit rounded-full p-3'>
                      <Eye className='text-muted-foreground h-8 w-8' />
                    </div>
                    <h3 className='mb-2 text-xl font-semibold'>
                      {t('card.selectAssistant')}
                    </h3>
                    <p className='text-muted-foreground mx-auto max-w-sm'>
                      {t('card.selectAssistantDescription')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Name Modal */}
      <Dialog open={editNameModalOpen} onOpenChange={setEditNameModalOpen}>
        <DialogContent className='flex h-[85vh] max-h-[85vh] flex-col sm:max-w-[500px]'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle>{t('edit.editNameTitle')}</DialogTitle>
          </DialogHeader>
          <div className='flex-1 space-y-4 overflow-y-auto py-4'>
            <Alert className='border-blue-200 bg-blue-50'>
              <AlertCircle className='h-4 w-4 text-blue-600' />
              <AlertDescription className='text-sm text-blue-900'>
                {t('edit.editing', { name: editingAssistant?.name })}
              </AlertDescription>
            </Alert>

            <div className='space-y-2'>
              <Label htmlFor='edit-name'>{t('edit.assistantNameLabel')}</Label>
              <Input
                id='edit-name'
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder={t('edit.editNamePlaceholder')}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-description'>{t('description')}</Label>
              <Textarea
                id='edit-description'
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder={t('edit.editDescriptionPlaceholder')}
                rows={3}
              />
              <p className='text-muted-foreground text-xs'>
                {editForm.description
                  ? t('edit.descriptionCharCount', {
                    count: editForm.description.length
                  })
                  : t('edit.noDescription')}
              </p>
            </div>
          </div>
          <DialogFooter className='flex-shrink-0 border-t pt-4'>
            <Button
              variant='outline'
              onClick={() => setEditNameModalOpen(false)}
              disabled={saving}
            >
              {t('request.cancel')}
            </Button>
            <Button onClick={handleSaveName} disabled={saving}>
              <Save className='mr-2 h-4 w-4' />
              {saving ? t('edit.saving') : t('edit.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Script Modal */}
      <Dialog open={editScriptModalOpen} onOpenChange={setEditScriptModalOpen}>
        <DialogContent className='flex h-[85vh] max-h-[85vh] flex-col sm:max-w-[700px]'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle>
              {t('edit.editScriptTitle', {
                name: editingAssistant?.name || ''
              })}
            </DialogTitle>
          </DialogHeader>
          <div className='flex-1 space-y-4 overflow-y-auto py-4'>
            <Alert className='border-blue-200 bg-blue-50'>
              <AlertCircle className='h-4 w-4 text-blue-600' />
              <AlertDescription className='text-blue-900'>
                <strong>{t('edit.autoSyncDescription')}</strong>
                {editingAssistant?.default_script && (
                  <div className='mt-2 text-sm'>
                    {t('edit.editingScript', {
                      name: editingAssistant.default_script.name,
                      type: editingAssistant.default_script.script_type
                    })}
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <div className='space-y-2'>
              <Label htmlFor='edit-script-content'>
                {t('edit.scriptContentLabel')}
              </Label>
              <Textarea
                id='edit-script-content'
                value={editForm.scriptContent}
                onChange={(e) =>
                  setEditForm({ ...editForm, scriptContent: e.target.value })
                }
                placeholder={t('edit.scriptContentPlaceholder')}
                rows={10}
                className='font-mono text-sm'
              />
              <div className='text-muted-foreground flex items-center justify-between text-xs'>
                <span>
                  {t('edit.scriptContentNote')}
                </span>
                <span>{t('edit.descriptionCharCount', { count: editForm.scriptContent.length })}</span>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-first-message'>
                {t('edit.firstMessageLabel')}
              </Label>
              <Textarea
                id='edit-first-message'
                value={editForm.firstMessage}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstMessage: e.target.value })
                }
                placeholder={t('edit.firstMessagePlaceholder')}
                rows={3}
              />
              <p className='text-muted-foreground text-xs'>
                {t('edit.firstMessageDescription')}
              </p>
            </div>
          </div>
          <DialogFooter className='flex-shrink-0 border-t pt-4'>
            <Button
              variant='outline'
              onClick={() => setEditScriptModalOpen(false)}
              disabled={saving}
            >
              {t('request.cancel')}
            </Button>
            <Button onClick={handleSaveScript} disabled={saving}>
              <Save className='mr-2 h-4 w-4' />
              {saving ? t('edit.savingAndSyncing') : t('edit.saveAndSync')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Voice Modal */}
      <Dialog
        open={editVoiceModalOpen}
        onOpenChange={(open) => {
          setEditVoiceModalOpen(open);
          if (!open && isPlaying) {
            try {
              stopVoice();
            } catch { }
          }
        }}
      >
        <DialogContent className='flex h-[85vh] max-h-[85vh] flex-col sm:max-w-[600px]'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle>
              {t('edit.changeVoiceTitle', {
                name: editingAssistant?.name || ''
              })}
            </DialogTitle>
          </DialogHeader>
          <div className='flex-1 space-y-4 overflow-y-auto py-4'>
            <Alert className='border-blue-200 bg-blue-50'>
              <AlertCircle className='h-4 w-4 text-blue-600' />
              <AlertDescription className='text-blue-900'>
                <strong>{t('edit.voiceSelectionDescription')}</strong>
                {editingAssistant?.default_voice &&
                  (() => {
                    const currentVoiceId =
                      editingAssistant.default_voice.vapi_voice_id;
                    const matchedVoice = availableVoices.find(
                      (v) => v.id === currentVoiceId
                    );
                    const displayName = matchedVoice
                      ? matchedVoice.name
                      : editingAssistant.default_voice.name;
                    return (
                      <div className='mt-2 text-sm'>
                        {t('edit.currentVoice', { name: displayName })}
                        {matchedVoice && matchedVoice.type && (
                          <Badge variant='outline' className='ml-2 text-xs'>
                            {matchedVoice.type}
                          </Badge>
                        )}
                      </div>
                    );
                  })()}
              </AlertDescription>
            </Alert>

            <div className='space-y-2'>
              <Label htmlFor='voice-select'>{t('edit.selectVoice')}</Label>
              {loadingVoices ? (
                <div className='flex items-center justify-center p-4'>
                  <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2'></div>
                  <span className='text-muted-foreground ml-2 text-sm'>
                    {t('edit.loadingVoices')}
                  </span>
                </div>
              ) : (
                <Select
                  value={selectedVoiceId}
                  onValueChange={setSelectedVoiceId}
                >
                  <SelectTrigger id='voice-select'>
                    <SelectValue placeholder={t('edit.selectVoicePlaceholder')}>
                      {selectedVoiceId &&
                        (() => {
                          const selectedVoice = availableVoices.find(
                            (v) => v.id === selectedVoiceId
                          );
                          return selectedVoice ? (
                            <div className='flex items-center gap-2'>
                              <Mic className='h-3 w-3' />
                              <span>{selectedVoice.name}</span>
                              {selectedVoice.type && (
                                <Badge
                                  variant='outline'
                                  className='ml-2 text-xs'
                                >
                                  {selectedVoice.type}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            selectedVoiceId
                          );
                        })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className='flex items-center gap-2'>
                          <Mic className='h-3 w-3' />
                          <span>{voice.name}</span>
                          {voice.type && (
                            <Badge variant='outline' className='ml-2 text-xs'>
                              {voice.type}
                            </Badge>
                          )}
                          {voice.language && voice.language !== 'en' && (
                            <span className='text-muted-foreground text-xs'>
                              ({voice.language})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className='text-muted-foreground text-xs'>
                {t('edit.voicesAvailable', { count: availableVoices.length })}
              </p>
            </div>

            {/* Voice Preview */}
            {selectedVoiceId && availableVoices.length > 0 && (
              <div className='bg-muted/50 space-y-2 rounded-lg p-4'>
                <div className='text-sm font-medium'>
                  {t('edit.selectedVoicePreview')}
                </div>
                {(() => {
                  const voice = availableVoices.find(
                    (v) => v.id === selectedVoiceId
                  );
                  return voice ? (
                    <>
                      <div className='grid grid-cols-2 gap-2 text-sm'>
                        <div>
                          <span className='text-muted-foreground'>
                            {t('edit.name')}
                          </span>
                          <span className='ml-2 font-medium'>{voice.name}</span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>
                            {t('edit.type')}
                          </span>
                          <span className='ml-2 font-medium capitalize'>
                            {voice.type || 'neutral'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>
                            {t('edit.language')}
                          </span>
                          <span className='ml-2 font-medium'>
                            {voice.language?.toUpperCase() || 'EN'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>
                            {t('edit.provider')}
                          </span>
                          <span className='ml-2 font-medium'>
                            {voice.provider || '11labs'}
                          </span>
                        </div>
                        {voice.description && (
                          <div className='col-span-2'>
                            <span className='text-muted-foreground'>
                              {t('edit.descriptionLabel')}
                            </span>
                            <p className='mt-1 text-xs'>{voice.description}</p>
                          </div>
                        )}
                      </div>

                      {/* Test Voice Button */}
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          if (isPlaying) {
                            stopVoice();
                          } else {
                            playVoice(voice.id, voice.name, voice.provider);
                          }
                        }}
                        disabled={isInitializing}
                        className='w-full'
                      >
                        {isInitializing ? (
                          <>
                            <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current'></div>
                            {t('edit.connecting')}
                          </>
                        ) : isPlaying ? (
                          <>
                            <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current'></div>
                            {t('edit.playing')}
                          </>
                        ) : (
                          <>{t('edit.testVoice')}</>
                        )}
                      </Button>

                      {voicePreviewError && (
                        <Alert variant='destructive'>
                          <AlertCircle className='h-4 w-4' />
                          <AlertDescription className='text-xs'>
                            {voicePreviewError}
                          </AlertDescription>
                        </Alert>
                      )}

                      <p className='text-muted-foreground text-center text-xs'>
                        {t('edit.previewNote')}
                      </p>
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </div>
          <DialogFooter className='flex-shrink-0 border-t pt-4'>
            <Button
              variant='outline'
              onClick={() => setEditVoiceModalOpen(false)}
              disabled={saving}
            >
              {t('request.cancel')}
            </Button>
            <Button
              onClick={handleSaveVoice}
              disabled={saving || !selectedVoiceId}
            >
              <Save className='mr-2 h-4 w-4' />
              {saving ? t('edit.savingVoice') : t('edit.saveVoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actions Dialog */}
      <Dialog
        open={actionsDialogOpen}
        modal={true}
        onOpenChange={(open) => {
          if (!open) {
            setActionsDialogOpen(false);
            clearUploadedFiles();
            // Stop audio preview (direct Audio element)
            if (audioPreviewRef.current) {
              audioPreviewRef.current.pause();
              audioPreviewRef.current = null;
              setIsAudioPlaying(false);
            }
            // Stop Vapi SDK voice preview
            if (isPlaying) {
              try { stopVoice(); } catch { }
            }
            setCurrentlyPlayingVoiceId(null);
            setIsStartingVoice(false);
          }
        }}
      >
        <DialogContent
          className='flex h-[90vh] max-h-[90vh] min-w-[95vw] flex-col'
          onInteractOutside={(e) => {
            // Prevent modal from closing when file picker opens
            e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            // Prevent modal from closing on any pointer down outside
            e.preventDefault();
          }}
          onFocusOutside={(e) => {
            // Prevent modal from closing when focus leaves (e.g., to file picker)
            e.preventDefault();
          }}
        >
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle className='text-2xl'>
              {t('edit.editAssistantTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('edit.editAssistantDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className='grid flex-1 grid-cols-1 gap-6 overflow-y-auto py-4 md:grid-cols-2'>
            {/* Left: Assistant name / Script */}
            <div className='flex flex-col space-y-4'>
              <div className='mb-5 space-y-2'>
                <Label htmlFor='ua-name'>{t('edit.assistantNameLabel')}</Label>
                <Input
                  id='ua-name'
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>

              <div className='flex flex-1 flex-col space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='ua-script'>
                    {t('edit.scriptContentLabel')}
                  </Label>
                </div>

                <Tabs
                  defaultValue='text'
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as 'text' | 'file')
                  }
                  className='flex flex-1 flex-col'
                >
                  <TabsList className='grid w-full grid-cols-2'>
                    <TabsTrigger
                      value='text'
                      className='flex items-center gap-2'
                    >
                      <Type className='h-4 w-4' />
                      {t('edit.typeText')}
                    </TabsTrigger>
                    <TabsTrigger
                      value='file'
                      className='flex items-center gap-2'
                    >
                      <FileText className='h-4 w-4' />
                      {t('edit.uploadFile')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value='text'
                    className='mt-4 flex flex-1 flex-col space-y-4'
                  >
                    {loadingAssistantData ? (
                      <div className='flex flex-1 items-center justify-center'>
                        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
                      </div>
                    ) : (
                      <>
                        <div className='flex items-center justify-end'>
                          {/* Clear button when there's content */}
                          {(editForm.scriptContent.length > 0 ||
                            activeTab === 'text') && (
                              <Button
                                variant='outline'
                                className='hover:text-red-600'
                                onClick={() => {
                                  setEditForm({ ...editForm, scriptContent: '' });
                                  // Clear file uploads if needed
                                }}
                              >
                                <X className='h-4 w-4' /> {t('edit.clearAll')}
                              </Button>
                            )}
                        </div>

                        <div className='relative flex flex-1'>
                          <Textarea
                            id='ua-script'
                            className='h-full min-h-[200px] pr-24 font-mono text-lg'
                            placeholder={t('edit.scriptPlaceholder')}
                            value={editForm.scriptContent}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                scriptContent: e.target.value
                              })
                            }
                          />
                          <div className='absolute top-2 right-2 text-xs text-gray-500'>
                            {t('edit.descriptionCharCount', { count: editForm.scriptContent.length })}
                          </div>
                        </div>
                        <div className='text-sm text-gray-500'>
                          {t('edit.scriptTip')}
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value='file' className='mt-4 space-y-4'>
                    {/* Script file upload using react-dropzone */}
                    <div
                      {...getScriptDropzoneProps()}
                      className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isScriptDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                        }`}
                    >
                      <input {...getScriptInputProps()} />
                      <div className='flex flex-col items-center'>
                        <FileText className='h-10 w-10 text-gray-400 mb-2' />
                        {isScriptDragActive ? (
                          <p className='text-primary font-medium'>Drop files here...</p>
                        ) : (
                          <>
                            <p className='text-gray-600 font-medium'>Click or drag to upload</p>
                            <p className='text-xs text-gray-400 mt-1'>Up to 5 files • Max 5MB each • .pdf,.docx,.txt,.zip</p>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Show selected script files */}
                    {scriptFiles.length > 0 && (
                      <div className='space-y-2'>
                        <p className='text-sm font-medium text-green-600'>✓ {scriptFiles.length} file(s) selected:</p>
                        <div className='flex flex-wrap gap-2'>
                          {scriptFiles.map((file, idx) => (
                            <div key={idx} className='flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm'>
                              <FileText className='h-4 w-4 text-gray-500' />
                              <span className='truncate max-w-[150px]'>{file.name}</span>
                              <button
                                type='button'
                                onClick={() => setScriptFiles(prev => prev.filter((_, i) => i !== idx))}
                                className='text-gray-400 hover:text-red-500'
                              >
                                <X className='h-3 w-3' />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className='text-sm text-gray-500'>
                      {t('edit.fileUploadTip')}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right: First message and voices section */}
            <div className='flex flex-col space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='ua-first'>{t('edit.firstMessageLabel2')}</Label>
                {loadingAssistantData ? (
                  <div className='flex h-24 items-center justify-center rounded-md border border-gray-200 bg-white'>
                    <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
                  </div>
                ) : (
                  <Textarea
                    id='ua-first'
                    rows={4}
                    value={editForm.firstMessage}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstMessage: e.target.value })
                    }
                  />
                )}
              </div>
              
              {/* Enhanced Voice Section */}
              <div className='flex flex-1 flex-col space-y-3'>
                {/* Section Header */}
                <div className='flex items-center justify-between'>
                  <Label className='text-base font-semibold'>
                    {t('edit.selectVoice') || 'Select Voice'}
                  </Label>
                  {selectedVoiceId && selectedVoiceId !== editFormBaseline.voiceId && (
                    <Badge className='bg-blue-100 text-blue-700 text-xs'>
                      Voice Changed
                    </Badge>
                  )}
                </div>

                {/* Current Voice Card (always visible when there's a current voice) */}
                {editFormBaseline.voiceId && (() => {
                  const currentVoice = vapiAvailableVoices.find(v => v.id === editFormBaseline.voiceId);
                  if (!currentVoice) return null;
                  return (
                    <div className='rounded-lg border-2 border-primary/20 bg-primary/5 p-1'>
                      <VoiceCard
                        name={currentVoice.name}
                        provider={currentVoice.provider.toUpperCase()}
                        bestFor={currentVoice.bestFor || currentVoice.accent}
                        language={currentVoice.language}
                        gender={currentVoice.type}
                        accent={currentVoice.accent}
                        isActive={true}
                        isCurrent={true}
                        isSelected={selectedVoiceId === currentVoice.id}
                        isPlaying={
                          currentlyPlayingVoiceId === currentVoice.id && (isPlaying || isAudioPlaying)
                        }
                        isLoading={
                          currentlyPlayingVoiceId === currentVoice.id &&
                          (isInitializing || isStartingVoice || (isPlaying && volumeLevel === 0))
                        }
                        onPlayPause={() => handleVoicePlayPause(currentVoice)}
                        onClick={() => setSelectedVoiceId(currentVoice.id)}
                      />
                    </div>
                  );
                })()}

                {/* Voice Filters */}
                <VoiceFilters
                  onFiltersChange={(f) => {
                    setFilters(f);
                    const langCode = nameToLangCode(f.language);
                    setActiveLanguageCode(langCode);
                    setActiveGenderCode(f.gender);
                    setActiveAccentCode(f.accent);
                    setCurrentVoicePage(1);
                    fetchAvailableVoices(1, false, langCode, f.gender, f.accent);
                  }}
                  defaultValue='all'
                  voices={vapiAvailableVoices}
                  availableLanguages={cachedLanguages}
                  availableAccents={availableAccents}
                  isLoading={vapiLoadingVoices}
                />

                {/* Voice Cards List */}
                <div className='flex-1 rounded-md border border-gray-200 bg-white'>
                  {vapiLoadingVoices && currentVoicePage === 1 ? (
                    <div className='flex items-center justify-center py-8'>
                      <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
                    </div>
                  ) : filteredVoices.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-8 text-center'>
                      <p className='text-muted-foreground'>
                        {t('edit.noVoicesFound')}
                      </p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setFilters({
                            language: 'all',
                            gender: 'all',
                            accent: 'all'
                          })
                        }
                        className='mt-2'
                      >
                        {t('edit.clearFilters')}
                      </Button>
                    </div>
                  ) : (
                    <div className='flex flex-col'>
                      <div className='flex max-h-[50vh] flex-col overflow-y-auto overflow-x-hidden' ref={voiceListRef}>
                        {[...filteredVoices]
                          .sort((a, b) => {
                            // Selected voice always first, then current voice
                            if (a.id === selectedVoiceId) return -1;
                            if (b.id === selectedVoiceId) return 1;
                            if (a.id === editFormBaseline.voiceId) return -1;
                            if (b.id === editFormBaseline.voiceId) return 1;
                            return 0;
                          })
                          .map((voice) => (
                          <div key={voice.id} data-voice-id={voice.id}>
                            <VoiceCard
                              name={voice.name}
                              provider={voice.provider.toUpperCase()}
                              bestFor={voice.bestFor || voice.accent}
                              language={voice.language}
                              gender={voice.type}
                              accent={voice.accent}
                              isActive={true}
                              isCurrent={voice.id === editFormBaseline.voiceId}
                              isSelected={voice.id === selectedVoiceId}
                              isPlaying={
                                currentlyPlayingVoiceId === voice.id && (isPlaying || isAudioPlaying)
                              }
                              isLoading={
                                currentlyPlayingVoiceId === voice.id &&
                                (isInitializing || isStartingVoice || (isPlaying && volumeLevel === 0))
                              }
                              onPlayPause={() => handleVoicePlayPause(voice)}
                              onClick={() => setSelectedVoiceId(voice.id)}
                            />
                          </div>
                        ))}
                      </div>
                      <div className='flex justify-center border-t border-gray-200 py-3'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => fetchAvailableVoices(currentVoicePage + 1, true, activeLanguageCode, activeGenderCode, activeAccentCode)}
                          disabled={loadingMoreVoices || !hasMoreVoices}
                          className='text-[#00B4B4] border-[#00B4B4] hover:bg-teal-50'
                        >
                          {loadingMoreVoices ? (
                            <><Loader2 className='w-4 h-4 animate-spin mr-2' />{t('edit.loading')}</>
                          ) : (
                            t('edit.showMoreVoices', { count: totalVoices - filteredVoices.length })
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className='flex-shrink-0 border-t pt-4'>
            <div className='flex w-full items-center justify-between'>
              <Button
                variant='destructive'
                onClick={async () => {
                  if (!actionsAssistant) return;
                  if (!confirm('Are you sure you want to delete this assistant? This action cannot be undone.')) {
                    return;
                  }
                  setDeleting(true);
                  try {
                    const response = await fetch(`/api/assistants/v2/${actionsAssistant.id}/user-delete`, {
                      method: 'DELETE',
                      credentials: 'include'
                    });

                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.message || 'Failed to delete assistant');
                    }

                    toast.success('Assistant deleted successfully');
                    setActionsDialogOpen(false);
                    fetchAssistants();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Failed to delete assistant');
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={saving || deleting}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                {deleting ? 'Deleting...' : 'Delete Assistant'}
              </Button>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setActionsDialogOpen(false)}
                  disabled={saving || deleting}
                >
                  {t('request.cancel')}
                </Button>
                <Button
                  onClick={async () => {
                    if (!actionsAssistant) return;
                    setSaving(true);
                    try {
                      // Build updated fields object with all changes
                      const updatedFields: Record<string, any> = {};

                      // Compare against baseline (live ElevenLabs values when modal opened)
                      if (editForm.name !== editFormBaseline.name) {
                        updatedFields.name = editForm.name;
                      }
                      if (editForm.description !== editFormBaseline.description) {
                        updatedFields.description = editForm.description;
                      }
                      if (editForm.scriptContent !== editFormBaseline.scriptContent) {
                        updatedFields.script_content = editForm.scriptContent;
                      }
                      if (editForm.firstMessage !== editFormBaseline.firstMessage) {
                        updatedFields.first_message = editForm.firstMessage;
                      }
                      const cleanVoiceId = selectedVoiceId?.split('|')[0] || '';
                      if (cleanVoiceId && cleanVoiceId !== editFormBaseline.voiceId) {
                        const sv = availableVoices.find((v) => v.id === cleanVoiceId);
                        const svData = vapiAvailableVoices.find((v) => v.id === cleanVoiceId);
                        updatedFields.voice = cleanVoiceId;
                        updatedFields.voice_name = sv?.name || '';
                        updatedFields.voice_provider = sv?.provider || 'elevenlabs';
                        // Include public_owner_id so backend can add shared voices to account library
                        if (svData?.public_owner_id) {
                          updatedFields.voice_public_owner_id = svData.public_owner_id;
                        }
                      }

                      // Send edit request to admin (NOT directly to VAPI)
                      const formData = new FormData();
                      formData.append('assistant_id', actionsAssistant.id);
                      formData.append('assistant_name', actionsAssistant.name);
                      formData.append('updated_fields', JSON.stringify(updatedFields));

                      // Attach any uploaded files (script files only)
                      scriptFiles.forEach((file) => formData.append('files', file));

                      const response = await fetch('/api/assistants/edit-requests', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include'
                      });

                      if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.message || 'Failed to submit edit request');
                      }

                      toast.success('Edit request sent to the admins');
                      setActionsDialogOpen(false);
                      clearUploadedFiles();
                      fetchAssistantEditRequests(); // Refresh edit requests to show the badge
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Failed to send edit request');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || deleting}
                >
                  {saving ? t('edit.saving') : t('edit.saveChanges')}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Assistant Request Wizard (5-step Figma design) ── */}
      <RequestAssistantWizard
        open={newRequestDialogOpen}
        onOpenChange={(open) => {
          setNewRequestDialogOpen(open);
          if (!open) clearUploadedFiles();
        }}
        voices={vapiAvailableVoices}
        voicesLoading={vapiLoadingVoices}
        loadingMoreVoices={loadingMoreVoices}
        hasActiveMinuteBundle={hasActiveMinuteBundle}
        onVoicePlayPause={handleVoicePlayPause}
        currentlyPlayingVoiceId={currentlyPlayingVoiceId}
        isVoicePlaying={isPlaying || isAudioPlaying}
        isVoiceLoading={currentlyPlayingVoiceId !== null && (isInitializing || (isPlaying && volumeLevel === 0))}
        onLoadMoreVoices={() => fetchAvailableVoices(currentVoicePage + 1, true, activeLanguageCode, activeGenderCode, activeAccentCode)}
        onLanguageFilterChange={(langCode) => {
          setActiveLanguageCode(langCode);
          setActiveGenderCode('all');
          setActiveAccentCode('all');
          setCurrentVoicePage(1);
          fetchAvailableVoices(1, false, langCode, 'all', 'all');
        }}
        onGenderFilterChange={(gender) => {
          setActiveGenderCode(gender);
          setCurrentVoicePage(1);
          fetchAvailableVoices(1, false, activeLanguageCode, gender, activeAccentCode);
        }}
        onAccentFilterChange={(accent) => {
          setActiveAccentCode(accent);
          setCurrentVoicePage(1);
          fetchAvailableVoices(1, false, activeLanguageCode, activeGenderCode, accent);
        }}
        availableLanguageCodes={cachedLanguageCodes}
        availableAccents={availableAccents}
        hasMoreVoices={hasMoreVoices}
        totalVoices={totalVoices}
        onSubmit={async (wizardForm) => {
          // Map wizard form → existing requestForm shape and submit
          const payload = {
            assistant_name: wizardForm.assistant_name,
            assistant_type: wizardForm.assistant_type,
            language: wizardForm.language,
            description: requestForm.description,
            notes: requestForm.notes,
            first_message: wizardForm.first_message,
            script_content: wizardForm.script_mode === 'text' ? wizardForm.script_content : '',
            voice_preference: wizardForm.voice_preference,
          };

          requireMinuteBundle(async () => {
            try {
              setSubmittingRequest(true);
              const formData = new FormData();
              Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
              // Attach script files and knowledge base files
              wizardForm.script_files.forEach(f => formData.append('files', f));
              wizardForm.knowledge_files.forEach(f => formData.append('files', f));

              const response = await fetch('/api/assistants/requests', {
                method: 'POST',
                credentials: 'include',
                body: formData,
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to submit request');
              }

              toast.success(t('request.submitSuccess'));
              clearUploadedFiles();
              fetchAssistantRequests();
            } catch (error: any) {
              toast.error(error.message || 'Failed to submit request');
              throw error; // re-throw so wizard stays open
            } finally {
              setSubmittingRequest(false);
            }
          });
        }}
      />





      {/* Edit Assistant Request Dialog */}
      <Dialog
        open={editRequestDialogOpen}
        onOpenChange={setEditRequestDialogOpen}
      >
        <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-[700px]'>
          <DialogHeader>
            <DialogTitle>{t('request.editRequestTitle')}</DialogTitle>
            <DialogDescription>
              {t('request.editRequestDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className='flex-1 space-y-4 overflow-y-auto py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit_assistant_name'>
                {t('request.assistantNameRequired')}
              </Label>
              <Input
                id='edit_assistant_name'
                value={requestForm.assistant_name}
                onChange={(e) => {
                  setRequestForm({
                    ...requestForm,
                    assistant_name: e.target.value
                  });
                  if (requestFormErrors.assistant_name) {
                    setRequestFormErrors({
                      ...requestFormErrors,
                      assistant_name: undefined
                    });
                  }
                }}
                placeholder={t('create.namePlaceholder')}
                className={requestFormErrors.assistant_name ? 'border-red-500' : ''}
              />
              {requestFormErrors.assistant_name && (
                <p className='text-sm text-red-500'>{requestFormErrors.assistant_name}</p>
              )}
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='edit_assistant_type'>
                  {t('request.typeRequired')}
                </Label>
                <Select
                  value={requestForm.assistant_type}
                  onValueChange={(value) =>
                    setRequestForm({ ...requestForm, assistant_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('request.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='inbound'>
                      {t('filters.inbound')}
                    </SelectItem>
                    <SelectItem value='outbound'>
                      {t('filters.outbound')}
                    </SelectItem>
                    <SelectItem value='both'>{t('filters.both')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='edit_language'>{t('card.language')}</Label>
                <Select
                  value={requestForm.language}
                  onValueChange={(value) =>
                    setRequestForm({ ...requestForm, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('request.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='en'>{t('languages.english')}</SelectItem>
                    <SelectItem value='es'>{t('languages.spanish')}</SelectItem>
                    <SelectItem value='fr'>{t('languages.french')}</SelectItem>
                    <SelectItem value='de'>{t('languages.german')}</SelectItem>
                    <SelectItem value='it'>{t('languages.italian')}</SelectItem>
                    <SelectItem value='pt'>{t('languages.portuguese')}</SelectItem>
                    <SelectItem value='no'>{t('languages.norwegian')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit_first_message'>
                {t('request.firstMessageRequired')}
              </Label>
              <Textarea
                id='edit_first_message'
                value={requestForm.first_message}
                onChange={(e) => {
                  setRequestForm({
                    ...requestForm,
                    first_message: e.target.value
                  });
                  if (requestFormErrors.first_message) {
                    setRequestFormErrors({
                      ...requestFormErrors,
                      first_message: undefined
                    });
                  }
                }}
                placeholder={t('request.firstMessagePlaceholder')}
                rows={2}
                className={requestFormErrors.first_message ? 'border-red-500' : ''}
              />
              {requestFormErrors.first_message && (
                <p className='text-sm text-red-500'>{requestFormErrors.first_message}</p>
              )}
              <p className='text-muted-foreground text-xs'>
                {t('request.firstMessageDescription')}
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit_script_content'>
                {t('request.scriptContentRequired')}
              </Label>
              <Textarea
                id='edit_script_content'
                value={requestForm.script_content}
                onChange={(e) => {
                  setRequestForm({
                    ...requestForm,
                    script_content: e.target.value
                  });
                  if (requestFormErrors.script_content) {
                    setRequestFormErrors({
                      ...requestFormErrors,
                      script_content: undefined
                    });
                  }
                }}
                placeholder={t('request.scriptContentPlaceholder')}
                rows={6}
                className={`font-mono text-sm ${requestFormErrors.script_content ? 'border-red-500' : ''}`}
              />
              {requestFormErrors.script_content && (
                <p className='text-sm text-red-500'>{requestFormErrors.script_content}</p>
              )}
              <p className='text-muted-foreground text-xs'>
                {t('request.scriptContentDescription')}
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit_voice_preference'>
                {t('request.voicePreference')}
              </Label>
              <Select
                value={requestForm.voice_preference}
                onValueChange={(value) =>
                  setRequestForm({ ...requestForm, voice_preference: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('request.selectVoiceType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='no_preference'>
                    {t('request.noPreference')}
                  </SelectItem>
                  <SelectItem value='male'>{t('request.maleVoice')}</SelectItem>
                  <SelectItem value='female'>
                    {t('request.femaleVoice')}
                  </SelectItem>
                  <SelectItem value='neutral'>
                    {t('request.neutralVoice')}
                  </SelectItem>
                  <SelectItem value='young'>
                    {t('request.youngVoice')}
                  </SelectItem>
                  <SelectItem value='mature'>
                    {t('request.matureVoice')}
                  </SelectItem>
                  <SelectItem value='professional'>
                    {t('request.professionalVoice')}
                  </SelectItem>
                  <SelectItem value='friendly'>
                    {t('request.friendlyVoice')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className='text-muted-foreground text-xs'>
                {t('request.voicePreferenceDescription')}
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit_description'>
                {t('request.useCaseDescription')}
              </Label>
              <Textarea
                id='edit_description'
                value={requestForm.description}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    description: e.target.value
                  })
                }
                placeholder={t('request.useCasePlaceholder')}
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit_notes'>{t('request.additionalNotes')}</Label>
              <Textarea
                id='edit_notes'
                value={requestForm.notes}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, notes: e.target.value })
                }
                placeholder={t('request.notesPlaceholder')}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEditRequestDialogOpen(false)}
              disabled={submittingRequest}
            >
              {t('request.cancel')}
            </Button>
            <Button onClick={handleEditRequest} disabled={submittingRequest}>
              {submittingRequest
                ? t('request.updating')
                : t('request.updateRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
