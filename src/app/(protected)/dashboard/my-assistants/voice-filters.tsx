// components/voice-language-switcher.tsx
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter, Loader2 } from 'lucide-react';

export type VoiceFiltersProps = {
  onFiltersChange?: (filters: VoiceFilters) => void;
  onLanguageChange?: (language: string) => void;
  defaultValue?: string;
  showResetButton?: boolean;
  voices?: VoiceData[];
  availableLanguages?: string[];
  availableAccents?: string[];
  isLoading?: boolean;
};

export type VoiceFilters = {
  language: string | 'all';
  gender: 'male' | 'female' | 'all';
  accent: string | 'all';
};

export type VoiceData = {
  id: string;
  name: string;
  provider: string;
  description?: string;
  type: 'male' | 'female';
  language: string;
  accent: string;
  bestFor?: string;
  preview_url?: string;
  public_owner_id?: string | null;
};

// Map language codes to display names
const LANG_CODE_TO_NAME: Record<string, string> = {
  en: 'english', no: 'norwegian', es: 'spanish', fr: 'french',
  de: 'german', it: 'italian', pt: 'portuguese', pl: 'polish',
  hi: 'hindi', ar: 'arabic', zh: 'chinese', ja: 'japanese',
  ko: 'korean', nl: 'dutch', sv: 'swedish', da: 'danish',
  fi: 'finnish', ru: 'russian', tr: 'turkish', cs: 'czech',
  ro: 'romanian', hu: 'hungarian', el: 'greek', id: 'indonesian',
  ms: 'malay', ta: 'tamil', uk: 'ukrainian', bg: 'bulgarian',
  hr: 'croatian', sk: 'slovak', fil: 'filipino', vi: 'vietnamese',
  th: 'thai',
};

export const langCodeToName = (code: string): string => {
  return LANG_CODE_TO_NAME[code] || code;
};

export const nameToLangCode = (name: string): string => {
  const entry = Object.entries(LANG_CODE_TO_NAME).find(([, v]) => v === name);
  return entry ? entry[0] : name;
};

function VoiceFilters({
  onFiltersChange,
  onLanguageChange,
  defaultValue = 'english',
  showResetButton = true,
  voices = [],
  availableLanguages = [],
  availableAccents = [],
  isLoading = false
}: VoiceFiltersProps) {
  const [filters, setFilters] = useState<VoiceFilters>({
    language: defaultValue,
    gender: 'all',
    accent: 'all'
  });

  // Get available accents - use cached list if available, otherwise derive from voices
  const getAvailableAccents = () => {
    if (availableAccents.length > 0) {
      return ['all' as const, ...availableAccents];
    }

    const filteredVoices = voices.filter((voice) => {
      if (filters.language !== 'all') {
        const voiceLang = langCodeToName(voice.language);
        if (voiceLang !== filters.language) return false;
      }
      if (filters.gender !== 'all' && voice.type !== filters.gender)
        return false;
      return true;
    });

    const accents = Array.from(
      new Set(filteredVoices.map((voice) => voice.accent || 'Standard'))
    );
    return ['all' as const, ...accents].sort();
  };

  const handleFilterChange = (
    filterType: keyof VoiceFilters,
    value: string
  ) => {
    const newFilters = { ...filters };

    if (filterType === 'language') {
      newFilters.language = value;
      newFilters.gender = 'all';
      newFilters.accent = 'all';
    } else if (filterType === 'gender') {
      newFilters.gender = value as 'male' | 'female' | 'all';
    } else if (filterType === 'accent') {
      newFilters.accent = value;
    }

    setFilters(newFilters);
    onFiltersChange?.(newFilters);

    if (filterType === 'language') {
      onLanguageChange?.(value);
    }
  };

  const handleResetFilters = () => {
    const resetFilters: VoiceFilters = {
      language: defaultValue,
      gender: 'all',
      accent: 'all'
    };
    setFilters(resetFilters);
    onFiltersChange?.(resetFilters);
    onLanguageChange?.(defaultValue);
  };

  // Get available genders based on selected language
  const getAvailableGenders = () => {
    const filteredVoices = voices.filter((voice) => {
      if (filters.language !== 'all') {
        const voiceLang = langCodeToName(voice.language);
        return voiceLang === filters.language;
      }
      return true;
    });

    const genders = Array.from(
      new Set(filteredVoices.map((voice) => voice.type))
    );
    return ['all' as const, ...genders];
  };

  // Filter voices based on all criteria
  const getFilteredVoices = () => {
    return voices.filter((voice) => {
      if (filters.language !== 'all') {
        const voiceLang = langCodeToName(voice.language);
        if (voiceLang !== filters.language) return false;
      }
      if (filters.gender !== 'all' && voice.type !== filters.gender)
        return false;
      if (filters.accent !== 'all' && voice.accent !== filters.accent)
        return false;
      return true;
    });
  };


  return (
    <div className='space-y-4'>
      {/* Filter header */}
      <div className='mb-1 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Filter className='text-muted-foreground h-4 w-4' />
          <h3 className='font-medium'>Voice Filters</h3>
        </div>
      </div>

      {/* Filter controls */}
      <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
        {/* Language Filter */}
        <div className='space-y-2'>
          <Select
            value={filters.language}
            onValueChange={(value) => handleFilterChange('language', value)}
            disabled={false}
          >
            <SelectTrigger id='voice-language' className='h-9 text-sm'>
              <SelectValue placeholder='Select language' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Languages</SelectItem>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  <div className='flex items-center gap-2 capitalize'>
                    {lang}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender Filter */}
        <div className='space-y-2'>
          <Select
            value={filters.gender}
            onValueChange={(value) => handleFilterChange('gender', value)}
          >
            <SelectTrigger id='voice-gender' className='h-9 text-sm'>
              <SelectValue placeholder='Select gender' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Genders</SelectItem>
              <SelectItem value='male'>Male</SelectItem>
              <SelectItem value='female'>Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Accent Filter */}
        <div className='space-y-2'>
          <Select
            value={filters.accent}
            onValueChange={(value) => handleFilterChange('accent', value)}
            disabled={false}
          >
            <SelectTrigger id='voice-accent' className='h-9 text-sm'>
              <SelectValue placeholder='Select accent' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Accents</SelectItem>
              {getAvailableAccents()
                .filter((accent) => accent !== 'all')
                .map((accent) => (
                  <SelectItem key={accent} value={accent}>
                    {accent}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default VoiceFilters;
