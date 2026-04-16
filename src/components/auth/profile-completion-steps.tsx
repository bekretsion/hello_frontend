'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { CheckCircle2, Circle, User, Mail, Briefcase, Phone, X, Globe, Languages, Hash, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UserProfile {
  fullName?: string;
  full_name?: string;
  email?: string;
  companyName?: string;
  company_name?: string;
  phoneNumber?: string;
  phone_number?: string;
  organizationNumber?: string;
  languages?: string[];
  websites?: string[];
  socialMedia?: string[];
}

interface Step {
  id: string;
  label: string;
  field: keyof UserProfile;
  icon: React.ReactNode;
}

export const steps: Step[] = [
  { id: 'fullName', label: 'Full Name', field: 'fullName', icon: <User className="h-5 w-5" /> },
  { id: 'email', label: 'Email', field: 'email', icon: <Mail className="h-5 w-5" /> },
  { id: 'companyName', label: 'Company Name', field: 'companyName', icon: <Briefcase className="h-5 w-5" /> },
  { id: 'phoneNumber', label: 'Phone Number', field: 'phoneNumber', icon: <Phone className="h-5 w-5" /> },
];

// Additional onboarding fields - these are collected in the profile completion modal
// Note: languages is not included because it defaults to ['English'] on submit
export const onboardingFields = [
  { id: 'organizationNumber', label: 'Organization Number', field: 'organizationNumber' as keyof UserProfile },
  { id: 'websites', label: 'Websites', field: 'websites' as keyof UserProfile },
  { id: 'socialMedia', label: 'Social Media', field: 'socialMedia' as keyof UserProfile },
];

// Hook to get profile completion data
export function useProfileCompletion() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reviewStatus, setReviewStatus] = useState<'incomplete' | 'under_review' | 'pending' | 'approved' | 'rejected' | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Fetch from all endpoints with cache busting
      const timestamp = Date.now();
      const [authResponse, onboardingResponse, statusResponse] = await Promise.all([
        fetch(`/api/auth/me?t=${timestamp}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch(`/api/onboarding/profile?t=${timestamp}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }).catch(() => null),
        fetch(`/api/onboarding/status?t=${timestamp}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }).catch(() => null)
      ]);

      // Extract review status from status response
      if (statusResponse?.ok) {
        const statusData = await statusResponse.json();
        const status = statusData.status || statusData;
        setReviewStatus(status.reviewStatus || status.review_status || null);
      }

      let profile: UserProfile = {};

      if (authResponse.ok) {
        const authData = await authResponse.json();
        const authProfile = authData.user || authData;
        profile = {
          fullName: authProfile.fullName || authProfile.full_name || '',
          full_name: authProfile.full_name || authProfile.fullName || '',
          email: authProfile.email || '',
          companyName: authProfile.companyName || authProfile.company_name || '',
          company_name: authProfile.company_name || authProfile.companyName || '',
          phoneNumber: authProfile.phoneNumber || authProfile.phone_number || '',
          phone_number: authProfile.phone_number || authProfile.phoneNumber || '',
        };
      } else {
        // If auth response is not OK, still initialize empty profile
        // This ensures new users see the pill even if profile hasn't been created yet
        profile = {
          fullName: '',
          email: '',
          companyName: '',
          phoneNumber: '',
        };
      }

      let hasBackendData = false;
      if (onboardingResponse?.ok) {
        const onboardingData = await onboardingResponse.json();
        const onboardingProfile = onboardingData.data || onboardingData;

        // Always use backend data if response is OK, even if fields are empty
        // This ensures we get the latest state from the backend
        profile = {
          ...profile,
          organizationNumber: onboardingProfile.organizationNumber || onboardingProfile.organization_number || '',
          languages: Array.isArray(onboardingProfile.languages)
            ? onboardingProfile.languages
            : (onboardingProfile.languages || []),
          websites: Array.isArray(onboardingProfile.websites)
            ? onboardingProfile.websites
            : (onboardingProfile.websites || []),
          socialMedia: Array.isArray(onboardingProfile.socialMedia)
            ? onboardingProfile.socialMedia
            : (Array.isArray(onboardingProfile.social_media)
              ? onboardingProfile.social_media
              : (onboardingProfile.socialMedia || onboardingProfile.social_media || [])),
        };

        // Check if we actually have meaningful data
        hasBackendData =
          onboardingProfile.organizationNumber ||
          (onboardingProfile.languages && (Array.isArray(onboardingProfile.languages) ? onboardingProfile.languages.length > 0 : true)) ||
          (onboardingProfile.websites && (Array.isArray(onboardingProfile.websites) ? onboardingProfile.websites.length > 0 : true)) ||
          (onboardingProfile.socialMedia && (Array.isArray(onboardingProfile.socialMedia) ? onboardingProfile.socialMedia.length > 0 : true)) ||
          (onboardingProfile.social_media && (Array.isArray(onboardingProfile.social_media) ? onboardingProfile.social_media.length > 0 : true));
      }

      // If backend doesn't have meaningful data, check localStorage for saved data
      // But prioritize backend data even if it's empty (to ensure we're in sync)
      if (!hasBackendData && typeof window !== 'undefined' && user?.id) {
        try {
          const savedData = localStorage.getItem(`onboarding_profile_data_${user.id}`);
          if (savedData) {
            const parsed = JSON.parse(savedData);
            // Only use localStorage data if it's recent (within last 7 days)
            const hoursSinceSave = (Date.now() - (parsed.savedAt || 0)) / (1000 * 60 * 60);
            if (hoursSinceSave < 24 * 7) {
              profile = {
                ...profile,
                organizationNumber: parsed.organizationNumber || '',
                languages: parsed.languages || [],
                websites: parsed.websites || [],
                socialMedia: parsed.socialMedia || [],
              };
              console.log('[useProfileCompletion] Using localStorage data as backup');
            } else {
              // Clear old data
              localStorage.removeItem(`onboarding_profile_data_${user.id}`);
            }
          }
        } catch (e) {
          console.warn('[useProfileCompletion] Failed to parse localStorage data:', e);
        }
      }

      setUserProfile(profile);

      // Debug logging
      if (typeof window !== 'undefined' && user?.id) {
        console.log('[useProfileCompletion] Profile fetched:', {
          profile,
          hasBackendData,
          hasLocalStorageData: !!localStorage.getItem(`onboarding_profile_data_${user.id}`),
          onboardingFields: {
            organizationNumber: profile.organizationNumber,
            languages: profile.languages,
            websites: profile.websites,
            socialMedia: profile.socialMedia
          }
        });
      }
    } catch (error) {
      console.error('[useProfileCompletion] Error fetching profile:', error);
      // Set empty profile on error so the pill can still render
      // This ensures new users see the pill even if API fails
      setUserProfile({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id, refreshKey]); // Refetch when user.id or refreshKey changes

  // Expose refresh function
  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Make refresh available globally for the modal to call
  if (typeof window !== 'undefined') {
    (window as any).__refreshProfileCompletion = refresh;
  }

  if (loading || !userProfile) {
    return { loading: true, completedSteps: null, allCompleted: false, completionPercentage: 50, reviewStatus: null, refresh };
  }

  // Normalize profile data
  const normalizedProfile: UserProfile = {
    fullName: userProfile.fullName || userProfile.full_name || '',
    email: userProfile.email || '',
    companyName: userProfile.companyName || userProfile.company_name || '',
    phoneNumber: userProfile.phoneNumber || userProfile.phone_number || '',
    organizationNumber: userProfile.organizationNumber || '',
    languages: userProfile.languages || [],
    websites: userProfile.websites || [],
    socialMedia: userProfile.socialMedia || [],
  };

  // Check completion status for each step
  const completedSteps = steps.map(step => {
    const value = normalizedProfile[step.field];
    if (Array.isArray(value)) {
      return {
        ...step,
        completed: value.length > 0,
      };
    }
    return {
      ...step,
      completed: (value || '').trim().length > 0,
    };
  });

  // Check onboarding fields completion
  const onboardingCompleted = onboardingFields.map(field => {
    const value = normalizedProfile[field.field];
    if (Array.isArray(value)) {
      return { ...field, completed: value.length > 0 };
    }
    return { ...field, completed: (value || '').trim().length > 0 };
  });

  const allStepsCompleted = completedSteps.every(step => step.completed);
  const allOnboardingCompleted = onboardingCompleted.every(field => field.completed);

  // Check if profile was marked as complete in localStorage (for cases where backend doesn't persist)
  let localStorageComplete = false;
  if (typeof window !== 'undefined' && user?.id) {
    const storedComplete = localStorage.getItem(`profile_completion_complete_${user.id}`);
    const storedTimestamp = localStorage.getItem(`profile_completion_timestamp_${user.id}`);
    if (storedComplete === 'true' && storedTimestamp) {
      // Only trust localStorage if it's recent (within last 24 hours)
      const timestamp = parseInt(storedTimestamp, 10);
      const hoursSinceUpdate = (Date.now() - timestamp) / (1000 * 60 * 60);
      if (hoursSinceUpdate < 24) {
        localStorageComplete = true;
      } else {
        // Clear old localStorage data
        localStorage.removeItem(`profile_completion_complete_${user.id}`);
        localStorage.removeItem(`profile_completion_timestamp_${user.id}`);
      }
    }
  }

  const allCompleted = (allStepsCompleted && allOnboardingCompleted) || localStorageComplete;

  // Calculate completion percentage to match modal display
  // Modal assumes: 50% base (basic profile) + 50% for onboarding fields
  // So if user has filled all onboarding fields, they're at 100%
  const onboardingFieldsCompleted = onboardingCompleted.filter(f => f.completed).length;
  const totalOnboardingFields = onboardingCompleted.length;

  // Base 50% + (completed onboarding / total onboarding) * 50%
  let completionPercentage = 50 + (totalOnboardingFields > 0
    ? (onboardingFieldsCompleted / totalOnboardingFields) * 50
    : 0);

  // Round to nearest integer
  completionPercentage = Math.round(completionPercentage);

  // If all onboarding fields are completed, ensure it's exactly 100
  if (onboardingFieldsCompleted === totalOnboardingFields && totalOnboardingFields > 0) {
    completionPercentage = 100;
  }

  // If marked complete in localStorage, ensure percentage is 100
  if (localStorageComplete && completionPercentage < 100) {
    completionPercentage = 100;
  }

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[useProfileCompletion] Completion status:', {
      allCompleted,
      completionPercentage,
      localStorageComplete,
      completedCount: completedSteps.filter(s => s.completed).length,
      totalSteps: completedSteps.length,
      onboardingCompletedCount: onboardingCompleted.filter(f => f.completed).length,
      totalOnboardingFields: onboardingCompleted.length,
      steps: completedSteps.map(s => ({ id: s.id, completed: s.completed })),
      onboardingFields: onboardingCompleted.map(f => ({ id: f.id, completed: f.completed }))
    });
  }

  return {
    loading: false,
    completedSteps,
    allCompleted: allCompleted || (onboardingFieldsCompleted === totalOnboardingFields && totalOnboardingFields > 0),
    normalizedProfile,
    onboardingCompleted,
    completionPercentage,
    reviewStatus,
    refresh
  };
}

// Compact step cycle component for header
export function ProfileCompletionStepCycle({ compact = false, forceShow = false }: { compact?: boolean; forceShow?: boolean }) {
  const { loading, completedSteps, allCompleted, completionPercentage } = useProfileCompletion();

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[ProfileCompletionStepCycle]', {
      loading,
      allCompleted,
      hasCompletedSteps: !!completedSteps,
      completedStepsCount: completedSteps?.length || 0,
      forceShow
    });
  }

  if (loading) {
    // Show a loading placeholder in compact mode
    if (compact) {
      return (
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-4 h-1 bg-gray-200" />
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-4 h-1 bg-gray-200" />
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-4 h-1 bg-gray-200" />
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        </div>
      );
    }
    return null;
  }

  // If profile is complete (100%) and not forcing show, hide the component
  // Check allCompleted first, then check if percentage is >= 100 (accounting for rounding)
  if ((allCompleted || completionPercentage >= 100 || !completedSteps) && !forceShow) {
    // Show a small checkmark indicator when profile is complete (optional - can be removed)
    // Uncomment the next block if you want to show something even when complete
    /*
    if (compact && allCompleted) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400" title="Profile Complete">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    }
    */
    return null;
  }

  // If forcing show but no steps, show placeholder
  if (forceShow && !completedSteps) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>No profile data</span>
        </div>
      );
    }
    return null;
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2 px-2">
          {completedSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${step.completed
                      ? 'bg-[#83d2df] text-white shadow-sm'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                      }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <div className="scale-100">{step.icon}</div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{step.label} {step.completed ? '✓' : '(Incomplete)'}</p>
                </TooltipContent>
              </Tooltip>
              {index < completedSteps.length - 1 && (
                <div className="w-4 h-1 mx-1.5">
                  <div className={`h-full transition-colors ${step.completed ? 'bg-[#83d2df]' : 'bg-gray-200 dark:bg-gray-700'
                    }`}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {completedSteps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${step.completed
                ? 'bg-[#83d2df] text-white'
                : 'bg-gray-200 text-gray-500'
                }`}
            >
              {step.completed ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <div className="scale-125">{step.icon}</div>
              )}
            </div>
            <span className={`mt-2 text-sm font-medium text-center max-w-[100px] ${step.completed ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'
              }`}>
              {step.label}
            </span>
          </div>
          {index < completedSteps.length - 1 && (
            <div className="flex-1 h-1 mx-3 -mt-8">
              <div className={`h-full ${step.completed ? 'bg-[#83d2df]' : 'bg-gray-200'
                }`}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// URL validation function
const isValidUrl = (url: string): boolean => {
  try {
    // Add protocol if missing
    let urlToCheck = url.trim();
    if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
      urlToCheck = 'https://' + urlToCheck;
    }
    const urlObj = new URL(urlToCheck);
    // Check if it's a valid http or https URL
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Check if text looks like it could be a URL (for real-time validation)
const looksLikeUrl = (text: string): boolean => {
  if (!text.trim()) return true; // Empty is OK (user is still typing)

  // Basic patterns that suggest it might be a URL
  const urlPatterns = [
    /^https?:\/\//i, // Starts with http:// or https://
    /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}/i, // Domain-like pattern (example.com)
    /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}\//i, // Domain with path (example.com/)
    /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}:/i, // Domain with port (example.com:8080)
  ];

  return urlPatterns.some(pattern => pattern.test(text.trim()));
};

// Tag Input Component for arrays
const TagInput = ({
  label,
  placeholder,
  values,
  onValuesChange,
  maxTags = 3,
  validateUrl = false,
  onValidationError,
  translations,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onValuesChange: (values: string[]) => void;
  maxTags?: number;
  validateUrl?: boolean;
  onValidationError?: (errors: string[]) => void;
  translations?: any;
}) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const addTag = () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) return;

    if (values.length >= maxTags) {
      toast.error(translations ? translations('errors.maximumItems', { maxTags }) : `Maximum ${maxTags} items allowed`);
      return;
    }

    // Check for duplicates (case-insensitive for URLs)
    const normalizedValues = validateUrl
      ? values.map(v => v.toLowerCase().trim())
      : values;
    const normalizedInput = validateUrl
      ? trimmedValue.toLowerCase().trim()
      : trimmedValue;

    if (normalizedValues.includes(normalizedInput)) {
      toast.error(translations ? translations('errors.itemExists') : 'This item already exists');
      return;
    }

    // Validate URL if required
    if (validateUrl && !isValidUrl(trimmedValue)) {
      const errorMsg = translations ? translations('errors.invalidUrl') : 'Please enter a valid URL (e.g., https://example.com)';
      setInputError(errorMsg);
      toast.error(errorMsg);
      if (onValidationError) {
        onValidationError([translations ? translations('errors.invalidUrl') : `Invalid URL: ${trimmedValue}`]);
      }
      return;
    }

    onValuesChange([...values, trimmedValue]);
    setInputValue('');
    setInputError('');
    // Clear validation errors on successful add
    if (onValidationError) {
      onValidationError([]);
    }
  };

  const removeTag = (indexToRemove: number) => {
    onValuesChange(values.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-[#83d2df] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              <span>{value}</span>
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:bg-[#6bb8c7] rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type={validateUrl ? 'url' : 'text'}
            value={inputValue}
            onChange={(e) => {
              const value = e.target.value;
              setInputValue(value);

              // Real-time URL validation
              if (validateUrl && value.trim()) {
                if (!looksLikeUrl(value)) {
                  setInputError(translations ? translations('errors.invalidUrl') : 'Please enter a valid URL');
                } else if (!isValidUrl(value)) {
                  // Check if it's a complete URL
                  setInputError(translations ? translations('errors.completeUrl') : 'Enter a complete URL (e.g., https://example.com)');
                } else {
                  setInputError('');
                }
              } else {
                setInputError('');
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={placeholder}
            disabled={values.length >= maxTags}
            className={validateUrl && inputError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          />
          {validateUrl && inputError && (
            <p className="text-red-500 text-xs mt-1">{inputError}</p>
          )}
        </div>
        <Button
          type="button"
          onClick={addTag}
          disabled={!inputValue.trim() || values.length >= maxTags || (validateUrl && !!inputError)}
          className="bg-[#83d2df] hover:bg-[#6bb8c7] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {translations ? translations('add') : 'Add'}
        </Button>
      </div>
      {values.length >= maxTags && (
        <p className="text-orange-500 text-sm">{translations ? translations('errors.maximumItems', { maxTags }) : `Maximum ${maxTags} items allowed`}</p>
      )}
    </div>
  );
};

// Profile Completion Modal
export function ProfileCompletionModal({
  open,
  onOpenChange,
  initialData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    organizationNumber?: string;
    languages?: string[];
    websites?: string[];
    socialMedia?: string[];
  };
}) {
  const { user } = useAuth();
  const t = useTranslations('auth.profileCompletion');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    organizationNumber: '',
    websites: [] as string[],
    socialMedia: [] as string[],
  });
  const [validationErrors, setValidationErrors] = useState({
    organizationNumber: '',
    websites: [] as string[],
    socialMedia: [] as string[],
  });

  // Use ref to track previous open state
  const prevOpenRef = useRef(false);

  useEffect(() => {
    // Only initialize when modal opens (transition from closed to open)
    if (open && !prevOpenRef.current && initialData) {
      const rawOrgNumber = initialData.organizationNumber || '';
      setFormData({
        organizationNumber: rawOrgNumber.replace(/[^a-zA-Z\s\-.]/g, ''),
        websites: initialData.websites || [],
        socialMedia: initialData.socialMedia || [],
      });
    }

    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Only depend on open to prevent infinite loops

  // Calculate completion percentage - start at 50% since basic profile is complete
  const completionPercentage = useMemo(() => {
    const fields = [
      formData.organizationNumber?.trim() || '',
      formData.websites?.length > 0 ? formData.websites : null,
      formData.socialMedia?.length > 0 ? formData.socialMedia : null,
    ];

    const completedFields = fields.filter(field => {
      if (Array.isArray(field)) {
        return field.length > 0;
      }
      return field && field.trim().length > 0;
    }).length;

    // Start at 50% (basic profile complete) + percentage of onboarding fields
    const onboardingProgress = (completedFields / fields.length) * 50;
    return Math.round(50 + onboardingProgress);
  }, [formData]);

  // Validate all URLs
  const validateUrls = (urls: string[], fieldName: 'websites' | 'socialMedia'): string[] => {
    const errors: string[] = [];
    urls.forEach((url, index) => {
      if (!isValidUrl(url)) {
        errors.push(`Invalid URL at position ${index + 1}`);
      }
    });
    return errors;
  };

  // Check for duplicate URLs (case-insensitive)
  const hasDuplicateUrls = (urls: string[]): boolean => {
    const normalized = urls.map(url => url.toLowerCase().trim());
    return new Set(normalized).size !== normalized.length;
  };

  // Organization number must contain only letters, spaces, hyphens, and dots (no numbers)
  // And must be more than 3 characters
  const isOrganizationNumberValid = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return true; // Empty is valid (optional field)
    // Check allowed characters: letters, spaces, hyphens, dots only
    const isValidChars = /^[a-zA-Z\s\-.]+$/.test(trimmed);
    // Check minimum length (more than 3 characters)
    const isValidLength = trimmed.length > 3;
    return isValidChars && isValidLength;
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    // At least one field must be filled
    const hasAtLeastOneField =
      formData.organizationNumber?.trim().length > 0 ||
      formData.websites.length > 0 ||
      formData.socialMedia.length > 0;

    if (!hasAtLeastOneField) {
      return false;
    }

    // Organization number must be digits only when provided
    if (formData.organizationNumber?.trim() && !isOrganizationNumberValid(formData.organizationNumber)) {
      return false;
    }

    // Validate URLs if they exist
    const websitesValid = formData.websites.length === 0 ||
      (formData.websites.every(url => isValidUrl(url)) && !hasDuplicateUrls(formData.websites));
    const socialMediaValid = formData.socialMedia.length === 0 ||
      (formData.socialMedia.every(url => isValidUrl(url)) && !hasDuplicateUrls(formData.socialMedia));

    return websitesValid && socialMediaValid;
  }, [formData]);

  const handleSubmit = async () => {
    // Validate that at least one field is filled
    const hasAtLeastOneField =
      formData.organizationNumber?.trim().length > 0 ||
      formData.websites.length > 0 ||
      formData.socialMedia.length > 0;

    if (!hasAtLeastOneField) {
      toast.error(t('errors.atLeastOneField'));
      return;
    }

    // Validate organization number: allowed characters and minimum length
    if (formData.organizationNumber?.trim() && !isOrganizationNumberValid(formData.organizationNumber)) {
      const trimmed = formData.organizationNumber.trim();
      if (trimmed.length <= 3) {
        const errorMsg = t('errors.organizationNumberMinLength');
        setValidationErrors(prev => ({ ...prev, organizationNumber: errorMsg }));
        toast.error(errorMsg);
      } else {
        const errorMsg = t('errors.organizationNumberInvalidChars');
        setValidationErrors(prev => ({ ...prev, organizationNumber: errorMsg }));
        toast.error(errorMsg);
      }
      return;
    }

    // Validate URLs before submitting
    const websiteErrors = validateUrls(formData.websites, 'websites');
    const socialMediaErrors = validateUrls(formData.socialMedia, 'socialMedia');

    if (websiteErrors.length > 0 || socialMediaErrors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        websites: websiteErrors,
        socialMedia: socialMediaErrors,
      }));
      toast.error(t('errors.fixUrlErrors'));
      return;
    }

    if (hasDuplicateUrls(formData.websites)) {
      toast.error(t('errors.duplicateWebsiteUrls'));
      return;
    }

    if (hasDuplicateUrls(formData.socialMedia)) {
      toast.error(t('errors.duplicateSocialMediaUrls'));
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/onboarding/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationNumber: formData.organizationNumber,
          languages: ['English'], // Default to English
          websites: formData.websites,
          socialMedia: formData.socialMedia,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Store saved onboarding data in localStorage as backup (in case backend doesn't persist)
      if (typeof window !== 'undefined' && user?.id) {
        localStorage.setItem(`onboarding_profile_data_${user.id}`, JSON.stringify({
          organizationNumber: formData.organizationNumber,
          languages: ['English'], // Default to English
          websites: formData.websites,
          socialMedia: formData.socialMedia,
          savedAt: Date.now()
        }));

        // Check if all onboarding fields are now complete
        const allOnboardingFieldsComplete =
          formData.organizationNumber?.trim() &&
          formData.websites?.length > 0 &&
          formData.socialMedia?.length > 0;

        // Note: We can't mark profile as complete here because we don't know
        // if the basic profile fields (fullName, email, etc.) are complete.
        // The useProfileCompletion hook will calculate this after refresh.
      }

      toast.success(t('success.profileUpdated'), {
        description: t('success.onboardingSaved')
      });

      onOpenChange(false);

      // Trigger a refresh of profile data after a short delay to ensure backend has processed
      // Use a longer delay to ensure the backend has fully processed the update
      // Also trigger multiple refreshes to ensure data is synced
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).__refreshProfileCompletion) {
          (window as any).__refreshProfileCompletion();
          // Trigger another refresh after a bit more time to ensure backend has fully processed
          setTimeout(() => {
            if ((window as any).__refreshProfileCompletion) {
              (window as any).__refreshProfileCompletion();
            }
          }, 500);
        }
      }, 800);
    } catch (error) {
      toast.error('Update Error', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {t('progress')}
              </span>
              <span className="font-semibold text-[#83d2df]">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#83d2df] rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Organization Number */}
          <div className="space-y-2">
            <Label htmlFor="organizationNumber" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              {t('organizationNumber')}
            </Label>
            <Input
              id="organizationNumber"
              type="text"
              value={formData.organizationNumber}
              onChange={(e) => {
                // Allow only letters, spaces, hyphens, and dots (no numbers)
                const value = e.target.value.replace(/[^a-zA-Z\s\-.]/g, '');
                setFormData({ ...formData, organizationNumber: value });
                if (validationErrors.organizationNumber) {
                  setValidationErrors(prev => ({ ...prev, organizationNumber: '' }));
                }
              }}
              placeholder={t('organizationNumberPlaceholder')}
              className={validationErrors.organizationNumber ? 'border-destructive' : ''}
            />
            {validationErrors.organizationNumber && (
              <p className="text-sm text-destructive">{validationErrors.organizationNumber}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('organizationNumberHelper')}
            </p>
          </div>

          {/* Websites */}
          <div className="space-y-2">
            <TagInput
              label={t('websiteUrls')}
              placeholder={t('websiteUrlsPlaceholder')}
              values={formData.websites}
              onValuesChange={(values) => {
                setFormData({ ...formData, websites: values });
                // Clear validation errors when user changes values
                setValidationErrors(prev => ({ ...prev, websites: [] }));
              }}
              maxTags={3}
              validateUrl={true}
              onValidationError={(errors) => {
                setValidationErrors(prev => ({ ...prev, websites: errors }));
              }}
              translations={t}
            />
            {validationErrors.websites.length > 0 && (
              <div className="text-sm text-red-500 space-y-1">
                {validationErrors.websites.map((error, idx) => (
                  <p key={idx}>{error}</p>
                ))}
              </div>
            )}
            {hasDuplicateUrls(formData.websites) && (
              <p className="text-sm text-red-500">{t('errors.duplicateUrls')}</p>
            )}
          </div>

          {/* Social Media */}
          <div className="space-y-2">
            <TagInput
              label={t('socialMediaLinks')}
              placeholder={t('socialMediaLinksPlaceholder')}
              values={formData.socialMedia}
              onValuesChange={(values) => {
                setFormData({ ...formData, socialMedia: values });
                // Clear validation errors when user changes values
                setValidationErrors(prev => ({ ...prev, socialMedia: [] }));
              }}
              maxTags={3}
              validateUrl={true}
              onValidationError={(errors) => {
                setValidationErrors(prev => ({ ...prev, socialMedia: errors }));
              }}
              translations={t}
            />
            {validationErrors.socialMedia.length > 0 && (
              <div className="text-sm text-red-500 space-y-1">
                {validationErrors.socialMedia.map((error, idx) => (
                  <p key={idx}>{error}</p>
                ))}
              </div>
            )}
            {hasDuplicateUrls(formData.socialMedia) && (
              <p className="text-sm text-red-500">{t('errors.duplicateUrls')}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !isFormValid}
            className="bg-[#83d2df] hover:bg-[#6bb8c7] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('saving') : t('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Pill-style progress bar component
export function ProfileCompletionPill() {
  const { loading, completionPercentage, allCompleted, normalizedProfile, reviewStatus } = useProfileCompletion();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [showApprovedBadge, setShowApprovedBadge] = useState(false);
  const t = useTranslations('navigation');

  // Debug logging
  useEffect(() => {
    console.log('[ProfileCompletionPill] State:', {
      loading,
      reviewStatus,
      completionPercentage,
      allCompleted,
      userId: user?.id
    });
  }, [loading, reviewStatus, completionPercentage, allCompleted, user?.id]);

  // Check if we should show "Approved" message (only once per user)
  useEffect(() => {
    if (reviewStatus === 'approved' && user?.id) {
      const approvalSeenKey = `profile_approval_seen_${user.id}`;
      const hasSeenApproval = localStorage.getItem(approvalSeenKey);

      if (!hasSeenApproval) {
        console.log('[ProfileCompletionPill] Showing approved badge for first time');
        setShowApprovedBadge(true);
        // Mark as seen and hide after 5 seconds
        setTimeout(() => {
          localStorage.setItem(approvalSeenKey, 'true');
          setShowApprovedBadge(false);
        }, 5000);
      }
    }
  }, [reviewStatus, user?.id]);

  // Calculate progress circle values
  const { strokeDashoffset, circumference, radius } = useMemo(() => {
    const r = 8;
    const circ = 2 * Math.PI * r;
    const offset = circ - (completionPercentage / 100) * circ;
    return { strokeDashoffset: offset, circumference: circ, radius: r };
  }, [completionPercentage]);

  // Loading state
  if (loading) {
    return (
      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    );
  }

  // CASE 1: Profile is APPROVED
  if (reviewStatus === 'approved') {
    // Show approved badge only if user hasn't seen it yet
    if (showApprovedBadge) {
      return (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-700 dark:text-green-300 whitespace-nowrap">
              Profile Approved ✓
            </span>
          </div>
        </div>
      );
    }
    // If already seen approval, hide the pill completely
    return null;
  }

  // CASE 2: Profile is 100% complete AND UNDER REVIEW (waiting for admin)
  // Only show "Under Review" when profile is fully complete
  const isProfileComplete = allCompleted || completionPercentage >= 100;
  const isUnderReview = reviewStatus === 'under_review' || reviewStatus === 'pending';

  if (isProfileComplete && isUnderReview) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300 whitespace-nowrap">
            {t('underReview')}
          </span>
        </div>
      </div>
    );
  }

  // CASE 3: Profile is complete but no review status yet (hide the pill)
  if (isProfileComplete && !isUnderReview) {
    return null;
  }

  // CASE 4: Profile needs completion (not yet submitted for review)
  // Show progress indicator with modal button
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#83d2df]/10 hover:bg-[#83d2df]/20 border border-[#83d2df]/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {/* Small circular progress wheel */}
          <div className="relative w-5 h-5 flex-shrink-0">
            <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
              {/* Background circle */}
              <circle
                cx="10"
                cy="10"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="10"
                cy="10"
                r={radius}
                fill="none"
                stroke="#83d2df"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {t('setup.complete')} · {completionPercentage}%
          </span>
        </div>
      </button>
      <ProfileCompletionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={{
          organizationNumber: normalizedProfile?.organizationNumber,
          languages: normalizedProfile?.languages,
          websites: normalizedProfile?.websites,
          socialMedia: normalizedProfile?.socialMedia,
        }}
      />
    </>
  );
}

export function ProfileCompletionSteps() {
  const router = useRouter();
  const { loading, completedSteps, allCompleted, completionPercentage } = useProfileCompletion();

  if (loading) {
    return null;
  }

  // Hide when profile is 100% complete
  // Check allCompleted first, then check if percentage is >= 100 (accounting for rounding)
  if (allCompleted || completionPercentage >= 100 || !completedSteps) {
    return null;
  }

  return (
    <Card className="mb-4 border-2 border-[#83d2df] bg-gradient-to-r from-[#83d2df]/10 to-[#6bb8c7]/10">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Profile Completion: {completionPercentage}%
            </h3>

            {/* Step Cycle */}
            <div className="mb-5">
              <ProfileCompletionStepCycle />
            </div>

            <p className="text-base text-gray-600 dark:text-gray-400">
              Complete your profile to unlock all features and improve your experience.
            </p>
          </div>

          <Button
            onClick={() => router.push('/dashboard/settings?tab=profile')}
            size="default"
            className="bg-[#83d2df] hover:bg-[#6bb8c7] text-white shrink-0 text-base px-6 py-2"
          >
            Complete Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}