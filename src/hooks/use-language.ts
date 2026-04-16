'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'no';

interface LanguageState {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      isRTL: false,
      setLanguage: (language: Language) => {
        set({ 
          currentLanguage: language,
          isRTL: false
        });
        
        if (typeof document !== 'undefined') {
          document.documentElement.lang = language;
          // Set cookie for server-side locale detection
          document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000; SameSite=Lax`;
          // Emit custom event for client-side components
          window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
          // Force page reload to ensure server-side components get the new locale
          // Small delay to ensure cookie is set
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      },
    }),
    {
      name: 'language-storage',
    }
  )
);

export const useLanguage = () => {
  const { currentLanguage, setLanguage, isRTL } = useLanguageStore();
  
  return {
    currentLanguage,
    setLanguage,
    isRTL,
  };
};