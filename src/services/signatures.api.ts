import { httpClient } from './httpClient';

export const signaturesApi = {
  async requestOtp(payload: { email: string; documentId: number | string }) {
    const response = await httpClient.post<{
      success: boolean;
      message: string;
    }>('/signatures/send-otp', payload);
    return response.data;
  }
};


