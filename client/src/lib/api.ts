
const rawBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
const BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_OTP: '/auth/resend-verification-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE: '/auth/google',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  HEALTH: '/health',
  RETROS: '/retros',
  RETRO_ANALYTICS: '/retros/analytics',
  MEMBERS: '/members',
  SETTINGS: '/settings',
  PROJECTS: '/projects',
} as const;

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  token?: string;
}

const inFlightGetRequests = new Map<string, Promise<any>>();

async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, token, headers, ...customConfig } = options;

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryStr = searchParams.toString();
    if (queryStr) {
      url += url.includes('?') ? `&${queryStr}` : `?${queryStr}`;
    }
  }

  let authToken = token || null;

  if (typeof window !== 'undefined') {
    if (!authToken) {
      authToken = localStorage.getItem('retroflow_token');
    }
  }

  const method = (customConfig.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  const dedupKey = isGet ? `${url}::${authToken || ''}` : null;
  if (dedupKey && inFlightGetRequests.has(dedupKey)) {
    return inFlightGetRequests.get(dedupKey)!;
  }

  const executeRequest = async (): Promise<T> => {
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    };

    const config: RequestInit = {
      cache: 'no-store',
      ...customConfig,
      headers: defaultHeaders,
    };

    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
      console.groupCollapsed(
        `%c🚀 [API Call] ${method} ${endpoint}`,
        'color: #6366f1; font-weight: bold;'
      );
      console.log('📍 Full URL:', url);
      if (config.body) {
        try {
          console.log('📦 JSON Payload:', JSON.parse(config.body as string));
        } catch {
          console.log('📦 Payload:', config.body);
        }
      }
      console.groupEnd();
    }

    try {
      const startTime = performance.now();
      const response = await fetch(url, config);
      const duration = Math.round(performance.now() - startTime);

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (isDev) {
        const statusColor = response.ok ? '#10b981' : '#f43f5e';
        console.groupCollapsed(
          `%c${response.ok ? '✅' : '❌'} [API Response] ${response.status} (${duration}ms) ${endpoint}`,
          `color: ${statusColor}; font-weight: bold;`
        );
        console.log('📦 Response Data:', data);
        console.groupEnd();
      }

      if (response.status === 401 && typeof window !== 'undefined') {
        const isAuthRoute =
          endpoint.includes('/auth/login') ||
          endpoint.includes('/auth/register') ||
          endpoint.includes('/auth/forgot-password') ||
          endpoint.includes('/auth/reset-password') ||
          endpoint.includes('/auth/verify-email');

        if (!isAuthRoute && !window.location.pathname.includes('/retro/')) {
          console.warn('[API] 401 Unauthorized detected. Clearing session.');
          localStorage.removeItem('retroflow_token');
          localStorage.removeItem('retroflow_user');
          localStorage.removeItem('retroflow_cached_active_project');
          localStorage.removeItem('retroflow_active_project_id');
          localStorage.removeItem('retroflow_cached_projects_list');
          if (
            window.location.pathname !== '/login' &&
            window.location.pathname !== '/signup' &&
            window.location.pathname !== '/'
          ) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
        }
      }

      if (!response.ok) {
        const errorMessage =
          (data && typeof data === 'object' && (data.message || data.error)) ||
          `Request failed with status ${response.status}`;

        const customError = new Error(errorMessage) as any;
        customError.status = response.status;
        customError.response = { status: response.status, data };
        throw customError;
      }

      return data as T;
    } catch (error: any) {
      const isAbort =
        Boolean(customConfig?.signal?.aborted) ||
        Boolean(options?.signal?.aborted) ||
        error?.name === 'AbortError' ||
        error?.name === 'CanceledError' ||
        error?.code === 20 ||
        error?.code === 'ERR_CANCELED' ||
        (typeof error === 'string' &&
          (error.toLowerCase().includes('abort') ||
            error.toLowerCase().includes('cancel') ||
            error.toLowerCase().includes('unmount') ||
            error.toLowerCase().includes('request triggered'))) ||
        (error?.message &&
          (String(error.message).toLowerCase().includes('aborted') ||
            String(error.message).toLowerCase().includes('canceled') ||
            String(error.message).toLowerCase().includes('cancelled') ||
            String(error.message).toLowerCase().includes('unmount')));

      if (isAbort) {
        throw error;
      }

      if (isDev) {
        const errorMsg =
          error?.message ||
          (typeof error === 'string' ? error : null) ||
          (typeof error?.data?.message === 'string' ? error.data.message : null) ||
          'Unknown network error';
        console.error(`❌ [API Error] ${endpoint}:`, errorMsg);
      }
      throw error;
    }
  };

  if (dedupKey) {
    const inFlightPromise = executeRequest().finally(() => {
      inFlightGetRequests.delete(dedupKey);
    });
    inFlightGetRequests.set(dedupKey, inFlightPromise);
    return inFlightPromise;
  }

  return executeRequest();
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'GET',
      params: options?.params,
    }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
