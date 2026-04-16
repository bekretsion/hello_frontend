import { useTranslations } from 'next-intl';

const TRANSLATION_MAPPINGS = {
  callTypes: {
    'webCall': 'Web Call',
    'inboundPhoneCall': 'Inbound Call',
    'outboundPhoneCall': 'Outbound Call',
    
    'WebCall': 'Web Call',
    'InboundPhoneCall': 'Inbound Call', 
    'OutboundPhoneCall': 'Outbound Call',
    'Web Call': 'Web Call',
    'Inbound Call': 'Inbound Call',
    'Outbound Call': 'Outbound Call',
    'InboundCall': 'Inbound Call',
    'OutboundCall': 'Outbound Call'
  },
  
  assistants: {
    '52476d2b-5bca-4793-af3c-0398f5e1188d': 'salesAgent',
    'ad91f541-71e8-4f2c-9854-8a8a6f29abd5': 'supportBot',
    '95504c6d-7690-4287-872a-061ac7e2a78e': 'freshCutz',
    'b90a956e-f5e5-4844-aba7-4006ec7a5c5e': 'bookingAI',
    '00000000-0000-0000-0000-000000000000': 'defaultAssistant'
  },
  
  callStatus: {
    'completed': 'completed',
    'failed': 'failed',
    'in-progress': 'inProgress',
    'cancelled': 'cancelled'
  },
  
  endReasons: {
    'customer-ended-call': 'customer-ended-call',
    'assistant-ended-call': 'assistant-ended-call',
    'customer-did-not-give-microphone-permission': 'customer-did-not-give-microphone-permission',
    'assistant-said-end-call-phrase': 'assistant-said-end-call-phrase',
    'exceeded-max-duration': 'exceeded-max-duration',
    'exceeded-silence-threshold': 'exceeded-silence-threshold',
    'machine-detected': 'machine-detected'
  },

  breadcrumbs: {
    'dashboard': 'dashboard',
    'users': 'users',
    'analytics': 'analytics',
    'calls': 'calls',
    'settings': 'settings',
    'profile': 'profile',
    'reports': 'reports',
    'overview': 'overview',
    'assistants': 'assistants',
    'performance': 'performance',
    'statistics': 'statistics',
    'billing': 'billing',
    'integrations': 'integrations',
    'call.details': 'call.details',
    'call.logs': 'call.logs',
    'call.history': 'call.history',
    'user.management': 'user.management',
    'api.settings': 'api.settings',
    'assistant.details': 'assistant.details',
    
    'Dashboard': 'dashboard',
    'Users': 'users',
    'Analytics': 'analytics',
    'Calls': 'calls',
    'Settings': 'settings',
    'Profile': 'profile',
    'Reports': 'reports',
    'Overview': 'overview',
    'Assistants': 'assistants',
    'Performance': 'performance',
    'Statistics': 'statistics',
    'Billing': 'billing',
    'Integrations': 'integrations',
    'Call Details': 'call.details',
    'Call Logs': 'call.logs',
    'Call History': 'call.history',
    'User Management': 'user.management',
    'API Settings': 'api.settings',
    'Assistant Details': 'assistant.details',
    'Receipts': 'receipts',
    
    'call-details': 'call.details',
    'call-logs': 'call.logs',
    'user-management': 'user.management',
    'api-settings': 'api.settings',
    'receipts': 'receipts',
    'documents': 'documents',
    'pending': 'pending',
    'Pending': 'pending',
    'signed': 'signed',
    'Signed': 'signed',
    'templates': 'templates',
    'Templates': 'templates',
    'invoices': 'invoices',
    'Invoices': 'invoices'
  }
} as const;

type MappingKey = keyof typeof TRANSLATION_MAPPINGS;

export function useDynamicTranslation(namespace: string = 'analytics') {
  const t = useTranslations(namespace);
  const tCommon = useTranslations('common');
  const tNavigation = useTranslations('navigation');

  const translateValue = (
    value: string,
    mappingKey: MappingKey,
    options: {
      normalize?: boolean;
      fallback?: string;
      returnKey?: boolean;
    } = {}
  ): string => {
    const { normalize = true, fallback, returnKey = false } = options;
    
    const mapping = TRANSLATION_MAPPINGS[mappingKey];
    
    let processedValue = value;
    if (normalize) {
      processedValue = value
        .replace('PhoneCall', ' Call')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/^\w/, (c: string) => c.toUpperCase());
    }
    
    let mappedKey: string | undefined = mapping[value as keyof typeof mapping];
    
    if (!mappedKey) {
      mappedKey = mapping[processedValue as keyof typeof mapping];
    }
    if (!mappedKey) {
      const lowerValue = value.toLowerCase();
      const lowerProcessedValue = processedValue.toLowerCase();
      
      for (const [key, val] of Object.entries(mapping)) {
        if (key.toLowerCase() === lowerValue || key.toLowerCase() === lowerProcessedValue) {
          mappedKey = val as string;
          break;
        }
      }
    }
    
    if (mappedKey) {
      if (mappingKey === 'breadcrumbs') {
        // For breadcrumbs, try to translate using navigation namespace
        const translationKey = `navigation.${mappedKey}`;
        const translated = tNavigation(translationKey.replace('navigation.', ''));
        
        if (translated && translated !== translationKey) {
          return translated;
        }
        // Fallback to the mapped key if translation fails
        return mappedKey;
      } else {
        const translationKey = `${mappingKey}.${mappedKey}`;
        const translated = t(translationKey);
        
        if (translated !== translationKey) {
          return translated;
        }
      }
    }
    
    if (mappingKey === 'breadcrumbs') {
      // Try navigation namespace as fallback
      try {
        const navTranslated = tNavigation(value.toLowerCase());
        if (navTranslated && navTranslated !== value) {
          return navTranslated;
        }
      } catch (e) {
        // Ignore translation errors
      }
      return value;
    }
    
    if (fallback) return fallback;
    if (returnKey && mappedKey) return mappedKey;
    
    return processedValue || tCommon('unknown');
  };

  const translateCallType = (type: string) => 
    translateValue(type, 'callTypes');
    
  const translateAssistant = (id: string, showShortId = true) => 
    translateValue(id, 'assistants', { 
      normalize: false,
      fallback: showShortId ? id.substring(0, 8) : id 
    });
    
  const translateCallStatus = (status: string) => 
    translateValue(status, 'callStatus', { normalize: false });
    
  const translateEndReason = (reason: string) => 
    translateValue(reason, 'endReasons', { normalize: false });

  const translateBreadcrumb = (title: string) => {
    const lowerTitle = title.toLowerCase();
    
    // First try direct translation from navigation namespace
    try {
      const directTranslation = tNavigation(lowerTitle);
      if (directTranslation && directTranslation !== lowerTitle) {
        return directTranslation;
      }
    } catch {
      // Translation key doesn't exist, continue to mapping
    }

    // Try mapping-based translation
    const mappedKey = translateValue(title, 'breadcrumbs', { normalize: false });
    if (mappedKey && mappedKey !== title) {
      try {
        const nestedTranslation = tNavigation(mappedKey);
        if (nestedTranslation && nestedTranslation !== mappedKey) {
          return nestedTranslation;
        }
      } catch {
        // If translation fails, return the mapped key or original title
        return mappedKey || title;
      }
    }

    // Final fallback: return title as-is if no translation found
    return title;
  };

  return {
    translateValue,
    translateCallType,
    translateAssistant,
    translateCallStatus,
    translateEndReason,
    translateBreadcrumb,
    t,
    tCommon,
    tNavigation
  };
}