import { NavItem } from '@/types';
// No need to import the Icons map here, but we know what it contains.

export type Product = {
  id: string; // A unique identifier for the product (e.g., 'prod_12345')
  name: string; // The display name of the product (e.g., 'Pro Plan Credits')
  description: string; // A short description of what the product is
  price: number; // The price in a numeric format (e.g., 29.99)
  currency: string; // The currency code (e.g., 'USD')
  image?: string; // An optional URL to a product image
  features?: string[]; // An optional list of features or benefits
  category?: string;
};

export const navItems: NavItem[] = [
  {
    title: 'Overview',
    url: '/dashboard/analytics',
    icon: 'overview', // Home icon for overview
    isActive: false,
    shortcut: ['o', 'v'],
    items: []
  },
  {
    title: 'My Assistants',
    url: '/dashboard/my-assistants',
    icon: 'aiAssistant', // Robot icon for AI assistants
    isActive: false,
    shortcut: ['a', 'i'],
    items: []
  },
  {
    title: 'Calls',
    url: '/dashboard/calls',
    icon: 'phoneCall', // Phone call icon for calls
    shortcut: ['c', 'a'],
    isActive: false,
    items: []
  },
  {
    title: 'Calendar',
    url: '/dashboard/meeting',
    icon: 'calendar', // Calendar icon for meetings/scheduling
    shortcut: ['c', 'l'],
    isActive: false,
    items: []
  },
  {
    title: 'Documents',
    url: '/dashboard/documents',
    icon: 'documents', // Files icon for documents
    shortcut: ['d', 'o'],
    isActive: false,
    items: [
      {
        title: 'All Documents',
        url: '/dashboard/documents'
      },
      {
        title: 'Pending Signature',
        url: '/dashboard/documents/pending'
      },
      {
        title: 'Signed',
        url: '/dashboard/documents/signed'
      },
      {
        title: 'Invoices / Bills',
        url: '/dashboard/documents/invoices'
      },
      {
        title: 'Templates',
        url: '/dashboard/documents/templates'
      }
    ]
  },
  {
    title: 'Integrations',
    url: '/dashboard/integrations',
    icon: 'integrations', // API icon for integrations
    shortcut: ['i', 'n'],
    isActive: false,
    items: []
  },
  {
    title: 'Plan & Add-ons',
    url: '/dashboard/billing',
    icon: 'planAddons', // Wallet icon for plan & add-ons
    shortcut: ['p', 'l'],
    isActive: false,
    items: []
  },
  {
    title: 'Store',
    url: '/dashboard/billing',
    icon: 'billing', // Keep for backward compatibility with existing references
    shortcut: ['s', 't'],
    isActive: false,
    items: []
  },
  {
    title: 'Dashboard/Analytics',
    url: '/dashboard/analytics',
    icon: 'dashboard', // Keep for backward compatibility
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Call Leads',
    url: '/dashboard/upload',
    icon: 'add', // Best match: The URL implies uploading, so 'add' signifies adding new leads.
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Scheduled Calls',
    url: '/dashboard/scheduled-calls',
    icon: 'post', // Best match: Represents a list/record of scheduled items. Consistent with 'Calls'.
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Numbers Preview',
    url: '/dashboard/preview',
    icon: 'settings', // Best match: Implies viewing or managing the configuration of numbers.
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Store',
    url: '/dashboard/billing',
    icon: 'billing', // Direct match: The URL is '/billing', and you have a 'billing' icon.
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Users',
    url: '/dashboard/users',
    icon: 'user', // Direct match: The standard icon for a list of users.
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Admin Dashboard',
    url: '/dashboard/admin',
    icon: 'dashboard', // Admin control panel
    shortcut: ['a', 'd'],
    isActive: false,
    items: []
  },
  {
    title: 'Assistant Management',
    url: '/dashboard/admin/assistants',
    icon: 'lifebuoy', // LifeBuoy icon - most intuitive for assistance management
    shortcut: ['a', 'm'],
    isActive: false,
    items: []
  },
  {
    title: 'Projects',
    url: '/dashboard/admin/projects',
    icon: 'post', // Project management
    shortcut: ['p', 'r'],
    isActive: false,
    items: []
  },
  {
    title: 'Project Templates',
    url: '/dashboard/admin/projects/templates',
    icon: 'settings', // Template management
    shortcut: ['p', 't'],
    isActive: false,
    items: []
  },
  {
    title: 'Reports & Analytics',
    url: '/dashboard/admin/reports',
    icon: 'chart', // Analytics and reporting charts
    shortcut: ['r', 'a'],
    isActive: false,
    items: []
  },
  {
    title: 'Integration Requests',
    url: '/dashboard/admin/integration-requests',
    icon: 'plug', // Integration requests
    shortcut: ['i', 'r'],
    isActive: false,
    items: []
  },
  {
    title: 'Phone Numbers',
    url: '/dashboard/admin/phone-numbers',
    icon: 'phone', // Phone number management
    shortcut: ['p', 'n'],
    isActive: false,
    items: []
  },
  {
    title: 'Manager Numbers',
    url: '/dashboard/phonenumbers',
    icon: 'settings', // Best match: Implies managing or configuring numbers, consistent with the other numbers link.
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Receipts',
    url: '/dashboard/admin/receipts',
    icon: 'billing', // Receipts/billing icon
    shortcut: ['r', 'c'],
    isActive: false,
    items: []
  },
  {
    title: 'New Users',
    url: '#', // Parent item for collapsible menu only
    icon: 'add', // Plus icon for new users
    shortcut: ['n', 'u'],
    isActive: false,
    items: [
      {
        title: 'Meeting Slots',
        url: '/dashboard/admin/meeting-slots',
        icon: 'calendar',
        shortcut: ['m', 's']
      },
      {
        title: 'Appointments',
        url: '/dashboard/admin/appointments',
        icon: 'clock',
        shortcut: ['a', 'p']
      },
      {
        title: 'Onboarding',
        url: '/dashboard/admin/onboarding',
        icon: 'fileText',
        shortcut: ['o', 'b']
      }
    ]
  }
];
