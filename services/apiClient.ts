const TOKEN_KEY = 'idn_token';

let unauthorizedHandler: (() => void) | null = null;

const getBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (typeof configured === 'string' && configured.trim() !== '') {
    return configured.trim().replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { protocol, hostname, port, origin } = window.location;
  if (port === '5173') {
    return `${protocol}//${hostname}:8000`;
  }

  return origin.replace(/\/$/, '');
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

const isFormDataBody = (body: unknown): body is FormData =>
  typeof FormData !== 'undefined' && body instanceof FormData;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken();
  const formDataBody = isFormDataBody(options.body);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body !== undefined && !formDataBody ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
    body: options.body === undefined
      ? undefined
      : (formDataBody ? options.body : JSON.stringify(options.body)),
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
