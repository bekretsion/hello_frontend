'use client';

import { OTPForm } from '@/components/auth/otp-form';
import { Sparkles, Bot, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function VerifyOTPPage() {
    const { currentLanguage } = useLanguage();

    return (
        <div className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#83d2df] via-[#6bb8c7] to-[#5a9fb0] scrollbar-thin">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#83d2df]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                </div>
            </div>

            {/* Main Content */}
            <div key={currentLanguage} className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom duration-700">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-2 border border-white/50">
                        <OTPForm />
                    </div>

                    <div className="mt-8 text-center text-white/80">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="font-semibold text-white">Secure Verification</span>
                        </div>
                        <p className="text-sm">Protecting your account is our top priority.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
