import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/lib/font';
import ThemeProvider from '@/components/layout/ThemeToggle/theme-provider';
import { TranslationProvider } from '@/components/translation-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';
import './theme.css';
import { ExcelDataProvider } from "@/context/ExcelDataContext";

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b'
};

export const metadata: Metadata = {
  title: 'Next Shadcn',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  let activeThemeValue: string | undefined;
  let isScaled = false;

  try {
    const cookieStore = await cookies();
    activeThemeValue = cookieStore.get('active_theme')?.value;
    isScaled = activeThemeValue?.endsWith('-scaled') || false;
  } catch (error) {
    // If cookies() fails (e.g., during build/compilation), use defaults
    // This can happen during static generation or dev compilation
    activeThemeValue = undefined;
    isScaled = false;
  }

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
              try {
                // Sync language preference from localStorage to cookie for server-side access
                // This runs before server-side rendering to ensure cookie is available
                const languageStorage = localStorage.getItem('language-storage');
                if (languageStorage) {
                  try {
                    const parsed = JSON.parse(languageStorage);
                    // Zustand persist stores as { state: { currentLanguage: 'no' } }
                    const currentLanguage = parsed?.state?.currentLanguage || parsed?.currentLanguage || 'en';
                    if (currentLanguage === 'en' || currentLanguage === 'no') {
                      // Set cookie synchronously before any server requests
                      document.cookie = 'NEXT_LOCALE=' + currentLanguage + '; path=/; max-age=31536000; SameSite=Lax';
                    }
                  } catch (e) {
                    // If parsing fails, default to English
                    document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax';
                  }
                } else {
                  // No language preference found, default to English
                  document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax';
                }
              } catch (_) {
                // Fallback to English if anything fails
                try {
                  document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax';
                } catch (_) {}
              }
            `
          }}
        />
      </head>
      <body
        suppressHydrationWarning={true} // Added this line for testing
        className={cn(
          'bg-background overflow-hidden overscroll-none font-sans antialiased',
          activeThemeValue ? `theme-${activeThemeValue}` : '',
          isScaled ? 'theme-scaled' : '',
          fontVariables
        )}
      >
        <NextTopLoader showSpinner={false} />
        <NuqsAdapter>
          <ThemeProvider
            attribute='class'
            defaultTheme='light'
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <TranslationProvider>
              <Providers activeThemeValue={activeThemeValue as string}>
                <ExcelDataProvider>
                  <Toaster />
                  {children}
                </ExcelDataProvider>
              </Providers>
            </TranslationProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
