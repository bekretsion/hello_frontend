'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { DOCUMENT_TYPES } from '@/types/documents';
import { templatesApi } from '@/services/templates.api';
import { toast } from 'sonner';
import { Plus, X, Info, Wand2, AlertCircle } from 'lucide-react';

interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
}

const BUILT_IN_VARIABLES = [
  { name: 'date', description: 'Current date (e.g., 12/18/2025)' },
  { name: 'time', description: 'Current time (e.g., 10:30:00 AM)' },
  { name: 'datetime', description: 'Current date and time' },
  { name: 'year', description: 'Current year (e.g., 2025)' }
];

export default function TemplateCreatePage() {
  const t = useTranslations('documents.templates.create');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'contract',
    content: ''
  });

  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableDescription, setNewVariableDescription] = useState('');
  const [newVariableDefault, setNewVariableDefault] = useState('');

  const extractedVariables = useMemo(() => {
    const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    const foundVars = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(form.content)) !== null) {
      foundVars.add(match[1]);
    }
    return Array.from(foundVars);
  }, [form.content]);

  const undefinedVariables = useMemo(() => {
    const definedNames = new Set([
      ...variables.map(v => v.name),
      ...BUILT_IN_VARIABLES.map(v => v.name)
    ]);
    return extractedVariables.filter(v => !definedNames.has(v));
  }, [extractedVariables, variables]);

  const addVariable = useCallback(() => {
    if (!newVariableName.trim()) {
      toast.error(t('errors.variableNameRequired'));
      return;
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newVariableName)) {
      toast.error(t('errors.variableInvalid'));
      return;
    }

    if (variables.some(v => v.name === newVariableName)) {
      toast.error(t('errors.variableExists'));
      return;
    }

    if (BUILT_IN_VARIABLES.some(v => v.name === newVariableName)) {
      toast.error(t('errors.builtInVariable'));
      return;
    }

    setVariables([
      ...variables,
      {
        name: newVariableName.trim(),
        description: newVariableDescription.trim() || `Value for ${newVariableName}`,
        defaultValue: newVariableDefault.trim() || undefined
      }
    ]);
    setNewVariableName('');
    setNewVariableDescription('');
    setNewVariableDefault('');
  }, [newVariableName, newVariableDescription, newVariableDefault, variables, t]);

  const removeVariable = useCallback((name: string) => {
    setVariables(variables.filter(v => v.name !== name));
  }, [variables]);

  const quickAddVariable = useCallback((name: string) => {
    setVariables([
      ...variables,
      {
        name,
        description: `Value for ${name}`,
        defaultValue: undefined
      }
    ]);
  }, [variables]);

  const insertVariable = useCallback((name: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = form.content;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newContent = before + `{{${name}}}` + after;
      setForm(prev => ({ ...prev, content: newContent }));
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + name.length + 4;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }, [form.content]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error(t('errors.nameRequired'));
      return;
    }

    if (!form.content.trim()) {
      toast.error(t('errors.contentRequired'));
      return;
    }

    try {
      setSubmitting(true);

      const variablesObject: Record<string, string> = {};
      for (const v of variables) {
        variablesObject[v.name] = v.description;
      }

      await templatesApi.createTemplate({
        name: form.name,
        type: form.type as any,
        content: form.content,
        variables: variablesObject
      });

      toast.success(t('success.templateCreated'));
      router.push('/dashboard/documents/templates');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.createFailed')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('details.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('details.name')}</Label>
                    <Input
                      id="name"
                      placeholder={t('details.namePlaceholder')}
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) =>
                          prev ? { ...prev, name: event.target.value } : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('details.type')}</Label>
                    <Select
                      value={form.type}
                      onValueChange={(value) =>
                        setForm((prev) => (prev ? { ...prev, type: value as any } : prev))
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('content.title')}</CardTitle>
                <CardDescription>
                  {t('content.description', { syntax: '{{variable_name}}' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {undefinedVariables.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm text-amber-800">
                        {t('variables.undefinedWarning')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {undefinedVariables.map((v) => (
                          <Badge
                            key={v}
                            variant="outline"
                            className="cursor-pointer hover:bg-amber-100"
                            onClick={() => quickAddVariable(v)}
                          >
                            {v}
                            <Plus className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-amber-600">
                        {t('variables.clickToAdd')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">{t('content.contentLabel')}</Label>
                    <div className="flex gap-2">
                      {BUILT_IN_VARIABLES.slice(0, 2).map((v) => (
                        <Tooltip key={v.name}>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => insertVariable(v.name)}
                            >
                              {`{{${v.name}}}`}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{v.description}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    id="content"
                    rows={16}
                    value={form.content}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, content: event.target.value }))
                    }
                    placeholder={t('content.placeholder')}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  {t('variables.title')}
                </CardTitle>
                <CardDescription>
                  {t('variables.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t('variables.builtIn')}
                  </Label>
                  <div className="space-y-1">
                    {BUILT_IN_VARIABLES.map((v) => (
                      <div
                        key={v.name}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm cursor-pointer hover:bg-muted"
                        onClick={() => insertVariable(v.name)}
                      >
                        <code className="text-primary">{`{{${v.name}}}`}</code>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>{v.description}</TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t('variables.custom', { count: variables.length })}
                  </Label>
                  {variables.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      {t('variables.noCustom')}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {variables.map((v) => (
                        <div
                          key={v.name}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm group"
                        >
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => insertVariable(v.name)}
                          >
                            <code className="text-primary">{`{{${v.name}}}`}</code>
                            <p className="text-xs text-muted-foreground truncate">
                              {v.description}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => removeVariable(v.name)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t('variables.addNew')}
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder={t('variables.namePlaceholder')}
                      value={newVariableName}
                      onChange={(e) => setNewVariableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    />
                    <Input
                      placeholder={t('variables.descriptionPlaceholder')}
                      value={newVariableDescription}
                      onChange={(e) => setNewVariableDescription(e.target.value)}
                    />
                    <Input
                      placeholder={t('variables.defaultPlaceholder')}
                      value={newVariableDefault}
                      onChange={(e) => setNewVariableDefault(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={addVariable}
                      disabled={!newVariableName.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('variables.addButton')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {extractedVariables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('variables.inContent')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {extractedVariables.map((v) => {
                      const isDefined = variables.some(x => x.name === v) || BUILT_IN_VARIABLES.some(x => x.name === v);
                      return (
                        <Badge
                          key={v}
                          variant={isDefined ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {v}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/documents/templates')}
          >
            {t('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('buttons.creating') : t('buttons.createTemplate')}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}