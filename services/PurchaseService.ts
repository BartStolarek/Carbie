// services/PurchaseService.ts

import { Platform } from 'react-native';

// Conditional imports for expo-iap (only on native platforms)
let iapModule: any = null;

if (Platform.OS !== 'web') {
  try {
    iapModule = require('expo-iap');
  } catch (error) {
    console.warn('expo-iap not available:', error);
  }
}

const itemSubs = Platform.select({
  ios: [
    'carbie_monthly_subscription',
    'carbie_yearly_subscription',
  ],
  android: [
    'carbie_monthly_subscription',
    'carbie_yearly_subscription',
  ],
  web: [], // No subscriptions on web
}) as string[];

interface Product {
  productId: string;
  price: string;
  title: string;
  description: string;
}

interface SubscriptionPurchase {
  productId: string;
  purchaseToken?: string;
  transactionReceipt?: string;
  transactionId?: string;
  transactionIdentifier?: string;
}

class PurchaseService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private purchaseListener: ((purchase: any) => void) | null = null;

  async initializePurchases(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('Purchase service initialized for web (mock mode)');
      return true;
    }

    if (!iapModule) {
      console.error('expo-iap module not available');
      return false;
    }

    try {
      const result = await iapModule.initConnection();
      console.log('IAP connection result:', result);
      
      // Set up listeners
      this.purchaseUpdateSubscription = iapModule.purchaseUpdatedListener(
        async (purchase: any) => {
          console.log('Purchase updated:', purchase);
          await this.handlePurchaseUpdate(purchase);
        }
      );

      this.purchaseErrorSubscription = iapModule.purchaseErrorListener(
        (error: any) => {
          console.warn('Purchase error:', error);
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      return false;
    }
  }

  async getProducts(): Promise<Product[]> {
    if (Platform.OS === 'web') {
      // Return mock products for web
      return [
        {
          productId: 'carbie_monthly_subscription',
          price: '$9.99',
          title: 'Monthly Subscription',
          description: 'Monthly access to Carbie Premium'
        },
        {
          productId: 'carbie_yearly_subscription',
          price: '$99.99',
          title: 'Yearly Subscription',
          description: 'Yearly access to Carbie Premium'
        }
      ];
    }

    if (!iapModule) {
      console.error('expo-iap module not available');
      return [];
    }

    try {
      const products = await iapModule.getSubscriptions(itemSubs);
      console.log('Available products:', products);
      return products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseSubscription(productId: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Simulate purchase for web testing
      console.log(`Simulating purchase for: ${productId}`);
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful purchase
      const mockPurchase = {
        productId: productId,
        purchaseToken: `mock_token_${Date.now()}`,
        transactionId: `mock_transaction_${Date.now()}`,
      };
      
      if (this.purchaseListener) {
        this.purchaseListener(mockPurchase);
      }
      
      return;
    }

    if (!iapModule) {
      throw new Error('Purchase service not available');
    }

    try {
      console.log(`Attempting to purchase: ${productId}`);
      
      if (Platform.OS === 'android') {
        await iapModule.requestPurchase({
          request: { skus: [productId], subscriptionOffers: [] },
          type: 'subs'
        });
      } else {
        await iapModule.requestPurchase({
          request: { sku: productId },
          type: 'subs'
        });
      }
      // The purchase result will be handled by the purchaseUpdatedListener
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<SubscriptionPurchase[]> {
    if (Platform.OS === 'web') {
      // Simulate restored purchases for web
      console.log('Simulating restore purchases for web');
      return [];
    }

    if (!iapModule) {
      console.error('expo-iap module not available');
      return [];
    }

    try {
      const purchases = await iapModule.getAvailablePurchases();
      console.log('Restored purchases:', purchases);
      
      for (const purchase of purchases) {
        await this.handlePurchaseUpdate(purchase);
      }
      
      return purchases;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return [];
    }
  }

  // Add the missing setPurchaseListener method
  setPurchaseListener(listener: (purchase: any) => void) {
    this.purchaseListener = listener;
  }

  private async handlePurchaseUpdate(purchase: any): Promise<void> {
    try {
      console.log('Handling purchase update:', purchase);
      
      // Validate purchase data
      if (!purchase.productId) {
        console.error('Purchase missing productId:', purchase);
        return;
      }
      
      // Call the listener if it's set
      if (this.purchaseListener) {
        this.purchaseListener(purchase);
      }
      
      // Finish the transaction (only on native platforms)
      if (Platform.OS !== 'web' && iapModule) {
        try {
          await iapModule.finishTransaction({
            purchase,
            isConsumable: false // subscriptions are not consumable
          });
          console.log('Transaction finished successfully');
        } catch (finishError) {
          console.error('Error finishing transaction:', finishError);
          // Don't throw here - the purchase was successful, just couldn't finish
        }
      }
      
      console.log('Purchase handled successfully');
    } catch (error) {
      console.error('Error handling purchase:', error);
      // Re-throw to let the caller handle it
      throw error;
    }
  }

  async endConnection(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      
      if (iapModule) {
        await iapModule.endConnection();
      }
    } catch (error) {
      console.error('Error ending IAP connection:', error);
    }
  }

  // Test products for development
  static getTestProducts() {
    return Platform.select({
      ios: ['ios.test.carbie_monthly'],
      android: ['android.test.purchased'],
      web: ['web.test.subscription'],
    }) as string[];
  }
}

export const purchaseService = new PurchaseService();