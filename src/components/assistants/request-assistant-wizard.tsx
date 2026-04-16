'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
    Check,
    ArrowLeft,
    Upload,
    X,
    Play,
    Pause,
    Loader2,
    AlertTriangle,
    Lock,
    ChevronRight,
    ChevronsUpDown,
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Send,
    MessageSquare,
    Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoiceData {
    id: string;
    name: string;
    provider: string;
    type: 'male' | 'female' | string;
    language: string;
    accent?: string;
    bestFor?: string;
    previewUrl?: string;
    preview_url?: string;
    public_owner_id?: string;
}

export interface WizardForm {
    assistant_name: string;
    assistant_type: string;
    language: string;
    first_message: string;
    script_mode: 'text' | 'file';
    script_content: string;
    script_files: File[];
    knowledge_files: File[];
    voice_preference: string;
    voice_owner_id: string;
}

interface RequestAssistantWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    voices: VoiceData[];
    voicesLoading?: boolean;
    hasActiveMinuteBundle?: boolean;
    onSubmit: (form: WizardForm) => Promise<void>;
    onVoicePlayPause?: (voice: VoiceData) => void;
    currentlyPlayingVoiceId?: string | null;
    isVoicePlaying?: boolean;
    isVoiceLoading?: boolean;
    onLoadMoreVoices?: () => void;
    hasMoreVoices?: boolean;
    loadingMoreVoices?: boolean;
    totalVoices?: number;
    onLanguageFilterChange?: (langCode: string) => void;
    onGenderFilterChange?: (gender: string) => void;
    onAccentFilterChange?: (accent: string) => void;
    availableLanguageCodes?: string[];
    availableAccents?: string[];
}

// ─── Steps (Knowledge Base removed, Preview added) ───────────────────────────

const STEPS = [
    { id: 1, label: 'Basics', subtitle: 'Name your assistant and set the call type' },
    { id: 2, label: 'Script', subtitle: 'Provide the script or system prompt for your assistant' },
    { id: 3, label: 'Voice', subtitle: "Choose a voice that matches your assistant's tone and language" },
    { id: 4, label: 'Review', subtitle: 'Review everything before submitting your request' },
    { id: 5, label: 'Preview', subtitle: 'Test your assistant before submitting' },
];

const INITIAL_FORM: WizardForm = {
    assistant_name: '',
    assistant_type: 'inbound',
    language: 'en',
    first_message: '',
    script_mode: 'text',
    script_content: '',
    script_files: [],
    knowledge_files: [],
    voice_preference: 'no_preference',
    voice_owner_id: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(name: string) {
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
    const colors: Record<string, string> = {
        PDF: 'text-red-500 bg-red-50 border-red-200',
        DOCX: 'text-blue-500 bg-blue-50 border-blue-200',
        DOC: 'text-blue-500 bg-blue-50 border-blue-200',
        TXT: 'text-gray-500 bg-gray-100 border-gray-200',
        ZIP: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    };
    return (
        <span className={cn('text-[10px] font-bold border rounded px-1', colors[ext] ?? 'text-gray-500 bg-gray-100 border-gray-200')}>
            {ext}
        </span>
    );
}

// ─── Sidebar Step ─────────────────────────────────────────────────────────────

function SidebarStep({ step, currentStep }: { step: typeof STEPS[number]; currentStep: number }) {
    const completed = step.id < currentStep;
    const active = step.id === currentStep;

    return (
        <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl transition-all', active && 'bg-white/70 dark:bg-white/10 shadow-sm')}>
            <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold border-2 transition-all',
                completed && 'bg-[#00B4B4] border-[#00B4B4] text-white',
                active && 'bg-[#00B4B4] border-[#00B4B4] text-white',
                !completed && !active && 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500',
            )}>
                {completed ? <Check className="w-4 h-4" /> : step.id}
            </div>
            <span className={cn(
                'text-sm font-medium transition-colors',
                (active || completed) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500',
            )}>
                {step.label}
            </span>
            {active && <ChevronRight className="w-3.5 h-3.5 text-[#00B4B4] ml-auto" />}
        </div>
    );
}

// ─── Dropzone ─────────────────────────────────────────────────────────────────

function DropzoneArea({ files, onFilesChange, id, isNo }: { files: File[]; onFilesChange: (f: File[]) => void; id: string; isNo: boolean }) {
    const onDrop = useCallback((accepted: File[]) => {
        onFilesChange([...files, ...accepted].slice(0, 5));
    }, [files, onFilesChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/zip': ['.zip'],
        },
        multiple: true,
        maxFiles: 5,
        noDragEventsBubbling: true,
    });

    return (
        <div className="space-y-3">
            <div
                {...getRootProps()}
                className={cn(
                    'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200',
                    isDragActive
                        ? 'border-[#00B4B4] bg-teal-50/60 dark:bg-teal-900/10 scale-[1.01]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-[#00B4B4]/50 bg-gray-50/80 dark:bg-gray-800/40 hover:bg-teal-50/20',
                )}
            >
                <input {...getInputProps()} id={id} />
                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                        isDragActive ? 'bg-[#00B4B4]/10' : 'bg-gray-100 dark:bg-gray-800',
                    )}>
                        <Upload className={cn('w-6 h-6', isDragActive ? 'text-[#00B4B4]' : 'text-gray-400')} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {isDragActive ? (isNo ? 'Slipp filer her...' : 'Drop files here...') : (isNo ? 'Klikk for a bla gjennom eller dra og slipp' : 'Click to browse or drag & drop')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{isNo ? 'PDF, DOCX, TXT, ZIP - opptil 5 filer, 5MB hver' : 'PDF, DOCX, TXT, ZIP - up to 5 files, 5MB each'}</p>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                            {getFileExt(file.name)}
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">{file.name}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{formatBytes(file.size)}</span>
                            <button
                                type="button"
                                onClick={() => onFilesChange(files.filter((_, i) => i !== idx))}
                                className="text-gray-300 hover:text-red-400 transition-colors ml-1 flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Voice Card ───────────────────────────────────────────────────────────────

function WizardVoiceCard({ voice, isSelected, isPlaying, isLoading, onPlayPause, onSelect }: {
    voice: VoiceData;
    isSelected: boolean;
    isPlaying: boolean;
    isLoading: boolean;
    onPlayPause: () => void;
    onSelect: () => void;
}) {
    return (
        <div
            onClick={onSelect}
            className={cn(
                'flex flex-col gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all hover:shadow-sm',
                isSelected ? 'border-[#00B4B4] bg-teal-50/40 dark:bg-teal-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#00B4B4]/40',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-300 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {voice.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{voice.name}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{voice.language?.slice(0, 2) || 'EN'}</span>
                            {voice.type && <span className="text-[10px] text-gray-400 capitalize">· {voice.type}</span>}
                            {voice.accent && <span className="text-[10px] text-gray-400 capitalize">· {voice.accent}</span>}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onPlayPause(); }}
                    className="w-8 h-8 rounded-full bg-[#00B4B4] hover:bg-[#009999] flex items-center justify-center text-white flex-shrink-0 transition-colors"
                >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
            </div>
        </div>
    );
}

// ─── Review Row ───────────────────────────────────────────────────────────────

function ReviewRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
    return (
        <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={cn('text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3', multiline && 'whitespace-pre-wrap')}>
                {value}
            </p>
        </div>
    );
}

// ─── Preview Chat Component ──────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

function PreviewChat({
    form,
    voices,
}: {
    form: WizardForm;
    voices: VoiceData[];
}) {
    const { user } = useAuth();
    const [previewAgentId, setPreviewAgentId] = useState<string | null>(null);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isCalling, setIsCalling] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const nextPlayTimeRef = useRef<number>(0);
    const isPlayingAudioRef = useRef<boolean>(false);
    const audioSampleRateRef = useRef<number>(16000); // Default, will be updated from metadata
    const activeAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]); // Track active audio sources

    const selectedVoiceId = form.voice_preference?.split('|')[0];
    const selectedVoice = voices.find(v => v.id === selectedVoiceId);
    const voicePublicOwnerId = form.voice_owner_id || '';

    // Audio playback queue system
    const playAudioChunk = useCallback((audioData: Float32Array) => {
        if (!audioContextRef.current) return;

        const audioContext = audioContextRef.current;
        const sampleRate = audioSampleRateRef.current;
        const audioBuffer = audioContext.createBuffer(1, audioData.length, sampleRate);
        audioBuffer.getChannelData(0).set(audioData);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        // Track this source so we can stop it later
        activeAudioSourcesRef.current.push(source);

        // Schedule playback
        const currentTime = audioContext.currentTime;
        const startTime = Math.max(currentTime, nextPlayTimeRef.current);
        
        source.start(startTime);
        nextPlayTimeRef.current = startTime + audioBuffer.duration;

        // Track speaking state
        if (!isPlayingAudioRef.current) {
            isPlayingAudioRef.current = true;
            setIsAgentSpeaking(true);
        }

        source.onended = () => {
            // Remove this source from active sources
            activeAudioSourcesRef.current = activeAudioSourcesRef.current.filter(s => s !== source);
            
            // Check if there are more chunks in queue
            if (audioQueueRef.current.length === 0) {
                isPlayingAudioRef.current = false;
                setIsAgentSpeaking(false);
            }
        };
    }, []);

    const processAudioQueue = useCallback(() => {
        if (audioQueueRef.current.length > 0 && audioContextRef.current) {
            const chunk = audioQueueRef.current.shift();
            if (chunk) {
                playAudioChunk(chunk);
            }
        }
    }, [playAudioChunk]);

    // Cleanup function
    const cleanup = useCallback(async () => {
        // Stop all currently playing audio sources immediately
        activeAudioSourcesRef.current.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Source might already be stopped
            }
        });
        activeAudioSourcesRef.current = [];
        
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            try { await audioContextRef.current.close(); } catch { /* ignore */ }
            audioContextRef.current = null;
        }
        // Reset audio queue
        audioQueueRef.current = [];
        nextPlayTimeRef.current = 0;
        isPlayingAudioRef.current = false;
        audioSampleRateRef.current = 16000; // Reset to default
        
        setIsCalling(false);
        setConnected(false);
        setIsAgentSpeaking(false);

        // Delete preview agent
        if (previewAgentId) {
            try {
                await fetch(`/api/assistants/preview-agent/${previewAgentId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${user?.token}` },
                });
            } catch { /* ignore cleanup errors */ }
            setPreviewAgentId(null);
            setSignedUrl(null);
        }
    }, [previewAgentId, user?.token]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { cleanup(); };
    }, [cleanup]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Create preview agent
    const createPreview = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetch('/api/assistants/preview-agent', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`,
                },
                body: JSON.stringify({
                    name: form.assistant_name,
                    language: form.language,
                    first_message: form.first_message,
                    script_content: form.script_content,
                    voice_id: selectedVoiceId !== 'no_preference' ? selectedVoiceId : undefined,
                    voice_public_owner_id: voicePublicOwnerId || undefined,
                }),
            });

            if (!resp.ok) {
                const data = await resp.json();
                throw new Error(data.message || 'Failed to create preview');
            }

            const data = await resp.json();
            setPreviewAgentId(data.agent_id);
            setSignedUrl(data.signed_url);
            setMessages([]);

            // Add the first message
            if (form.first_message) {
                setMessages([{ role: 'assistant', content: form.first_message }]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create preview');
        } finally {
            setLoading(false);
        }
    };

    // Start voice call via WebSocket
    const startCall = async () => {
        if (!signedUrl) return;
        setIsCalling(true);
        setError(null);

        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Create audio context for playback (will use dynamic sample rate)
            audioContextRef.current = new AudioContext();

            // Connect to ElevenLabs via signed URL
            const ws = new WebSocket(signedUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);

                // Send initial config
                ws.send(JSON.stringify({
                    type: 'conversation_initiation_client_data',
                    conversation_initiation_client_data: {},
                }));

                // Start streaming audio from microphone (16kHz for ElevenLabs input)
                const audioContext = new AudioContext({ sampleRate: 16000 });
                const source = audioContext.createMediaStreamSource(stream);
                const processor = audioContext.createScriptProcessor(4096, 1, 1);

                processor.onaudioprocess = (e) => {
                    if (ws.readyState !== WebSocket.OPEN || isMuted) return;
                    const inputData = e.inputBuffer.getChannelData(0);
                    // Convert to 16-bit PCM
                    const pcm16 = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(inputData[i] * 32767)));
                    }
                    // Send as base64
                    const bytes = new Uint8Array(pcm16.buffer);
                    let binary = '';
                    for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    ws.send(JSON.stringify({
                        user_audio_chunk: btoa(binary),
                    }));
                };

                source.connect(processor);
                processor.connect(audioContext.destination);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle conversation initialization metadata
                    if (data.type === 'conversation_initiation_metadata') {
                        const audioFormat = data.conversation_initiation_metadata_event?.agent_output_audio_format;
                        console.log('ElevenLabs audio format:', audioFormat);
                        
                        // Parse sample rate from format like "pcm_16000" or "pcm_44100"
                        if (audioFormat && audioFormat.includes('pcm_')) {
                            const rate = parseInt(audioFormat.split('_')[1]);
                            if (!isNaN(rate)) {
                                audioSampleRateRef.current = rate;
                                console.log('Audio sample rate set to:', rate);
                            }
                        }
                    }

                    if (data.type === 'audio') {
                        // Handle incoming audio chunk - CORRECT PATH: audio_event.audio_base_64
                        if (audioContextRef.current && data.audio_event?.audio_base_64) {
                            // Decode base64 to PCM16
                            const binaryStr = atob(data.audio_event.audio_base_64);
                            const bytes = new Uint8Array(binaryStr.length);
                            for (let i = 0; i < binaryStr.length; i++) {
                                bytes[i] = binaryStr.charCodeAt(i);
                            }
                            
                            // Convert PCM16 to Float32
                            const pcm16 = new Int16Array(bytes.buffer);
                            const float32 = new Float32Array(pcm16.length);
                            for (let i = 0; i < pcm16.length; i++) {
                                float32[i] = pcm16[i] / 32768;
                            }
                            
                            // Add to queue and play
                            audioQueueRef.current.push(float32);
                            processAudioQueue();
                        }
                    }

                    if (data.type === 'agent_response') {
                        setMessages(prev => [...prev, { role: 'assistant', content: data.agent_response_event?.agent_response || '' }]);
                    }

                    if (data.type === 'user_transcript') {
                        const text = data.user_transcription_event?.user_transcript;
                        if (text) {
                            setMessages(prev => [...prev, { role: 'user', content: text }]);
                        }
                    }
                } catch { /* ignore parse errors */ }
            };

            ws.onerror = () => {
                setError('Connection error. Please try again.');
                setIsCalling(false);
                setConnected(false);
            };

            ws.onclose = () => {
                setIsCalling(false);
                setConnected(false);
                setIsAgentSpeaking(false);
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start call');
            setIsCalling(false);
        }
    };

    const endCall = () => {
        // Stop all currently playing audio sources immediately
        activeAudioSourcesRef.current.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Source might already be stopped
            }
        });
        activeAudioSourcesRef.current = [];
        
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
        // Reset audio queue
        audioQueueRef.current = [];
        nextPlayTimeRef.current = 0;
        isPlayingAudioRef.current = false;
        audioSampleRateRef.current = 16000; // Reset to default
        
        setIsCalling(false);
        setConnected(false);
        setIsAgentSpeaking(false);
    };

    // Send text message
    const sendMessage = () => {
        if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            type: 'user_message',
            user_message: { text: inputText.trim() },
        }));
        setMessages(prev => [...prev, { role: 'user', content: inputText.trim() }]);
        setInputText('');
    };

    // Not initialized yet
    if (!previewAgentId) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Bot className="w-12 h-12 text-white" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        Preview your assistant
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md">
                        Test how your assistant will sound and respond with the configuration you set up.
                        This creates a temporary preview that will be removed after you close the wizard.
                    </p>
                </div>
                <Button
                    onClick={createPreview}
                    disabled={loading}
                    className="rounded-xl bg-[#00B4B4] hover:bg-[#009999] text-white h-12 px-8 font-semibold"
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating preview...</>
                    ) : (
                        <><Phone className="w-4 h-4 mr-2" />Start Preview</>
                    )}
                </Button>
                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-xl">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // Preview initialized — show conversation UI
    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        isAgentSpeaking
                            ? 'bg-[#00B4B4] animate-pulse shadow-lg shadow-teal-200'
                            : 'bg-gradient-to-br from-teal-400 to-cyan-500'
                    )}>
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{form.assistant_name || 'Assistant'}</p>
                        <p className="text-xs text-gray-400">
                            {connected ? (isAgentSpeaking ? 'Speaking...' : 'Connected') : 'Preview mode'}
                            {selectedVoice && ` · ${selectedVoice.name}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                        Preview
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                        <MessageSquare className="w-8 h-8" />
                        <p className="text-sm">Start a call to test your assistant</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                            msg.role === 'user'
                                ? 'bg-[#00B4B4] text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Controls */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-xl">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Call controls */}
                <div className="flex items-center justify-center gap-4">
                    {!isCalling ? (
                        <button
                            onClick={startCall}
                            className="w-14 h-14 rounded-full bg-[#00B4B4] hover:bg-[#009999] flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
                        >
                            <Phone className="w-6 h-6" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                                    isMuted
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                            >
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={endCall}
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Text input */}
                {connected && (
                    <div className="flex items-center gap-2">
                        <Input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Send a message..."
                            className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 h-11"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!inputText.trim()}
                            className="w-11 h-11 rounded-xl bg-[#00B4B4] hover:bg-[#009999] disabled:bg-gray-200 flex items-center justify-center text-white transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function RequestAssistantWizard({
    open,
    onOpenChange,
    voices,
    voicesLoading,
    hasActiveMinuteBundle = true,
    onSubmit,
    onVoicePlayPause,
    currentlyPlayingVoiceId,
    isVoicePlaying,
    isVoiceLoading,
    onLoadMoreVoices,
    hasMoreVoices = false,
    loadingMoreVoices = false,
    totalVoices = 0,
    onLanguageFilterChange,
    onGenderFilterChange,
    onAccentFilterChange,
    availableLanguageCodes = [],
    availableAccents = [],
}: RequestAssistantWizardProps) {
    const { currentLanguage } = useLanguage();
    const isNo = currentLanguage === 'no';
    const copy = {
        newAssistant: isNo ? 'Ny assistent' : 'New Assistant',
        stepOf: isNo ? 'Steg' : 'Step',
        close: isNo ? 'Lukk' : 'Close',
        continue: isNo ? 'Fortsett' : 'Continue',
        back: isNo ? 'Tilbake' : 'Back',
        cancel: isNo ? 'Avbryt' : 'Cancel',
        submitRequest: isNo ? 'Send foresporsel' : 'Submit Request',
        submitting: isNo ? 'Sender...' : 'Submitting...',
        needBundle: isNo ? 'Du trenger en aktiv minuttpakke for a sende en foresporsel.' : 'You need an active minute bundle to submit a request.',
        optional: isNo ? 'Valgfritt:' : 'Optional:',
        scriptOptional: isNo ? 'Legg til et skript eller systemprompt for a styre assistentens atferd. Du kan hoppe over dette og legge det til senere.' : "Provide a script or system prompt to guide the assistant's behaviour. You can skip this and add it later.",
        typeScript: isNo ? 'Skriv skript' : 'Type script',
        uploadFile: isNo ? 'Last opp fil' : 'Upload file',
        scriptPlaceholder: isNo ? 'Skriv skriptet eller systemprompten her...' : 'Type your script or system prompt here. Describe how the assistant should behave, what it should say, and how to handle common scenarios...',
        chars: isNo ? 'tegn' : 'characters',
        assistantName: isNo ? 'Assistentnavn' : 'Assistant name',
        callType: isNo ? 'Samtaletype' : 'Call type',
        greetingMessage: isNo ? 'Hilsningsmelding' : 'Greeting message',
        assistantNamePh: isNo ? 'f.eks., Salgsassistent, Support-bot' : 'e.g., Sales Assistant, Support Bot',
        inboundLabel: isNo ? 'Inngaende - handterer innkommende samtaler' : 'Inbound - handles incoming calls',
        outboundLabel: isNo ? 'Utgaende - ringer ut (kommer snart)' : 'Outbound - makes calls (coming soon)',
        greetingPh: isNo ? 'f.eks., Hei! Takk for at du ringer. Hvordan kan jeg hjelpe deg i dag?' : 'e.g., Hello! Thanks for calling. How can I help you today?',
        greetingHint: isNo ? 'Dette er det innringere horer forst. Du kan oppdatere dette senere.' : 'First thing callers will hear. You can update this later.',
        assistantLanguage: isNo ? 'Assistentens sprak' : 'Assistant language',
        filterLanguage: isNo ? 'Filtrer etter sprak' : 'Filter by language',
        filterGender: isNo ? 'Kjonn' : 'Gender',
        filterAccent: isNo ? 'Aksent' : 'Accent',
        allLanguages: isNo ? 'Alle sprak' : 'All languages',
        allGenders: isNo ? 'Alle kjonn' : 'All genders',
        allAccents: isNo ? 'Alle aksenter' : 'All accents',
        male: isNo ? 'Mann' : 'Male',
        female: isNo ? 'Kvinne' : 'Female',
        clearFilters: isNo ? 'Nullstill filtre' : 'Clear filters',
        noVoicesMatch: isNo ? 'Ingen stemmer matcher disse filtrene.' : 'No voices match these filters.',
        clearAllFilters: isNo ? 'Nullstill alle filtre' : 'Clear all filters',
        selected: isNo ? 'Valgt' : 'Selected',
        noPreference: isNo ? 'Ingen preferanse' : 'No preference',
        script: isNo ? 'Skript' : 'Script',
        voice: isNo ? 'Stemme' : 'Voice',
        noneProvided: isNo ? 'Ingen oppgitt' : 'None provided',
        inbound: isNo ? 'Innkommende' : 'Inbound',
    };
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<WizardForm>(INITIAL_FORM);
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [langFilter, setLangFilter] = useState('all');
    const [langSearchOpen, setLangSearchOpen] = useState(false);
    const [genderFilter, setGenderFilter] = useState('all');
    const [accentFilter, setAccentFilter] = useState('all');

    const isInitialized = useRef(false);

    // Notify parent when language filter changes for server-side filtering
    // Reset gender and accent when language changes
    useEffect(() => {
        if (!isInitialized.current) return;
        setGenderFilter('all');
        setAccentFilter('all');
        onLanguageFilterChange?.(langFilter);
    }, [langFilter]);

    // Notify parent when gender filter changes for server-side filtering
    useEffect(() => {
        if (!isInitialized.current) return;
        onGenderFilterChange?.(genderFilter);
    }, [genderFilter]);

    // Notify parent when accent filter changes for server-side filtering
    useEffect(() => {
        if (!isInitialized.current) return;
        onAccentFilterChange?.(accentFilter);
    }, [accentFilter]);

    useEffect(() => {
        if (open && !isInitialized.current) {
            setStep(1);
            setForm(INITIAL_FORM);
            setErrors({});
            setLangFilter('all');
            setGenderFilter('all');
            setAccentFilter('all');
            isInitialized.current = true;
        }
        if (!open) {
            isInitialized.current = false;
        }
    }, [open]);

    const update = useCallback((patch: Partial<WizardForm>) => {
        setForm(prev => ({ ...prev, ...patch }));
    }, []);

    const handleClose = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    const validate = (s: number) => {
        const e: Record<string, string> = {};
        if (s === 1) {
            if (!form.assistant_name.trim()) e.assistant_name = 'Assistant name is required';
            if (!form.first_message.trim()) e.first_message = 'Greeting message is required';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleContinue = async () => {
        if (!validate(step)) return;
        if (step < 5) { setStep(s => s + 1); return; }
        // Step 5 (Preview) — submit the request
        setSubmitting(true);
        try {
            await onSubmit(form);
            handleClose();
        } catch {
            // error handled by parent
        } finally {
            setSubmitting(false);
        }
    };

    // ── Language helpers ──────────────────────────────────────────────────────
    const langCodeToName: Record<string, string> = {
        en: 'English', no: 'Norwegian', es: 'Spanish', fr: 'French',
        de: 'German', it: 'Italian', pt: 'Portuguese', pl: 'Polish',
        hi: 'Hindi', ar: 'Arabic', zh: 'Chinese', ja: 'Japanese',
        ko: 'Korean', nl: 'Dutch', sv: 'Swedish', da: 'Danish',
        fi: 'Finnish', ru: 'Russian', tr: 'Turkish', cs: 'Czech',
        ro: 'Romanian', hu: 'Hungarian', el: 'Greek', id: 'Indonesian',
        ms: 'Malay', ta: 'Tamil', uk: 'Ukrainian', bg: 'Bulgarian',
        hr: 'Croatian', sk: 'Slovak', fil: 'Filipino', vi: 'Vietnamese',
        th: 'Thai',
    };
    const getLangName = (code: string) => langCodeToName[code?.toLowerCase().slice(0, 2)] || code;

    const uniqueLangCodes = availableLanguageCodes.length > 0
        ? availableLanguageCodes
        : Array.from(new Set(voices.map(v => v.language?.toLowerCase().slice(0, 2)).filter(Boolean))).sort() as string[];

    // ── Filtered voices ───────────────────────────────────────────────────────
    const filteredVoices = voices.filter(v => {
        if (langFilter !== 'all' && v.language?.toLowerCase().slice(0, 2) !== langFilter) return false;
        if (genderFilter !== 'all' && v.type !== genderFilter) return false;
        if (accentFilter !== 'all' && v.accent?.toLowerCase() !== accentFilter) return false;
        return true;
    });
    
    const uniqueAccents = availableAccents.length > 0
        ? availableAccents
        : Array.from(new Set(
            (langFilter === 'all' ? voices : voices.filter(v => v.language?.toLowerCase().slice(0, 2) === langFilter))
                .map(v => v.accent).filter(Boolean)
          ));
    const localizedSteps = isNo
        ? [
            { ...STEPS[0], label: 'Grunnleggende', subtitle: 'Gi assistenten et navn og velg samtaletype' },
            { ...STEPS[1], label: 'Skript', subtitle: 'Legg til skript eller systemprompt for assistenten' },
            { ...STEPS[2], label: 'Stemme', subtitle: 'Velg en stemme som passer tonen og spraket' },
            { ...STEPS[3], label: 'Gjennomgang', subtitle: 'Se gjennom alt for du sender foresporselen' },
            { ...STEPS[4], label: 'Forhandsvisning', subtitle: 'Test assistenten din for du sender inn' },
        ]
        : STEPS;
    const currentStepConfig = localizedSteps[step - 1];

    const selectedVoiceId = form.voice_preference.split('|')[0];
    const selectedVoiceName = form.voice_preference === 'no_preference'
        ? copy.noPreference
        : voices.find(v => v.id === selectedVoiceId)?.name || copy.noPreference;

    return (
        <Dialog open={open} onOpenChange={() => { /* intentional no-op */ }}>
            <DialogContent
                hideClose
                className="flex p-0 gap-0 min-w-[92vw] max-w-[92vw] w-[92vw] h-[92vh] max-h-[92vh] rounded-2xl border-0 shadow-2xl"
                onInteractOutside={e => e.preventDefault()}
                onPointerDownOutside={e => e.preventDefault()}
                onEscapeKeyDown={e => { e.preventDefault(); handleClose(); }}
            >
                {/* ── Left sidebar ─────────────────────────────────────────── */}
                <div className="w-[230px] flex-shrink-0 bg-[#EBF7F7] dark:bg-[#0d2424] flex flex-col py-8 rounded-l-2xl relative">
                    <div className="px-6 mb-8">
                        <div className="w-10 h-10 mb-4 flex flex-col justify-center gap-[3px]">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-[3px] rounded-full bg-[#00B4B4]" style={{ width: `${55 + i * 9}%` }} />
                            ))}
                        </div>
                        <p className="text-xs font-semibold text-[#00B4B4] uppercase tracking-widest mb-0.5">{copy.newAssistant}</p>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                            {currentStepConfig.label}
                        </h2>
                        <div className="w-8 h-0.5 bg-[#00B4B4] mt-2 rounded-full" />
                    </div>

                    <nav className="flex flex-col gap-0.5 px-3 flex-1">
                        {localizedSteps.map(s => <SidebarStep key={s.id} step={s} currentStep={step} />)}
                    </nav>

                    <div className="px-6 pt-4 mt-auto">
                        <div className="text-xs text-gray-400 dark:text-gray-500">{copy.stepOf} {step} / {localizedSteps.length}</div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1.5">
                            <div
                                className="bg-[#00B4B4] h-1 rounded-full transition-all duration-300"
                                style={{ width: `${(step / localizedSteps.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Right content ─────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 rounded-r-2xl relative">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="absolute -top-4 -right-4 z-50 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                        aria-label={copy.close}
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Header */}
                    <div className="px-10 pt-8 pb-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 pr-16">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{currentStepConfig.label}</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{currentStepConfig.subtitle}</p>
                    </div>

                    {/* Bundle warning */}
                    {!hasActiveMinuteBundle && (
                        <div className="mx-10 mt-5 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {copy.needBundle}
                        </div>
                    )}

                    {/* Step content */}
                    <div className="flex-1 overflow-y-auto px-10 py-7">

                        {/* ── Step 1: Basics ──────────────────────────────── */}
                        {step === 1 && (
                            <div className="space-y-7 max-w-2xl">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        {copy.assistantName} <span className="text-[#00B4B4]">*</span>
                                    </label>
                                    <Input
                                        value={form.assistant_name}
                                        onChange={e => { update({ assistant_name: e.target.value }); setErrors(p => ({ ...p, assistant_name: undefined })); }}
                                        placeholder={copy.assistantNamePh}
                                        disabled={!hasActiveMinuteBundle}
                                        className={cn('h-12 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-[#00B4B4] text-base', errors.assistant_name && 'border-red-400')}
                                    />
                                    {errors.assistant_name && <p className="text-xs text-red-500">{errors.assistant_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        {copy.callType} <span className="text-[#00B4B4]">*</span>
                                    </label>
                                    <Select value={form.assistant_type} onValueChange={v => update({ assistant_type: v })} disabled={!hasActiveMinuteBundle}>
                                        <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-700 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inbound">{copy.inboundLabel}</SelectItem>
                                            <SelectItem value="outbound" disabled className="opacity-50">{copy.outboundLabel}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {copy.assistantLanguage}
                                    </label>
                                    <Select value={form.language} onValueChange={v => update({ language: v, voice_preference: 'no_preference', voice_owner_id: '' })} disabled={!hasActiveMinuteBundle}>
                                        <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-700 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(langCodeToName).map(([code, name]) => (
                                                <SelectItem key={code} value={code}>{name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        {copy.greetingMessage} <span className="text-[#00B4B4]">*</span>
                                    </label>
                                    <Textarea
                                        value={form.first_message}
                                        onChange={e => { update({ first_message: e.target.value.slice(0, 200) }); setErrors(p => ({ ...p, first_message: undefined })); }}
                                        placeholder={copy.greetingPh}
                                        rows={4}
                                        disabled={!hasActiveMinuteBundle}
                                        className={cn('rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-[#00B4B4] resize-none text-sm', errors.first_message && 'border-red-400')}
                                    />
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>{copy.greetingHint}</span>
                                        <span>{form.first_message.length}/200</span>
                                    </div>
                                    {errors.first_message && <p className="text-xs text-red-500">{errors.first_message}</p>}
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Script ──────────────────────────────── */}
                        {step === 2 && (
                            <div className="space-y-5 max-w-2xl">
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                                    <strong>{copy.optional}</strong> {copy.scriptOptional}
                                </div>

                                <div className="flex gap-3">
                                    {(['text', 'file'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => update({ script_mode: mode })}
                                            className={cn(
                                                'flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                                                form.script_mode === mode
                                                    ? 'border-[#00B4B4] text-[#00B4B4] bg-teal-50/30 dark:bg-teal-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300',
                                            )}
                                        >
                                            <span className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0', form.script_mode === mode ? 'border-[#00B4B4]' : 'border-gray-300 dark:border-gray-600')}>
                                                {form.script_mode === mode && <span className="w-2 h-2 rounded-full bg-[#00B4B4]" />}
                                            </span>
                                            {mode === 'text' ? copy.typeScript : copy.uploadFile}
                                        </button>
                                    ))}
                                </div>

                                {form.script_mode === 'text' ? (
                                    <div className="space-y-1">
                                        <Textarea
                                            value={form.script_content}
                                            onChange={e => update({ script_content: e.target.value })}
                                            placeholder={copy.scriptPlaceholder}
                                            rows={12}
                                            disabled={!hasActiveMinuteBundle}
                                            className="rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-[#00B4B4] resize-none text-sm"
                                        />
                                        <p className="text-right text-xs text-gray-400">{form.script_content.length} {copy.chars}</p>
                                    </div>
                                ) : (
                                    <DropzoneArea
                                        id="script-upload"
                                        files={form.script_files}
                                        onFilesChange={files => update({ script_files: files })}
                                        isNo={isNo}
                                    />
                                )}
                            </div>
                        )}

                        {/* ── Step 3: Voice ────────────────────────────────── */}
                        {step === 3 && (
                            <div className="space-y-5">
                                {/* Filters */}
                                <div className="flex flex-wrap gap-3">
                                    <Popover open={langSearchOpen} onOpenChange={setLangSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex items-center gap-2 h-9 px-3 w-44 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
                                                    {langFilter === 'all' ? copy.allLanguages : getLangName(langFilter)}
                                                </span>
                                                <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-52 p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search language..." className="h-9 text-sm" />
                                                <CommandList className="max-h-56">
                                                    <CommandEmpty>No language found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="all"
                                                            onSelect={() => { setLangFilter('all'); setLangSearchOpen(false); }}
                                                            className="text-sm cursor-pointer"
                                                        >
                                                            <Check className={cn('mr-2 h-4 w-4', langFilter === 'all' ? 'opacity-100' : 'opacity-0')} />
                                                            {copy.allLanguages}
                                                        </CommandItem>
                                                        {uniqueLangCodes.map(code => (
                                                            <CommandItem
                                                                key={code}
                                                                value={getLangName(code)}
                                                                onSelect={() => { setLangFilter(code); setLangSearchOpen(false); }}
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                <Check className={cn('mr-2 h-4 w-4', langFilter === code ? 'opacity-100' : 'opacity-0')} />
                                                                {getLangName(code)}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                                        <SelectTrigger className="w-32 h-9 rounded-lg text-sm border-gray-200 dark:border-gray-700">
                                            <SelectValue placeholder={copy.filterGender} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{copy.allGenders}</SelectItem>
                                            <SelectItem value="male">{copy.male}</SelectItem>
                                            <SelectItem value="female">{copy.female}</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {uniqueAccents.length > 0 && (
                                        <Select value={accentFilter} onValueChange={setAccentFilter}>
                                            <SelectTrigger className="w-36 h-9 rounded-lg text-sm border-gray-200 dark:border-gray-700">
                                                <SelectValue placeholder={copy.filterAccent} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{copy.allAccents}</SelectItem>
                                                {uniqueAccents.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {(langFilter !== 'all' || genderFilter !== 'all' || accentFilter !== 'all') && (
                                        <button
                                            type="button"
                                            onClick={() => { setLangFilter('all'); setGenderFilter('all'); setAccentFilter('all'); }}
                                            className="text-sm text-[#00B4B4] hover:underline"
                                        >
                                            {copy.clearFilters}
                                        </button>
                                    )}
                                </div>

                                {voicesLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#00B4B4]" />
                                    </div>
                                ) : filteredVoices.length === 0 ? (
                                    <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
                                        <p className="text-sm">{copy.noVoicesMatch}</p>
                                        <button type="button" onClick={() => { setLangFilter('all'); setGenderFilter('all'); setAccentFilter('all'); }} className="text-sm text-[#00B4B4] hover:underline">{copy.clearAllFilters}</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[55vh] overflow-y-auto pr-1 pb-1">
                                            {filteredVoices.map(voice => (
                                                <WizardVoiceCard
                                                    key={voice.id}
                                                    voice={voice}
                                                    isSelected={selectedVoiceId === voice.id}
                                                    isPlaying={currentlyPlayingVoiceId === voice.id && !!isVoicePlaying}
                                                    isLoading={currentlyPlayingVoiceId === voice.id && !!isVoiceLoading}
                                                    onPlayPause={() => onVoicePlayPause?.(voice)}
                                                    onSelect={() => update({
                                                        voice_preference: voice.public_owner_id
                                                            ? `${voice.id}|${voice.public_owner_id}`
                                                            : voice.id,
                                                        voice_owner_id: voice.public_owner_id || '',
                                                        ...(voice.language ? { language: voice.language.toLowerCase().slice(0, 2) } : {})
                                                    })}
                                                />
                                            ))}
                                        </div>
                                        {onLoadMoreVoices && (
                                            <div className="flex justify-center pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={onLoadMoreVoices}
                                                    disabled={loadingMoreVoices || !hasMoreVoices}
                                                    className="rounded-xl border-[#00B4B4] text-[#00B4B4] hover:bg-teal-50 dark:hover:bg-teal-900/20"
                                                >
                                                    {loadingMoreVoices ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isNo ? 'Laster...' : 'Loading...'}</>
                                                    ) : (
                                                        isNo ? `Vis flere stemmer (${totalVoices - voices.length})` : `Show More Voices (${totalVoices - voices.length})`
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <p className="text-xs text-gray-400">
                                    {copy.selected}: <span className="font-medium text-gray-600 dark:text-gray-400">{selectedVoiceName}</span>
                                </p>
                            </div>
                        )}

                        {/* ── Step 4: Review ───────────────────────────────── */}
                        {step === 4 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                                <div className="space-y-5">
                                    <ReviewRow label={copy.assistantName} value={form.assistant_name || '—'} />
                                    <ReviewRow label={copy.callType} value={form.assistant_type === 'inbound' ? copy.inbound : form.assistant_type} />
                                    <ReviewRow label={copy.assistantLanguage} value={getLangName(form.language)} />
                                    <ReviewRow label={copy.greetingMessage} value={form.first_message || '—'} multiline />
                                </div>
                                <div className="space-y-5">
                                    <ReviewRow
                                        label={copy.script}
                                        value={
                                            form.script_mode === 'text'
                                                ? (form.script_content || copy.noneProvided)
                                                : form.script_files.length > 0
                                                    ? form.script_files.map(f => f.name).join(', ')
                                                    : copy.noneProvided
                                        }
                                        multiline
                                    />
                                    <ReviewRow label={copy.voice} value={selectedVoiceName} />
                                </div>
                            </div>
                        )}

                        {/* ── Step 5: Preview ──────────────────────────────── */}
                        {step === 5 && (
                            <PreviewChat form={form} voices={voices} />
                        )}
                    </div>

                    {/* ── Footer ───────────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-10 py-5 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => step > 1 ? setStep(s => s - 1) : handleClose()}
                            className="flex items-center gap-2 rounded-xl border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 h-11 px-5"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {step > 1 ? copy.back : copy.cancel}
                        </Button>

                        {!hasActiveMinuteBundle ? (
                            <Button disabled className="rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed flex items-center gap-2 h-11 px-7">
                                <Lock className="w-4 h-4" />
                                {step === 5 ? copy.submitRequest : copy.continue}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleContinue}
                                disabled={submitting}
                                className="rounded-xl bg-[#00B4B4] hover:bg-[#009999] text-white h-11 px-7 min-w-[140px] font-semibold"
                            >
                                {submitting
                                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{copy.submitting}</>
                                    : step === 5
                                        ? copy.submitRequest
                                        : <span className="flex items-center gap-2">{copy.continue} <ChevronRight className="w-4 h-4" /></span>
                                }
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
