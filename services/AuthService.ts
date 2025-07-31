// services/AuthService.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from './ApiClient';
import { loggingService } from './LoggingService';

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  system: string;
  user_type: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  // Get token from secure storage
  async getToken(): Promise<string | null> {
    const methodName = 'getToken';
    loggingService.debug(`${methodName}: Starting token retrieval`);
    
    if (this.token) {
      loggingService.debug(`${methodName}: Returning cached token`, { hasToken: !!this.token });
      return this.token;
    }

    try {
      loggingService.debug(`${methodName}: Retrieving token from secure storage`, { platform: Platform.OS });
      
      if (Platform.OS === 'web') {
        this.token = localStorage.getItem('auth_token');
        loggingService.debug(`${methodName}: Retrieved token from localStorage`, { hasToken: !!this.token });
      } else {
        this.token = await SecureStore.getItemAsync('auth_token');
        loggingService.debug(`${methodName}: Retrieved token from SecureStore`, { hasToken: !!this.token });
      }
      
      // Update API client with token
      apiClient.setToken(this.token);
      loggingService.info(`${methodName}: Token retrieved and API client updated`, { hasToken: !!this.token });
      return this.token;
    } catch (error) {
      loggingService.error(`${methodName}: Error getting token`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  // Store token securely
  async setToken(token: string): Promise<void> {
    const methodName = 'setToken';
    loggingService.info(`${methodName}: Setting new token`, { hasToken: !!token, tokenLength: token?.length });
    
    this.token = token;
    apiClient.setToken(token); // Update API client
    
    try {
      loggingService.debug(`${methodName}: Storing token in secure storage`, { platform: Platform.OS });
      
      if (Platform.OS === 'web') {
        localStorage.setItem('auth_token', token);
        loggingService.debug(`${methodName}: Token stored in localStorage`);
      } else {
        await SecureStore.setItemAsync('auth_token', token);
        loggingService.debug(`${methodName}: Token stored in SecureStore`);
      }
      
      loggingService.info(`${methodName}: Token stored successfully`);
    } catch (error) {
      loggingService.error(`${methodName}: Error storing token`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  // Remove token
  async removeToken(): Promise<void> {
    const methodName = 'removeToken';
    loggingService.info(`${methodName}: Removing token and clearing user data`);
    
    this.token = null;
    this.user = null;
    apiClient.setToken(null); // Update API client
    
    try {
      loggingService.debug(`${methodName}: Removing token from secure storage`, { platform: Platform.OS });
      
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
        loggingService.debug(`${methodName}: Token removed from localStorage`);
      } else {
        await SecureStore.deleteItemAsync('auth_token');
        loggingService.debug(`${methodName}: Token removed from SecureStore`);
      }
      
      loggingService.info(`${methodName}: Token removed successfully`);
    } catch (error) {
      loggingService.error(`${methodName}: Error removing token`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const methodName = 'isAuthenticated';
    loggingService.debug(`${methodName}: Starting authentication check`);
    
    const token = await this.getToken();
    if (!token) {
      loggingService.warn(`${methodName}: No token found, user not authenticated`);
      return false;
    }

    loggingService.debug(`${methodName}: Token found, validating with backend`);
    
    // Validate token with backend
    const response = await apiClient.post('/api/v1/token/verify', { token }, { skipAuth: true });
    
    loggingService.info(`${methodName}: Token validation response`, { 
      success: response.success, 
      statusCode: response.statusCode,
      hasError: !!response.error 
    });
    
    if (!response.success) {
      loggingService.warn(`${methodName}: Token validation failed`, { 
        error: response.error,
        statusCode: response.statusCode 
      });
      
      // If token is invalid, clean it up
      if (response.statusCode === 401 || response.statusCode === 422) {
        loggingService.info(`${methodName}: Invalid token detected, cleaning up`);
        await this.removeToken();
      }
      return false;
    }

    loggingService.info(`${methodName}: Token validation successful, user is authenticated`);
    return true;
  }

  // Get current user info
  async getCurrentUser(): Promise<User | null> {
    const methodName = 'getCurrentUser';
    loggingService.debug(`${methodName}: Starting user info retrieval`);
    
    if (this.user) {
      loggingService.debug(`${methodName}: Returning cached user`, { 
        userId: this.user.id,
        userEmail: this.user.email 
      });
      return this.user;
    }

    const token = await this.getToken();
    if (!token) {
      loggingService.warn(`${methodName}: No token available, cannot get user info`);
      return null;
    }

    loggingService.debug(`${methodName}: Fetching user info from API`);
    const response = await apiClient.get<User>('/api/v1/user/me');
    
    loggingService.info(`${methodName}: User info API response`, { 
      success: response.success, 
      statusCode: response.statusCode,
      hasUser: !!response.data,
      hasError: !!response.error 
    });
    
    if (response.success && response.data) {
      this.user = response.data;
      loggingService.info(`${methodName}: User info retrieved successfully`, { 
        userId: this.user.id,
        userEmail: this.user.email,
        isAdmin: this.user.is_admin,
        isActive: this.user.is_active
      });
      return this.user;
    } else {
      loggingService.error(`${methodName}: Error getting current user`, { 
        error: response.error,
        statusCode: response.statusCode 
      });
      return null;
    }
  }

  // Check if current user is admin
  async isAdmin(): Promise<boolean> {
    const methodName = 'isAdmin';
    loggingService.debug(`${methodName}: Checking admin status`);
    
    const user = await this.getCurrentUser();
    const isAdmin = user?.is_admin || false;
    
    loggingService.info(`${methodName}: Admin check result`, { 
      isAdmin,
      userId: user?.id,
      hasUser: !!user 
    });
    
    return isAdmin;
  }

  // Login
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const methodName = 'login';
    loggingService.info(`${methodName}: Starting login process`, { 
      email: email.toLowerCase().trim(),
      hasPassword: !!password 
    });
    
    const response = await apiClient.post<LoginResponse>(
      '/api/v1/token/login',
      {
        email: email.toLowerCase().trim(),
        password: password,
      },
      { skipAuth: true }
    );

    loggingService.info(`${methodName}: Login API response`, { 
      success: response.success, 
      statusCode: response.statusCode,
      hasToken: !!response.data?.access_token,
      hasError: !!response.error 
    });

    if (response.success && response.data) {
      loggingService.info(`${methodName}: Login successful, setting token`);
      await this.setToken(response.data.access_token);
      
      // Get user info after login
      loggingService.debug(`${methodName}: Fetching user info after login`);
      const user = await this.getCurrentUser();
      
      // Set RevenueCat user ID if user was retrieved successfully
      if (user) {
        loggingService.debug(`${methodName}: Setting RevenueCat user ID`, { userId: user.id });
        try {
          const Purchases = require('react-native-purchases').default;
          await Purchases.logIn(user.id.toString());
          loggingService.info(`${methodName}: RevenueCat user ID set successfully`, { userId: user.id });
        } catch (error) {
          loggingService.error(`${methodName}: Error setting RevenueCat user ID`, { 
            userId: user.id,
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      } else {
        loggingService.warn(`${methodName}: Could not get user info after login`);
      }
      
      loggingService.info(`${methodName}: Login process completed successfully`);
      return { success: true };
    } else {
      loggingService.error(`${methodName}: Login failed`, { 
        error: response.error,
        statusCode: response.statusCode 
      });
      return { 
        success: false, 
        error: response.error || 'Login failed. Please try again.' 
      };
    }
  }

  // Register
  async register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const methodName = 'register';
    loggingService.info(`${methodName}: Starting registration process`, { 
      email: email.toLowerCase().trim(),
      hasPassword: !!password 
    });
    
    const response = await apiClient.post<User>(
      '/api/v1/user/',
      {
        email: email.toLowerCase().trim(),
        password: password,
        system: 'carbie',
        user_type: 'trial',
      },
      { skipAuth: true }
    );

    loggingService.info(`${methodName}: Registration API response`, { 
      success: response.success, 
      statusCode: response.statusCode,
      hasUser: !!response.data,
      hasError: !!response.error 
    });

    if (response.success) {
      loggingService.info(`${methodName}: Registration successful, proceeding to login`);
      // After successful registration, log the user in
      return await this.login(email, password);
    } else {
      // Log the full error for debugging
      loggingService.error(`${methodName}: Registration failed`, {
        error: response.error,
        statusCode: response.statusCode,
        requestBody: {
          email: email.toLowerCase().trim(),
          password: '[REDACTED]',
          system: 'carbie',
          user_type: 'trial',
        }
      });

      return { 
        success: false, 
        error: response.error || 'Registration failed. Please try again.' 
      };
    }
  }

  // Logout
  async logout(): Promise<void> {
    const methodName = 'logout';
    loggingService.info(`${methodName}: Starting logout process`);
    
    // Logout from RevenueCat
    try {
      loggingService.debug(`${methodName}: Logging out from RevenueCat`);
      const Purchases = require('react-native-purchases').default;
      await Purchases.logOut();
      loggingService.info(`${methodName}: Successfully logged out from RevenueCat`);
    } catch (error) {
      loggingService.error(`${methodName}: Error logging out from RevenueCat`, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    loggingService.debug(`${methodName}: Removing local token and user data`);
    await this.removeToken();
    loggingService.info(`${methodName}: Logout process completed`);
  }

  // Make authenticated API request (legacy method, prefer using apiClient directly)
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const methodName = 'makeAuthenticatedRequest';
    loggingService.debug(`${methodName}: Making authenticated request`, { 
      url,
      method: options.method || 'GET',
      hasHeaders: !!options.headers 
    });
    
    const token = await this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      loggingService.debug(`${methodName}: Added authorization header`);
    } else {
      loggingService.warn(`${methodName}: No token available for authenticated request`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      loggingService.info(`${methodName}: Request completed`, { 
        status: response.status,
        statusText: response.statusText,
        url 
      });
      
      return response;
    } catch (error) {
      loggingService.error(`${methodName}: Request failed`, { 
        url,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();