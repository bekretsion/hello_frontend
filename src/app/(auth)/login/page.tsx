'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { ChartBar, Shield, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const { setTheme } = useTheme();
  const t = useTranslations('auth.loginPage');
  const tf = useTranslations('auth.loginForm');

  useEffect(() => {
    document.body.classList.forEach((className) => {
      if (className.startsWith('theme-')) {
        document.body.classList.remove(className);
      }
    });
    document.body.classList.remove('theme-scaled');
    setTheme('light');
    document.body.classList.add('theme-default');
  }, [setTheme]);

  return (
    <div className="h-screen w-full flex relative overflow-hidden bg-white">
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col bg-[#f8f9fa] relative overflow-y-auto lg:overflow-hidden">

        <div className="flex-1 flex flex-col justify-center items-center px-8 sm:px-12 py-12">
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-[#1a2b3c] mb-3">{t('signInTitle')}</h2>
              <p className="text-gray-600 text-lg">{t('signInDescription')}</p>
            </div>

            <LoginForm minimal />

            <div className="mt-8 text-center">
              <p className="text-gray-600 font-medium">
                {tf('haveAccount')}?{' '}
                <Link href="/signup" className="text-[#83d2df] font-semibold hover:underline transition-all">
                  {tf('SignUp')}
                </Link>
              </p>
            </div>

            {/* Test Account Credentials */}
            <div className="mt-6 border border-[#83d2df]/40 rounded-lg p-4 bg-[#f0fbfc]">
              <p className="text-sm font-semibold text-[#1a2b3c] mb-2">Test Account Credentials</p>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Email:</span> <span className="font-mono">tester@example.com</span></p>
                <p><span className="font-medium">Password:</span> <span className="font-mono">password123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative flex-col justify-between p-16 bg-[#1a2b3c] overflow-hidden">
        {/* Grid Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        {/* Top: Logo */}
        <div className="relative z-5 flex items-center">
          <Image
            src="/images/Hello_Transparent.png"
            alt="Hello Logo"
            width={300}
            height={300}
            className="object-contain"
            unoptimized
          />
          <span className="text-7xl font-bold text-white">Hello</span>
        </div>

        {/* Middle: Hero Text & Features */}
        <div className="flex-1 flex flex-col justify-center my-8">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-8">
            {t('heroTitleLine1')}<br />
            {t.rich('heroTitleLine2', {
              span: (chunks) => <span className="text-[#83d2df]">{chunks}</span>
            })}
          </h1>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm shrink-0">
                <ChartBar className="w-5 h-5 text-[#83d2df]" />
              </div>
              <span className="text-lg text-white font-medium">{t('features.analytics')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm shrink-0">
                <Shield className="w-5 h-5 text-[#83d2df]" />
              </div>
              <span className="text-lg text-white font-medium">{t('features.security')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm shrink-0">
                <Clock className="w-5 h-5 text-[#83d2df]" />
              </div>
              <span className="text-lg text-white font-medium">{t('features.support')}</span>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">© 2024 Hello AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
