import { httpClient } from './httpClient';
import type { InvoicePayload } from '@/types/documents';

interface InvoiceListResponse<T = any> {
  success: boolean;
  data: T;
}

interface InvoiceResponse<T = any> {
  success: boolean;
  data: T;
}

export const invoicesApi = {
  async listInvoices(params?: Record<string, string | number>) {
    const response = await httpClient.get<InvoiceListResponse>(
      '/invoices',
      {
        params
      }
    );
    return response.data;
  },

  async getInvoice(id: number | string) {
    const response = await httpClient.get<InvoiceResponse>(`/invoices/${id}`);
    return response.data;
  },

  async createInvoice(payload: InvoicePayload) {
    const response = await httpClient.post<InvoiceResponse>(
      '/invoices',
      payload
    );
    return response.data;
  },

  async updateInvoice(
    id: number | string,
    payload: Partial<InvoicePayload> & { status?: string }
  ) {
    const response = await httpClient.patch<InvoiceResponse>(
      `/invoices/${id}`,
      payload
    );
    return response.data;
  },

  async deleteInvoice(id: number | string) {
    await httpClient.delete(`/invoices/${id}`);
  },

  async sendInvoice(id: number | string, payload: { recipient_email: string }) {
    const response = await httpClient.post<InvoiceResponse>(
      `/invoices/${id}/send`,
      payload
    );
    return response.data;
  },

  async createPaymentSession(id: number | string) {
    const response = await httpClient.post<{
      success: boolean;
      data: {
        checkout_url: string;
        session_id: string;
      };
    }>(`/invoices/${id}/pay`);
    return response.data;
  },

  async markAsPaid(id: number | string, payload?: { payment_method?: string; paid_date?: string }) {
    const response = await httpClient.post<InvoiceResponse>(
      `/invoices/${id}/mark-paid`,
      payload || {}
    );
    return response.data;
  }
};


