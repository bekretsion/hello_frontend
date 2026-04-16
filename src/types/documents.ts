export const DOCUMENT_TYPES = [
  'contract',
  'offer',
  'invoice',
  'nda',
  'agreement',
  'proposal',
  'other'
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUSES = [
  'draft',
  'sent',
  'opened',
  'pending_signature',
  'signed_internal',
  'signed_external',
  'offer_accepted',
  'invoice_sent',
  'paid',
  'signed',
  'expired'
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface DocumentSignature {
  id: number;
  document_id: number;
  signer_email: string;
  signer_name: string;
  signed_at: string;
  ip_address?: string;
  device_info?: Record<string, unknown>;
  signature_hash?: string;
  verification_code?: string;
  signing_method?: 'internal' | 'embedded' | 'external';
  provider_envelope_id?: string;
}

export interface DocumentActivity {
  id: number;
  document_id: number;
  action: string;
  performed_by?: number;
  performed_by_name?: string;
  performed_by_email?: string;
  performed_at: string;
  details?: Record<string, unknown> | null;
  ip_address?: string;
}

export interface Document {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_user_id?: number;
  document_type: DocumentType;
  title?: string;
  content?: string;
  template_id?: number | null;
  template_name?: string | null;
  file_name?: string;
  file_path?: string | null;
  file_size?: number;
  mime_type?: string | null;
  uploaded_by: number;
  uploaded_by_name?: string;
  uploaded_by_email?: string;
  document_status: DocumentStatus;
  signing_link?: string | null;
  signature_request_id?: string | null;
  signature_hash?: string | null;
  signed_by_name?: string | null;
  signed_by_email?: string | null;
  signed_at?: string | null;
  signed_ip?: string | null;
  signed_device_info?: string | null;
  expiry_date?: string | null;
  created_at: string;
  updated_at: string;
  activity_log?: DocumentActivity[];
  signatures?: DocumentSignature[];
}

export interface DocumentFilters {
  type?: DocumentType;
  status?: DocumentStatus;
  customer_id?: number;
  search?: string;
  limit?: number;
  offset?: number;
  date_from?: string;
  date_to?: string;
  is_signed?: boolean;
}

export interface DocumentPayload {
  customer_id: number | string;
  document_type: DocumentType;
  title?: string;
  content?: string;
  template_id?: number | null;
  template_variables?: Record<string, string>;
  file_name?: string;
  file_path?: string | null;
  file_size?: number;
  mime_type?: string | null;
  expiry_date?: string | null;
}

export interface Template {
  id: number;
  name: string;
  type: DocumentType;
  content: string;
  variables?: Record<string, unknown> | null;
  created_by: number;
  created_by_name?: string;
  created_by_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplatePayload {
  name: string;
  type: DocumentType;
  content: string;
  variables?: Record<string, string>;
  is_active?: boolean;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate?: number;
}

export interface InvoicePayload {
  customer_id: number | string;
  document_id?: number;
  due_date: string;
  currency: string;
  notes?: string;
  line_items: InvoiceLineItem[];
}


