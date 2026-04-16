'use client';

import { useCallback, useEffect, useState } from 'react';
import { documentsApi } from '@/services/documents.api';
import type { Document, DocumentActivity } from '@/types/documents';

interface UseDocumentDetailResult {
  document: Document | null;
  activity: DocumentActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDocumentDetail = (
  id?: number | string
): UseDocumentDetailResult => {
  const [document, setDocument] = useState<Document | null>(null);
  const [activity, setActivity] = useState<DocumentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [documentResponse, activityResponse] = await Promise.all([
        documentsApi.getDocument(id),
        documentsApi.getActivityLog(id)
      ]);

      // Validate that the response data is actually an object and not a string
      if (typeof documentResponse.data === 'string') {
        throw new Error('Invalid response format from server');
      }

      if (typeof activityResponse.data === 'string') {
        throw new Error('Invalid response format from server');
      }

      // Additional validation to ensure document has required properties
      if (!documentResponse.data || typeof documentResponse.data !== 'object') {
        throw new Error('Invalid document data structure');
      }

      if (!Array.isArray(activityResponse.data)) {
        throw new Error('Invalid activity data structure');
      }

      setDocument(documentResponse.data);
      setActivity(activityResponse.data || []);
    } catch (err) {
      console.error('Error fetching document:', err);

      // Handle the specific "[object Object]" error
      if (err instanceof Error && err.message.includes('[object Object]')) {
        setError('Invalid response format from server. Please try again.');
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to load document'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  return {
    document,
    activity,
    loading,
    error,
    refetch: fetchDocument
  };
};
