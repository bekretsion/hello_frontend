import { SignupForm } from '@/components/auth/signup-form';
import { Bot, Check, Sparkles, ChartBar } from 'lucide-react';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';

export default function SignupPage() {
  const t = useTranslations('auth.signupPage');

  return (
    <div className="h-screen w-full flex relative overflow-hidden bg-white">
      {/* Left Column - Signup Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col bg-[#f8f9fa] relative overflow-y-auto lg:overflow-hidden">
        <div className="flex-1 flex flex-col justify-center items-center px-8 sm:px-12 py-12">
          <div className="w-full max-w-[400px]">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-4xl font-bold text-[#1a2b3c] mb-3">{t('createAccountTitle')}</h2>
              <p className="text-gray-600 text-lg">{t('createAccountDescription')}</p>
            </div>

            <SignupForm minimal />

            <div className="mt-8 text-center">
              <p className="text-gray-600 font-medium">
                {t('alreadyHaveAccount')}{' '}
                <NextLink href="/login" className="text-[#83d2df] font-semibold hover:underline transition-all">
                  {t('logIn')}
                </NextLink>
              </p>
              <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
                <NextLink href="/privacy" className="hover:text-gray-600 transition-colors">{t('legal.privacyPolicy')}</NextLink>
                <span>•</span>
                <NextLink href="/terms" className="hover:text-gray-600 transition-colors">{t('legal.termsOfUse')}</NextLink>
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
        <div className="relative z-10 flex items-center gap-3">
          <NextImage
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
        <div className="relative z-10 flex-1 flex flex-col justify-center my-8">
          <div className="mb-10">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-2">
              {t('welcomeTitle')}
            </h1>
            <span className="text-5xl font-extrabold text-[#83d2df]">Hello</span>
            <p className="text-lg text-white/70 font-medium mt-5 max-w-lg">
              {t('heroTitle')}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm shrink-0">
                <Bot className="w-5 h-5 text-[#83d2df]" />
              </div>
              <span className="text-lg text-white font-medium">{t('features.support')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm shrink-0">
                <Check className="w-5 h-5 text-[#83d2df]" />
              </div>
              <span className="text-lg text-white font-medium">{t('features.leadQualification')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm shrink-0">
                <Sparkles className="w-5 h-5 text-[#83d2df]" />
              </div>
              <span className="text-lg text-white font-medium">{t('features.crmIntegration')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm shrink-0">
                <ChartBar className="w-5 h-5 text-[#83d2df]" />
              </div>
              <span className="text-lg text-white font-medium">{t('features.analytics')}</span>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            {t('copyright')}
          </p>
        </div>
      </div>
    </div>
  );
}
