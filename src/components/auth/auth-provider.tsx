'use client';

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  apiKey: string;
}

export function AuthProvider({
  session,
  children
}: {
  session: User | null;
  children: React.ReactNode;
}) {
  const { initialize, user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize with server session (takes priority)
    // If no server session, the store will try to restore from localStorage
    initialize(session);
    setIsInitialized(true);
  }, [initialize, session]);

  // Periodically refresh session to keep user logged in
  useEffect(() => {
    if (!isInitialized || !user) return;

    const refreshSession = async () => {
      try {
        // Check if session is still valid by calling /api/auth/me
        const response = await fetch('/api/auth/me', { 
          method: 'GET',
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          const currentUser = data.user || data;
          // Update user data if it changed
          if (currentUser) {
            initialize(currentUser);
          }
        } else {
          // Session expired, try to restore from localStorage
          console.log('Session expired, checking localStorage...');
        }
      } catch (error) {
        console.error('Failed to refresh session:', error);
      }
    };

    // Refresh session every 30 minutes
    const interval = setInterval(refreshSession, 30 * 60 * 1000);
    
    // Also refresh on window focus (user comes back to tab)
    const handleFocus = () => {
      refreshSession();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isInitialized, user, initialize]);

  return <>{children}</>;
}
