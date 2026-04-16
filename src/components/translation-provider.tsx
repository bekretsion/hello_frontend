'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useLanguage } from '@/hooks/use-language';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface TranslationProviderProps {
  children: React.ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const { currentLanguage } = useLanguage();

  // Sync language preference to cookie for server-side access
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1];
      
      // If cookie doesn't exist but we have a language preference, set it
      if (!cookieValue && currentLanguage) {
        document.cookie = `NEXT_LOCALE=${currentLanguage}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  }, [currentLanguage]);
  const [messages, setMessages] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sync language preference to cookie for server-side access
    if (typeof document !== 'undefined' && currentLanguage) {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1];
      
      // If cookie doesn't exist or doesn't match current language, set it
      if (cookieValue !== currentLanguage) {
        document.cookie = `NEXT_LOCALE=${currentLanguage}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  }, [currentLanguage]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        // Use dynamic import with await to properly load the messages
        const messagesModule = await import(`../../messages/${currentLanguage}.json`);
        setMessages(messagesModule.default);
      } catch (error) {
        console.error('Failed to load messages:', error);
        try {
          // Fallback to English if the locale file doesn't exist
          const fallbackMessages = await import(`../../messages/en.json`);
          setMessages(fallbackMessages.default);
        } catch (fallbackError) {
          console.error('Failed to load fallback messages:', fallbackError);
          setMessages({});
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
    
    // Listen for language change events
    const handleLanguageChange = () => {
      loadMessages();
    };
    
    window.addEventListener('languageChange', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, [currentLanguage]);

  if (isLoading || !messages) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm text-muted-foreground">
            {currentLanguage === 'no' ? 'Laster oversettelser...' : 'Loading translations...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <NextIntlClientProvider
      locale={currentLanguage}
      messages={messages}
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  );
}