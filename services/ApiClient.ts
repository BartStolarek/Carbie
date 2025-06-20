// services/ApiClient.ts
import { Platform } from 'react-native';

const API_BASE_URL = 'https://bartstolarek.com';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  isNetworkError?: boolean;
  isServerError?: boolean;
  isClientError?: boolean;
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  customErrorMessage?: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private getStoredToken(): string | null {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('auth_token');
      }
      // For native, we'd need to make this async, but for now we'll rely on setToken
      return this.token;
    } catch {
      return null;
    }
  }

  private getErrorMessage(status: number, endpoint: string, responseData?: any): string {
    switch (status) {
      case 400:
        if (responseData?.detail) {
          if (Array.isArray(responseData.detail)) {
            return responseData.detail.map((err: any) => err.msg || err).join(', ');
          }
          return responseData.detail;
        }
        return 'Bad request - please check your input';
      
      case 401:
        return 'Authentication failed - please login again';
      
      case 403:
        return 'Access forbidden - insufficient permissions';
      
      case 404:
        return `Endpoint not found: (BASE URL: ${API_BASE_URL} Endpoint: ${endpoint}. This might be a client-side bug.`;
      
      case 409:
        return 'Conflict - this action cannot be completed (possibly duplicate data)';
      
      case 422:
        if (responseData?.detail) {
          if (Array.isArray(responseData.detail)) {
            return responseData.detail.map((err: any) => err.msg || err).join(', ');
          }
          return responseData.detail;
        }
        return 'Validation error - please check your input';
      
      case 429:
        return 'Too many requests - please wait a moment and try again';
      
      case 500:
        return 'Server error - please try again later';
      
      case 502:
        return 'Service temporarily unavailable';
      
      case 503:
        return 'Service unavailable - please try again later';
      
      case 504:
        return 'Request timeout - the server took too long to respond';
      
      default:
        if (status >= 500) {
          return `Server error (${status}) - please try again later`;
        } else if (status >= 400) {
          return `Client error (${status}) - please check your request`;
        }
        return `Unexpected response (${status})`;
    }
  }

  async request<T = any>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, customErrorMessage, ...fetchOptions } = options;
    
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string> || {}),
    };

    // Add authentication if not skipped
    if (!skipAuth) {
      const token = this.getStoredToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    console.log(`🌐 API Request: ${fetchOptions.method || 'GET'} ${endpoint}`);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      console.log(`📡 API Response: ${response.status} ${response.statusText} for ${endpoint}`);

      let responseData: any = null;
      const contentType = response.headers.get('content-type');
      
      // Try to parse response body
      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          if (text) {
            responseData = { message: text };
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse response body:', parseError);
      }

      if (response.ok) {
        return {
          success: true,
          data: responseData,
          statusCode: response.status,
        };
      } else {
        const errorMessage = customErrorMessage || this.getErrorMessage(response.status, endpoint, responseData);
        
        console.error(`❌ API Error ${response.status}:`, {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          responseData,
          errorMessage,
        });

        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
          isClientError: response.status >= 400 && response.status < 500,
          isServerError: response.status >= 500,
        };
      }
    } catch (networkError) {
      console.error('🔥 Network Error:', {
        endpoint,
        error: networkError,
        message: (networkError as Error).message,
      });

      let errorMessage = 'Network error - please check your internet connection';
      
      if ((networkError as Error).message.includes('CONNECTION_REFUSED')) {
        errorMessage = 'Cannot connect to server - make sure the API is running on localhost:8000';
      } else if ((networkError as Error).message.includes('fetch')) {
        errorMessage = 'Failed to connect to server - please check your internet connection';
      }

      return {
        success: false,
        error: customErrorMessage || errorMessage,
        isNetworkError: true,
      };
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();