'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className = '' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const trySetDuration = () => {
      const d = audio.duration;
      if (isFinite(d) && !isNaN(d) && d > 0) setDuration(d);
      setIsLoading(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', trySetDuration);
    audio.addEventListener('durationchange', trySetDuration);
    audio.addEventListener('canplaythrough', trySetDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadeddata', trySetDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', trySetDuration);
      audio.removeEventListener('durationchange', trySetDuration);
      audio.removeEventListener('canplaythrough', trySetDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadeddata', trySetDuration);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audio.currentTime = percentage * duration;
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const unknownDuration = duration === 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        disabled={isLoading}
        className="h-8 w-8 shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Time Display */}
      <div className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
        {formatTime(currentTime)} / {unknownDuration ? '--:--' : formatTime(duration)}
      </div>

      {/* Progress Bar */}
      <div
        className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative overflow-hidden"
        onClick={handleProgressClick}
      >
        {unknownDuration && isPlaying ? (
          /* Indeterminate animation when duration is unknown but audio is playing */
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div
              className="h-full w-1/3 rounded-full bg-primary animate-[slide_1.5s_ease-in-out_infinite]"
              style={{
                animation: 'indeterminate 1.5s ease-in-out infinite',
              }}
            />
          </div>
        ) : (
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-[width] duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        )}
      </div>

      {/* Volume and Menu Icons */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Volume2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
