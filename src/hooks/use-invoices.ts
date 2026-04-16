'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { invoicesApi } from '@/services/invoices.api';

interface UseInvoicesResult<T = any> {
  invoices: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useInvoices = <T = any>(
  filters?: Record<string, string | number>
): UseInvoicesResult<T> => {
  const [invoices, setInvoices] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serializedFilters = useMemo(
    () => JSON.stringify(filters || {}),
    [filters]
  );

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await invoicesApi.listInvoices(filters);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.invoices || [];

      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [serializedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices
  };
};


