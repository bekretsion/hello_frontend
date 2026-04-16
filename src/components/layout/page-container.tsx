'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProfileCompletionBanner } from '@/components/auth/profile-completion-banner';

export default function PageContainer({
  children,
  scrollable = true
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className='h-[calc(100dvh-52px)] w-full'>
          <div className='flex flex-1 flex-col p-4 md:px-6 w-full min-h-0'>
            <ProfileCompletionBanner />
            {children}
          </div>
        </ScrollArea>
      ) : (
        <div className='flex flex-1 flex-col p-4 md:px-6 w-full min-h-0'>
          <ProfileCompletionBanner />
          {children}
        </div>
      )}
    </>
  );
}
