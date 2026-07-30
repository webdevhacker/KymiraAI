import axios from 'axios';

// Use Vite proxy in dev, direct URL in prod
const BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ──────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kymira_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Do not attempt to refresh if the request was to login
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('kymira_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });

        localStorage.setItem('kymira_access_token', data.accessToken);
        localStorage.setItem('kymira_refresh_token', data.refreshToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        localStorage.removeItem('kymira_access_token');
        localStorage.removeItem('kymira_refresh_token');
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('kymira_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
