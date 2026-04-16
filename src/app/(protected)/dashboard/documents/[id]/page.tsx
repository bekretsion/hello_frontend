'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DocumentStatusBadge } from '@/components/documents/document-status-badge';
import { DocumentTypePill } from '@/components/documents/document-type-pill';
import { DocumentViewer } from '@/components/documents/document-viewer';
import { DocumentTimeline } from '@/components/documents/document-timeline';
import { SendSignatureModal } from '@/components/documents/send-signature-modal';
import { SendOfferModal } from '@/components/documents/send-offer-modal';
import { HelloSignEmbeddedSigner } from '@/components/documents/hellosign-embedded-signer';
import { useDocumentDetail } from '@/hooks/use-document-detail';
import { useAuth } from '@/hooks/use-auth';
import { useDocumentPermissions } from '@/hooks/use-document-permissions';
import { documentsApi } from '@/services/documents.api';
import { toast } from 'sonner';
import {
  FileSignature,
  Loader2,
  Trash2,
  Upload,
  RotateCcw,
  Send,
  XCircle,
  Pencil
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useTranslations } from 'next-intl';

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const documentId = params?.id;
  const { document, activity, loading, error, refetch } =
    useDocumentDetail(documentId);
  const permissions = useDocumentPermissions();
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [hellosignEmbeddedUrl, setHellosignEmbeddedUrl] = useState<
    string | null
  >(null);
  const [loadingHelloSignUrl, setLoadingHelloSignUrl] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Revoke modal state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // Resend modal state
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendName, setResendName] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resending, setResending] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const t = useTranslations('documents.detail');

  const handleRevoke = async () => {
    try {
      setRevoking(true);
      await documentsApi.revokeDocument(
        document!.id,
        revokeReason || undefined
      );
      toast.success(t('success.documentRevoked'));
      setShowRevokeModal(false);
      setRevokeReason('');
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.revokeFailed')
      );
    } finally {
      setRevoking(false);
    }
  };

  const handleResend = async () => {
    if (!resendEmail) {
      toast.error(t('modals.resend.recipientEmail').replace('*', ''));
      return;
    }

    try {
      setResending(true);
      await documentsApi.resendForSigning(document!.id, {
        recipient_email: resendEmail,
        recipient_name: resendName || resendEmail,
        message: resendMessage || undefined
      });
      toast.success(t('success.documentResent'));
      setShowResendModal(false);
      setResendEmail('');
      setResendName('');
      setResendMessage('');
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.resendFailed')
      );
    } finally {
      setResending(false);
    }
  };

  const handleEdit = async () => {
    try {
      setSaving(true);
      await documentsApi.updateDocument(document!.id, {
        title: editTitle,
        content: editContent
      });
      toast.success(t('success.documentUpdated'));
      setShowEditModal(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('errors.updateFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    setEditTitle(document?.title || '');
    setEditContent(document?.content || '');
    setShowEditModal(true);
  };

  // Check if document can be revoked
  const canRevoke =
    isAdmin &&
    document &&
    ['sent', 'opened', 'pending_signature'].includes(document.document_status);

  // Check if document can be resent
  const canResend =
    isAdmin &&
    document &&
    document.file_path &&
    ['sent', 'opened', 'pending_signature'].includes(document.document_status);

  // Check if document can be edited (draft status only)
  const canEdit = isAdmin && document && document.document_status === 'draft';

  if (loading) {
    return (
      <div className='flex items-center justify-center py-32'>
        <p className='text-muted-foreground'>{t('loading')}</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className='space-y-4'>
        <p className='text-destructive'>{error || t('notFound')}</p>
        <p className='text-muted-foreground text-sm'>
          If you continue to experience issues, please contact support.
        </p>
        <Button onClick={refetch} variant='outline'>
          Retry
        </Button>
      </div>
    );
  }

  // Validate document structure
  if (typeof document === 'string') {
    return (
      <div className='space-y-4'>
        <p className='text-destructive'>
          Invalid document data received from server.
        </p>
        <p className='text-muted-foreground text-sm'>
          The server returned invalid data format. Please try again or contact
          support.
        </p>
        <Button onClick={refetch} variant='outline'>
          Retry
        </Button>
      </div>
    );
  }

  // Basic validation for required document properties
  if (!document.id || !document.document_type) {
    return (
      <div className='space-y-4'>
        <p className='text-destructive'>
          Incomplete document data received from server.
        </p>
        <p className='text-muted-foreground text-sm'>
          The document data is missing required information. Please try again or
          contact support.
        </p>
        <Button onClick={refetch} variant='outline'>
          Retry
        </Button>
      </div>
    );
  }

  // Validate activity data
  if (activity && !Array.isArray(activity)) {
    return (
      <div className='space-y-4'>
        <p className='text-destructive'>
          Invalid activity data received from server.
        </p>
        <p className='text-muted-foreground text-sm'>
          The activity log data is in an unexpected format. Please try again or
          contact support.
        </p>
        <Button onClick={refetch} variant='outline'>
          {t('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className='flex min-h-0 w-full flex-1 flex-col space-y-3 sm:space-y-4 md:space-y-6 pb-4 sm:pb-8 p-2 sm:p-0'>
      {/* Header Section */}
      <div className='flex flex-col gap-3 sm:gap-4 md:gap-6 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0 flex-1 space-y-2 sm:space-y-3'>
          <div className='flex flex-wrap items-center gap-1.5 sm:gap-2'>
            <p className='text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap'>
              {t('documentNumber')}
              {document.id}
            </p>
            <span className='text-muted-foreground hidden sm:inline'>•</span>
            <p className='text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap uppercase'>
              {t('inbound')}
            </p>
          </div>
          <h1 className='text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight break-words'>
            {document.title || document.file_name || t('untitled')}
          </h1>
          <div className='flex flex-wrap items-center gap-1.5 sm:gap-2'>
            <DocumentTypePill type={document.document_type} />
            <DocumentStatusBadge status={document.document_status} />
          </div>
        </div>
        <div className='flex flex-shrink-0 flex-wrap gap-2 sm:flex-nowrap'>
          {/* Edit button - for admins when document is in draft */}
          {canEdit && (
            <Button
              variant='outline'
              onClick={openEditModal}
              className='w-full sm:w-auto text-xs sm:text-sm'
              size='sm'
            >
              <Pencil className='mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
              {t('edit')}
            </Button>
          )}

          {/* Send for Signature - only show if not already sent or signed */}
          {permissions.canSendForSignature() &&
            document.document_status === 'draft' && (
              <Button
                onClick={() => {
                  if (!document.file_path) {
                    toast.error(t('errors.noFile'));
                    return;
                  }
                  setShowSignatureModal(true);
                }}
                disabled={!document.file_path}
                className='w-full sm:w-auto text-xs sm:text-sm'
                size='sm'
                title={!document.file_path ? t('errors.mustHaveFile') : ''}
              >
                <Send className='mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>{t('sendForSignature')}</span>
                <span className='sm:hidden'>{t('send')}</span>
              </Button>
            )}

          {/* Revoke button - for admins when document is sent/opened */}
          {canRevoke && (
            <Button
              variant='outline'
              onClick={() => setShowRevokeModal(true)}
              className='w-full border-orange-600 text-orange-600 hover:bg-orange-50 sm:w-auto text-xs sm:text-sm'
              size='sm'
            >
              <XCircle className='mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
              {t('revoke')}
            </Button>
          )}

          {/* Resend button - for admins when document is sent/opened */}
          {canResend && (
            <Button
              variant='outline'
              onClick={() => setShowResendModal(true)}
              className='w-full sm:w-auto text-xs sm:text-sm'
              size='sm'
            >
              <RotateCcw className='mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
              {t('resend')}
            </Button>
          )}

          {permissions.canSendAsOffer() &&
            document.document_type === 'offer' &&
            document.document_status !== 'offer_accepted' && (
              <Button
                variant='outline'
                onClick={() => setShowOfferModal(true)}
                className='w-full sm:w-auto text-xs sm:text-sm'
                size='sm'
              >
                {t('sendAsOffer')}
              </Button>
            )}
          {!document.file_path && permissions.canEdit() && (
            <Button
              variant='outline'
              onClick={() => {
                const input = window.document.createElement('input');
                input.type = 'file';
                // Only allow PDF uploads – required for signing workflows
                input.accept = 'application/pdf,.pdf';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;

                  // Ensure the file is a PDF by MIME type or extension
                  const isPdfMime = file.type === 'application/pdf';
                  const isPdfName = file.name.toLowerCase().endsWith('.pdf');
                  if (!isPdfMime && !isPdfName) {
                    toast.error(t('errors.onlyPdf'));
                    return;
                  }

                  if (file.size < 1024) {
                    toast.error(t('errors.fileTooSmall'));
                    return;
                  }

                  try {
                    setUploadingFile(true);
                    await documentsApi.uploadFileToDocument(document.id, file);
                    toast.success(t('success.fileUploaded'));
                    refetch();
                  } catch (error: any) {
                    toast.error(
                      error?.response?.data?.message || t('errors.uploadFailed')
                    );
                  } finally {
                    setUploadingFile(false);
                  }
                };
                input.click();
              }}
              disabled={uploadingFile}
              className='w-full sm:w-auto text-xs sm:text-sm'
              size='sm'
            >
              {uploadingFile ? (
                <>
                  <Loader2 className='mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin' />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <Upload className='mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                  {t('uploadFile')}
                </>
              )}
            </Button>
          )}
          {permissions.canDelete() && (
            <Button
              variant='destructive'
              onClick={async () => {
                if (
                  !confirm(
                    t('modals.delete.confirm', {
                      title: document.title || document.file_name
                    })
                  )
                ) {
                  return;
                }
                try {
                  setDeleting(true);
                  await documentsApi.deleteDocument(document.id);
                  toast.success(t('success.documentDeleted'));
                  router.push('/dashboard/documents');
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : t('errors.deleteFailed')
                  );
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className='w-full sm:w-auto text-xs sm:text-sm'
              size='sm'
            >
              {deleting ? (
                <>
                  <Loader2 className='mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin' />
                  {t('deleting')}
                </>
              ) : (
                <>
                  <Trash2 className='mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                  {t('delete')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Tabs
        defaultValue='preview'
        className='flex min-h-0 w-full flex-1 flex-col space-y-3 sm:space-y-4 md:space-y-6'
      >
        <TabsList className='grid h-auto w-full flex-shrink-0 grid-cols-2 sm:grid-cols-3 md:inline-flex md:h-10 md:w-auto md:grid-cols-none gap-1 sm:gap-2'>
          <TabsTrigger value='preview' className='text-[10px] sm:text-xs md:text-sm px-2 sm:px-3'>
            {t('tabs.preview')}
          </TabsTrigger>
          <TabsTrigger value='info' className='text-[10px] sm:text-xs md:text-sm px-2 sm:px-3'>
            {t('tabs.info')}
          </TabsTrigger>
          <TabsTrigger value='activity' className='text-[10px] sm:text-xs md:text-sm px-2 sm:px-3'>
            {t('tabs.activity')}
          </TabsTrigger>
          {document.signatures && document.signatures.length > 0 && (
            <TabsTrigger value='audit' className='text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 col-span-2 sm:col-span-3 md:col-span-1'>
              {t('tabs.audit')}
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent
          value='preview'
          className='mt-3 flex min-h-0 w-full flex-1 flex-col space-y-3 sm:mt-4 sm:space-y-4 md:mt-6 md:space-y-6'
        >
          {!isAdmin &&
          document.signature_request_id &&
          (document.document_status === 'sent' ||
            document.document_status === 'opened') ? (
            <>
              {hellosignEmbeddedUrl ? (
                <div className='flex h-full min-h-0 w-full flex-1 flex-col'>
                  <HelloSignEmbeddedSigner
                    documentId={document.id}
                    embeddedSignUrl={hellosignEmbeddedUrl}
                    onSigningComplete={() => {
                      refetch();
                      setHellosignEmbeddedUrl(null);
                    }}
                  />
                </div>
              ) : (
                <Card className='border-primary/20 bg-primary/5 w-full flex-shrink-0'>
                  <CardContent className='px-4 pt-4 sm:px-6 sm:pt-6'>
                    <div className='flex flex-col items-center justify-center space-y-3 py-4 sm:space-y-4 sm:py-6'>
                      <div className='bg-primary/10 mb-1 flex h-12 w-12 items-center justify-center rounded-full sm:mb-2 sm:h-16 sm:w-16'>
                        <FileSignature className='text-primary h-6 w-6 sm:h-8 sm:w-8' />
                      </div>
                      <div className='w-full max-w-md space-y-2 text-center'>
                        <h3 className='text-base font-semibold sm:text-lg'>
                          {t('signing.readyForSignature')}
                        </h3>
                        <p className='text-muted-foreground px-2 text-xs sm:px-0 sm:text-sm'>
                          {t('signing.description')}
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            setLoadingHelloSignUrl(true);
                            const response =
                              await documentsApi.getHelloSignEmbeddedUrl(
                                document.id
                              );
                            setHellosignEmbeddedUrl(
                              response.data.embedded_sign_url
                            );
                          } catch (error: any) {
                            // Check if the error is "Already Signed" (409)
                            // The error object structure depends on how httpClient throws errors
                            // usually error.response?.status or error.message if intercepted
                            if (
                              error?.response?.status === 409 ||
                              error?.message?.includes('409') ||
                              error?.message?.includes('already signed')
                            ) {
                              toast.success(t('signing.alreadySigned'));
                              refetch();
                            } else {
                              toast.error(t('signing.failedToLoad'));
                            }
                          } finally {
                            setLoadingHelloSignUrl(false);
                          }
                        }}
                        disabled={loadingHelloSignUrl}
                        size='lg'
                        className='mt-2 w-full min-w-[200px] sm:w-auto'
                      >
                        {loadingHelloSignUrl ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            {t('signing.loading')}
                          </>
                        ) : (
                          <>
                            <FileSignature className='mr-2 h-4 w-4' />
                            {t('signing.openSigningInterface')}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
          <div className='flex h-full min-h-0 w-full flex-1 flex-col'>
            <DocumentViewer document={document} />
          </div>
        </TabsContent>
        <TabsContent value='info' className='mt-3 sm:mt-4 md:mt-6'>
          <Card className='w-full'>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>{t('metadata.title')}</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:gap-6 p-4 sm:p-6 pt-0'>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  {t('metadata.customer')}
                </p>
                <p className='text-sm font-medium break-words sm:text-base'>
                  {document.customer_name || '—'}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  {t('metadata.uploadedBy')}
                </p>
                <p className='text-sm font-medium break-words sm:text-base'>
                  {document.uploaded_by_name ||
                    document.uploaded_by_email ||
                    '—'}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  {t('metadata.created')}
                </p>
                <p className='text-sm font-medium sm:text-base'>
                  {new Date(document.created_at).toLocaleString()}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-xs sm:text-sm'>
                  {t('metadata.lastUpdated')}
                </p>
                <p className='text-sm font-medium sm:text-base'>
                  {new Date(document.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='activity' className='mt-3 sm:mt-4 md:mt-6'>
          <div className='w-full'>
            <DocumentTimeline activities={activity} />
          </div>
        </TabsContent>
        {document.signatures && document.signatures.length > 0 && (
          <TabsContent value='audit' className='mt-3 sm:mt-4 md:mt-6'>
            <Card className='w-full'>
              <CardHeader className='p-4 sm:p-6'>
                <CardTitle className='text-base sm:text-lg'>{t('audit.title')}</CardTitle>
              </CardHeader>
              <CardContent className='overflow-x-auto p-4 sm:p-6 pt-0'>
                <div className='min-w-full'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='text-xs sm:text-sm'>
                          {t('audit.signer')}
                        </TableHead>
                        <TableHead className='text-xs sm:text-sm'>
                          {t('audit.email')}
                        </TableHead>
                        <TableHead className='text-xs sm:text-sm'>
                          {t('audit.signedAt')}
                        </TableHead>
                        <TableHead className='hidden text-xs sm:table-cell sm:text-sm'>
                          {t('audit.ipAddress')}
                        </TableHead>
                        <TableHead className='text-xs sm:text-sm'>
                          {t('audit.method')}
                        </TableHead>
                        <TableHead className='hidden text-xs sm:text-sm lg:table-cell'>
                          {t('audit.verification')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {document.signatures?.map((signature) => (
                        <TableRow key={signature.id}>
                          <TableCell className='text-xs font-medium sm:text-sm'>
                            {signature.signer_name}
                          </TableCell>
                          <TableCell className='text-xs break-all sm:text-sm'>
                            {signature.signer_email}
                          </TableCell>
                          <TableCell className='text-xs whitespace-nowrap sm:text-sm'>
                            {signature.signed_at
                              ? new Date(signature.signed_at).toLocaleString()
                              : '—'}
                          </TableCell>
                          <TableCell className='hidden font-mono text-xs sm:table-cell'>
                            {signature.ip_address || '—'}
                          </TableCell>
                          <TableCell className='text-xs capitalize sm:text-sm'>
                            {signature.signing_method || 'internal'}
                          </TableCell>
                          <TableCell className='hidden font-mono text-xs lg:table-cell'>
                            {signature.signature_hash
                              ? `${signature.signature_hash.substring(0, 16)}...`
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {document.signatures.some((s) => s.device_info) && (
                  <div className='mt-4 space-y-2 sm:mt-6'>
                    <p className='text-sm font-medium'>
                      {t('audit.deviceInformation')}
                    </p>
                    {document.signatures
                      .filter((s) => s.device_info)
                      .map((signature) => (
                        <div
                          key={signature.id}
                          className='bg-muted overflow-x-auto rounded p-2 text-xs sm:p-3'
                        >
                          <pre className='break-words whitespace-pre-wrap'>
                            {JSON.stringify(signature.device_info, null, 2)}
                          </pre>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <SendSignatureModal
        documentId={document.id}
        open={showSignatureModal}
        onOpenChange={setShowSignatureModal}
        onSuccess={() => {
          refetch();
        }}
      />
      <SendOfferModal
        documentId={document.id}
        open={showOfferModal}
        onOpenChange={setShowOfferModal}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Revoke Modal */}
      <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modals.revoke.title')}</DialogTitle>
            <DialogDescription>
              {t('modals.revoke.description')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='reason'>{t('modals.revoke.reason')}</Label>
              <Textarea
                id='reason'
                placeholder={t('modals.revoke.reasonPlaceholder')}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowRevokeModal(false)}
              disabled={revoking}
            >
              {t('modals.revoke.cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('modals.revoke.revoking')}
                </>
              ) : (
                t('modals.revoke.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Modal */}
      <Dialog open={showResendModal} onOpenChange={setShowResendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modals.resend.title')}</DialogTitle>
            <DialogDescription>
              {t('modals.resend.description')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='resend-email'>
                {t('modals.resend.recipientEmail')}
              </Label>
              <Input
                id='resend-email'
                type='email'
                placeholder='recipient@example.com'
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='resend-name'>
                {t('modals.resend.recipientName')}
              </Label>
              <Input
                id='resend-name'
                placeholder='John Doe'
                value={resendName}
                onChange={(e) => setResendName(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='resend-message'>
                {t('modals.resend.message')}
              </Label>
              <Textarea
                id='resend-message'
                placeholder={t('modals.resend.messagePlaceholder')}
                value={resendMessage}
                onChange={(e) => setResendMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowResendModal(false)}
              disabled={resending}
            >
              {t('modals.resend.cancel')}
            </Button>
            <Button onClick={handleResend} disabled={resending || !resendEmail}>
              {resending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('modals.resend.resending')}
                </>
              ) : (
                <>
                  <Send className='mr-2 h-4 w-4' />
                  {t('modals.resend.confirm')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('modals.edit.title')}</DialogTitle>
            <DialogDescription>
              {t('modals.edit.description')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-title'>{t('modals.edit.titleLabel')}</Label>
              <Input
                id='edit-title'
                placeholder={t('modals.edit.titlePlaceholder')}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-content'>
                {t('modals.edit.contentLabel')}
              </Label>
              <Textarea
                id='edit-content'
                placeholder={t('modals.edit.contentPlaceholder')}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={12}
                className='font-mono text-sm'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowEditModal(false)}
              disabled={saving}
            >
              {t('modals.edit.cancel')}
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('modals.edit.saving')}
                </>
              ) : (
                t('modals.edit.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
