'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DOCUMENT_TYPES, type Template } from '@/types/documents';
import { templatesApi } from '@/services/templates.api';
import { toast } from 'sonner';

export default function TemplateDetailPage() {
  const t = useTranslations('documents.templates.edit');
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const templateId = params?.id;
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await templatesApi.getTemplate(templateId);
        setTemplate(response.data);
      } catch (error) {
        toast.error(t('errors.updateFailed'));
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId, t]);

  const handleSave = async () => {
    if (!template) return;
    try {
      setSaving(true);
      await templatesApi.updateTemplate(template.id, {
        name: template.name,
        type: template.type,
        content: template.content,
        variables: (template.variables as Record<string, string>) || {}
      });
      toast.success(t('success.templateUpdated'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.updateFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    try {
      await templatesApi.deleteTemplate(template.id);
      toast.success(t('success.templateDeleted'));
      router.push('/dashboard/documents/templates');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.deleteFailed')
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (!template) {
    return <p className="text-destructive">{t('notFound')}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t('templateNumber', { id: template.id })}</p>
          <h1 className="text-3xl font-semibold">{template.name}</h1>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          {t('delete')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('name')}</Label>
            <Input
              value={template.name}
              onChange={(event) =>
                setTemplate((prev) =>
                  prev ? { ...prev, name: event.target.value } : prev
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t('type')}</Label>
            <Select
              value={template.type}
              onValueChange={(value) =>
                setTemplate((prev) => (prev ? { ...prev, type: value as any } : prev))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('variablesJson')}</Label>
            <Textarea
              rows={4}
              value={JSON.stringify(template.variables || {}, null, 2)}
              onChange={(event) =>
                setTemplate((prev) =>
                  prev
                    ? { ...prev, variables: JSON.parse(event.target.value || '{}') }
                    : prev
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t('content')}</Label>
            <Textarea
              rows={12}
              value={template.content}
              onChange={(event) =>
                setTemplate((prev) =>
                  prev ? { ...prev, content: event.target.value } : prev
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}