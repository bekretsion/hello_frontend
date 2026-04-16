import { useTranslations } from 'next-intl';

// Hook to get translated category options
export const useTranslatedCategoryOptions = () => {
  const t = useTranslations('products.categories');
  
  return [
    { value: 'Electronics', label: t('electronics') },
    { value: 'Furniture', label: t('furniture') },
    { value: 'Clothing', label: t('clothing') },
    { value: 'Toys', label: t('toys') },
    { value: 'Groceries', label: t('groceries') },
    { value: 'Books', label: t('books') },
    { value: 'Jewelry', label: t('jewelry') },
    { value: 'Beauty Products', label: t('beauty') }
  ];
};

// For backward compatibility or places where hooks can't be used
export const CATEGORY_OPTIONS = [
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Toys', label: 'Toys' },
  { value: 'Groceries', label: 'Groceries' },
  { value: 'Books', label: 'Books' },
  { value: 'Jewelry', label: 'Jewelry' },
  { value: 'Beauty Products', label: 'Beauty Products' }
];