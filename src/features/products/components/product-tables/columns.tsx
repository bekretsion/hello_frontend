'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Product } from '@/constants/data';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Text, XCircle } from 'lucide-react';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { useTranslatedCategoryOptions } from './options';
import { useTranslations } from 'next-intl';

// Hook that creates the columns with translations
export const useProductColumns = (): ColumnDef<Product>[] => {
  const t = useTranslations('products.table');
  const categoryOptions = useTranslatedCategoryOptions();

  return [
    {
      accessorKey: 'photo_url',
      header: t('columns.image'),
      cell: ({ row }) => {
        return (
          <div className='relative aspect-square'>
            <Image
              src={row.getValue('photo_url')}
              alt={row.getValue('name')}
              fill
              className='rounded-lg'
            />
          </div>
        );
      }
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }: { column: Column<Product, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('columns.name')} />
      ),
      cell: ({ cell }) => <div>{cell.getValue<Product['name']>()}</div>,
      meta: {
        label: t('columns.name'),
        placeholder: t('search.placeholder'),
        variant: 'text',
        icon: Text
      },
      enableColumnFilter: true
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: ({ column }: { column: Column<Product, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('columns.category')} />
      ),
      cell: ({ cell }) => {
        const status = cell.getValue<Product['category']>();
        const Icon = status === 'active' ? CheckCircle2 : XCircle;

        return (
          <Badge variant='outline' className='capitalize'>
            <Icon />
            {status}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: t('filters.categories'),
        variant: 'multiSelect',
        options: categoryOptions
      }
    },
    {
      accessorKey: 'price',
      header: t('columns.price')
    },
    {
      accessorKey: 'description',
      header: t('columns.description')
    },
    {
      id: 'actions',
      cell: ({ row }) => <CellAction data={row.original} />
    }
  ];
};