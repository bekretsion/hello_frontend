'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { documentsApi } from '@/services/documents.api';
import type { Document } from '@/types/documents';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export default function SigningPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    signer_name: '',
    signer_email: '',
    otp: '',
    message: ''
  });
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        if (!token) return;
        const response = await documentsApi.getDocument(token);
        setDocument(response.data);
      } catch (error) {
        toast.error('Invalid or expired signing link.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [token]);

  const handleSign = async () => {
    if (isAdmin) {
      toast.error('Admins cannot sign documents.');
      return;
    }
    if (!token) return;
    try {
      setSigning(true);
      await documentsApi.registerSignature(token, {
        signer_name: form.signer_name,
        signer_email: form.signer_email,
        signature_hash: `manual-${Date.now()}`,
        verification_code: form.otp,
        device_info: {
          note: form.message
        }
      });
      toast.success('Document signed successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to sign document'
      );
    } finally {
      setSigning(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Admins cannot access signing flows.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{document.title || document.file_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Please confirm your details and sign to complete.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.signer_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, signer_name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.signer_email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, signer_email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>One-Time Passcode</Label>
              <Input
                value={form.otp}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, otp: event.target.value }))
                }
                placeholder="Enter code from email"
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                rows={4}
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
              />
            </div>
            <Button className="w-full" onClick={handleSign} disabled={signing}>
              {signing ? 'Signing...' : 'Sign & Confirm'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


