'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Bot, CheckCircle2, Sparkles, Globe, FileText, Info, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface CreateAssistantRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  hasActiveMinuteBundle?: boolean;
}

export function CreateAssistantRequestModal({
  open,
  onOpenChange,
  onSuccess,
  hasActiveMinuteBundle = false
}: CreateAssistantRequestModalProps) {
  const t = useTranslations('assistants');
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const isOutboundAccount = user?.activeAccountType === 'outbound';

  // True when the user cannot submit a request
  const isRestricted = !hasActiveMinuteBundle;

  const [formData, setFormData] = useState({
    assistant_name: '',
    assistant_type: 'inbound',
    language: 'en',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block submission if the user has no active bundle and show a warning toast
    if (isRestricted) {
      toast.warning(t('request.needActiveBundle'), {
        description: t('request.purchaseBundlePrompt'),
        duration: 4000
      });
      return;
    }

    if (!formData.assistant_name.trim()) {
      toast.error(t('validation.assistantNameRequired'));
      return;
    }

    try {
      setSubmitting(true);

      const requestBody = {
        assistant_name: formData.assistant_name,
        assistant_type: formData.assistant_type,
        language: formData.language,
        description: formData.description || ''
      };

      const response = await fetch('/api/assistants/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit request');
      }

      toast.success(t('request.submitSuccess'));
      setRequestSent(true);

      setFormData({
        assistant_name: '',
        assistant_type: 'inbound',
        language: 'en',
        description: ''
      });

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        setRequestSent(false);
        onOpenChange(false);
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for clicks on the disabled submit button to show a warning toast
  const handleDisabledSubmitClick = () => {
    if (isRestricted) {
      toast.warning(t('request.needActiveBundle'), {
        description: t('request.purchaseBundlePrompt'),
        duration: 4000
      });
    }
  };

  const handleCancel = () => {
    setRequestSent(false);
    onOpenChange(false);
    setFormData({
      assistant_name: '',
      assistant_type: 'inbound',
      language: 'en',
      description: ''
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRequestSent(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[600px] p-5">
        {requestSent ? (
          // Success State
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-center space-y-3 max-w-md">
              <h3 className="text-2xl font-bold text-foreground">
                {t('request.submitSuccess')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('request.submitSuccessDescription')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-2 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {t('request.requestNewTitle')}
                  </DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-base leading-relaxed">
                {t('request.requestNewDescription')}
              </DialogDescription>
            </DialogHeader>

            {/* Info banner (always shown) */}
            <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 py-2.5">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                {t('request.adminReviewMessage')}
              </AlertDescription>
            </Alert>

            {/* Warning banner — shown when user has no active bundle */}
            {isRestricted && (
              <Alert className="border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  {t('request.needActiveBundle')}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto py-1">
              {/* Assistant Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="assistant_name"
                  className={`text-sm font-semibold flex items-center gap-2 ${isRestricted ? 'text-muted-foreground' : ''}`}
                >
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  {t('request.assistantNameRequired')}
                  {isRestricted && <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />}
                </Label>
                <Input
                  id="assistant_name"
                  value={formData.assistant_name}
                  onChange={(e) =>
                    !isRestricted && setFormData({ ...formData, assistant_name: e.target.value })
                  }
                  placeholder={t('request.assistantNamePlaceholder')}
                  className={`h-9 ${isRestricted ? 'opacity-50 cursor-not-allowed bg-muted' : ''}`}
                  disabled={isRestricted}
                  required={!isRestricted}
                  readOnly={isRestricted}
                />
                <p className="text-xs text-muted-foreground">
                  {t('request.assistantNameDescription')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Assistant Type */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="assistant_type"
                    className={`text-sm font-semibold flex items-center gap-2 ${isRestricted ? 'text-muted-foreground' : ''}`}
                  >
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    {t('request.typeRequired')}
                  </Label>
                  <Select
                    value={formData.assistant_type}
                    onValueChange={(value) =>
                      !isRestricted && setFormData({ ...formData, assistant_type: value })
                    }
                    disabled={isRestricted}
                  >
                    <SelectTrigger className={`h-9 ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder={t('request.selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">{t('filters.inbound')}</SelectItem>
                      {isOutboundAccount && (
                        <>
                          <SelectItem value="outbound">
                            {t('filters.outbound')}
                          </SelectItem>
                          <SelectItem value="both">
                            {t('filters.both')}
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('request.typeDescription')}
                  </p>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="language"
                    className={`text-sm font-semibold flex items-center gap-2 ${isRestricted ? 'text-muted-foreground' : ''}`}
                  >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {t('card.language')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      !isRestricted && setFormData({ ...formData, language: value })
                    }
                    disabled={isRestricted}
                  >
                    <SelectTrigger className={`h-9 ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder={t('request.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 {t('languages.english')}</SelectItem>
                      <SelectItem value="es">🇪🇸 {t('languages.spanish')}</SelectItem>
                      <SelectItem value="fr">🇫🇷 {t('languages.french')}</SelectItem>
                      <SelectItem value="de">🇩🇪 {t('languages.german')}</SelectItem>
                      <SelectItem value="it">🇮🇹 {t('languages.italian')}</SelectItem>
                      <SelectItem value="pt">🇵🇹 {t('languages.portuguese')}</SelectItem>
                      <SelectItem value="no">🇳🇴 {t('languages.norwegian')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('request.languageDescription')}
                  </p>
                </div>
              </div>

              {/* Description / Use Case */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className={`text-sm font-semibold flex items-center gap-2 ${isRestricted ? 'text-muted-foreground' : ''}`}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {t('request.useCaseDescription')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    !isRestricted && setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t('request.useCasePlaceholder')}
                  rows={3}
                  className={`resize-none ${isRestricted ? 'opacity-50 cursor-not-allowed bg-muted' : ''}`}
                  disabled={isRestricted}
                  readOnly={isRestricted}
                />
                <p className="text-xs text-muted-foreground">
                  {t('request.descriptionOptional')}
                </p>
              </div>
            </form>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={submitting}
                className="min-w-[100px]"
              >
                {t('request.cancel')}
              </Button>

              {/* Wrapper div captures clicks even when the button is visually disabled */}
              <div
                className={isRestricted ? 'cursor-not-allowed' : ''}
                onClick={isRestricted ? handleDisabledSubmitClick : undefined}
              >
                <Button
                  type="submit"
                  onClick={isRestricted ? (e) => e.preventDefault() : handleSubmit}
                  disabled={submitting || !formData.assistant_name.trim() || isRestricted}
                  className={`bg-[#83d2df] hover:bg-[#6bb8c7] text-white min-w-[140px] shadow-sm hover:shadow-md transition-all ${isRestricted ? 'pointer-events-none opacity-50' : ''
                    }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('request.submitting')}
                    </>
                  ) : (
                    <>
                      {isRestricted ? (
                        <Lock className="mr-2 h-4 w-4" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {t('request.submitRequest')}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
