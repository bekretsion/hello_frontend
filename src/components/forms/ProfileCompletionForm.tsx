'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Building, Phone, Globe, User, Mail, Briefcase, Factory, Camera, X, Upload, Trash2 } from 'lucide-react';
import { z } from 'zod';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';

const ProfileCompletionSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required.' }),
  email: z.string().email({ message: 'Valid email is required.' }),
  companyName: z.string().min(2, { message: 'Company name is required.' }),
  phoneNumber: z
    .string()
    .min(7, { message: 'Valid phone number is required.' })
    .regex(/^[0-9+\-\s()]+$/, { message: 'Phone number can only contain numbers and phone symbols (+, -, (), spaces).' }),
  industry: z.string().optional(),
});

type ProfileCompletionInput = z.infer<typeof ProfileCompletionSchema>;

export function ProfileCompletionForm() {
  const { user, updateUser } = useAuth();
  const t = useTranslations('auth.profile');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);

  const form = useForm<ProfileCompletionInput>({
    resolver: zodResolver(ProfileCompletionSchema),
    defaultValues: {
      fullName: '',
      email: '',
      companyName: '',
      phoneNumber: '',
      industry: '',
    }
  });

  useEffect(() => {
    const cacheKey = 'profile_form_loaded';
    const hasLoaded = sessionStorage.getItem(cacheKey) === 'true';

    if (hasLoaded) {
      // Already loaded before, fetch silently without showing loading
      setInitialLoading(false);
      fetchUserProfile(false);
      return;
    }

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      sessionStorage.setItem(cacheKey, 'true');
      fetchUserProfile(true);
    }
  }, [user]);

  // Re-fetch when component mounts (user navigates back to the tab)
  // The key prop in the parent will cause this component to remount when tab becomes active

  const fetchUserProfile = async (showLoading = true) => {
    try {
      if (showLoading) {
        setInitialLoading(true);
      }
      // Fetch from both endpoints to get all profile data
      const [authResponse, onboardingResponse] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/onboarding/profile', { cache: 'no-store' }).catch(() => null)
      ]);

      let industry = '';

      if (authResponse.ok) {
        const data = await authResponse.json();
        const profile = data.user || data;

        form.setValue('fullName', profile.fullName || profile.full_name || '');
        form.setValue('email', profile.email || '');
        form.setValue('companyName', profile.companyName || profile.company_name || '');
        form.setValue('phoneNumber', profile.phoneNumber || profile.phone_number || '');
        industry = profile.industry || '';

        // Load profile picture from backend
        const pictureUrl = profile.profilePictureUrl || profile.profile_picture_url;
        if (pictureUrl) {
          setProfilePicture(pictureUrl);
        }
      }

      // Check onboarding profile for industry (prioritize onboarding profile)
      if (onboardingResponse?.ok) {
        const onboardingData = await onboardingResponse.json();
        const onboardingProfile = onboardingData.data || onboardingData;
        // Use industry from onboarding profile if available, otherwise use from auth/me
        if (onboardingProfile.industry) {
          industry = onboardingProfile.industry;
        }
      }

      // Always set industry value, even if empty - this ensures the form shows the current value
      form.setValue('industry', industry || '', { shouldDirty: false });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (values: ProfileCompletionInput) => {
    try {
      setLoading(true);

      // Update basic profile info via /api/auth/me
      // Note: Email is excluded from update since it's disabled
      const authResponse = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: values.fullName,
          // email: values.email, // Email is disabled and should not be updated
          company_name: values.companyName,
          phone_number: values.phoneNumber,
          industry: values.industry,
        })
      });

      const authResult = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authResult.message || 'Failed to update profile');
      }

      // If there's a pending profile picture file, upload it as part of the save
      if (profilePictureFile) {
        try {
          const formData = new FormData();
          formData.append('profilePicture', profilePictureFile);

          const picResponse = await fetch('/api/auth/me/profile-picture', {
            method: 'POST',
            body: formData,
          });

          const picData = await picResponse.json();

          if (picResponse.ok && picData.profile_picture_url) {
            setProfilePicture(picData.profile_picture_url);
            updateUser({ profilePictureUrl: picData.profile_picture_url });
            setProfilePictureFile(null);
            // Clean up any leftover localStorage data
            if (user?.id) {
              localStorage.removeItem(`profilePicture_${user.id}`);
            }
          } else {
            console.warn('Profile picture upload failed:', picData.message);
          }
        } catch (picError) {
          console.warn('Failed to upload profile picture:', picError);
        }
      }

      // Also save industry to onboarding profile (save even if empty to ensure it's stored)
      try {
        const onboardingResponse = await fetch('/api/onboarding/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industry: values.industry || '',
          })
        });

        if (!onboardingResponse.ok) {
          console.warn('Failed to update onboarding profile industry field');
        }
      } catch (onboardingError) {
        // Don't fail the whole update if onboarding profile update fails
        console.warn('Failed to update onboarding profile:', onboardingError);
      }

      toast.success(t('success.title'), {
        description: t('success.description')
      });

      // Clear dismissed banner flag so it can reappear if needed
      if (user?.id) {
        localStorage.removeItem(`profileBannerDismissed_${user.id}`);
      }

      // Wait a bit for the backend to process, then re-fetch the profile to get updated data
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchUserProfile(false);

    } catch (error) {
      toast.error(t('error.title'), {
        description: error instanceof Error ? error.message : t('error.unexpected')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('logo.typeError'));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('logo.sizeError'));
        return;
      }

      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    try {
      const response = await fetch('/api/auth/me/profile-picture', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove profile picture');
      }

      setProfilePicture(null);
      setProfilePictureFile(null);
      // Also update the auth store so sidebar avatar clears immediately
      updateUser({ profilePictureUrl: undefined });
      // Clean up any leftover localStorage data
      localStorage.removeItem(`profilePicture_${user.id}`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success(t('logo.removed'));
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove profile picture');
    }
  };

  const [uploadingPicture, setUploadingPicture] = useState(false);

  const handleSaveProfilePicture = async () => {
    if (!profilePictureFile) {
      toast.error('Please select an image first');
      return;
    }

    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    try {
      setUploadingPicture(true);
      const formData = new FormData();
      formData.append('profilePicture', profilePictureFile);

      const response = await fetch('/api/auth/me/profile-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload profile picture');
      }

      // Update the displayed picture with the Cloudinary URL from the backend
      if (data.profile_picture_url) {
        setProfilePicture(data.profile_picture_url);
        // Also update the auth store so sidebar avatar updates immediately
        updateUser({ profilePictureUrl: data.profile_picture_url });
      }
      // Clean up any leftover localStorage data
      localStorage.removeItem(`profilePicture_${user.id}`);
      toast.success(t('logo.saved'));
      setProfilePictureFile(null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(error instanceof Error ? error.message : t('logo.saveError'));
    } finally {
      setUploadingPicture(false);
    }
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Profile Picture Section - Separate from form */}
        <div className="mb-6 pb-6 border-b">
          <label className="text-base font-medium mb-3 block">{t('logo.label')}</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {profilePicture ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                  <Image
                    src={profilePicture}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                  id="profile-picture-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPhotoDialogOpen(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {profilePicture ? t('logo.change') : t('logo.upload')}
                </Button>
              </div>
              {profilePictureFile && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveProfilePicture}
                    disabled={uploadingPicture}
                    className="bg-[#83d2df] hover:bg-[#6bb8c7] text-white"
                  >
                    {uploadingPicture ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      t('logo.update')
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {profilePictureFile.name}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t('logo.formatInfo')}
              </p>
            </div>
          </div>
        </div>

        {/* Photo Dialog */}
        <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{profilePicture ? t('logo.change') : t('logo.upload')}</DialogTitle>
              <DialogDescription>
                {profilePicture ? 'Choose to upload a new photo or remove your current photo.' : 'Upload a new profile photo.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button
                onClick={() => {
                  fileInputRef.current?.click();
                  setPhotoDialogOpen(false);
                }}
                className="bg-[#83d2df] hover:bg-[#6bb8c7] text-white justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                {profilePicture ? 'Upload New Photo' : t('logo.upload')}
              </Button>
              {profilePicture && (
                <Button
                  onClick={() => {
                    handleRemoveProfilePicture();
                    setPhotoDialogOpen(false);
                  }}
                  variant="destructive"
                  className="justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('logo.remove')}
                </Button>
              )}
              <Button
                onClick={() => setPhotoDialogOpen(false)}
                variant="outline"
                className="justify-start"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fullName')}</FormLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                    <FormControl>
                      <Input placeholder="John Doe" className="pl-10" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.email')}</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10 bg-muted cursor-not-allowed"
                        disabled
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.companyName')}</FormLabel>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                    <FormControl>
                      <Input placeholder="Acme Corp" className="pl-10" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.phoneNumber')}</FormLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                    <FormControl>
                      <Input
                        placeholder="+1275569990"
                        className="pl-10"
                        {...field}
                        onChange={(e) => {
                          // Only allow numbers, +, -, (, ), and spaces
                          const value = e.target.value.replace(/[^0-9+\-\s()]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />



            <Button
              type="submit"
              className="w-full bg-[#83d2df] hover:bg-[#6bb8c7] text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('form.saving')}
                </>
              ) : (
                t('form.saveButton')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

