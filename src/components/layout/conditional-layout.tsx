'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

/**
 * This component hides the sidebar and header for specific full-screen pages.
 */
export function ConditionalLayout({ children, sidebar, header }: { 
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
}) {
  const pathname = usePathname();

  // Full-screen pages that should NOT show sidebar/header
  const onboardingJourneyPages = [
    '/dashboard/store',
    '/dashboard/activation'
  ];

  const isOnboardingPage = onboardingJourneyPages.some(page => pathname?.startsWith(page));

  // If on an onboarding page, render without sidebar and header
  if (isOnboardingPage) {
    return (
      <div className="h-screen w-full overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {children}
      </div>
    );
  }

  // Otherwise, render with full layout
  return (
    <>
      {sidebar}
      <div className="flex flex-col h-screen overflow-hidden w-full">
        {header}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent will-change-contents">
          {children}
        </main>
      </div>
    </>
  );
}

