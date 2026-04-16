// stores/auth-store.ts

import { create } from 'zustand';

interface User {
  id: number;
  name?: string;
  fullName?: string;
  email: string;
  role: string;
  activeAccountType?: string;
  apiKey: string;
  token?: string;
  profilePictureUrl?: string;
  // Status fields from new onboarding flow
  isEmailVerified?: boolean;
  isOnboardingComplete?: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected' | null;
  rejectionReason?: string | null;
  rejectionCount?: number;
  isApiKeyConfigured?: boolean;
  // Legacy status fields
  assistant_status?: string;
  signup_status?: string;
  assigned_phone_number?: string;
  companyName?: string;
  phoneNumber?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawUser = any; // Accepts both camelCase (login) and snake_case (getMe) user objects

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: RawUser, token?: string) => void;
  logout: () => void;
  switchAccount: (accountType: string) => void;
  initialize: (user: RawUser | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setToken: (token: string) => void;
}

// Helper to save user to localStorage
const saveUserToStorage = (user: User | null) => {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_timestamp', Date.now().toString());
    } else {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_timestamp');
    }
  }
};

// Helper to load user from localStorage
const loadUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedUser = localStorage.getItem('auth_user');
    const timestamp = localStorage.getItem('auth_timestamp');
    
    if (!storedUser || !timestamp) return null;
    
    // Check if stored data is recent (within 7 days)
    const storedTime = parseInt(timestamp, 10);
    const daysSinceStored = (Date.now() - storedTime) / (1000 * 60 * 60 * 24);
    
    if (daysSinceStored > 7) {
      // Clear old data
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_timestamp');
      return null;
    }
    
    return JSON.parse(storedUser);
  } catch (error) {
    console.error('Failed to load user from localStorage:', error);
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (rawUser) => {
    // Normalize user object: accept both snake_case (from getMe) and camelCase (from login)
    const user: User = {
      id: rawUser.id,
      name: rawUser.name || rawUser.fullName || rawUser.full_name || rawUser.username,
      fullName: rawUser.fullName || rawUser.full_name,
      email: rawUser.email,
      role: rawUser.role,
      activeAccountType: rawUser.activeAccountType || rawUser.active_account_type,
      apiKey: rawUser.apiKey || rawUser.api_key || '',
      token: rawUser.token,
      profilePictureUrl: rawUser.profilePictureUrl || rawUser.profile_picture_url,
      isEmailVerified: rawUser.isEmailVerified ?? rawUser.is_email_verified,
      isOnboardingComplete: rawUser.isOnboardingComplete ?? rawUser.is_onboarding_complete,
      reviewStatus: rawUser.reviewStatus || rawUser.review_status,
      rejectionReason: rawUser.rejectionReason || rawUser.rejection_reason,
      rejectionCount: rawUser.rejectionCount || rawUser.rejection_count,
      isApiKeyConfigured: rawUser.isApiKeyConfigured ?? rawUser.is_api_key_configured,
      assistant_status: rawUser.assistant_status || rawUser.assistantStatus,
      signup_status: rawUser.signup_status || rawUser.signupStatus,
      assigned_phone_number: rawUser.assigned_phone_number || rawUser.assignedPhoneNumber,
      companyName: rawUser.companyName || rawUser.company_name,
      phoneNumber: rawUser.phoneNumber || rawUser.phone_number,
    };
    saveUserToStorage(user);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    saveUserToStorage(null);
    set({ user: null, isAuthenticated: false });
  },
  switchAccount: (accountType: string) => set((state) => {
    const updatedUser = state.user ? { ...state.user, activeAccountType: accountType } : null;
    if (updatedUser) {
      saveUserToStorage(updatedUser);
    }
    return { user: updatedUser };
  }),
  initialize: (rawUser) => {
    if (rawUser) {
      // Load previously stored user data so we can preserve fields
      // that the incoming rawUser may not contain (e.g. JWT session
      // doesn't carry profilePictureUrl, but localStorage does)
      const storedUser = loadUserFromStorage();

      // Normalize user object: accept both snake_case (from getMe) and camelCase (from login)
      const user: User = {
        id: rawUser.id,
        name: rawUser.name || rawUser.username,
        fullName: rawUser.fullName || rawUser.full_name || storedUser?.fullName,
        email: rawUser.email,
        role: rawUser.role,
        activeAccountType: rawUser.activeAccountType || rawUser.active_account_type,
        apiKey: rawUser.apiKey || rawUser.api_key || '',
        token: rawUser.token,
        // Preserve profilePictureUrl from stored data when incoming rawUser doesn't have it
        // (e.g. JWT session object only has basic fields)
        profilePictureUrl: rawUser.profilePictureUrl || rawUser.profile_picture_url || storedUser?.profilePictureUrl,
        isEmailVerified: rawUser.isEmailVerified ?? rawUser.is_email_verified ?? storedUser?.isEmailVerified,
        isOnboardingComplete: rawUser.isOnboardingComplete ?? rawUser.is_onboarding_complete ?? storedUser?.isOnboardingComplete,
        reviewStatus: rawUser.reviewStatus || rawUser.review_status || storedUser?.reviewStatus,
        rejectionReason: rawUser.rejectionReason || rawUser.rejection_reason || storedUser?.rejectionReason,
        rejectionCount: rawUser.rejectionCount || rawUser.rejection_count || storedUser?.rejectionCount,
        isApiKeyConfigured: rawUser.isApiKeyConfigured ?? rawUser.is_api_key_configured ?? storedUser?.isApiKeyConfigured,
        assistant_status: rawUser.assistant_status || rawUser.assistantStatus || storedUser?.assistant_status,
        signup_status: rawUser.signup_status || rawUser.signupStatus || storedUser?.signup_status,
        assigned_phone_number: rawUser.assigned_phone_number || rawUser.assignedPhoneNumber || storedUser?.assigned_phone_number,
        companyName: rawUser.companyName || rawUser.company_name || storedUser?.companyName,
        phoneNumber: rawUser.phoneNumber || rawUser.phone_number || storedUser?.phoneNumber,
      };
      saveUserToStorage(user);
      set({ user, isAuthenticated: true });
    } else {
      // If no server session, try to restore from localStorage
      const storedUser = loadUserFromStorage();
      if (storedUser) {
        set({ user: storedUser, isAuthenticated: true });
      }
    }
  },
  updateUser: (updates) => set((state) => {
    const updatedUser = state.user ? { ...state.user, ...updates } : null;
    if (updatedUser) {
      saveUserToStorage(updatedUser);
    }
    return { user: updatedUser };
  }),
  setToken: (token) => set({ token })
}));
