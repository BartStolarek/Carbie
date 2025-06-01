import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface CreditPackage {
  id: string;
  credits: number;
  price: string;
  popular?: boolean;
}

const creditPackages: CreditPackage[] = [
  { id: '1', credits: 100, price: '$4.99' },
  { id: '2', credits: 250, price: '$9.99', popular: true },
  { id: '3', credits: 500, price: '$17.99' },
  { id: '4', credits: 1000, price: '$29.99' }
];

export default function PurchaseScreen({ navigation }: any) {
  const [selectedPackage, setSelectedPackage] = useState<string>('2');

  const handlePurchase = () => {
    const selected = creditPackages.find(pkg => pkg.id === selectedPackage);
    Alert.alert(
      'Purchase Credits',
      `Purchase ${selected?.credits} credits for ${selected?.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Purchase', 
          onPress: () => {
            // TODO: Implement actual purchase logic
            Alert.alert('Success', 'Credits purchased successfully!', [
              { text: 'OK', onPress: () => navigation.navigate('MainChat') }
            ]);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Purchase Credits</Text>
      <Text style={styles.subtitle}>Choose a credit package to continue using Carbie</Text>

      <View style={styles.packagesContainer}>
        {creditPackages.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.packageCard,
              selectedPackage === pkg.id && styles.selectedPackage,
              pkg.popular && styles.popularPackage
            ]}
            onPress={() => setSelectedPackage(pkg.id)}
          >
            {pkg.popular && <Text style={styles.popularLabel}>Most Popular</Text>}
            <Text style={styles.creditsText}>{pkg.credits} Credits</Text>
            <Text style={styles.priceText}>{pkg.price}</Text>
            <Text style={styles.perCreditText}>
              ${((parseFloat(pkg.price.slice(1)) / pkg.credits) * 100).toFixed(1)}¢ per credit
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
        <Text style={styles.purchaseButtonText}>Purchase Credits</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.linkText}>Back to Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  packagesContainer: {
    marginBottom: 30,
  },
  packageCard: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    position: 'relative',
  },
  selectedPackage: {
    borderColor: '#4CAF50',
  },
  popularPackage: {
    borderColor: '#FF9800',
  },
  popularLabel: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FF9800',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  creditsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  perCreditText: {
    fontSize: 12,
    color: '#666',
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#4CAF50',
    fontSize: 14,
  },
});