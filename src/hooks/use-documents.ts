'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { documentsApi } from '@/services/documents.api';
import type { Document, DocumentFilters } from '@/types/documents';

interface UseDocumentsResult {
  documents: Document[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDocuments = (
  filters?: DocumentFilters
): UseDocumentsResult => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serializedFilters = useMemo(
    () => JSON.stringify(filters || {}),
    [filters]
  );

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await documentsApi.listDocuments(filters);
      setDocuments(response.data);
      setTotal(response.total || response.data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [serializedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    total,
    loading,
    error,
    refetch: fetchDocuments
  };
};


