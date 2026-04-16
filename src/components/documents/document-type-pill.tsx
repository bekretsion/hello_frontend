'use client';

import { Badge } from '@/components/ui/badge';
import type { DocumentType } from '@/types/documents';

const TYPE_STYLES: Record<DocumentType, string> = {
  contract: 'bg-slate-100 text-slate-800',
  offer: 'bg-purple-100 text-purple-800',
  invoice: 'bg-orange-100 text-orange-800',
  nda: 'bg-pink-100 text-pink-800',
  agreement: 'bg-slate-100 text-slate-800',
  proposal: 'bg-slate-100 text-slate-800',
  other: 'bg-gray-100 text-gray-800'
};

interface Props {
  type: DocumentType;
}

export function DocumentTypePill({ type }: Props) {
  return (
    <Badge variant="outline" className={`${TYPE_STYLES[type]} capitalize text-xs`}>
      {type}
    </Badge>
  );
}


