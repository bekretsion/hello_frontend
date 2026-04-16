// src/app/dashboard/upload/upload-client.tsx
'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2, FileCheck2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

// Define the row limit as a constant for easy modification
const MAX_ROWS = 100;

export default function UploadPageClient() {
  const router = useRouter();
  const t = useTranslations('upload');

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (all other handlers remain the same)
  const validateAndSetFile = (selectedFile: File | null | undefined) => {
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error(t('messages.invalidFileType'), {
        description: t('messages.invalidFileDescription')
      });
      return;
    }
    setFile(selectedFile);
  };
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(event.target.files?.[0]);
  };
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // This is crucial to allow dropping
    event.stopPropagation();
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      validateAndSetFile(droppedFiles[0]);
    }
  };
  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };


  const handleProcessFile = () => {
    if (!file) {
      toast.warning(t('messages.selectFileFirst'));
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const binaryStr = event.target?.result;
        if (!binaryStr) throw new Error(t('messages.fileCouldNotBeRead'));

        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          throw new Error(t('messages.emptyFile'));
        }

        // --- NEW: ROW LIMIT VALIDATION ---
        if (jsonData.length > MAX_ROWS) {
          throw new Error(t('messages.rowLimitExceeded', { count: MAX_ROWS }));
        }
        // --- END OF VALIDATION ---

        const response = await fetch('/api/contacts/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contacts: jsonData })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to save contacts to the server.');
        }

        toast.success(t('messages.fileProcessedSuccess'), {
          description: result.message
        });
        router.push('/dashboard/preview');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('messages.unknownError');
        // Check for specific error to provide a better description
        if (errorMessage.includes('limit')) {
          toast.error(t('messages.uploadAborted'), { description: errorMessage });
        } else {
          toast.error(t('messages.processingFailed'), { description: errorMessage });
        }
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      toast.error(t('messages.fileReadError'), {
        description: t('messages.fileReadErrorDescription')
      });
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  // JSX remains the same
  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileSelect}
            className='hidden'
            accept='.xlsx, .xls, .csv'
          />

          <div
            onClick={handleDropZoneClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              'border-muted-foreground/30 hover:border-primary flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors',
              isDragging && 'border-primary ring-primary ring-2 ring-offset-2'
            )}
          >
            {file ? (
              <div className='relative w-full p-4 text-center'>
                <FileCheck2 className='text-success mx-auto h-8 w-8' />
                <p className='text-muted-foreground mt-2 truncate text-sm font-medium'>
                  {file.name}
                </p>
                <p className='text-muted-foreground/80 text-xs'>
                  {t('dropZone.clickToChange')}
                </p>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute top-1 right-1 h-6 w-6'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                >
                  <XCircle className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <div className='text-center'>
                <FileUp className='text-muted-foreground h-8 w-8' />
                <p className='text-muted-foreground mt-2 text-sm'>
                  {isDragging
                    ? t('dropZone.dropHere')
                    : t('dropZone.clickOrDrop')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardContent>
          <Button
            onClick={handleProcessFile}
            className='w-full'
            disabled={!file || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            {isProcessing ? t('buttons.processing') : t('buttons.processAndPreview')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}