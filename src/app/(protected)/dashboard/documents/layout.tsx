import PageContainer from '@/components/layout/page-container';
import type { ReactNode } from 'react';

export default function DocumentsLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer scrollable>
      <div className="space-y-6 flex flex-col flex-1 min-h-0 w-full">
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {children}
        </div>
      </div>
    </PageContainer>
  );
}


