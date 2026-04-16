'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useTemplates } from '@/hooks/use-templates';
import { DOCUMENT_TYPES, type DocumentType, type Template } from '@/types/documents';
import { documentsApi } from '@/services/documents.api';
import { toast } from 'sonner';
import { FileText, Upload, ChevronRight, ChevronLeft, Check, Wand2 } from 'lucide-react';

type CreationMode = 'template' | 'upload';

type CreationAction =
  | 'signature'
  | 'offer'
  | 'draft';

interface FormState {
  document_type: DocumentType;
  template_id?: string;
  content: string;
  customer_id: string;
  action: CreationAction;
  title: string;
  template_variables: Record<string, string>;
}

interface Customer {
  id: number;
  company_name?: string;
  username?: string;
  contact_person?: string;
  email?: string;
}

export default function DocumentCreationPage() {
  const t = useTranslations('documents.create');
  const router = useRouter();
  const { templates } = useTemplates({ is_active: true });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<CreationMode | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [form, setForm] = useState<FormState>({
    document_type: 'contract',
    content: '',
    customer_id: '',
    action: 'draft',
    title: '',
    template_variables: {}
  });

  const selectedTemplate = useMemo(() => {
    if (!form.template_id) return null;
    return templates.find(t => t.id.toString() === form.template_id) || null;
  }, [form.template_id, templates]);

  const templateVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    const foundVars = new Set<string>();
    const builtInVars = ['date', 'time', 'datetime', 'year'];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(selectedTemplate.content)) !== null) {
      if (!builtInVars.includes(match[1])) {
        foundVars.add(match[1]);
      }
    }
    return Array.from(foundVars);
  }, [selectedTemplate]);

  const steps = useMemo(() => {
    if (mode === 'template') {
      const baseSteps = [
        t('steps.selectType'),
        t('steps.chooseTemplate'),
      ];
      if (templateVariables.length > 0) {
        baseSteps.push(t('steps.fillVariables'));
      }
      baseSteps.push(t('steps.selectCustomer'), t('steps.reviewCreate'));
      return baseSteps;
    } else if (mode === 'upload') {
      return [
        t('steps.selectType'),
        t('steps.uploadFile'),
        t('steps.selectCustomer'),
        t('steps.reviewCreate')
      ];
    }
    return [t('steps.chooseMethod')];
  }, [mode, templateVariables.length, t]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/admin/customers?limit=1000');
        if (!response.ok) {
          throw new Error('Failed to load customers');
        }
        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('errors.createFailed')
        );
      }
    };

    fetchCustomers();
  }, [t]);

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    if (step === 0 && mode !== null) {
      setMode(null);
    } else {
      setStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleSubmit = async () => {
    if (!form.customer_id) {
      toast.error(t('errors.selectCustomer'));
      return;
    }

    try {
      setCreating(true);

      if (mode === 'upload' && uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('customer_id', form.customer_id);
        formData.append('document_type', form.document_type);
        formData.append('title', form.title || uploadedFile.name);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || t('errors.uploadFailed'));
        }

        const result = await response.json();
        toast.success(t('success.uploadSuccess'));
        router.push(`/dashboard/documents/${result.data.id}`);
      } else {
        const payload = await documentsApi.createDocument({
          customer_id: form.customer_id,
          document_type: form.document_type,
          template_id: form.template_id ? Number(form.template_id) : undefined,
          content: form.content,
          title: form.title,
          template_variables: form.template_variables
        });

        toast.success(t('success.createSuccess'));

        if (form.action === 'signature') {
          router.push(`/dashboard/documents/${payload.data.id}`);
        } else if (form.action === 'offer') {
          router.push(`/dashboard/documents/${payload.data.id}`);
        } else {
          router.push('/dashboard/documents');
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.createFailed')
      );
    } finally {
      setCreating(false);
    }
  };

  if (mode === null) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => {
              setMode('template');
              setStep(0);
            }}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t('useTemplate.title')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('useTemplate.description')}
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground text-left space-y-1">
                  <li>• {t('useTemplate.features.1')}</li>
                  <li>• {t('useTemplate.features.2')}</li>
                  <li>• {t('useTemplate.features.3')}</li>
                  <li>• {t('useTemplate.features.4')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => {
              setMode('upload');
              setStep(0);
            }}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t('uploadPdf.title')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('uploadPdf.description')}
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground text-left space-y-1">
                  <li>• {t('uploadPdf.features.1')}</li>
                  <li>• {t('uploadPdf.features.2')}</li>
                  <li>• {t('uploadPdf.features.3')}</li>
                  <li>• {t('uploadPdf.features.4')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    if (mode === 'template') {
      if (step === 0) {
        return (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>{t('form.documentType')}</Label>
              <Select
                value={form.document_type}
                onValueChange={(value) =>
                  setForm({ ...form, document_type: value as DocumentType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.chooseType')} />
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
            <div className="space-y-2">
              <Label>{t('form.documentTitle')}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('form.titlePlaceholder')}
              />
            </div>
          </div>
        );
      } else if (step === 1) {
        const filteredTemplates = templates.filter(
          t => t.type === form.document_type || form.document_type === 'other'
        );
        return (
          <div className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t('form.noTemplates')}
                </p>
                <Button
                  variant="link"
                  onClick={() => router.push('/dashboard/documents/templates/create')}
                >
                  {t('form.createTemplate')}
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors ${form.template_id === template.id.toString()
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                      }`}
                    onClick={() => {
                      setForm({
                        ...form,
                        template_id: template.id.toString(),
                        content: template.content,
                        template_variables: {}
                      });
                    }}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {template.type.charAt(0).toUpperCase() + template.type.slice(1)} template
                          </p>
                        </div>
                        {form.template_id === template.id.toString() && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      } else if (templateVariables.length > 0 && step === 2) {
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('variables.fillValues')}
            </p>
            <div className="grid gap-4">
              {templateVariables.map((varName) => {
                const varDescription = (selectedTemplate?.variables?.[varName] as string | undefined) ||
                  varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                return (
                  <div key={varName} className="space-y-2">
                    <Label htmlFor={varName}>
                      {varDescription}
                      <code className="ml-2 text-xs text-muted-foreground bg-muted px-1 rounded">
                        {`{{${varName}}}`}
                      </code>
                    </Label>
                    <Input
                      id={varName}
                      value={form.template_variables[varName] || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          template_variables: {
                            ...form.template_variables,
                            [varName]: e.target.value
                          }
                        })
                      }
                      placeholder={t('variables.enterValue', { name: varDescription.toLowerCase() })}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      } else {
        const adjustedStep = templateVariables.length > 0 ? step : step + 1;

        if (adjustedStep === 3) {
          return (
            <div className="grid gap-3">
              <Label>{t('form.customer')}</Label>
              <Select
                value={form.customer_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, customer_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.selectCustomer')} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.company_name ||
                        customer.username ||
                        customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        } else if (adjustedStep === 4) {
          const selectedCustomer = customers.find(
            c => c.id.toString() === form.customer_id
          );
          return (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t('review.type')}</span>
                  <span className="font-medium capitalize">{form.document_type}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t('review.title')}</span>
                  <span className="font-medium">{form.title || t('review.untitled')}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t('review.template')}</span>
                  <span className="font-medium">{selectedTemplate?.name || t('review.none')}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t('review.customer')}</span>
                  <span className="font-medium">
                    {selectedCustomer?.company_name || selectedCustomer?.username || t('review.notSelected')}
                  </span>
                </div>
                {Object.keys(form.template_variables).length > 0 && (
                  <div className="py-2 border-b">
                    <span className="text-muted-foreground">{t('review.variableValues')}</span>
                    <div className="mt-2 space-y-1">
                      {Object.entries(form.template_variables).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <code className="text-muted-foreground">{key}</code>
                          <span>{value || t('review.empty')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('form.afterCreation')}</Label>
                <Select
                  value={form.action}
                  onValueChange={(value: CreationAction) =>
                    setForm((prev) => ({ ...prev, action: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.chooseNext')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signature">{t('form.goToDocument')}</SelectItem>
                    <SelectItem value="draft">{t('form.saveDraft')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }
      }
    } else if (mode === 'upload') {
      if (step === 0) {
        return (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>{t('form.documentType')}</Label>
              <Select
                value={form.document_type}
                onValueChange={(value) =>
                  setForm({ ...form, document_type: value as DocumentType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.chooseType')} />
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
            <div className="space-y-2">
              <Label>{t('form.documentTitle')}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('form.titlePlaceholder')}
              />
            </div>
          </div>
        );
      } else if (step === 1) {
        return (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${uploadedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
            >
              {uploadedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-primary mx-auto" />
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    {t('form.remove')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">{t('form.uploadPdfDocument')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('form.clickOrDrop')}
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="max-w-xs mx-auto"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                          toast.error(t('form.onlyPdf'));
                          return;
                        }
                        if (file.size < 1024) {
                          toast.error(t('form.fileTooSmall'));
                          return;
                        }
                        setUploadedFile(file);
                        if (!form.title) {
                          setForm(prev => ({
                            ...prev,
                            title: file.name.replace('.pdf', '')
                          }));
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      } else if (step === 2) {
        return (
          <div className="grid gap-3">
            <Label>{t('form.customer')}</Label>
            <Select
              value={form.customer_id}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, customer_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('form.selectCustomer')} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.company_name ||
                      customer.username ||
                      customer.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      } else if (step === 3) {
        const selectedCustomer = customers.find(
          c => c.id.toString() === form.customer_id
        );
        return (
          <div className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t('review.type')}</span>
                <span className="font-medium capitalize">{form.document_type}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t('review.title')}</span>
                <span className="font-medium">{form.title || t('review.untitled')}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t('review.file')}</span>
                <span className="font-medium">{uploadedFile?.name || t('review.none')}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t('review.customer')}</span>
                <span className="font-medium">
                  {selectedCustomer?.company_name || selectedCustomer?.username || t('review.notSelected')}
                </span>
              </div>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const canProceed = () => {
    if (mode === 'template') {
      if (step === 1 && !form.template_id) return false;
      if (step === steps.length - 2 && !form.customer_id) return false;
    } else if (mode === 'upload') {
      if (step === 1 && !uploadedFile) return false;
      if (step === 2 && !form.customer_id) return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('steps.chooseMethod')} {step + 1} {t('steps.reviewCreate')} {steps.length}</span>
          <span>•</span>
          <span className="capitalize">{mode} mode</span>
        </div>
        <h1 className="text-3xl font-semibold">{steps[step]}</h1>
      </div>

      <div className="flex gap-1">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${index <= step ? 'bg-primary' : 'bg-muted'
              }`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step]}</CardTitle>
          {step === 0 && mode === 'template' && (
            <CardDescription>
              {t('form.chooseType')}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('buttons.back')}
        </Button>
        {step === steps.length - 1 ? (
          <Button onClick={handleSubmit} disabled={creating || !canProceed()}>
            {creating ? t('buttons.creating') : t('buttons.createDocument')}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed()}>
            {t('buttons.next')}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
