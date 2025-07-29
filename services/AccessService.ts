// services/AccessService.ts
import { authService, User } from './AuthService';
import { loggingService } from './LoggingService';
import { REVENUECAT_CONFIG } from '../config/revenuecat';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

export interface AccessResult {
  hasAccess: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasSubscription: boolean;
  user: User | null;
  error?: string;
}

export interface PaywallResult {
  success: boolean;
  purchased: boolean;
  error?: string;
}

class AccessService {
  private currentUser: User | null = null;

  /**
   * Main access check function that handles everything automatically:
   * - Checks authentication and redirects to login if needed
   * - Checks admin status
   * - Checks subscription and presents paywall if needed
   */
  async checkAccess(navigation?: any): Promise<AccessResult> {
    try {
      loggingService.info('AccessService: Starting access check...');

      // Step 1: Check authentication
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        loggingService.warn('AccessService: User not authenticated, redirecting to login...');
        if (navigation) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        }
        return {
          hasAccess: false,
          isAuthenticated: false,
          isAdmin: false,
          hasSubscription: false,
          user: null,
          error: 'User not authenticated'
        };
      }

      // Step 2: Get current user
      const user = await authService.getCurrentUser();
      if (!user) {
        loggingService.warn('AccessService: Could not get user info');
        return {
          hasAccess: false,
          isAuthenticated: true,
          isAdmin: false,
          hasSubscription: false,
          user: null,
          error: 'Could not get user info'
        };
      }

      this.currentUser = user;
      loggingService.info('AccessService: User authenticated:', { id: user.id, isAdmin: user.is_admin });

      // Step 3: Check if user is admin
      if (user.is_admin) {
        loggingService.info('AccessService: User is admin, bypassing subscription check');
        return {
          hasAccess: true,
          isAuthenticated: true,
          isAdmin: true,
          hasSubscription: true, // Admins are considered to have subscription
          user: user
        };
      }

      // Step 4: Set RevenueCat user ID for non-admin users
      try {
        await Purchases.logIn(user.id.toString());
        loggingService.info('AccessService: RevenueCat user ID set to:', user.id);
      } catch (error) {
        loggingService.error('AccessService: Error setting RevenueCat user ID:', error);
      }

      // Step 5: Check subscription status for non-admin users
      const hasSubscription = await this.validateSubscription();
      
      if (hasSubscription) {
        return {
          hasAccess: true,
          isAuthenticated: true,
          isAdmin: false,
          hasSubscription: true,
          user: user
        };
      } else {
        // Step 6: Present paywall if no subscription
        loggingService.warn('AccessService: User does not have subscription, presenting paywall...');
        const paywallResult = await this.presentPaywall();
        
        if (paywallResult.purchased) {
          loggingService.info('AccessService: Purchase successful, re-checking access...');
          // Re-check access after successful purchase
          return await this.checkAccess(navigation);
        } else {
          return {
            hasAccess: false,
            isAuthenticated: true,
            isAdmin: false,
            hasSubscription: false,
            user: user,
            error: 'No active subscription'
          };
        }
      }

    } catch (error) {
      loggingService.error('AccessService: Error during access check:', error);
      return {
        hasAccess: false,
        isAuthenticated: false,
        isAdmin: false,
        hasSubscription: false,
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error during access check'
      };
    }
  }

  /**
   * Check if user has valid subscription via RevenueCat
   */
  private async validateSubscription(): Promise<boolean> {
    try {
      loggingService.info('AccessService: Checking RevenueCat entitlements...');
      const customerInfo = await Purchases.getCustomerInfo();
      
      const entitlementId = REVENUECAT_CONFIG.ENTITLEMENT_ID;
      const isActive = customerInfo.entitlements.active[entitlementId] !== undefined;
      
      if (isActive) {
        loggingService.info('AccessService: User has active subscription via RevenueCat');
        return true;
      } else {
        loggingService.warn('AccessService: User does not have active subscription');
        return false;
      }
    } catch (error) {
      loggingService.error('AccessService: Error checking RevenueCat entitlements:', error);
      return false;
    }
  }

  /**
   * Present paywall for subscription purchase
   */
  private async presentPaywall(): Promise<PaywallResult> {
    try {
      loggingService.info('AccessService: Presenting RevenueCat paywall...');
      
      if (!RevenueCatUI || typeof RevenueCatUI.presentPaywall !== 'function') {
        loggingService.error('AccessService: RevenueCatUI not available');
        return { success: false, purchased: false, error: 'Paywall not available' };
      }
      
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
      
      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          loggingService.info('AccessService: Purchase successful');
          return { success: true, purchased: true };
        case PAYWALL_RESULT.CANCELLED:
          loggingService.warn('AccessService: Paywall was cancelled by user');
          return { success: true, purchased: false };
        default:
          loggingService.warn('AccessService: Paywall not presented or error occurred');
          return { success: false, purchased: false, error: 'Paywall error' };
      }
    } catch (error) {
      loggingService.error('AccessService: Error presenting paywall:', error);
      return { 
        success: false, 
        purchased: false, 
        error: error instanceof Error ? error.message : 'Unknown error presenting paywall' 
      };
    }
  }

  /**
   * Get current user (cached)
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Clear cached user data
   */
  clearCache(): void {
    this.currentUser = null;
  }
}

// Export singleton instance
export const accessService = new AccessService();