import { httpClient } from './httpClient';
import type {
  Document,
  DocumentActivity,
  DocumentFilters,
  DocumentPayload
} from '@/types/documents';

interface DocumentsResponse {
  success: boolean;
  data: Document[];
  total?: number;
}

interface DocumentResponse {
  success: boolean;
  data: Document;
}

interface ActivityResponse {
  success: boolean;
  data: DocumentActivity[];
}

export const documentsApi = {
  async listDocuments(filters?: DocumentFilters) {
    const response = await httpClient.get<DocumentsResponse>('/documents', {
      params: filters
    });
    return response.data;
  },

  async getDocument(id: number | string) {
    const response = await httpClient.get<DocumentResponse>(`/documents/${id}`);
    return response.data;
  },

  async createDocument(payload: DocumentPayload) {
    const response = await httpClient.post<DocumentResponse>(
      '/documents',
      payload
    );
    return response.data;
  },

  async updateDocument(id: number | string, payload: Partial<DocumentPayload>) {
    const response = await httpClient.put<DocumentResponse>(
      `/documents/${id}`,
      payload
    );
    return response.data;
  },

  async deleteDocument(id: number | string) {
    await httpClient.delete(`/documents/${id}`);
  },

  async getActivityLog(id: number | string) {
    const response = await httpClient.get<ActivityResponse>(
      `/documents/${id}/activity`
    );
    return response.data;
  },

  async sendForSignature(
    id: number | string,
    payload: { recipient_email: string; recipient_name: string; message?: string }
  ) {
    const response = await httpClient.post<DocumentResponse>(
      `/documents/${id}/send-embedded-sign`,
      payload
    );
    return response.data;
  },

  async registerSignature(
    id: number | string,
    payload: {
      signer_email: string;
      signer_name: string;
      signature_hash: string;
      ip_address?: string;
      device_info?: Record<string, unknown>;
      verification_code?: string;
      signing_method?: string;
      provider_envelope_id?: string;
    }
  ) {
    const response = await httpClient.post<DocumentResponse>(
      `/documents/${id}/sign`,
      payload
    );
    return response.data;
  },

  async sendOffer(
    id: number | string,
    payload: { recipient_email: string; recipient_name: string; message?: string }
  ) {
    const response = await httpClient.post<DocumentResponse>(
      `/documents/${id}/send-offer`,
      payload
    );
    return response.data;
  },

  async approveOffer(
    id: number | string,
    payload: { token: string; signer_name: string; signer_email: string }
  ) {
    const response = await httpClient.post<DocumentResponse>(
      `/documents/${id}/approve-offer`,
      payload
    );
    return response.data;
  },
  async sendForHelloSign(
    id: number | string,
    payload: { recipient_email: string; recipient_name: string }
  ) {
    const response = await httpClient.post<{
      success: boolean;
      data: {
        embedded_sign_url: string;
        signature_request_id: string;
        document_id: number;
      };
    }>(`/documents/${id}/send-dropbox-sign`, payload);
    return response.data;
  },

  async getHelloSignEmbeddedUrl(id: number | string) {
    const response = await httpClient.get<{
      success: boolean;
      data: {
        embedded_sign_url: string;
        signature_request_id: string;
      };
    }>(`/documents/${id}/hellosign-sign-url`);
    return response.data;
  },

  async uploadFileToDocument(
    id: number | string,
    file: File
  ) {
    const formData = new FormData();
    formData.append('file', file);

    // Use the Next.js API proxy route so we reuse auth + backend URL logic
    const response = await fetch(`/api/documents/${id}/upload-file`, {
      method: 'POST',
      // Don't set Content-Type - browser will set it with boundary
      body: formData
    });

    if (!response.ok) {
      let errorMessage = 'Failed to upload file';
      try {
        const errorData = await response.json();
        errorMessage =
          errorData?.message ||
          errorData?.error ||
          errorMessage;
      } catch {
        // ignore JSON parse errors – fall back to generic message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async revokeDocument(id: number | string, reason?: string) {
    const response = await httpClient.post<DocumentResponse>(
      `/documents/${id}/revoke`,
      { reason }
    );
    return response.data;
  },

  async resendForSigning(
    id: number | string,
    payload: { recipient_email: string; recipient_name: string; message?: string }
  ) {
    const response = await httpClient.post<DocumentResponse>(
      `/documents/${id}/resend`,
      payload
    );
    return response.data;
  }
};


