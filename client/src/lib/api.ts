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
    ME: '/auth/me',
  },
  HEALTH: '/health',
  RETROS: '/retros',
  MEMBERS: '/members',
  SETTINGS: '/settings',
  PROJECTS: '/projects',
} as const;

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  token?: string;
}

/**
 * Core Universal Request Handler
 */
async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, token, headers, ...customConfig } = options;

  // Build complete URL with optional query parameters
  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => searchParams.append(key, String(val)));
    url += `?${searchParams.toString()}`;
  }

  // Retrieve JWT auth token from localStorage if in browser environment
  const authToken =
    token || (typeof window !== 'undefined' ? localStorage.getItem('retroflow_token') : null);

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...headers,
  };

  const config: RequestInit = {
    ...customConfig,
    headers: defaultHeaders,
  };

  const isDev = process.env.NODE_ENV !== 'production';

  // 1. Log outgoing request in development console
  if (isDev) {
    const method = (config.method || 'GET').toUpperCase();
    console.groupCollapsed(`%c🚀 [API Call] ${method} ${endpoint}`, 'color: #6366f1; font-weight: bold;');
    console.log('URL:', url);
    if (config.body) {
      try {
        console.log('📦 Payload:', JSON.parse(config.body as string));
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
      console.log('Status:', response.status);
      console.log('Response Body:', data);
      console.groupEnd();
    }

    // 3. Handle HTTP Errors uniformly
    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && data !== null && (data.message || data.error)) ||
        `Request failed with status ${response.status}`;

      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err: any) {
    if (isDev) {
      console.error(`❌ [API Error] ${endpoint}:`, err.message);
    }
    throw err;
  }
}

/**
 * Universal API Client Object
 */
export const api = {
  /**
   * HTTP GET Request
   */
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

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
