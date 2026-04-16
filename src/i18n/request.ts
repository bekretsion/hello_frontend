import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { locales, defaultLocale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale: typeof defaultLocale = defaultLocale;
  
  try {
    // Priority: 1. Cookie (user preference), 2. requestLocale (URL/header), 3. defaultLocale
    try {
      const cookieStore = await cookies();
      const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
      
      // First, check cookie (user preference takes priority)
      if (localeCookie && locales.includes(localeCookie as any)) {
        locale = localeCookie as typeof defaultLocale;
      }
    } catch (cookieError) {
      // If cookies() fails (e.g., during build/compilation), skip cookie check
      // This can happen during static generation or dev compilation
    }
    
    // If no cookie or cookie check failed, check requestLocale
    if (locale === defaultLocale) {
      try {
        const requestLocaleValue = await requestLocale;
        if (requestLocaleValue && locales.includes(requestLocaleValue as any)) {
          locale = requestLocaleValue as typeof defaultLocale;
        }
      } catch (error) {
        // Fall back to default locale
      }
    }
  } catch (error) {
    // Fall back to default locale on any error
    locale = defaultLocale;
  }

  // Load messages with error handling
  try {
    const messages = await import(`../../messages/${locale}.json`);
    return {
      locale,
      messages: messages.default
    };
  } catch (error) {
    // Fallback to default locale messages
    const defaultMessages = await import(`../../messages/${defaultLocale}.json`);
    return {
      locale: defaultLocale,
      messages: defaultMessages.default
    };
  }
});
