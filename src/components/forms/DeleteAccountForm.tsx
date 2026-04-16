'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

export function DeleteAccountForm() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations('settings');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Don't show for admin users
  if (user?.role === 'admin') {
    return null;
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/auth/users/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');

      // Logout and redirect to home
      logout();
      router.push('/');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      toast.error('Failed to delete account', {
        description: errorMessage
      });
      setIsDeleting(false);
      setShowDialog(false);
    }
  }

  return (
    <Card className='w-full border-destructive/50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-destructive'>
          <Trash2 className='h-5 w-5' />
          {t('deleteAccount.title')}
        </CardTitle>
        <CardDescription>
          {t('deleteAccount.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='rounded-lg border border-destructive/20 bg-destructive/5 p-4'>
          <div className='flex gap-3'>
            <AlertTriangle className='h-5 w-5 text-destructive flex-shrink-0 mt-0.5' />
            <div className='space-y-2 text-sm'>
              <p className='font-medium text-destructive'>
                {t('deleteAccount.warningTitle')}
              </p>
              <p className='text-muted-foreground'>
                {t('deleteAccount.warningDescription')}
              </p>
              <ul className='list-disc list-inside space-y-1 text-muted-foreground ml-2'>
                <li>{t('deleteAccount.items.nameEmailPhone')}</li>
                <li>{t('deleteAccount.items.recordingsAndTranscripts')}</li>
                <li>{t('deleteAccount.items.chatAndCrm')}</li>
                <li>{t('deleteAccount.items.integrations')}</li>
                <li>{t('deleteAccount.items.profileAndSettings')}</li>
                <li>{t('deleteAccount.items.trainingData')}</li>
              </ul>
              <p className='text-muted-foreground mt-3'>
                {t('deleteAccount.legalNote')}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogTrigger asChild>
            <Button
              variant='destructive'
              disabled={isDeleting}
              className='w-full sm:w-auto'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('deleteAccount.dialog.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className='mr-2 h-4 w-4' />
                  {t('deleteAccount.title')}
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className='max-w-md'>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className='space-y-2'>
                <p>{t('deleteAccount.dialog.body1')}</p>
                <p className='font-medium text-destructive'>
                  {t('deleteAccount.dialog.body2')}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {t('deleteAccount.dialog.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                {isDeleting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {t('deleteAccount.dialog.deleting')}
                  </>
                ) : (
                  t('deleteAccount.dialog.confirm')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

