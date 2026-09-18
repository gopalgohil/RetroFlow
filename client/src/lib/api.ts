/**
 * @file api.ts
 * @description Universal API Client for RetroFlow Frontend.
 * Centralizes Base URL, headers, authentication tokens, request/response logging, and error handling.
 */

// Base API URL from environment variable or local backend default
// Automatically normalizes URL to include /api even if user omits it in deployment settings
const rawBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
const BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;


/**
 * Standard API Endpoints Registry (Ensures type-safety & zero typos)
 */
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

/**
 * Single-flight in-flight request deduplication map for GET requests.
 * Prevents identical simultaneous API requests from firing multiple times over the network.
 */
const inFlightGetRequests = new Map<string, Promise<any>>();

/**
 * Core Universal Request Handler
 */
async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, token, headers, ...customConfig } = options;

  // Build complete URL with optional query parameters
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

  // Retrieve JWT auth token and user context from localStorage if in browser environment
  let authToken = token || null;
  let userEmail: string | null = null;
  let userRole: string | null = null;

  if (typeof window !== 'undefined') {
    if (!authToken) {
      authToken = localStorage.getItem('retroflow_token');
    }
    try {
      const savedUser = localStorage.getItem('retroflow_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        userEmail = u.email || null;
        const isAdmin =
          u.role === 'admin' ||
          u.email === 'gopalgohel249@gmail.com' ||
          (u.email && u.email.toLowerCase().includes('admin'));
        userRole = isAdmin ? 'admin' : (u.role || 'member');
      }
    } catch {}
  }

  const method = (customConfig.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Coalesce identical simultaneous GET requests to eliminate duplicate network traffic
  const dedupKey = isGet ? `${url}::${authToken || ''}` : null;
  if (dedupKey && inFlightGetRequests.has(dedupKey)) {
    return inFlightGetRequests.get(dedupKey)!;
  }

  const executeRequest = async (): Promise<T> => {
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(userEmail ? { 'x-user-email': userEmail } : {}),
      ...(userRole ? { 'x-user-role': userRole } : {}),
      ...headers,
    };

    const config: RequestInit = {
      cache: 'no-store',
      ...customConfig,
      headers: defaultHeaders,
    };

    const isDev = process.env.NODE_ENV !== 'production';

    // 1. Log outgoing request in development console with full payload for network observability
    if (isDev) {
      console.groupCollapsed(
        `%c🚀 [API Call] ${method} ${endpoint}`,
        'color: #6366f1; font-weight: bold;'
      );
      console.log('📍 Full URL:', url);
      console.log('👤 Request User Context:', { email: userEmail, role: userRole });
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

      // 2. Log response in development console
      if (isDev) {
        const statusColor = response.ok ? '#10b981' : '#f43f5e';
        console.groupCollapsed(
          `%c${response.ok ? '✅' : '❌'} [API Response] ${response.status} (${duration}ms) ${endpoint}`,
          `color: ${statusColor}; font-weight: bold;`
        );
        console.log('📦 Response Data:', data);
        console.groupEnd();
      }

      // 3. Handle Unauthorized (401) sessions
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
          if (
            window.location.pathname !== '/login' &&
            window.location.pathname !== '/signup' &&
            window.location.pathname !== '/'
          ) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
        }
      }

      // 4. Unified error handling
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

/**
 * Universal API Client Object
 */
export const api = {
  /**
   * HTTP GET Request with automatic request coalescing
   */
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'GET',
      params: options?.params,
    }),

  /**
   * HTTP POST Request
   */
  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * HTTP PUT Request
   */
  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * HTTP PATCH Request
   */
  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /**
   * HTTP DELETE Request
   */
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
