import { httpClient } from './httpClient';
import type { Template, TemplatePayload } from '@/types/documents';

interface TemplatesResponse {
  success: boolean;
  data: Template[];
}

interface TemplateResponse {
  success: boolean;
  data: Template;
}

export const templatesApi = {
  async listTemplates(params?: { type?: string; is_active?: boolean }) {
    const response = await httpClient.get<TemplatesResponse>('/templates', {
      params
    });
    return response.data;
  },

  async getTemplate(id: number | string) {
    const response = await httpClient.get<TemplateResponse>(`/templates/${id}`);
    return response.data;
  },

  async createTemplate(payload: TemplatePayload) {
    const response = await httpClient.post<TemplateResponse>(
      '/templates',
      payload
    );
    return response.data;
  },

  async updateTemplate(id: number | string, payload: Partial<TemplatePayload>) {
    const response = await httpClient.put<TemplateResponse>(
      `/templates/${id}`,
      payload
    );
    return response.data;
  },

  async deleteTemplate(id: number | string) {
    await httpClient.delete(`/templates/${id}`);
  },

  async applyTemplate(
    id: number | string,
    variables: Record<string, string | number>
  ) {
    const response = await httpClient.post<{
      success: boolean;
      data: { content: string };
    }>(`/templates/${id}/apply`, { variables });
    return response.data;
  }
};


