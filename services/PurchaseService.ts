// services/PurchaseService.ts
import RNIap, {
  Product,
  PurchaseError,
  SubscriptionPurchase,
  acknowledgePurchaseAndroid,
  consumePurchaseAndroid,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';
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
      const result = await RNIap.initConnection();
      console.log('IAP connection result:', result);
      
      if (Platform.OS === 'android') {
        // For Android, we can also use flushFailedPurchasesCachedAsPendingAndroid
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
      }

      // Set up listeners
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: SubscriptionPurchase) => {
          console.log('Purchase updated:', purchase);
          await this.handlePurchaseUpdate(purchase);
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
      const products = await RNIap.getSubscriptions({ skus: itemSubs });
      console.log('Available products:', products);
      return products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseSubscription(sku: string): Promise<void> {
    try {
      await RNIap.requestSubscription({ sku });
      // The purchase result will be handled by the purchaseUpdatedListener
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<SubscriptionPurchase[]> {
    try {
      const purchases = await RNIap.getAvailablePurchases();
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
        console.log('Verifying purchase:', purchase.productId);
        
        // For Android, acknowledge the purchase
        if (Platform.OS === 'android') {
          await acknowledgePurchaseAndroid({
            token: purchase.purchaseToken || '',
            developerPayload: purchase.developerPayloadAndroid,
          });
        }
        
        // For iOS, finish the transaction
        if (Platform.OS === 'ios') {
          await finishTransaction({ purchase });
        }
        
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
      
      await RNIap.endConnection();
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