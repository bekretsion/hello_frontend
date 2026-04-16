'use client';

import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { UserNav } from './user-nav';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import NotificationsBell from './notifications-bell';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '../ui/badge';
import { ProfileCompletionPill } from '@/components/auth/profile-completion-steps';

export default function Header() {
  const router = useRouter();
  const { user } = useAuthStore();

  // The handleLogout function remains here, as it contains router logic.
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/login');
        router.refresh(); // Important to clear router cache
        console.log('Logout successful');
      } else {
        const data = await response.json();
        console.error('Logout failed:', data.message);
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('An error occurred during logout:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  // Get account type badge styling
  const getAccountTypeBadge = () => {
    if (!user?.activeAccountType) return null;

    const isInbound = user.activeAccountType === 'inbound';
    return (
      <Badge
        variant={isInbound ? 'default' : 'secondary'}
        className={`text-xs font-medium ${isInbound
            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
          }`}
      >
        {user.activeAccountType.toUpperCase()}
      </Badge>
    );
  };

  return (
    <header className='flex h-14 sm:h-16 shrink-0 items-center justify-between gap-1 sm:gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 overflow-hidden'>
      <div className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4 min-w-0 flex-1'>
        <SidebarTrigger className='-ml-1 flex-shrink-0' />
        <Separator orientation='vertical' className='mr-1 sm:mr-2 h-4 hidden sm:block' />
        <Link href='/dashboard' className='mr-2 sm:mr-4 flex-shrink-0 hidden sm:block'>
          <Image
            src='/images/Hello_Transparent.png'
            alt='Hello Logo'
            width={600}
            height={140}
            className='h-24 sm:h-28 w-auto'
            priority
            unoptimized
          />
        </Link>
        <div className='min-w-0 flex-1'>
          <Breadcrumbs />
        </div>
        <div className='hidden sm:flex items-center gap-1 sm:gap-2 flex-shrink-0'>
          {getAccountTypeBadge()}
          <Separator orientation='vertical' className='h-4' />
          {/* Profile Completion Pill - Shows percentage and opens modal on click */}
          <ProfileCompletionPill />
        </div>
      </div>

      <div className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4 flex-shrink-0'>
        <NotificationsBell data-tour="notifications" />
        <UserNav onLogout={handleLogout} data-tour="user-nav" />
        <ModeToggle data-tour="theme-toggle" />
      </div>
    </header>
  );
}
