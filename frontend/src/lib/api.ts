const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_TIMEOUT = 30000;

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  timeout?: number;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiClient<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const doFetch = async (): Promise<T> => {
    try {
      const res = await fetch(`${API_BASE}/v1${endpoint}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 401 && !skipAuth) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryRes = await fetch(`${API_BASE}/v1${endpoint}`, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
          });
          if (!retryRes.ok) {
            const retryError = await retryRes.json().catch(() => ({ message: 'Request failed' }));
            throw new ApiError(retryError.message || `HTTP ${retryRes.status}`, retryRes.status, retryError);
          }
          return retryRes.json();
        }
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new ApiError(error.message || `HTTP ${res.status}`, res.status, error);
      }

      return res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof ApiError) throw err;
      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out', 408);
      }
      throw new ApiError(err.message || 'Network error', 0);
    }
  };

  return doFetch();
}

export const api = {
  get: <T = any>(endpoint: string, opts?: FetchOptions) =>
    apiClient<T>(endpoint, { ...opts, method: 'GET' }),
  post: <T = any>(endpoint: string, body: any, opts?: FetchOptions) =>
    apiClient<T>(endpoint, { ...opts, method: 'POST', body: JSON.stringify(body) }),
  patch: <T = any>(endpoint: string, body: any, opts?: FetchOptions) =>
    apiClient<T>(endpoint, { ...opts, method: 'PATCH', body: JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body: any, opts?: FetchOptions) =>
    apiClient<T>(endpoint, { ...opts, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string, opts?: FetchOptions) =>
    apiClient<T>(endpoint, { ...opts, method: 'DELETE' }),
};
