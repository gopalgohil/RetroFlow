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
  params?: Record<string, string | number | boolean | undefined | null>;
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
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryStr = searchParams.toString();
    if (queryStr) url += `?${queryStr}`;
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

  const isAuthEndpoint = endpoint.includes('/auth/');
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken && !isAuthEndpoint ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(userEmail && !isAuthEndpoint ? { 'x-user-email': userEmail } : {}),
    ...(userRole && !isAuthEndpoint ? { 'x-user-role': userRole } : {}),
    ...headers,
  };

  const config: RequestInit = {
    ...customConfig,
    headers: defaultHeaders,
  };

  const isDev = process.env.NODE_ENV !== 'production';

  // 1. Log outgoing request in development console with full payload for network observability
  if (isDev) {
    const method = (config.method || 'GET').toUpperCase();
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
