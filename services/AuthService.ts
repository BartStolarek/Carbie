// services/AuthService.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from './ApiClient';

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
    if (this.token) return this.token;

    try {
      if (Platform.OS === 'web') {
        this.token = localStorage.getItem('auth_token');
      } else {
        this.token = await SecureStore.getItemAsync('auth_token');
      }
      
      // Update API client with token
      apiClient.setToken(this.token);
      return this.token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Store token securely
  async setToken(token: string): Promise<void> {
    this.token = token;
    apiClient.setToken(token); // Update API client
    
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('auth_token', token);
      } else {
        await SecureStore.setItemAsync('auth_token', token);
      }
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  // Remove token
  async removeToken(): Promise<void> {
    this.token = null;
    this.user = null;
    apiClient.setToken(null); // Update API client
    
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    // Validate token with backend
    const response = await apiClient.post('/api/v1/token/verify', { token }, { skipAuth: true });
    
    if (!response.success) {
      console.log('Token validation failed:', response.error);
      // If token is invalid, clean it up
      if (response.statusCode === 401 || response.statusCode === 422) {
        await this.removeToken();
      }
      return false;
    }

    return true;
  }

  // Get current user info
  async getCurrentUser(): Promise<User | null> {
    if (this.user) return this.user;

    const token = await this.getToken();
    if (!token) return null;

    const response = await apiClient.get<User>('/api/v1/user/me');
    
    if (response.success && response.data) {
      this.user = response.data;
      return this.user;
    } else {
      console.error('Error getting current user:', response.error);
      return null;
    }
  }

  // Check if current user is admin
  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.is_admin || false;
  }

  // Login
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post<LoginResponse>(
      '/api/v1/token/login',
      {
        email: email.toLowerCase().trim(),
        password: password,
      },
      { skipAuth: true }
    );

    if (response.success && response.data) {
      await this.setToken(response.data.access_token);
      // Get user info after login
      const user = await this.getCurrentUser();
      
      // Set RevenueCat user ID if user was retrieved successfully
      if (user) {
        try {
          const Purchases = require('react-native-purchases').default;
          await Purchases.logIn(user.id.toString());
          console.log('RevenueCat user ID set to:', user.id);
        } catch (error) {
          console.error('Error setting RevenueCat user ID:', error);
        }
      }
      
      return { success: true };
    } else {
      return { 
        success: false, 
        error: response.error || 'Login failed. Please try again.' 
      };
    }
  }

  // Register
  async register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
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

    if (response.success) {
      // After successful registration, log the user in
      return await this.login(email, password);
    } else {
      // Log the full error for debugging
      console.error('Registration failed:', {
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
    // Logout from RevenueCat
    try {
      const Purchases = require('react-native-purchases').default;
      await Purchases.logOut();
      console.log('Logged out from RevenueCat');
    } catch (error) {
      console.error('Error logging out from RevenueCat:', error);
    }
    
    await this.removeToken();
  }


  // Make authenticated API request (legacy method, prefer using apiClient directly)
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }
}

// Export singleton instance
export const authService = new AuthService();