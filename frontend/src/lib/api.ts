const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_TIMEOUT = 30000;
const COMPANY_CONTEXT_KEY = 'superAdminCompanyContext';
const SESSION_ACCESS_TOKEN_KEY = 'fsit.accessToken';
const SESSION_REFRESH_TOKEN_KEY = 'fsit.refreshToken';

export function unwrapResponseBody(body: any): any {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body && 'timestamp' in body) {
    return body.data;
  }
  return body;
}

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
  try {
    const refreshToken = getSessionRefreshToken();
    const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });

    if (!res.ok) {
      clearSessionTokens();
      return null;
    }

    const body = await res.json();
    const data = unwrapResponseBody(body);
    if (data.accessToken || data.refreshToken) {
      setSessionTokens(data);
    }
    return data.accessToken || getSessionAccessToken() || 'cookie';
  } catch {
    clearSessionTokens();
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
    const companyContext = getCompanyContextId();
    if (companyContext) headers['X-Company-Context'] = companyContext;
    const token = getSessionAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const doFetch = async (): Promise<T> => {
    try {
      const res = await fetch(`${API_BASE}/v1${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
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
            credentials: 'include',
            signal: controller.signal,
          });
          if (!retryRes.ok) {
            const retryError = await retryRes.json().catch(() => ({ message: 'Request failed' }));
            throw new ApiError(retryError.message || `HTTP ${retryRes.status}`, retryRes.status, retryError);
          }
          return unwrapResponseBody(await retryRes.json());
        }
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Request failed' }));
        if (res.status === 401 && !skipAuth) clearSessionTokens();
        throw new ApiError(error.message || `HTTP ${res.status}`, res.status, error);
      }

      return unwrapResponseBody(await res.json());
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

function getCompanyContextId(): string | null {
  try {
    const value = typeof window !== 'undefined' ? localStorage.getItem(COMPANY_CONTEXT_KEY) : null;
    if (!value) return null;
    const company = JSON.parse(value);
    return typeof company?.id === 'string' ? company.id : null;
  } catch {
    return null;
  }
}

function getSessionAccessToken(): string | null {
  try {
    return typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_ACCESS_TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

function getSessionRefreshToken(): string | null {
  try {
    return typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_REFRESH_TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

export function setSessionTokens(data: any) {
  if (typeof window === 'undefined') return;
  try {
    if (data?.accessToken) sessionStorage.setItem(SESSION_ACCESS_TOKEN_KEY, data.accessToken);
    if (data?.refreshToken) sessionStorage.setItem(SESSION_REFRESH_TOKEN_KEY, data.refreshToken);
  } catch {}
}

export function clearSessionTokens() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_REFRESH_TOKEN_KEY);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch {}
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
