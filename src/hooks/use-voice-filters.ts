import {
  VoiceData,
  VoiceFilters
} from '@/app/(protected)/dashboard/my-assistants/voice-filters';
import { useState, useMemo } from 'react';

const langCodeToName: Record<string, string> = {
  en: 'english', no: 'norwegian', es: 'spanish', fr: 'french',
  de: 'german', it: 'italian', pt: 'portuguese', pl: 'polish',
  hi: 'hindi', ar: 'arabic', zh: 'chinese', ja: 'japanese',
  ko: 'korean', nl: 'dutch', sv: 'swedish', da: 'danish',
  fi: 'finnish', ru: 'russian', tr: 'turkish', cs: 'czech',
  ro: 'romanian', hu: 'hungarian', el: 'greek', id: 'indonesian',
  ms: 'malay', ta: 'tamil', uk: 'ukrainian', bg: 'bulgarian',
  hr: 'croatian', sk: 'slovak', fil: 'filipino', vi: 'vietnamese',
  th: 'thai'
};

export function useVoiceFilters(voices: VoiceData[] = [], selectedVoiceId?: string) {
  const [filters, setFilters] = useState<VoiceFilters>({
    language: 'all',
    gender: 'all',
    accent: 'all'
  });

  const filteredVoices = useMemo(() => {
    return voices.filter((voice) => {
      // Always include the currently selected voice so it always appears first
      if (selectedVoiceId && voice.id === selectedVoiceId) return true;
      if (filters.language !== 'all') {
        const voiceLang = langCodeToName[voice.language] || voice.language;
        if (voiceLang !== filters.language) return false;
      }
      if (filters.gender !== 'all' && voice.type !== filters.gender)
        return false;
      if (filters.accent !== 'all' && voice.accent !== filters.accent)
        return false;
      return true;
    });
  }, [voices, filters, selectedVoiceId]);

  // Group voices by language
  const englishVoices = useMemo(
    () => voices.filter((v) => v.language === 'en'),
    [voices]
  );

  const norwegianVoices = useMemo(
    () => voices.filter((v) => v.language === 'no'),
    [voices]
  );

  const resetFilters = () => {
    setFilters({
      language: 'all',
      gender: 'all',
      accent: 'all'
    });
  };

  return {
    filters,
    setFilters,
    filteredVoices,
    englishVoices,
    norwegianVoices,
    resetFilters,
    allVoices: voices
  };
}
