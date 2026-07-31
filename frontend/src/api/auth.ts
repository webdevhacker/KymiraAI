import { apiClient } from './client';
import type { User, AuthState } from '../types';

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  tempToken?: string;
  requires2FA?: boolean;
  user?: User;
  message?: string;
}

export const authApi = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', { name, email, password });
    return data;
  },

  verifyEmail: async (email: string, otp: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/verify-email', { email, otp });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  verify2FA: async (tempToken: string, code: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/verify-2fa', { tempToken, code });
    return data;
  },

  requestFallback2FA: async (tempToken: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post('/auth/fallback-2fa', { tempToken });
    return data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return data.user;
  },
};
