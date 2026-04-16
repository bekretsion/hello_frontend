'use client';

import { Badge } from '@/components/ui/badge';
import type { DocumentStatus } from '@/types/documents';

const STATUS_STYLES: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  opened: 'bg-cyan-100 text-cyan-800',
  pending_signature: 'bg-amber-100 text-amber-900',
  signed_internal: 'bg-green-100 text-green-800',
  signed_external: 'bg-green-100 text-green-800',
  offer_accepted: 'bg-emerald-100 text-emerald-800',
  invoice_sent: 'bg-indigo-100 text-indigo-800',
  paid: 'bg-lime-100 text-lime-800',
  signed: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800'
};

interface Props {
  status: DocumentStatus;
}

export function DocumentStatusBadge({ status }: Props) {
  return (
    <Badge className={`${STATUS_STYLES[status]} font-medium capitalize text-xs`}>
      {status.replace('_', ' ')}
    </Badge>
  );
}


