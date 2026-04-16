'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OfferApprovedPage() {
  const params = useParams<{ token: string }>();

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Offer Approved</CardTitle>
            <p className="text-muted-foreground">
              Thank you! We have recorded your approval and sent a confirmation
              email.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Reference Token: <span className="font-mono">{params?.token}</span>
            </p>
            <Button asChild className="w-full">
              <Link href="/sign-in">Back to Hello</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


