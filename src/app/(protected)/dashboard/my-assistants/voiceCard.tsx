import React from 'react';
import { Play, Pause, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LANG_CODE_TO_LABEL: Record<string, { code: string; color: string }> = {
  en: { code: 'EN', color: 'text-red-600' },
  no: { code: 'NO', color: 'text-blue-600' },
  es: { code: 'ES', color: 'text-orange-600' },
  fr: { code: 'FR', color: 'text-indigo-600' },
  de: { code: 'DE', color: 'text-yellow-700' },
  it: { code: 'IT', color: 'text-green-600' },
  pt: { code: 'PT', color: 'text-emerald-600' },
  ar: { code: 'AR', color: 'text-teal-600' },
  zh: { code: 'ZH', color: 'text-rose-600' },
  ja: { code: 'JA', color: 'text-pink-600' },
  ko: { code: 'KO', color: 'text-violet-600' },
  hi: { code: 'HI', color: 'text-amber-600' },
  ru: { code: 'RU', color: 'text-cyan-600' },
  nl: { code: 'NL', color: 'text-orange-500' },
  sv: { code: 'SV', color: 'text-blue-500' },
  da: { code: 'DA', color: 'text-red-500' },
  fi: { code: 'FI', color: 'text-blue-400' },
  pl: { code: 'PL', color: 'text-red-700' },
  tr: { code: 'TR', color: 'text-red-600' },
};

export type VoiceCardProps = {
  name: string;
  provider: string;
  gender: string;
  accent: string;
  bestFor: string;
  language?: string;
  isActive?: boolean;
  isPlaying?: boolean;
  isLoading?: boolean;
  isSelected?: boolean;
  isCurrent?: boolean;
  onPlayPause?: () => void;
  onClick?: () => void;
  className?: string;
};

const VoiceCard = React.memo(function VoiceCard({
  name = 'Sarah',
  provider = '11LABS',
  gender = 'female',
  accent = 'Norwegian',
  bestFor = 'Norsk Reklame',
  language = 'en',
  isActive = true,
  isPlaying = false,
  isLoading = false,
  isSelected = false,
  isCurrent = false,
  onPlayPause,
  onClick,
  className = ''
}: VoiceCardProps) {
  const getButtonState = () => {
    if (isLoading) return 'loading';
    if (isPlaying) return 'playing';
    return 'idle';
  };

  const buttonState = getButtonState();
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const langInfo = LANG_CODE_TO_LABEL[language] || { code: language?.toUpperCase()?.slice(0, 2) || '??', color: 'text-gray-600' };

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
        isCurrent
          ? 'bg-primary/10 border border-primary/30 shadow-sm'
          : isSelected
            ? 'bg-blue-50 border border-blue-200'
            : 'hover:bg-gray-50 border border-transparent'
      } ${className}`}
      onClick={onClick}
    >
      {/* Avatar with check indicator */}
      <div className='relative'>
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isCurrent
            ? 'bg-primary text-primary-foreground'
            : isSelected
              ? 'bg-blue-500 text-white'
              : 'bg-gradient-to-br from-purple-400 to-pink-400 text-white'
        }`}>
          {initials}
        </div>
        {(isCurrent || isSelected) && (
          <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center ${
            isCurrent ? 'bg-primary' : 'bg-blue-500'
          }`}>
            <Check className='h-2.5 w-2.5 text-white' />
          </div>
        )}
      </div>

      {/* Voice Info */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <h4 className='text-sm font-semibold text-gray-900 truncate'>{name}</h4>
          {isCurrent && (
            <Badge className='bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4 flex-shrink-0'>
              Current
            </Badge>
          )}
          {isSelected && !isCurrent && (
            <Badge variant='outline' className='text-blue-600 border-blue-300 text-[10px] px-1.5 py-0 h-4 flex-shrink-0'>
              Selected
            </Badge>
          )}
        </div>
        <div className='flex items-center gap-1.5 mt-0.5'>
          <span className={`text-[10px] font-medium ${langInfo.color}`}>{langInfo.code}</span>
          <span className='text-[10px] text-gray-400'>•</span>
          <span className='text-[10px] text-gray-500 truncate'>{gender}</span>
          {bestFor && (
            <>
              <span className='text-[10px] text-gray-400'>•</span>
              <span className='text-[10px] text-gray-500 truncate'>{bestFor}</span>
            </>
          )}
        </div>
      </div>

      {/* Play Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlayPause?.();
        }}
        disabled={isLoading}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
          buttonState === 'loading'
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : buttonState === 'playing'
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'hover:bg-gray-100 text-gray-600'
        }`}
        aria-label={
          buttonState === 'loading'
            ? 'Loading...'
            : buttonState === 'playing'
              ? 'Pause voice'
              : 'Play voice'
        }
      >
        {buttonState === 'loading' ? (
          <div className='h-3 w-3'>
            <div className='border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent'></div>
          </div>
        ) : buttonState === 'playing' ? (
          <Pause className='h-4 w-4 fill-current' />
        ) : (
          <Play className='h-4 w-4 fill-current' />
        )}
      </button>
    </div>
  );
});

export default VoiceCard;
