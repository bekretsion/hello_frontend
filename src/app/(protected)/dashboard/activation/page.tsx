'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  signup_status: string;
  assistant_status?: string;
  assistant_started_at?: string;
  assistant_ready_at?: string;
  assigned_phone_number?: string;
}

export default function ActivationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    fetchUserStatus();
    const interval = setInterval(fetchUserStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userData?.assistant_ready_at) {
      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.assistant_ready_at]);

  const fetchUserStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user status');
      }

      const data = await response.json();
      setUserData(data);

      // If assistant is ready, redirect to full dashboard
      if (data.signup_status === 'assistant_ready' || data.assistant_status === 'ready') {
        toast.success('Your assistant is ready! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard/analytics');
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
      toast.error('Failed to load activation status');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = () => {
    if (!userData?.assistant_ready_at) return;

    const readyDate = new Date(userData.assistant_ready_at);
    const now = new Date();
    const diff = readyDate.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Assistant should be ready now!');
      fetchUserStatus(); // Check status immediately
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      setTimeRemaining(`${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`);
    } else {
      setTimeRemaining(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    }
  };

  if (loading) {
    return (
      <PageContainer scrollable={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  const isInProgress = userData?.assistant_status === 'in_progress' || userData?.signup_status === 'paid';
  const isReady = userData?.assistant_status === 'ready' || userData?.signup_status === 'assistant_ready';

  return (
    <PageContainer scrollable={true}>
      <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8 pb-8">
        {/* Header */}
        <div className="text-center space-y-2 md:space-y-3 px-2">
          <div className="flex items-center justify-center mb-4">
            {isReady ? (
              <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-primary" />
            ) : (
              <Clock className="h-16 w-16 md:h-20 md:w-20 text-primary animate-pulse" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {isReady ? 'Your Assistant is Ready!' : 'Assistant Activation in Progress'}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            {isReady 
              ? 'Your AI voice assistant has been successfully activated and is ready to use!'
              : 'We are building your custom AI voice assistant. This typically takes 2 business days.'}
          </p>
        </div>

        {/* Main Status Card */}
        <Card className="mx-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl md:text-2xl">
              {isReady ? 'Activation Complete!' : 'Payment Confirmed'}
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              {isReady 
                ? 'Thank you for your patience. Your assistant is now fully operational.'
                : 'Thank you for your payment. Your assistant activation is underway.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isInProgress && (
              <>
                {/* Progress Steps */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 md:p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-sm md:text-base">Payment Received</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Your payment has been successfully processed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 md:p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                    <div className="relative">
                      <Loader2 className="h-5 w-5 md:h-6 md:w-6 text-cyan-600 animate-spin flex-shrink-0 mt-1" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm md:text-base">Building Your Assistant</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Our team is configuring your AI assistant based on your onboarding preferences.
                      </p>
                      {timeRemaining && (
                        <p className="text-xs md:text-sm font-medium text-cyan-700 dark:text-cyan-400 mt-2">
                          Estimated completion: {timeRemaining}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 md:p-4 bg-muted/50 rounded-lg border border-muted">
                    <Clock className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-sm md:text-base">Assistant Ready</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        You'll receive an email when your assistant is activated.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expected Delivery */}
                <div className="bg-muted/30 p-4 md:p-6 rounded-lg border">
                  <h3 className="font-semibold mb-3 text-sm md:text-base">What to Expect</h3>
                  <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Your assistant will be ready within 2 business days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>You'll receive a confirmation email with your assistant's phone number</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Once ready, you can start making and receiving calls immediately</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {isReady && userData?.assigned_phone_number && (
              <div className="bg-primary/10 p-4 md:p-6 rounded-lg border border-primary/30">
                <h3 className="font-semibold mb-3 text-sm md:text-base text-center">
                  Your Assistant Phone Number
                </h3>
                <div className="flex items-center justify-center gap-2 text-xl md:text-2xl font-bold text-primary">
                  <Phone className="h-6 w-6" />
                  {userData.assigned_phone_number}
                </div>
                <p className="text-xs md:text-sm text-center text-muted-foreground mt-3">
                  Use this number to manage your AI voice assistant calls
                </p>
              </div>
            )}

            {/* Action Button */}
            {isReady && (
              <div className="text-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => router.push('/dashboard/analytics')}
                  className="w-full sm:w-auto"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Card */}
        <Card className="mx-2">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Need Help?</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Our support team is here to assist you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/support')}
                className="w-full sm:w-auto text-sm"
              >
                Contact Support
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/billing')}
                className="w-full sm:w-auto text-sm"
              >
                View Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

