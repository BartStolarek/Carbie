// services/PurchaseService.ts
import * as InAppPurchases from 'expo-in-app-purchases';

class PurchaseService {
  async initializePurchases() {
    try {
      await InAppPurchases.connectAsync();
      console.log('In-app purchases initialized');
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
    }
  }

  async getProducts() {
    try {
      const { results } = await InAppPurchases.getProductsAsync([
        'carbie_monthly_subscription',
        'carbie_yearly_subscription'
      ]);
      return results;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseSubscription(productId: string) {
    try {
      const { results } = await InAppPurchases.purchaseItemAsync(productId);
      return results[0];
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases() {
    try {
      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      return results;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return [];
    }
  }

  // Listen for purchase updates
  setPurchaseListener(callback: (purchase: any) => void) {
    InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results?.forEach(callback);
      }
    });
  }
}

export const purchaseService = new PurchaseService();