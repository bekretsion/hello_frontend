'use client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { useDynamicTranslation } from '@/hooks/use-dynamic-translation';
import { useDocumentDetail } from '@/hooks/use-document-detail';
import { usePathname } from 'next/navigation';
import { IconSlash } from '@tabler/icons-react';
import { Fragment } from 'react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const items = useBreadcrumbs();
  const { translateBreadcrumb } = useDynamicTranslation();
  
  // Check if we're on a document detail page
  const documentIdMatch = pathname?.match(/^\/dashboard\/documents\/(\d+)$/);
  const documentId = documentIdMatch ? documentIdMatch[1] : null;
  const { document } = useDocumentDetail(documentId || undefined);
  
  if (items.length === 0) return null;

  // Helper function to check if a string is a number
  const isNumber = (str: string) => {
    return !isNaN(Number(str)) && !isNaN(parseFloat(str));
  };

  // Helper function to get document breadcrumb title
  const getDocumentBreadcrumbTitle = () => {
    if (!document) return null;
    
    // Prefer title, then file_name, then document_type
    if (document.title) {
      return document.title;
    }
    if (document.file_name) {
      return document.file_name;
    }
    // Capitalize document type as fallback
    return document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1);
  };

  // Helper function to translate breadcrumb title
  const getTranslatedTitle = (title: string, index: number) => {
    // If this is the last item and it's a number, and we're on a document detail page
    if (index === items.length - 1 && isNumber(title) && documentId) {
      const documentTitle = getDocumentBreadcrumbTitle();
      if (documentTitle) {
        return documentTitle;
      }
      // If document is still loading, show the ID temporarily
      return title;
    }
    
    // If it's a number and not the last item, don't translate it
    if (isNumber(title)) {
      return title;
    }
    
    // Otherwise, translate it
    return translateBreadcrumb(title);
  };

  return (
    <Breadcrumb>
      <BreadcrumbList className='flex-wrap'>
        {items.map((item, index) => (
          <Fragment key={item.title}>
            {index !== items.length - 1 && (
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink href={item.link} className='text-xs sm:text-sm'>
                  {getTranslatedTitle(item.title, index)}
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {index < items.length - 1 && (
              <BreadcrumbSeparator className='hidden md:block'>
                <IconSlash className='h-3 w-3 sm:h-4 sm:w-4' />
              </BreadcrumbSeparator>
            )}
            {index === items.length - 1 && (
              <BreadcrumbPage className='max-w-[150px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-none truncate text-xs sm:text-sm md:text-base font-medium'>
                {getTranslatedTitle(item.title, index)}
              </BreadcrumbPage>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}