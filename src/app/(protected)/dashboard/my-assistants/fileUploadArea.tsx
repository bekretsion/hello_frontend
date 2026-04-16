'use client';

import React, { useRef, useState } from 'react';
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileText,
  FileArchive,
  Trash2,
  FileUp,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface FileUploadAreaProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  maxFiles?: number;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  accept = '.pdf,.docx,.txt,.jpg,.jpeg,.png',
  maxSize = 10, // 10MB default
  multiple = false,
  maxFiles = 5
}) => {
  const t = useTranslations('assistants.fileupload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image'))
      return <ImageIcon className='h-5 w-5 text-blue-500' />;
    if (fileType.includes('pdf'))
      return <FileText className='h-5 w-5 text-red-500' />;
    if (fileType.includes('document') || fileType.includes('word'))
      return <FileText className='h-5 w-5 text-blue-600' />;
    if (fileType.includes('zip') || fileType.includes('rar'))
      return <FileArchive className='h-5 w-5 text-yellow-600' />;
    if (fileType.includes('text'))
      return <FileText className='h-5 w-5 text-gray-600' />;
    return <File className='h-5 w-5 text-gray-500' />;
  };

  const getFileTypeName = (type: string): string => {
    if (type.includes('pdf')) return t('file_types.pdf');
    if (type.includes('image')) return t('file_types.image');
    if (type.includes('document') || type.includes('word')) return t('file_types.doc');
    if (type.includes('text')) return t('file_types.text');
    if (type.includes('zip') || type.includes('rar')) return t('file_types.archive');
    return t('file_types.file');
  };

  const handleFiles = (files: FileList) => {
    console.log('[FileUpload] handleFiles called with:', files.length, 'files');
    const fileArray = Array.from(files);
    console.log('[FileUpload] File names:', fileArray.map(f => f.name));

    // Check max files limit
    if (multiple && selectedFiles.length + fileArray.length > maxFiles) {
      console.log('[FileUpload] Max files exceeded');
      alert(t('alerts.max_files', { maxFiles }));
      return;
    }

    // If not multiple, replace all files
    const newFiles = multiple
      ? [...selectedFiles, ...fileArray]
      : [fileArray[0]];

    console.log('[FileUpload] newFiles count:', newFiles.length);

    // Remove duplicates by name and size
    const uniqueFiles = newFiles.filter(
      (file, index, self) =>
        index ===
        self.findIndex(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified
        )
    );

    console.log('[FileUpload] uniqueFiles count:', uniqueFiles.length);
    console.log('[FileUpload] Setting selectedFiles state...');
    setSelectedFiles(uniqueFiles);
    console.log('[FileUpload] Calling onFileSelect callback...');
    onFileSelect(uniqueFiles);
    console.log('[FileUpload] handleFiles complete');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[FileUpload] Input onChange triggered');
    console.log('[FileUpload] e.target.files:', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    console.log('[FileUpload] handleClick called');
    if (fileInputRef.current) {
      console.log('[FileUpload] Triggering click on file input');
      fileInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasFiles = selectedFiles.length > 0;

  // When there are no files, render the empty state with a label wrapping everything
  if (!hasFiles) {
    return (
      <div className='space-y-4'>
        <label
          className={`block cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200 ${dragActive
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary border-gray-300 hover:bg-gray-50'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type='file'
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className='sr-only'
          />
          <div className='p-8 text-center'>
            {/* Upload Icon */}
            <div className='mb-4 flex justify-center'>
              <Upload
                className={`h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`}
              />
            </div>

            {/* Instructions */}
            <p className='mb-1 text-sm font-medium text-gray-700'>
              {dragActive
                ? t('upload_drag_active')
                : t('upload_instructions')}
            </p>

            {/* File Requirements */}
            <p className='text-xs text-gray-400'>
              {t(`file_requirements.${multiple ? 'multiple' : 'single'}`, {
                maxFiles,
                maxSize,
                accept: accept.replace(/\.,/g, ', ')
              })}
            </p>
          </div>
        </label>
      </div>
    );
  }

  // When there are files, render the file list view
  return (
    <div className='space-y-4'>
      <div
        className='cursor-pointer rounded-lg border-2 border-dashed border-gray-300 transition-all duration-200'
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Hidden file input for the "Add More" button */}
        <input
          ref={fileInputRef}
          type='file'
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className='hidden'
        />

        {/* File list view */}
        <div className='p-4'>
          {/* Header with file count and add button */}
          <div className='mb-1 flex items-center justify-between'>
            <div className='flex items-center'>
              <FileUp className='mr-2 h-5 w-5 text-blue-500' />
              <h3 className='font-medium text-gray-700'>
                {selectedFiles.length}{' '}
                {multiple
                  ? t('selected_multiple')
                  : t('selected_single')}
              </h3>
            </div>
            <div className='flex items-center space-x-2'>
              <Button variant='outline' onClick={handleClick}>
                {multiple ? t('add_multiple') : t('add_single')}
              </Button>
              {multiple && selectedFiles.length > 1 && (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFiles([]);
                    onFileSelect([]);
                  }}
                  className='flex items-center text-sm font-medium text-red-500 hover:text-red-700'
                  title={t('remove_all')}
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Files Queue */}
          <div className='relative'>
            <div className='flex space-x-3 overflow-x-auto pb-3'>
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className='group relative flex-shrink-0 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-sm'
                  style={{ minWidth: '180px', maxWidth: '200px' }}
                >
                  {/* File Card */}
                  <div className='flex flex-col'>
                    {/* File Icon and Type */}
                    <div className='mb-2 flex items-start justify-between'>
                      <div className='flex items-center space-x-2'>
                        <div className='flex-shrink-0'>
                          {getFileIcon(file.type)}
                        </div>
                        <span className='text-xs font-medium text-gray-600'>
                          {getFileTypeName(file.type)}
                        </span>
                      </div>
                      {/* Remove Button */}
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className='absolute top-2 right-2 rounded-full p-1 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500'
                        title={t('remove_file')}
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </div>

                    {/* File Name (Truncated) */}
                    <p
                      className='mb-1 truncate text-sm font-medium text-gray-900'
                      title={file.name}
                    >
                      {file.name}
                    </p>

                    {/* File Size */}
                    <div className='mt-auto flex items-center justify-between'>
                      <span className='text-xs text-gray-500'>
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll indicator (only shows when there are many files) */}
            {selectedFiles.length > 3 && (
              <div className='absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center space-x-1'>
                <MoreHorizontal className='h-4 w-4 text-gray-400' />
                <span className='text-xs text-gray-500'>{t('scroll_hint')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadArea;