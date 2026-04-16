'use client'

import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { useLanguage } from '@/hooks/use-language';

export default function LoginPage() {
  const { currentLanguage } = useLanguage();
  
  return (
    <div key={currentLanguage} className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <AdminLoginForm />
    </div>
  );
}