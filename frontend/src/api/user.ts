import { apiClient } from './client';
import type { User, Session, Memory } from '../types';

export const userApi = {
  getProfile: async (): Promise<{ user: User; sessions: Session[]; memory: Memory | null }> => {
    const { data } = await apiClient.get('/user/profile');
    return data;
  },

  updateProfile: async (updates: { name?: string }): Promise<{ user: User }> => {
    const { data } = await apiClient.put('/user/profile', updates);
    return data;
  },

  requestPasswordChange: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/user/profile/password/request');
    return data;
  },

  verifyPasswordChange: async (otp: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/user/profile/password/verify', { otp, newPassword });
    return data;
  },

  acceptTerms: async (): Promise<void> => {
    await apiClient.post('/user/accept-terms');
  },

  revokeSession: async (tokenId: string): Promise<{ sessions: Session[] }> => {
    const { data } = await apiClient.delete(`/user/sessions/${tokenId}`);
    return data;
  },

  generate2FA: async (): Promise<{ secret: string; qrCodeUrl: string }> => {
    const { data } = await apiClient.post('/user/2fa/generate');
    return data;
  },

  verifyAndEnable2FA: async (code: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/user/2fa/verify', { code });
    return data;
  },

  disable2FA: async (code: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/user/2fa/disable', { code });
    return data;
  },

  requestDeleteAccount: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/user/delete-request');
    return data;
  },

  verifyDeleteAccount: async (otp: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/user/delete-verify', { otp });
    return data;
  }
};
