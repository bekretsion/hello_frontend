'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { documentsApi } from '@/services/documents.api';
import type { Document } from '@/types/documents';
import { toast } from 'sonner';

export default function OfferReviewPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token;
  const [offer, setOffer] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    signer_name: '',
    signer_email: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        if (!token) return;
        const response = await documentsApi.getDocument(token);
        setOffer(response.data);
      } catch (error) {
        toast.error('Offer link invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [token]);

  const handleApprove = async () => {
    if (!token) return;

    try {
      setSubmitting(true);
      await documentsApi.approveOffer(token, {
        token,
        signer_email: form.signer_email,
        signer_name: form.signer_name
      });
      router.push(`/offer/${token}/approved`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to approve offer'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading offer...</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Offer not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{offer.title || offer.file_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review the proposal and approve to move forward.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {offer.content ? (
              <div
                className="prose max-w-none border rounded-md p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: offer.content }}
              />
            ) : (
              <p className="text-muted-foreground">
                Offer preview is not available.
              </p>
            )}

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
            <Button className="w-full" onClick={handleApprove} disabled={submitting}>
              {submitting ? 'Approving...' : 'Approve Offer'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


