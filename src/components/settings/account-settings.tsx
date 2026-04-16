'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Headphones } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export default function AccountSettings() {
  const { user, updateUser, switchAccount } = useAuthStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // inbound_advanced = "Inbound Recording" (can listen + read)
  // inbound_basic    = "Inbound Script" (default)
  const isRecording = user?.role === 'inbound_advanced';
  const canToggle = user?.role === 'inbound_basic' || user?.role === 'inbound_advanced';

  const handleToggle = async (checked: boolean) => {
    setSaving(true);
    const mode = checked ? 'recording' : 'script';

    try {
      const res = await fetch('/api/auth/account-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to update account mode');
        return;
      }

      // Update Zustand store with new role so the UI reflects immediately
      if (data.user) {
        updateUser({ role: data.user.role, activeAccountType: data.user.activeAccountType });
        switchAccount(data.user.activeAccountType);
      }

      // Bust the Next.js RSC cache so calls page re-renders with the new role from the updated cookie
      router.refresh();

      toast.success(
        checked
          ? 'Switched to Inbound Recording — you can now listen and read call details.'
          : 'Switched to Inbound Script.'
      );

      // Navigate to Calls after a brief delay so the user sees the effect immediately
      setTimeout(() => router.push('/dashboard/calls'), 1500);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!canToggle) {
    return (
      <div className="w-full lg:w-1/2 mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-start gap-3 pb-3">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <Headphones className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">Listen &amp; Read Call Details</CardTitle>
              <CardDescription className="mt-1">
                This option is not available for your current account type.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-1/2 mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3 pb-3">
          <div className="rounded-full bg-primary/10 p-2 mt-0.5">
            <Headphones className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base">Listen &amp; Read Call Details</CardTitle>
            <CardDescription className="mt-1">
              When enabled, you can listen to call audio and read full transcripts.
              Please ensure you comply with your local laws on call recording and
              always inform callers that their conversation may be recorded before the call begins.
            </CardDescription>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="recording-toggle" className="text-sm font-medium leading-none">
                Inbound Recording
              </Label>
              <p className="text-xs text-muted-foreground">
                {isRecording
                  ? 'Active — call recordings and transcripts are accessible.'
                  : 'Inactive — currently on Inbound Script.'}
              </p>
            </div>

            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" aria-label="Saving…" />
            ) : (
              <Switch
                id="recording-toggle"
                checked={isRecording}
                onCheckedChange={handleToggle}
                disabled={saving}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
