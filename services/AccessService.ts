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
    const methodName = 'checkAccess';
    loggingService.info(`${methodName}: Starting access check`, { hasNavigation: !!navigation });
    
    try {
      loggingService.debug(`${methodName}: Step 1 - Checking authentication status`);
      
      // Step 1: Check authentication
      const isAuthenticated = await authService.isAuthenticated();
      loggingService.info(`${methodName}: Authentication check result`, { isAuthenticated });
      
      if (!isAuthenticated) {
        loggingService.warn(`${methodName}: User not authenticated, redirecting to login`);
        if (navigation) {
          loggingService.debug(`${methodName}: Performing navigation reset to Welcome screen`);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        } else {
          loggingService.warn(`${methodName}: No navigation provided, cannot redirect`);
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
      loggingService.debug(`${methodName}: Step 2 - Getting current user info`);
      const user = await authService.getCurrentUser();
      loggingService.info(`${methodName}: User info retrieved`, { 
        hasUser: !!user, 
        userId: user?.id, 
        userEmail: user?.email,
        isAdmin: user?.is_admin 
      });
      
      if (!user) {
        loggingService.warn(`${methodName}: Could not get user info`);
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
      loggingService.info(`${methodName}: User authenticated successfully`, { 
        id: user.id, 
        email: user.email,
        isAdmin: user.is_admin 
      });

      // Step 3: Check if user is admin
      if (user.is_admin) {
        loggingService.info(`${methodName}: User is admin, bypassing subscription check`);
        return {
          hasAccess: true,
          isAuthenticated: true,
          isAdmin: true,
          hasSubscription: true, // Admins are considered to have subscription
          user: user
        };
      }

      // Step 4: Set RevenueCat user ID for non-admin users
      loggingService.debug(`${methodName}: Step 4 - Setting RevenueCat user ID`);
      try {
        await Purchases.logIn(user.id.toString());
        loggingService.info(`${methodName}: RevenueCat user ID set successfully`, { userId: user.id });
      } catch (error) {
        loggingService.error(`${methodName}: Error setting RevenueCat user ID`, { 
          userId: user.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }

      // Step 5: Check subscription status for non-admin users
      loggingService.debug(`${methodName}: Step 5 - Validating subscription status`);
      const hasSubscription = await this.validateSubscription();
      loggingService.info(`${methodName}: Subscription validation result`, { hasSubscription });
      
      if (hasSubscription) {
        loggingService.info(`${methodName}: User has valid subscription, access granted`);
        return {
          hasAccess: true,
          isAuthenticated: true,
          isAdmin: false,
          hasSubscription: true,
          user: user
        };
      } else {
        // Step 6: Present paywall if no subscription
        loggingService.warn(`${methodName}: User does not have subscription, presenting paywall`);
        const paywallResult = await this.presentPaywall();
        loggingService.info(`${methodName}: Paywall result`, { 
          success: paywallResult.success, 
          purchased: paywallResult.purchased,
          error: paywallResult.error 
        });
        
        if (paywallResult.purchased) {
          loggingService.info(`${methodName}: Purchase successful, re-checking access`);
          // Re-check access after successful purchase
          return await this.checkAccess(navigation);
        } else {
          loggingService.warn(`${methodName}: No purchase made, access denied`);
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
      loggingService.error(`${methodName}: Unexpected error during access check`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
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
    const methodName = 'validateSubscription';
    loggingService.debug(`${methodName}: Starting RevenueCat entitlement check`);
    
    try {
      loggingService.debug(`${methodName}: Getting customer info from RevenueCat`);
      const customerInfo = await Purchases.getCustomerInfo();
      
      const entitlementId = REVENUECAT_CONFIG.ENTITLEMENT_ID;
      loggingService.debug(`${methodName}: Checking entitlement`, { 
        entitlementId, 
        availableEntitlements: Object.keys(customerInfo.entitlements.active || {})
      });
      
      const isActive = customerInfo.entitlements.active[entitlementId] !== undefined;
      
      if (isActive) {
        const entitlement = customerInfo.entitlements.active[entitlementId];
        loggingService.info(`${methodName}: User has active subscription`, { 
          entitlementId,
          productIdentifier: entitlement.productIdentifier,
          expirationDate: entitlement.expirationDate,
          willRenew: entitlement.willRenew
        });
        return true;
      } else {
        loggingService.warn(`${methodName}: User does not have active subscription`, { 
          entitlementId,
          activeEntitlements: Object.keys(customerInfo.entitlements.active || {})
        });
        return false;
      }
    } catch (error) {
      loggingService.error(`${methodName}: Error checking RevenueCat entitlements`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Present paywall for subscription purchase
   */
  private async presentPaywall(): Promise<PaywallResult> {
    const methodName = 'presentPaywall';
    loggingService.debug(`${methodName}: Starting paywall presentation`);
    
    try {
      loggingService.debug(`${methodName}: Checking RevenueCatUI availability`);
      
      if (!RevenueCatUI || typeof RevenueCatUI.presentPaywall !== 'function') {
        loggingService.error(`${methodName}: RevenueCatUI not available`, { 
          hasRevenueCatUI: !!RevenueCatUI,
          hasPresentPaywall: typeof RevenueCatUI?.presentPaywall === 'function'
        });
        return { success: false, purchased: false, error: 'Paywall not available' };
      }
      
      loggingService.info(`${methodName}: Presenting RevenueCat paywall`);
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
      loggingService.info(`${methodName}: Paywall presentation completed`, { result: paywallResult });
      
      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
          loggingService.info(`${methodName}: Purchase successful`);
          return { success: true, purchased: true };
        case PAYWALL_RESULT.RESTORED:
          loggingService.info(`${methodName}: Purchase restored`);
          return { success: true, purchased: true };
        case PAYWALL_RESULT.CANCELLED:
          loggingService.warn(`${methodName}: Paywall was cancelled by user`);
          return { success: true, purchased: false };
        default:
          loggingService.warn(`${methodName}: Paywall not presented or error occurred`, { result: paywallResult });
          return { success: false, purchased: false, error: 'Paywall error' };
      }
    } catch (error) {
      loggingService.error(`${methodName}: Error presenting paywall`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
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
    loggingService.debug('getCurrentUser: Returning cached user', { 
      hasUser: !!this.currentUser,
      userId: this.currentUser?.id 
    });
    return this.currentUser;
  }

  /**
   * Clear cached user data
   */
  clearCache(): void {
    loggingService.info('clearCache: Clearing cached user data', { 
      hadUser: !!this.currentUser,
      userId: this.currentUser?.id 
    });
    this.currentUser = null;
  }
}

// Export singleton instance
export const accessService = new AccessService();