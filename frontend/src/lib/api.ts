const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
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

export async function apiClient(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const { skipAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}/v1${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}/v1${endpoint}`, {
        ...fetchOptions,
        headers,
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    const err = new Error(error.message || `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }

  return res.json();
}

export const api = {
  get: (endpoint: string, opts?: FetchOptions) => apiClient(endpoint, { ...opts, method: 'GET' }),
  post: (endpoint: string, body: any, opts?: FetchOptions) =>
    apiClient(endpoint, { ...opts, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any, opts?: FetchOptions) =>
    apiClient(endpoint, { ...opts, method: 'PATCH', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any, opts?: FetchOptions) =>
    apiClient(endpoint, { ...opts, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string, opts?: FetchOptions) => apiClient(endpoint, { ...opts, method: 'DELETE' }),
};
