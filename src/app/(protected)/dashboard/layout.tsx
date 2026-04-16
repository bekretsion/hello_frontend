import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TranslationProvider } from '@/components/translation-provider';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AuthProvider } from '@/components/auth/auth-provider';
import { navItems } from '@/constants/data';
import { NavItem } from '@/types';
import { jwtVerify } from 'jose';
import { ConditionalLayout } from '@/components/layout/conditional-layout';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn'
};

const roleNavConfig = {
  // This config is now the single source of truth for all roles
  admin: [
    'Admin Dashboard',
    'Assistant Management',
    'Projects',
    'Reports & Analytics',
    'Integration Requests',
    'Manager Numbers',
    'Users',
    'Receipts',
    'New Users',
    'Documents'
  ],
  inbound: [
    'Overview',
    'My Assistants',
    'Calls',
    'Calendar',
    'Documents',
    'Integrations',
    'Plan & Add-ons'
  ],
  outbound: [
    'Overview',
    'My Assistants',
    'Calls',
    'Calendar',
    'Documents',
    'Integrations',
    'Call Leads',
    'Scheduled Calls',
    'Plan & Add-ons'
  ]
};

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  activeAccountType: string;
  iat: number;
  exp: number;
}

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  // Sidebar should be open by default. Only use cookie value if it exists, otherwise default to true
  const sidebarStateCookie = cookieStore.get('sidebar_state')?.value;
  const defaultOpen = sidebarStateCookie !== undefined ? sidebarStateCookie === 'true' : true;
  const token = cookieStore.get('session')?.value;

  let userRole = '';
  let activeAccountType = '';
  // session is used by AuthProvider to populate useAuth() — derive from JWT payload
  let session: { id: number; name: string; email: string; role: string; activeAccountType: string; apiKey: string } | null = null;

  const jwtSecret = (process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || '').trim();

  if (!jwtSecret) {
    console.error('❌ JWT_SECRET check - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    console.error('❌ JWT_SECRET check - JWT_SECRET_KEY:', process.env.JWT_SECRET_KEY ? 'SET' : 'NOT SET');
    throw new Error('JWT_SECRET environment variable is not set. Please set JWT_SECRET in your .env file and restart the dev server.');
  }

  if (token) {
    try {
      // Single jwtVerify — middleware already validated the token; we just need the payload.
      // Previously getSession() was called first (another jwtVerify), causing two sequential
      // crypto operations before any HTML could stream. Now we do it once.
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify<JwtPayload>(token, secret);
      userRole = payload.role;
      activeAccountType = payload.activeAccountType || '';
      session = {
        id: payload.id,
        name: (payload as any).name || '',
        email: payload.email,
        role: payload.role,
        activeAccountType: payload.activeAccountType || '',
        apiKey: (payload as any).apiKey || ''
      };
    } catch (error) {
      console.error('JWT verification failed in layout:', error);
    }
  }

  let filteredNavItems: NavItem[] = [];
  const canSeeTemplates = ['admin', 'sales', 'finance'].includes(userRole);

  // --- UPDATED LOGIC TO USE ACTIVE ACCOUNT TYPE ---
  if (userRole === 'admin') {
    // Apply the filter for the admin role using the roleNavConfig
    const allowedTitles = roleNavConfig.admin;
    filteredNavItems = navItems.filter((item) =>
      allowedTitles.includes(item.title)
    );
  } else if (activeAccountType === 'inbound') {
    // Use activeAccountType for inbound UI
    const allowedTitles = roleNavConfig.inbound;
    filteredNavItems = navItems.filter((item) =>
      allowedTitles.includes(item.title)
    );
  } else if (activeAccountType === 'outbound') {
    // Use activeAccountType for outbound UI
    const allowedTitles = roleNavConfig.outbound;
    filteredNavItems = navItems.filter((item) =>
      allowedTitles.includes(item.title)
    );
  } else if (userRole.includes('inbound') && !activeAccountType) {
    // Fallback for users without activeAccountType (legacy)
    const allowedTitles = roleNavConfig.inbound;
    filteredNavItems = navItems.filter((item) =>
      allowedTitles.includes(item.title)
    );
  } else if (userRole.includes('outbound') && !activeAccountType) {
    // Fallback for users without activeAccountType (legacy)
    const allowedTitles = roleNavConfig.outbound;
    filteredNavItems = navItems.filter((item) =>
      allowedTitles.includes(item.title)
    );
  } else {
    // DEFAULT: Show basic inbound UI for users who have completed onboarding
    const allowedTitles = roleNavConfig.inbound;
    filteredNavItems = navItems.filter((item) =>
      allowedTitles.includes(item.title)
    );
  }

  // Filter out Templates from Documents submenu for non-privileged users
  if (!canSeeTemplates) {
    filteredNavItems = filteredNavItems.map(item => {
      if (item.title === 'Documents' && item.items) {
        return {
          ...item,
          items: item.items.filter(subItem => subItem.title !== 'Templates')
        };
      }
      return item;
    });
  }

  return (
    <TranslationProvider>
      <AuthProvider session={session}>
        <KBar>
          <SidebarProvider defaultOpen={defaultOpen}>
            <ConditionalLayout
              sidebar={<AppSidebar navItems={filteredNavItems} />}
              header={<Header />}
            >
              {children}
            </ConditionalLayout>
          </SidebarProvider>
        </KBar>
      </AuthProvider>
    </TranslationProvider>
  );
}
