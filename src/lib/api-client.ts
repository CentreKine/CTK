/**
 * Unified API Client
 * Handles all communication with backend (Python FastAPI)
 * Features: retry logic, error handling, offline detection
 */

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/$/, '');
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

interface ApiResponse<T = any> {
  data: T | null;
  error: any | null;
  status?: number;
}

// Retry with exponential backoff
async function retryFetch(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryFetch(url, options, retries - 1);
    }
    throw error;
  }
}

export const apiClient = {
  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await retryFetch(url.toString());

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        return { data: null, error, status: response.status };
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (error) {
      console.error(`[API GET] ${endpoint}:`, error);
      return { data: null, error: { message: error instanceof Error ? error.message : 'Network error' } };
    }
  },

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, payload?: any): Promise<ApiResponse<T>> {
    try {
      const response = await retryFetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        return { data: null, error, status: response.status };
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (error) {
      console.error(`[API POST] ${endpoint}:`, error);
      return { data: null, error: { message: error instanceof Error ? error.message : 'Network error' } };
    }
  },

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, payload?: any): Promise<ApiResponse<T>> {
    try {
      const response = await retryFetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        body: JSON.stringify(payload || {}),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        return { data: null, error, status: response.status };
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (error) {
      console.error(`[API PUT] ${endpoint}:`, error);
      return { data: null, error: { message: error instanceof Error ? error.message : 'Network error' } };
    }
  },

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await retryFetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        return { data: null, error, status: response.status };
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (error) {
      console.error(`[API DELETE] ${endpoint}:`, error);
      return { data: null, error: { message: error instanceof Error ? error.message : 'Network error' } };
    }
  },

  /**
   * Check if backend is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE.replace('/api', '')}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};

/**
 * Supabase-like wrapper for backward compatibility
 */
export const supabase = {
  from: (table: string) => {
    const state = { filters: {}, order: undefined, limit: undefined, pendingOp: null, payload: null };

    async function executeSelect() {
      const params: Record<string, any> = { ...state.filters };
      if (state.order) params.order = state.order;
      if (state.limit) params.limit = state.limit;

      const result = await apiClient.get(`/${table}`, params);
      return { data: result.data, error: result.error };
    }

    return {
      select(cols: string) {
        return this;
      },
      order(field: string, opts = { ascending: false }) {
        state.order = `${field}:${opts.ascending ? 'asc' : 'desc'}`;
        return executeSelect();
      },
      limit(n: number) {
        state.limit = n;
        return executeSelect();
      },
      eq(field: string, value: any) {
        if (state.pendingOp === 'update') {
          return apiClient.put(`/${table}/${value}`, state.payload).then(r => ({ data: r.data ? [r.data] : null, error: r.error }));
        }
        if (state.pendingOp === 'delete') {
          return apiClient.delete(`/${table}/${value}`).then(r => ({ data: r.data, error: r.error }));
        }
        state.filters[field] = value;
        return this;
      },
      insert(payload: any) {
        return apiClient.post(`/${table}`, payload).then(r => ({ data: r.data ? [r.data] : null, error: r.error }));
      },
      update(payload: any) {
        state.pendingOp = 'update';
        state.payload = payload;
        return this;
      },
      delete() {
        state.pendingOp = 'delete';
        return this;
      },
    };
  },
};

export const supabaseUrl = API_BASE;
export const supabaseAnonKey = 'local-api-key';

export default apiClient;
