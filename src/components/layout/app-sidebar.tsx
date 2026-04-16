'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTranslations } from 'next-intl';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconPhotoUp,
  IconUserCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { NavItem } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

const tenants = [
  { id: '1', name: 'Acme Inc' },
  { id: '2', name: 'Beta Corp' },
  { id: '3', name: 'Gamma Ltd' }
];

// MODIFIED: The component now accepts 'navItems' as a prop.
export default function AppSidebar({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const isOpen = useMediaQuery(); // Removed unused destructuring
  const router = useRouter();
  const t = useTranslations('navigation');
  const { user } = useAuthStore();
  const { setOpen, state, isMobile, setOpenMobile } = useSidebar();

  // Get account type dropdown for sidebar
  const getAccountTypeDropdown = () => {
    if (!user?.activeAccountType) return null;

    const isInbound = user.activeAccountType === 'inbound';
    const canSwitchToInbound = user?.role?.includes('inbound');
    const canSwitchToOutbound = user?.role?.includes('outbound');
    const canSwitchAccounts = canSwitchToInbound && canSwitchToOutbound;

    const handleAccountRequest = (requestedType: 'inbound' | 'outbound') => {
      toast.success(`Successfully requested ${requestedType} access`, {
        description: `Your request for ${requestedType} account features has been submitted and is waiting for admin approval.`
      });
    };

    const handleAccountSwitch = (accountType: 'inbound' | 'outbound') => {
      if (accountType === user.activeAccountType) return;

      toast.success(`Successfully switched to ${accountType} account`, {
        description: `You are now using the ${accountType} account features.`
      });

      // For now, just show toast. Backend integration will be added later.
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className='bg-muted/50 hover:bg-muted/80 mx-2 mb-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors group-data-[collapsible=icon]:hidden'>
            <div
              className={`h-2 w-2 rounded-full ${isInbound ? 'bg-blue-500' : 'bg-green-500'
                }`}
            />
            <span className='text-muted-foreground text-xs font-medium'>
              {user.activeAccountType.toUpperCase()} ACCOUNT
            </span>
            <ChevronDown className='text-muted-foreground h-3 w-3' />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-48' align='start'>
          <DropdownMenuLabel className='text-xs font-normal'>
            Account Mode
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Current Active Account */}
          <DropdownMenuItem className='cursor-pointer'>
            <div className='flex w-full items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div
                  className={`h-2 w-2 rounded-full ${isInbound ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                />
                <span className='text-xs'>
                  {user.activeAccountType === 'inbound'
                    ? 'Inbound Account'
                    : 'Outbound Account'}
                </span>
              </div>
              <span className='text-xs text-green-600'>Active</span>
            </div>
          </DropdownMenuItem>

          {/* Switch Options for users with both account types */}
          {canSwitchAccounts && (
            <>
              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() =>
                  handleAccountSwitch(isInbound ? 'outbound' : 'inbound')
                }
              >
                <div className='flex w-full items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div
                      className={`h-2 w-2 rounded-full ${!isInbound ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                    />
                    <span className='text-xs'>
                      {isInbound ? 'Outbound Mode' : 'Inbound Mode'}
                    </span>
                  </div>
                  <span className='text-xs text-blue-600'>Switch</span>
                </div>
              </DropdownMenuItem>
            </>
          )}

          {/* Request Option for users with single account type */}
          {!canSwitchAccounts && (
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={() =>
                handleAccountRequest(isInbound ? 'outbound' : 'inbound')
              }
            >
              <div className='flex w-full items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`h-2 w-2 rounded-full ${!isInbound ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                  />
                  <span className='text-xs'>
                    {isInbound ? 'Outbound Account' : 'Inbound Account'}
                  </span>
                </div>
                <span className='text-xs text-blue-600'>Request</span>
              </div>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const handleSwitchTenant = (_tenantId: string) => {
    // Tenant switching functionality would be implemented here
  };

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  // Navigation title translation mapping
  const translateNavTitle = (title: string): string => {
    const titleMap: { [key: string]: string } = {
      'Dashboard/Analytics': t('overview'),
      'Manager Numbers': t('phonenumbers'),
      Users: t('users'),
      'Phone Calls': t('phonecalls'),
      Calls: t('calls'),
      Calendar: t('calendar'),
      Analyse: t('analyse'),
      'My Assistants': t('my-assistants'),
      Store: t('store'),
      'Call Leads': t('reports'),
      'Scheduled Calls': t('overview'),
      Profile: t('profile'),
      Settings: t('settings'),
      Reports: t('reports'),
      Overview: t('overview'),
      Assistants: t('assistants'),
      Performance: t('performance'),
      Statistics: t('statistics'),
      Billing: t('billing'),
      Integrations: t('integrations'),
      'Admin Dashboard': t('admin'),
      Projects: t('projects'),
      'Project Templates': t('templates'),
      'Reports & Analytics': t('reports'),
      Receipts: t('receipts'),
      Documents: t('documents'),
      'Plan & Add-ons': t('plan-addons')
    };

    return titleMap[title] || title;
  };

  // Translate sub-items
  const translateSubTitle = (title: string): string => {
    if (title.startsWith('navigation.')) {
      return t(title.replace('navigation.', ''));
    }

    const subTitleMap: { [key: string]: string } = {
      'Call Details': t('call.details'),
      'Call Logs': t('call.logs'),
      'Call History': t('call.history'),
      'User Management': t('user.management'),
      'API Settings': t('api.settings'),
      'Assistant Details': t('assistant.details'),
      'All Documents': t('all-documents'),
      'Pending Signature': t('pending'),
      Signed: t('signed'),
      'Invoices / Bills': t('invoices'),
      Templates: t('templates')
    };

    return subTitleMap[title] || title;
  };

  return (
    <Sidebar collapsible='icon' data-tour='sidebar'>
      <SidebarHeader></SidebarHeader>
      {getAccountTypeDropdown()}
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>{t('dashboard')}</SidebarGroupLabel>
          <SidebarMenu>
            {/* This .map() function now uses the 'navItems' prop passed from the layout */}
            {navItems.map((item) => {
              const Icon = item.icon
                ? Icons[item.icon as keyof typeof Icons]
                : Icons.logo;
              const translatedTitle = translateNavTitle(item.title);

              // Generate data-tour attribute based on item title
              const getTourAttribute = (title: string): string | undefined => {
                const tourMap: { [key: string]: string } = {
                  'Dashboard/Analytics': 'analytics-nav',
                  Overview: 'analytics-nav',
                  'My Assistants': 'assistants-nav',
                  'Phone Calls': 'calls-nav',
                  Calls: 'calls-nav',
                  'Call Leads': 'call-leads-nav',
                  'Scheduled Calls': 'scheduled-calls-nav',
                  Calendar: 'meetings-nav',
                  Store: 'store-nav',
                  'Plan & Add-ons': 'store-nav',
                  Billing: 'billing-nav',
                  'Manager Numbers': 'manager-numbers-nav',
                  Users: 'users-nav',
                  'Admin Dashboard': 'admin-dashboard-nav',
                  'Assistant Management': 'assistant-management-nav',
                  Projects: 'projects-nav',
                  'Reports & Analytics': 'reports-analytics-nav'
                };
                return tourMap[title];
              };

              const tourAttribute = getTourAttribute(item.title);

              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem className='group-data-[state=open]/collapsible:bg-primary'>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={translatedTitle}
                        isActive={pathname === item.url}
                        onClick={() => {
                          // Expand sidebar when "New Users" is clicked and sidebar is collapsed
                          if (
                            item.title === 'New Users' &&
                            state === 'collapsed'
                          ) {
                            setOpen(true);
                          }
                          if (item.url && item.url !== '#') {
                            router.push(item.url);
                          }
                        }}
                      >
                        {item.icon && Icon && <Icon />}
                        <span>{translatedTitle}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{translateSubTitle(subItem.title)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={translatedTitle}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url} data-tour={tourAttribute}>
                      {Icon && <Icon />}
                      <span>{translatedTitle}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="
                          flex w-full items-center gap-2
                          rounded-lg border border-primary/50
                          bg-sidebar
                          px-3 py-2
                          text-sidebar-foreground
                          transition
                          hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                          focus-visible:ring-2 focus-visible:ring-sidebar-ring
                          data-[state=open]:bg-sidebar-accent
                          data-[state=open]:text-sidebar-accent-foreground
                          data-[state=open]:border-primary
                        "
                >
                  {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={user}
                    />
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push('/dashboard/settings?tab=profile');
                      // Only close sidebar on mobile devices
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                    className='cursor-pointer'
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    {t('profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push('/dashboard/settings?tab=billing');
                      // Only close sidebar on mobile devices
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                    className='cursor-pointer'
                  >
                    <IconCreditCard className='mr-2 h-4 w-4' />
                    {t('billing')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push('/dashboard/settings?tab=alerts');
                      // Only close sidebar on mobile devices
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                    className='cursor-pointer'
                  >
                    <IconBell className='mr-2 h-4 w-4' />
                    {t('notifications')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/auth/session', {
                        method: 'DELETE'
                      });

                      if (response.ok) {
                        router.push('/login');
                        router.refresh();
                        toast.success('Logged out successfully');
                      } else {
                        const data = await response.json();
                        toast.error(data.message || 'Logout failed');
                      }
                    } catch (error) {
                      console.error('An error occurred during logout:', error);
                      toast.error('An unexpected error occurred during logout');
                    }
                  }}
                  className='cursor-pointer'
                >
                  <IconLogout className='mr-2 h-4 w-4' />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Copyright */}
        <div className="text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} <span className="font-medium text-foreground">Hello</span>. All rights reserved.
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
