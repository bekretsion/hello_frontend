'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, ArrowRight, LayoutDashboard, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function OnboardingChoicePage() {
    const router = useRouter();
    const { currentLanguage } = useLanguage();

    const handleSkipToDashboard = () => {
        // Store choice in sessionStorage for login redirect
        sessionStorage.setItem('onboardingChoice', 'dashboard');
        // Redirect to login page - user needs to login first
        router.push('/login');
    };

    const handleCreateAssistant = () => {
        // Store choice in sessionStorage for login redirect
        sessionStorage.setItem('onboardingChoice', 'create-assistant');
        // Redirect to login page - user needs to login first
        router.push('/login');
    };

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



            <div key={currentLanguage} className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700">
                    <Card className="w-full shadow-2xl border-0 rounded-3xl bg-white/95 backdrop-blur-xl">
                        <CardHeader className="text-center pb-6 pt-8 px-4 sm:px-6">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#83d2df] shadow-lg">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">What's Next?</CardTitle>
                            <CardDescription className="text-gray-600 text-base sm:text-lg mt-2">
                                Choose how you'd like to get started with Hello
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-8">
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Skip to Dashboard Option */}
                                <Card className="border-2 border-gray-200 hover:border-[#83d2df] transition-all duration-300 cursor-pointer group">
                                    <CardHeader className="text-center pb-4">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 group-hover:bg-[#83d2df] transition-colors">
                                            <LayoutDashboard className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <CardTitle className="text-lg font-bold text-gray-900">Skip to Dashboard</CardTitle>
                                        <CardDescription className="text-sm text-gray-600 mt-1">
                                            Go directly to your dashboard and explore the platform
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <Button
                                            onClick={handleSkipToDashboard}
                                            className="w-full bg-[#83d2df] hover:bg-[#6bb8c7] text-white shadow-lg"
                                            size="lg"
                                        >
                                            Go to Dashboard
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Create First Assistant Option */}
                                <Card className="border-2 border-gray-200 hover:border-[#83d2df] transition-all duration-300 cursor-pointer group">
                                    <CardHeader className="text-center pb-4">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 group-hover:bg-[#83d2df] transition-colors">
                                            <Bot className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <CardTitle className="text-lg font-bold text-gray-900">Create First Assistant</CardTitle>
                                        <CardDescription className="text-sm text-gray-600 mt-1">
                                            Set up your first AI voice assistant to get started
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <Button
                                            onClick={handleCreateAssistant}
                                            className="w-full bg-[#83d2df] hover:bg-[#6bb8c7] text-white shadow-lg"
                                            size="lg"
                                        >
                                            Create Assistant
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-500">
                                    You can always create an assistant later from your dashboard
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

