// services/RevenueCatService.ts
import { Platform } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { loggingService } from './LoggingService';

class RevenueCatService {
  private isInitialized = false;

  // Initialize RevenueCat (call this in App.tsx)
  async initialize(): Promise<void> {
    const methodName = 'initialize';
    loggingService.info(`${methodName}: Starting RevenueCat service initialization`);
    
    if (this.isInitialized) {
      loggingService.debug(`${methodName}: Service already initialized, skipping`);
      return;
    }

    try {
      // Note: RevenueCat SDK initialization should be done in App.tsx
      // This service focuses on paywall presentation
      this.isInitialized = true;
      loggingService.info(`${methodName}: RevenueCat service initialized successfully`);
    } catch (error) {
      loggingService.error(`${methodName}: Error initializing RevenueCat service`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  // Present paywall for current offering
  async presentPaywall(): Promise<boolean> {
    const methodName = 'presentPaywall';
    loggingService.info(`${methodName}: Starting paywall presentation for current offering`);
    
    try {
      loggingService.debug(`${methodName}: Calling RevenueCatUI.presentPaywall()`);
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
      
      loggingService.info(`${methodName}: Paywall presentation completed`, { 
        result: paywallResult,
        resultType: typeof paywallResult 
      });
      
      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
          loggingService.warn(`${methodName}: Paywall not presented`);
          return false;
        case PAYWALL_RESULT.ERROR:
          loggingService.error(`${methodName}: Paywall presentation error`);
          return false;
        case PAYWALL_RESULT.CANCELLED:
          loggingService.warn(`${methodName}: Paywall was cancelled by user`);
          return false;
        case PAYWALL_RESULT.PURCHASED:
          loggingService.info(`${methodName}: Purchase successful`);
          return true;
        case PAYWALL_RESULT.RESTORED:
          loggingService.info(`${methodName}: Purchase restored`);
          return true;
        default:
          loggingService.warn(`${methodName}: Unknown paywall result`, { result: paywallResult });
          return false;
      }
    } catch (error) {
      loggingService.error(`${methodName}: Error presenting paywall`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  // Present paywall for specific offering
  async presentPaywallWithOffering(offering: any): Promise<boolean> {
    const methodName = 'presentPaywallWithOffering';
    loggingService.info(`${methodName}: Starting paywall presentation with specific offering`, { 
      hasOffering: !!offering,
      offeringType: typeof offering,
      offeringKeys: offering ? Object.keys(offering) : []
    });
    
    try {
      loggingService.debug(`${methodName}: Calling RevenueCatUI.presentPaywall with offering`);
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall({
        offering: offering
      });
      
      loggingService.info(`${methodName}: Paywall presentation completed`, { 
        result: paywallResult,
        resultType: typeof paywallResult 
      });
      
      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
          loggingService.warn(`${methodName}: Paywall not presented`);
          return false;
        case PAYWALL_RESULT.ERROR:
          loggingService.error(`${methodName}: Paywall presentation error`);
          return false;
        case PAYWALL_RESULT.CANCELLED:
          loggingService.warn(`${methodName}: Paywall was cancelled by user`);
          return false;
        case PAYWALL_RESULT.PURCHASED:
          loggingService.info(`${methodName}: Purchase successful`);
          return true;
        case PAYWALL_RESULT.RESTORED:
          loggingService.info(`${methodName}: Purchase restored`);
          return true;
        default:
          loggingService.warn(`${methodName}: Unknown paywall result`, { result: paywallResult });
          return false;
      }
    } catch (error) {
      loggingService.error(`${methodName}: Error presenting paywall with offering`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        offering: offering ? 'provided' : 'not provided'
      });
      return false;
    }
  }

  // Present paywall if needed (checks entitlement)
  async presentPaywallIfNeeded(requiredEntitlementIdentifier: string = "pro"): Promise<boolean> {
    const methodName = 'presentPaywallIfNeeded';
    loggingService.info(`${methodName}: Starting conditional paywall presentation`, { 
      requiredEntitlementIdentifier 
    });
    
    try {
      loggingService.debug(`${methodName}: Calling RevenueCatUI.presentPaywallIfNeeded`);
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: requiredEntitlementIdentifier
      });
      
      loggingService.info(`${methodName}: Conditional paywall presentation completed`, { 
        result: paywallResult,
        resultType: typeof paywallResult,
        requiredEntitlementIdentifier 
      });
      
      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
          loggingService.info(`${methodName}: Paywall not presented (user already has entitlement)`);
          return false;
        case PAYWALL_RESULT.ERROR:
          loggingService.error(`${methodName}: Paywall presentation error`);
          return false;
        case PAYWALL_RESULT.CANCELLED:
          loggingService.warn(`${methodName}: Paywall was cancelled by user`);
          return false;
        case PAYWALL_RESULT.PURCHASED:
          loggingService.info(`${methodName}: Purchase successful`);
          return true;
        case PAYWALL_RESULT.RESTORED:
          loggingService.info(`${methodName}: Purchase restored`);
          return true;
        default:
          loggingService.warn(`${methodName}: Unknown paywall result`, { result: paywallResult });
          return false;
      }
    } catch (error) {
      loggingService.error(`${methodName}: Error presenting conditional paywall`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        requiredEntitlementIdentifier 
      });
      return false;
    }
  }

  // Present paywall if needed with specific offering
  async presentPaywallIfNeededWithOffering(offering: any, requiredEntitlementIdentifier: string = "pro"): Promise<boolean> {
    const methodName = 'presentPaywallIfNeededWithOffering';
    loggingService.info(`${methodName}: Starting conditional paywall presentation with specific offering`, { 
      hasOffering: !!offering,
      offeringType: typeof offering,
      offeringKeys: offering ? Object.keys(offering) : [],
      requiredEntitlementIdentifier 
    });
    
    try {
      loggingService.debug(`${methodName}: Calling RevenueCatUI.presentPaywallIfNeeded with offering`);
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
        offering: offering,
        requiredEntitlementIdentifier: requiredEntitlementIdentifier
      });
      
      loggingService.info(`${methodName}: Conditional paywall presentation completed`, { 
        result: paywallResult,
        resultType: typeof paywallResult,
        requiredEntitlementIdentifier 
      });
      
      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
          loggingService.info(`${methodName}: Paywall not presented (user already has entitlement)`);
          return false;
        case PAYWALL_RESULT.ERROR:
          loggingService.error(`${methodName}: Paywall presentation error`);
          return false;
        case PAYWALL_RESULT.CANCELLED:
          loggingService.warn(`${methodName}: Paywall was cancelled by user`);
          return false;
        case PAYWALL_RESULT.PURCHASED:
          loggingService.info(`${methodName}: Purchase successful`);
          return true;
        case PAYWALL_RESULT.RESTORED:
          loggingService.info(`${methodName}: Purchase restored`);
          return true;
        default:
          loggingService.warn(`${methodName}: Unknown paywall result`, { result: paywallResult });
          return false;
      }
    } catch (error) {
      loggingService.error(`${methodName}: Error presenting conditional paywall with offering`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        hasOffering: !!offering,
        requiredEntitlementIdentifier 
      });
      return false;
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService(); 