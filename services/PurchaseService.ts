// services/PurchaseService.ts

import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  type Product,
  type SubscriptionPurchase,
  type PurchaseError,
  type Purchase,
} from 'expo-iap';
import { Platform } from 'react-native';

const itemSubs = Platform.select({
  ios: [
    'carbie_monthly_subscription',
    'carbie_yearly_subscription',
  ],
  android: [
    'carbie_monthly_subscription',
    'carbie_yearly_subscription',
  ],
}) as string[];

class PurchaseService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  async initializePurchases(): Promise<boolean> {
    try {
      const result = await initConnection();
      console.log('IAP connection result:', result);
      
      // Note: expo-iap automatically handles Android failed purchases cleanup
      // No need for flushFailedPurchasesCachedAsPendingAndroid

      // Set up listeners
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: Purchase | SubscriptionPurchase) => {
          console.log('Purchase updated:', purchase);
          await this.handlePurchaseUpdate(purchase as SubscriptionPurchase);
        }
      );

      this.purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => {
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
    try {
      const products = await getSubscriptions(itemSubs);
      console.log('Available products:', products);
      return products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseSubscription(sku: string): Promise<void> {
    try {
      // expo-iap uses a different signature for requestPurchase
      if (Platform.OS === 'android') {
        await requestPurchase({
          request: { skus: [sku], subscriptionOffers: [] },
          type: 'subs'
        });
      } else {
        await requestPurchase({
          request: { sku },
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
    try {
      const purchases = await getAvailablePurchases();
      console.log('Restored purchases:', purchases);
      
      for (const purchase of purchases) {
        await this.handlePurchaseUpdate(purchase as SubscriptionPurchase);
      }
      
      return purchases as SubscriptionPurchase[];
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return [];
    }
  }

  private async handlePurchaseUpdate(purchase: SubscriptionPurchase): Promise<void> {
    try {
      // Verify purchase with your backend
      const receipt = purchase.transactionReceipt;
      
      if (receipt) {
        // Send to your backend for verification
        console.log('Verifying purchase:', purchase.id);
        
        // expo-iap handles platform-specific acknowledgment automatically
        // when you call finishTransaction
        await finishTransaction({
          purchase,
          isConsumable: false // subscriptions are not consumable
        });
        
        console.log('Purchase handled successfully');
      }
    } catch (error) {
      console.error('Error handling purchase:', error);
    }
  }

  async endConnection(): Promise<void> {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      
      await endConnection();
    } catch (error) {
      console.error('Error ending IAP connection:', error);
    }
  }

  // Test products for development
  static getTestProducts() {
    return Platform.select({
      ios: ['ios.test.carbie_monthly'],
      android: ['android.test.purchased'],
    }) as string[];
  }
}

export const purchaseService = new PurchaseService();