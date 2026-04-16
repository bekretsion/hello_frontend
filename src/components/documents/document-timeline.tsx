'use client';

import { DocumentActivity } from '@/types/documents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Edit,
  PlusCircle,
  Trash2,
  Unlock,
  User,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface DocumentTimelineProps {
  activities: DocumentActivity[];
}

export function DocumentTimeline({ activities }: DocumentTimelineProps) {
  console.log('DocumentTimeline received activities:', activities);
  const t = useTranslations('documents.detail.activityLog');

  if (!activities?.length) {
    return (
      <Card className='border shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <FileText className='h-5 w-5' />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
            <FileText className='mb-4 h-12 w-12 opacity-30' />
            <p className='text-lg font-medium'>{t('noActivity.title')}</p>
            <p className='mt-1 text-sm'>{t('noActivity.description')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <FileText className='text-primary h-5 w-5' />
          {t('title')}
          <Badge variant='outline' className='ml-2'>
            {t('eventCount', { count: activities.length })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <ScrollArea className='h-[500px]'>
          <div className='p-4'>
            <div className='relative'>
              {/* Timeline line */}
              <div className='bg-primary/50 absolute top-0 bottom-0 left-6 w-0.5' />

              {activities.map((activity, index) => (
                <TimelineItem
                  key={activity.id}
                  activity={activity}
                  isLast={index === activities.length - 1}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TimelineItemProps {
  activity: DocumentActivity;
  isLast: boolean;
}

function TimelineItem({ activity, isLast }: TimelineItemProps) {
  const t = useTranslations('documents.detail.activityLog');
  const { icon, color, bgColor, borderColor } = getActivityIcon(
    activity.action
  );
  const formattedTime = new Date(activity.performed_at).toLocaleString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
  );

  return (
    <div className={cn('relative flex gap-4 pb-8', isLast && 'pb-4')}>
      {/* Timeline dot */}
      <div className='relative z-10'>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-sm',
            bgColor,
            'border-primary/50'
          )}
        >
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 pt-1'>
        <div className='mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='secondary'
              className={cn('border text-sm', borderColor, color)}
            >
              {formatAction(activity.action, t)}
            </Badge>
          </div>
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <Calendar className='h-3 w-3' />
            <time>{formattedTime}</time>
          </div>
        </div>

        {/* User info */}
        <div className='mb-3 flex items-center gap-2'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/20 border-primary flex h-7 w-7 items-center justify-center rounded-full border'>
              <User className='text-primary h-4 w-4' />
            </div>
            <div>
              <span className='text-sm font-medium'>
                {activity.performed_by_name}
              </span>
              <span className='text-muted-foreground/90 ml-2 text-xs'>
                {activity.performed_by_email}
              </span>
            </div>
          </div>
        </div>

        {/* Details section */}
        {activity.details && Object.keys(activity.details).length > 0 && (
          <div className='bg-card border-primary/50 mt-3 rounded-lg border p-4'>
            <div className='mb-2 flex items-center gap-2'>
              <AlertCircle className='text-muted-foreground h-4 w-4' />
              <span className='text-sm font-medium'>{t('details.title')}</span>
            </div>
            {formatActivityDetails(activity.details, t)}
          </div>
        )}

        {/* Metadata */}
        <div className='text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-xs'>
          <div className='flex items-center gap-1'>
            <CheckCircle className='h-3 w-3' />
            <span>
              {t('metadata.documentId', { id: activity.document_id })}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <span>{t('metadata.activityId', { id: activity.id })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getActivityIcon(action: string) {
  switch (action) {
    case 'created':
      return {
        icon: <PlusCircle className='h-5 w-5 text-green-600' />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300'
      };
    case 'updated':
      return {
        icon: <Edit className='h-5 w-5 text-yellow-600' />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300'
      };
    case 'deleted':
      return {
        icon: <Trash2 className='h-5 w-5 text-red-600' />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300'
      };
    default:
      return {
        icon: <FileText className='h-5 w-5 text-gray-600' />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300'
      };
  }
}

function formatAction(action: string, t: any): string {
  const actionTranslations: Record<string, string> = {
    created: t('actions.created'),
    updated: t('actions.updated'),
    deleted: t('actions.deleted'),
    viewed: t('actions.viewed'),
    downloaded: t('actions.downloaded'),
    sent: t('actions.sent'),
    signed: t('actions.signed'),
    revoked: t('actions.revoked'),
    resent: t('actions.resent'),
    uploaded: t('actions.uploaded')
  };

  return (
    actionTranslations[action] ||
    action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

function formatActivityDetails(
  details: Record<string, unknown>,
  t: any
): React.ReactNode {
  // Handle fields_updated array with SQL-like placeholders
  if (details.fields_updated && Array.isArray(details.fields_updated)) {
    const fields = (details.fields_updated as string[])
      .map((field) => {
        const match = field.match(/^(\w+)\s*=/);
        return match ? match[1] : field;
      })
      .filter(Boolean);

    if (fields.length > 0) {
      return (
        <div>
          <p className='text-muted-foreground mb-2 text-sm'>
            {t('details.fieldsUpdated')}
          </p>
          <div className='flex flex-wrap gap-2'>
            {fields.map((field, index) => (
              <Badge
                key={index}
                variant='outline'
                className='border-yellow-200 bg-yellow-50 text-yellow-700'
              >
                <Edit className='mr-1 h-3 w-3' />
                {field.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      );
    }
  }

  // Handle document creation details
  const entries = Object.entries(details);

  if (entries.length === 0) {
    return (
      <p className='text-muted-foreground text-sm italic'>
        {t('details.noAdditionalDetails')}
      </p>
    );
  }

  // If it's a simple object (like created document details)
  if (
    entries.length <= 5 &&
    entries.every(
      ([_, value]) =>
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
    )
  ) {
    return (
      <div className='space-y-2'>
        {entries.map(([key, value]) => (
          <div key={key} className='flex items-start gap-3'>
            <div className=''>
              <span className='text-foreground text-sm font-medium capitalize'>
                {key.replace(/_/g, ' ')}:
              </span>
            </div>
            <div className='flex-1'>
              <span className='text-muted-foreground bg-muted rounded px-2 py-1 font-mono text-sm'>
                {value === null || value === undefined
                  ? '—'
                  : typeof value === 'string' && value.length > 50
                    ? `${value.substring(0, 50)}...`
                    : String(value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // For complex objects, show JSON with syntax highlighting
  return (
    <div className='relative'>
      <div className='absolute top-2 right-2'>
        <Badge variant='outline' className='text-xs'>
          {t('details.jsonView')}
        </Badge>
      </div>
      <pre className='bg-muted mt-6 overflow-x-auto rounded p-3 text-xs'>
        <code className='text-foreground'>
          {JSON.stringify(details, null, 2)}
        </code>
      </pre>
    </div>
  );
}
