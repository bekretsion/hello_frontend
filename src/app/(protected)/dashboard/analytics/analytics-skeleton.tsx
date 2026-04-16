import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ✅ No 'use client' — pure server component so skeleton is SSR'd as HTML
// The page heading is rendered by page.tsx above this, so we skip it here
export default function AnalyticsSkeleton() {
  return (
    <div className='flex flex-1 flex-col space-y-3 sm:space-y-4 mb-6 sm:mb-8 w-full min-w-0 px-2 sm:px-0'>
      {/* Filter row skeleton */}
      <div className='flex items-center justify-end gap-2'>
        <Skeleton className='h-9 w-9 rounded-md' />
        <Skeleton className='h-9 w-24 rounded-md' />
        <Skeleton className='h-10 w-[180px] rounded-md' />
      </div>

      {/* KPI Cards — 5-column grid matches real layout */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 w-full'>
        {/* Circle placeholder */}
        <Card className='overflow-hidden min-w-0'>
          <CardContent className='p-3 sm:p-4 min-h-[140px] sm:min-h-[160px] flex items-center justify-center'>
            <Skeleton className='w-[120px] h-[120px] rounded-full' />
          </CardContent>
        </Card>

        {/* 4 KPI stat cards */}
        {[...Array(4)].map((_, i) => (
          <Card key={i} className='min-w-0 overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3'>
              <Skeleton className='h-3 w-24' />
              <Skeleton className='h-3 w-3 rounded-full' />
            </CardHeader>
            <CardContent className='px-3 pb-3'>
              <Skeleton className='h-6 w-16 mb-2' />
              <Skeleton className='h-[45px] w-full' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + Chart placeholder */}
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full rounded-md' />
        <Card className='overflow-hidden'>
          <CardHeader>
            <Skeleton className='h-5 w-40' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-[350px] w-full' />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
