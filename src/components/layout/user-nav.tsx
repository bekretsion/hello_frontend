'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LogOut,
  PhoneIncoming,
  PhoneOutgoing,
  Settings,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';

type UserNavProps = {
  onLogout: () => void;
  'data-tour'?: string;
};

export function UserNav({ onLogout, 'data-tour': dataTour }: UserNavProps) {
  const router = useRouter();
  const t = useTranslations('userNav');
  const [isLoading, setIsLoading] = useState(false);
  const { user, switchAccount } = useAuthStore();

  const handleAccountSwitch = async (accountType: 'inbound' | 'outbound') => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to switch account');
      }

      // Update the auth store with new account type
      switchAccount(accountType);

      toast.success(`Successfully switched to ${accountType} account`, {
        description: `You are now using the ${accountType} account features.`
      });

      // Refresh the page to update the UI with new account context
      window.location.reload();
    } catch (error) {
      toast.error('Account switch failed', {
        description:
          error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountRequest = (requestedType: 'inbound' | 'outbound') => {
    toast.success(`Successfully requested ${requestedType} access`, {
      description: `Your request for ${requestedType} account features has been submitted and is waiting for admin approval.`
    });
  };

  // Check if user can switch between account types
  const canSwitchToInbound = user?.role?.includes('inbound');
  const canSwitchToOutbound = user?.role?.includes('outbound');
  const canSwitchAccounts = canSwitchToInbound && canSwitchToOutbound;
  const currentAccountType = user?.activeAccountType || 'inbound';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='relative h-8 w-8 rounded-full'
          data-tour={dataTour}
        >
          <User className='h-5 w-5' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>{t('myAccount')}</p>
            <p className='text-muted-foreground text-xs leading-none'>
              {user?.email}
            </p>
            {user?.activeAccountType && (
              <p className='text-muted-foreground text-xs leading-none'>
                Current: {user.activeAccountType} account
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push('/dashboard/settings')}
            className='cursor-pointer'
          >
            <User className='mr-2 h-4 w-4' />
            <span>{t('myAccount')}</span>
          </DropdownMenuItem>

          {/* Account switching options - only show if user has access to both */}
          {canSwitchAccounts && (
            <>
              <DropdownMenuItem
                onClick={() => handleAccountSwitch('outbound')}
                className='cursor-pointer'
                disabled={isLoading || currentAccountType === 'outbound'}
              >
                <PhoneOutgoing className='mr-2 h-4 w-4' />
                <span>{t('outboundAccount')}</span>
                {currentAccountType === 'outbound' && (
                  <span className='ml-auto text-xs text-green-600'>Active</span>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleAccountSwitch('inbound')}
                className='cursor-pointer'
                disabled={isLoading || currentAccountType === 'inbound'}
              >
                <PhoneIncoming className='mr-2 h-4 w-4' />
                <span>{t('inboundAccount')}</span>
                {currentAccountType === 'inbound' && (
                  <span className='ml-auto text-xs text-green-600'>Active</span>
                )}
              </DropdownMenuItem>
            </>
          )}

          {/* Show current active account and request option for users with single account type */}
          {!canSwitchAccounts && (
            <>
              <DropdownMenuSeparator />
              {/* Current Active Account */}
              <DropdownMenuItem className='cursor-pointer'>
                {currentAccountType === 'inbound' ? (
                  <>
                    <PhoneIncoming className='mr-2 h-4 w-4' />
                    <span>{t('inboundAccount')}</span>
                    <span className='ml-auto text-xs text-green-600'>
                      {t('active')}
                    </span>
                  </>
                ) : (
                  <>
                    <PhoneOutgoing className='mr-2 h-4 w-4' />
                    <span>{t('outboundAccount')}</span>
                    <span className='ml-auto text-xs text-green-600'>
                      {t('active')}
                    </span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Request Option for Opposite Account Type */}
              {currentAccountType === 'inbound' ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        className='cursor-not-allowed opacity-60'
                        disabled
                      >
                        <PhoneOutgoing className='mr-2 h-4 w-4' />
                        <div className='flex flex-col'>
                          <span>{t('requestOutbound')}</span>
                          <span className='text-[10px] text-muted-foreground'>{t('comingSoon')}</span>
                        </div>
                        <span className='ml-auto text-xs text-gray-400'>
                          {t('apply')}
                        </span>
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side='left'>
                      <p className='font-medium'>{t('comingSoon')}</p>
                      <p className='text-xs text-muted-foreground'>{t('comingSoonDescription')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <DropdownMenuItem
                  className='cursor-pointer'
                  onClick={() => handleAccountRequest('inbound')}
                >
                  <PhoneIncoming className='mr-2 h-4 w-4' />
                  <span>{t('requestInbound')}</span>
                  <span className='ml-auto text-xs text-blue-600'>
                    {t('request')}
                  </span>
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onLogout}
          className='cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/40 dark:focus:text-red-400'
        >
          <LogOut className='mr-2 h-4 w-4' />
          <span>{t('logOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
