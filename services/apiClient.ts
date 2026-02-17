const TOKEN_KEY = 'idn_token';

let unauthorizedHandler: (() => void) | null = null;

const getBaseUrl = (): string => {
  const value = import.meta.env.VITE_API_BASE_URL;
  return typeof value === 'string' ? value : '';
};

const getAuthToken = (): string | null => localStorage.getItem(TOKEN_KEY);

const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

type RequestOptions = Omit<RequestInit, 'headers' | 'body'> & {
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    clearAuthToken();
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const payload = await response.json();
      message = payload?.message ?? payload?.error ?? message;
    } catch {
      // ignore json parse errors for non-json responses
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  request,
  get: <T>(path: string, options: Omit<RequestOptions, 'body'> = {}) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'body'> = {}) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'body'> = {}) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options: Omit<RequestOptions, 'body'> = {}) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  setUnauthorizedHandler,
  TOKEN_KEY,
};

