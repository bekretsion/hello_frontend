'use client';

import { useCallback, useEffect, useState } from 'react';
import { templatesApi } from '@/services/templates.api';
import type { Template } from '@/types/documents';

interface UseTemplatesOptions {
  type?: string;
  is_active?: boolean;
}

interface UseTemplatesResult {
  templates: Template[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTemplates = (
  options?: UseTemplatesOptions
): UseTemplatesResult => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await templatesApi.listTemplates(options);
      setTemplates(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [options?.type, options?.is_active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  };
};


