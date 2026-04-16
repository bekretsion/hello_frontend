'use client';

import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

export function useVoicePreview() {
  const vapiRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);
  const lastStartTimeRef = useRef<number>(0);
  const MIN_CALL_INTERVAL = 3000; // Minimum 3 seconds between calls
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    // Mark as mounted
    isMountedRef.current = true;

    // Get public key from environment
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      console.error('[VoicePreview] NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set');
      setError(
        'Vapi public key not configured. Add NEXT_PUBLIC_VAPI_PUBLIC_KEY to .env.local'
      );
      return;
    }

    try {
      // Initialize Vapi with public key
      vapiRef.current = new Vapi(publicKey);

      // Setup event listeners
      vapiRef.current.on('call-start', () => {
        setIsPlaying(true);
         setIsInitializing(false);
        setError(null);
      });

      vapiRef.current.on('call-end', (endData: any) => {
        setIsPlaying(false);
        setIsInitializing(false);
        setVolumeLevel(0);

        // If call ended too quickly, it might be an error
        if (isPlaying) {
          setError(
            'Call ended unexpectedly. Check your Vapi account configuration.'
          );
        }
      });

      vapiRef.current.on('error', (err: any) => {
        let errorMessage = 'Failed to play voice preview';

        if (err) {
          // Check for network errors
          if (
            err.type === 'daily-call-join-error' ||
            err.type === 'start-method-error'
          ) {
            errorMessage = 'Network connection failed. Please try again.';
          } else if (typeof err === 'string') {
            errorMessage = err;
          } else if (err.errorMsg) {
            errorMessage = String(err.errorMsg);
          } else if (err.message) {
            errorMessage = String(err.message);
          } else if (err.error && typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.statusCode === 401 || err.statusCode === 403) {
            errorMessage =
              'Invalid Vapi Public Key. Please check your configuration.';
          } else {
            errorMessage =
              'Failed to connect to Vapi. Please check your internet connection.';
          }
        }

        // Don't show "Meeting has ended" as an error - that's normal after voice finishes
        if (errorMessage.includes('Meeting has ended')) {
          return;
        }

        if (errorMessage !== 'Failed to play voice preview') {
          console.error('[VoicePreview] Error:', errorMessage);
        }

        setError(errorMessage);
        setIsPlaying(false);
        setIsInitializing(false);
        setVolumeLevel(0);
      });

      vapiRef.current.on('speech-start', () => {});

      vapiRef.current.on('speech-end', () => {});

      vapiRef.current.on('message', (message: any) => {});

      vapiRef.current.on('volume-level', (level: number) => {
        setVolumeLevel(level); // store volume for UI animation
      });
    } catch (err) {
      console.error('[VoicePreview] Failed to initialize Vapi:', err);
      setError('Failed to initialize voice preview');
    }

    return () => {
      // Mark as unmounted
      isMountedRef.current = false;

      // Cleanup on unmount
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          console.error('[VoicePreview] Cleanup error:', e);
        }
      }
    };
  }, []);

  const playVoice = async (
    voiceId: string,
    voiceName: string,
    provider: string = '11labs'
  ) => {
    // Ensure component is still mounted
    if (!isMountedRef.current) {
      return;
    }

    // If vapiRef is null, try to re-initialize (can happen with Fast Refresh in dev mode)
    if (!vapiRef.current) {
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

      if (!publicKey) {
        const errorMsg =
          'Vapi Public Key not found. Add NEXT_PUBLIC_VAPI_PUBLIC_KEY to .env.local and restart dev server.';
        console.error('[VoicePreview]', errorMsg);
        setError(errorMsg);
        return;
      }

      try {
        vapiRef.current = new Vapi(publicKey);

        // Re-attach event listeners
        vapiRef.current.on('call-start', () => {
          setIsPlaying(true);
          setIsInitializing(false);
          setError(null);
        });

        vapiRef.current.on('call-end', (endData: any) => {
          setIsPlaying(false);
          setIsInitializing(false);
        });

        vapiRef.current.on('error', (err: any) => {
          let errorMessage = 'Failed to play voice preview';

          if (err) {
            if (
              err.type === 'daily-call-join-error' ||
              err.type === 'start-method-error'
            ) {
              errorMessage = 'Network connection failed. Please try again.';
            } else if (typeof err === 'string') {
              errorMessage = err;
            } else if (err.errorMsg) {
              errorMessage = String(err.errorMsg);
            } else if (err.message) {
              errorMessage = String(err.message);
            } else if (err.error && typeof err.error === 'string') {
              errorMessage = err.error;
            } else if (err.statusCode === 401 || err.statusCode === 403) {
              errorMessage =
                'Invalid Vapi Public Key. Please check your configuration.';
            } else {
              errorMessage =
                'Failed to connect to Vapi. Please check your Public Key and internet connection.';
            }
          }

          // Don't show "Meeting has ended" as an error - that's normal after voice finishes
          if (errorMessage.includes('Meeting has ended')) {
            return;
          }

          if (errorMessage !== 'Failed to play voice preview') {
            console.error('[VoicePreview] Error:', errorMessage);
          }

          setError(errorMessage);
          setIsPlaying(false);
          setIsInitializing(false);
        });
      } catch (err) {
        console.error('[VoicePreview] Failed to re-initialize:', err);
        setError('Failed to initialize Vapi SDK. Please refresh the page.');
        return;
      }
    }

    // Only stop if there's an active call to prevent false "ejection" errors
    if (isPlaying || isInitializing) {
      try {
        vapiRef.current.stop();
        // Wait for cleanup to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        // Silent fail on stop
      }
    }

    // Enforce minimum time between call starts to prevent ejection
    const timeSinceLastStart = Date.now() - lastStartTimeRef.current;
    if (
      lastStartTimeRef.current > 0 &&
      timeSinceLastStart < MIN_CALL_INTERVAL
    ) {
      const waitTime = MIN_CALL_INTERVAL - timeSinceLastStart;
      setIsInitializing(true);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Record this start time
    lastStartTimeRef.current = Date.now();

    try {
      setIsInitializing(true);
      setError(null);

      // Check microphone permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        stream.getTracks().forEach((track) => track.stop());
      } catch (micError: any) {
        console.error('[VoicePreview] Microphone permission denied:', micError);
        setError(
          'Microphone access is required. Please allow microphone permissions and try again.'
        );
        return;
      }

      // Create a transient assistant configuration for testing the voice
      const assistantConfig = {
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en'
        },
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful voice preview assistant. Say the first message and wait for user to end the call.'
            }
          ],
          temperature: 0.7
        },
        voice: {
          provider: provider,
          voiceId: voiceId
        },
        firstMessage: `Hello! This is a preview of the ${voiceName} voice. I'm speaking so you can hear how this voice sounds. Thank you for listening!`,
        endCallMessage: 'Goodbye!',
        silenceTimeoutSeconds: 10,
        recordingEnabled: false,
        clientMessages: [],
        backgroundSound: 'off'
      };

      // Start the call with the transient assistant config
      await vapiRef.current.start(assistantConfig);


    } catch (err: any) {
      console.error('[VoicePreview] Failed to start preview:', err);
      const errorMessage =
        err?.message ||
        err?.error ||
        'Failed to play voice preview. Please check your Vapi configuration.';
      setError(errorMessage);
      setIsPlaying(false);
      setIsInitializing(false);
    }
  };

  const stopVoice = async () => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
        setIsPlaying(false);
        setIsInitializing(false);

        // Wait for cleanup to complete before allowing another call
        await new Promise((resolve) => {
          cleanupTimeoutRef.current = setTimeout(resolve, 800);
        });
      } catch (err) {
        console.error('[VoicePreview] Failed to stop:', err);
        setIsPlaying(false);
        setIsInitializing(false);
      }
    }
  };

  return {
    playVoice,
    stopVoice,
    isPlaying,
    isInitializing,
    error,
    volumeLevel
  };
}
