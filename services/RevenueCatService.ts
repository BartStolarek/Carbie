// services/RevenueCatService.ts
import { Platform } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

class RevenueCatService {
  private isInitialized = false;

  // Initialize RevenueCat (call this in App.tsx)
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Note: RevenueCat SDK initialization should be done in App.tsx
      // This service focuses on paywall presentation
      this.isInitialized = true;
      console.log('RevenueCat service initialized');
    } catch (error) {
      console.error('Error initializing RevenueCat service:', error);
    }
  }

  // Present paywall for current offering
  async presentPaywall(): Promise<boolean> {
    try {
      console.log('Presenting RevenueCat paywall...');
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
      
      console.log('Paywall result:', paywallResult);
      
      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
          console.log('Paywall not presented, error, or cancelled');
          return false;
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          console.log('Purchase successful or restored');
          return true;
        default:
          console.log('Unknown paywall result:', paywallResult);
          return false;
      }
    } catch (error) {
      console.error('Error presenting paywall:', error);
      return false;
    }
  }

  // Present paywall for specific offering
  async presentPaywallWithOffering(offering: any): Promise<boolean> {
    try {
      console.log('Presenting RevenueCat paywall with specific offering...');
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall({
        offering: offering
      });
      
      console.log('Paywall result:', paywallResult);
      
      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
          console.log('Paywall not presented, error, or cancelled');
          return false;
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          console.log('Purchase successful or restored');
          return true;
        default:
          console.log('Unknown paywall result:', paywallResult);
          return false;
      }
    } catch (error) {
      console.error('Error presenting paywall with offering:', error);
      return false;
    }
  }

  // Present paywall if needed (checks entitlement)
  async presentPaywallIfNeeded(requiredEntitlementIdentifier: string = "pro"): Promise<boolean> {
    try {
      console.log('Presenting RevenueCat paywall if needed...');
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: requiredEntitlementIdentifier
      });
      
      console.log('Paywall if needed result:', paywallResult);
      
      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
          console.log('Paywall not presented, error, or cancelled');
          return false;
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          console.log('Purchase successful or restored');
          return true;
        default:
          console.log('Unknown paywall result:', paywallResult);
          return false;
      }
    } catch (error) {
      console.error('Error presenting paywall if needed:', error);
      return false;
    }
  }

  // Present paywall if needed with specific offering
  async presentPaywallIfNeededWithOffering(offering: any, requiredEntitlementIdentifier: string = "pro"): Promise<boolean> {
    try {
      console.log('Presenting RevenueCat paywall if needed with specific offering...');
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
        offering: offering,
        requiredEntitlementIdentifier: requiredEntitlementIdentifier
      });
      
      console.log('Paywall if needed result:', paywallResult);
      
      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
          console.log('Paywall not presented, error, or cancelled');
          return false;
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          console.log('Purchase successful or restored');
          return true;
        default:
          console.log('Unknown paywall result:', paywallResult);
          return false;
      }
    } catch (error) {
      console.error('Error presenting paywall if needed with offering:', error);
      return false;
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService(); 