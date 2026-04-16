'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from '@/types/documents';
import { useTranslations } from 'next-intl';
import { use } from 'react';

export interface DocumentFilterState {
  search?: string;
  type?: string;
  status?: string;
}

interface DocumentFiltersProps {
  filters: DocumentFilterState;
  onChange: (filters: DocumentFilterState) => void;
}

export function DocumentFilters({ filters, onChange }: DocumentFiltersProps) {
  const t = useTranslations('documents');
  return (
    <div className='grid grid-cols-1 gap-3 sm:gap-4 md:flex md:items-center'>
      <Input
        placeholder={t('filters.searchPlaceholder')}
        value={filters.search || ''}
        onChange={(event) =>
          onChange({ ...filters, search: event.target.value })
        }
        className='w-full max-w-md text-sm sm:text-base'
      />
      <Select
        value={filters.type || 'all'}
        onValueChange={(value) =>
          onChange({ ...filters, type: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className='w-full md:w-auto'>
          <SelectValue placeholder={t('filters.typePlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>{t('filters.type')}</SelectItem>
          {DOCUMENT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`filters.types.${type}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          onChange({ ...filters, status: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className='w-full md:w-48'>
          <SelectValue placeholder={t('filters.statusPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>{t('filters.status')}</SelectItem>
          {DOCUMENT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {t(`filters.statuses.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
