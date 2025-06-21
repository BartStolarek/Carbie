// screens/PurchaseScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { purchaseService } from '../services/PurchaseService';
import { apiClient } from '../services/ApiClient';

interface Product {
  productId: string;
  price: string;
  title: string;
  description: string;
}

export default function PurchaseScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      await purchaseService.initializePurchases();
      const availableProducts = await purchaseService.getProducts();
      setProducts(availableProducts);
      
      // Set up purchase listener
      purchaseService.setPurchaseListener(handlePurchaseUpdate);
    } catch (error) {
      Alert.alert('Error', 'Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseUpdate = async (purchase: any) => {
    try {
      // Verify purchase with your backend
      const response = await apiClient.post('/api/v1/purchases/verify', {
        receipt: purchase.transactionReceipt,
        productId: purchase.productId,
        transactionId: purchase.transactionIdentifier,
      });

      if (response.success) {
        Alert.alert('Success!', 'Your subscription is now active');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to activate subscription');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify purchase');
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      await purchaseService.purchaseSubscription(productId);
      // Purchase listener will handle the result
    } catch (error) {
      Alert.alert('Purchase Failed', 'Please try again');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const purchases = await purchaseService.restorePurchases();
      if (purchases.length > 0) {
        // Verify with backend
        for (const purchase of purchases) {
          await handlePurchaseUpdate(purchase);
        }
      } else {
        Alert.alert('No Purchases', 'No previous purchases found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Plan</Text>
      
      {products.map((product) => (
        <TouchableOpacity
          key={product.productId}
          style={styles.productCard}
          onPress={() => handlePurchase(product.productId)}
        >
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productPrice}>{product.price}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity 
        style={styles.restoreButton}
        onPress={handleRestorePurchases}
      >
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  productCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
  },
  restoreButton: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 16,
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },
});