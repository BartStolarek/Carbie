// screens/SubscriptionPaywallScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { authService, User } from '../services/AuthService';
import { apiClient } from '../services/ApiClient';
import { purchaseService } from '../services/PurchaseService';

// Cross-platform alert function
const alertPolyfill = (title: string, description?: string, options?: any[], extra?: any) => {
  if (Platform.OS === 'web') {
    const result = window.confirm([title, description].filter(Boolean).join('\n'));
    if (options && options.length > 0) {
      if (result) {
        const confirmOption = options.find(({ style }) => style !== 'cancel');
        confirmOption && confirmOption.onPress && confirmOption.onPress();
      } else {
        const cancelOption = options.find(({ style }) => style === 'cancel');
        cancelOption && cancelOption.onPress && cancelOption.onPress();
      }
    }
  } else {
    Alert.alert(title, description, options, extra);
  }
};

const showAlert = Platform.OS === 'web' ? alertPolyfill : Alert.alert;

interface SubscriptionPlan {
  id: string;
  productId: string; // Google Play product ID
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    productId: 'carbie_monthly_subscription', // Google Play Console product ID
    name: 'Monthly',
    price: '$9.99',
    period: 'per month',
    features: [
      'Unlimited carb estimates',
      'AI-powered nutrition analysis',
      'Export results',
      'Priority support'
    ]
  },
  {
    id: 'yearly',
    productId: 'carbie_yearly_subscription', // Google Play Console product ID
    name: 'Yearly',
    price: '$99.99',
    period: 'per year',
    popular: true,
    savings: 'Save 17%',
    features: [
      'Unlimited carb estimates',
      'AI-powered nutrition analysis',
      'Export results',
      'Priority support',
      'Advanced analytics',
      'Meal planning (coming soon)'
    ]
  }
];

interface PaywallScreenProps {
  navigation: any;
  route?: {
    params?: {
      reason?: 'trial_expired' | 'usage_limit' | 'access_denied' | 'subscription_expired';
      daysLeft?: number;
      usesLeft?: number;
    };
  };
}

export default function SubscriptionPaywallScreen({ navigation, route }: PaywallScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const reason = route?.params?.reason || 'access_denied';
  const daysLeft = route?.params?.daysLeft || 0;
  const usesLeft = route?.params?.usesLeft || 0;

  useEffect(() => {
    loadUserData();
    initializePurchases();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializePurchases = async () => {
    try {
      await purchaseService.initializePurchases();
      
      // Set up purchase listener
      purchaseService.setPurchaseListener(handlePurchaseUpdate);
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
    }
  };

  const handlePurchaseUpdate = async (purchase: any) => {
    try {
      console.log('Purchase update received:', purchase);
      const requestBody = {
        product_id: purchase.productId,
        purchase_token: purchase.purchaseToken || purchase.transactionReceipt,
        platform: Platform.OS,
        transaction_id: purchase.transactionId || purchase.transactionIdentifier,
      };
      console.log('Sending to verify-purchase:', requestBody);
      // Verify purchase with your backend using the correct API structure
      const response = await apiClient.post('/api/v1/carbie/subscription/verify-purchase', requestBody);
      console.log('Verify-purchase response:', response);
      if (!response.success && response.data && response.data.detail) {
        console.error('Verify-purchase error detail:', response.data.detail);
      }

      if (response.success) {
        // After successful verification, validate access to confirm subscription is active
        try {
          const accessResponse = await apiClient.get('/api/v1/carbie/access-validate');
          
          if (accessResponse.success && accessResponse.data?.access_granted) {
            showAlert(
              'Success!', 
              'Your subscription has been activated. Welcome to Carbie Premium!',
              [
                { 
                  text: 'OK', 
                  onPress: () => {
                    // Navigate back to main app
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainChat' }],
                    });
                  }
                }
              ]
            );
          } else {
            // Access validation failed - this shouldn't happen after successful purchase
            showAlert(
              'Verification Issue', 
              'Purchase verified but access not granted. Please contact support.',
              [
                { text: 'Contact Support', onPress: () => showAlert('Support', 'Email: support@carbie.com') },
              ]
            );
          }
        } catch (accessError) {
          console.error('Access validation failed after purchase:', accessError);
          // Still show success but warn about potential issues
          showAlert(
            'Purchase Verified', 
            'Your purchase was verified successfully. If you experience any issues, please contact support.',
            [
              { 
                text: 'OK', 
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainChat' }],
                  });
                }
              }
            ]
          );
        }
      } else {
        showAlert(
          'Verification Failed', 
          'We couldn\'t verify your purchase. Please try "Restore Purchases" or contact support.',
          [
            { text: 'Restore Purchases', onPress: handleRestorePurchases },
            { text: 'Contact Support', onPress: () => showAlert('Support', 'Email: support@carbie.com') },
          ]
        );
      }
    } catch (error) {
      console.error('Purchase verification failed:', error);
      showAlert('Error', 'Failed to verify purchase. Please contact support if this continues.');
    } finally {
      setPurchasing(null);
    }
  };

  const getPaywallMessage = () => {
    switch (reason) {
      case 'trial_expired':
        return {
          title: 'Your Free Trial Has Ended',
          subtitle: 'Continue enjoying unlimited carb estimates with a subscription',
          icon: 'schedule'
        };
      case 'subscription_expired':
        return {
          title: 'Your Subscription Has Expired',
          subtitle: 'Renew your subscription to continue using Carbie',
          icon: 'refresh'
        };
      case 'usage_limit':
        return {
          title: 'You\'ve Reached Your Usage Limit',
          subtitle: `You've used all your trial uses. Upgrade for unlimited access.`,
          icon: 'analytics'
        };
      default:
        return {
          title: 'Unlock Full Access',
          subtitle: 'Get unlimited carb estimates and premium features',
          icon: 'lock'
        };
    }
  };

  const handlePurchase = async (planId: string) => {
    setPurchasing(planId);
    
    try {
      // Find the plan and get the product ID
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      console.log(`Initiating purchase for product: ${plan.productId}`);
      
      // Use PurchaseService to handle the actual purchase
      await purchaseService.purchaseSubscription(plan.productId);
      
      // Purchase result will be handled by the purchase listener
      
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchasing(null);
      
      let errorMessage = 'Failed to process purchase. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('canceled')) {
          errorMessage = 'Purchase was cancelled.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      showAlert('Purchase Error', errorMessage);
    }
  };

  const handleVerifyPurchase = async (planId: string) => {
    try {
      setLoading(true);
      
      // Find the plan and get the product ID
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }
      
      // Call API to verify and activate subscription
      const response = await apiClient.post('/api/v1/carbie/subscription/verify-purchase', {
        product_id: plan.productId,
        platform: Platform.OS,
        // Note: This function is for manual verification without a purchase token
        // It should only be used for testing or special cases
      });

      if (response.success) {
        showAlert(
          'Success!', 
          'Your subscription has been activated. Welcome to Carbie Premium!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Navigate back to main app
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainChat' }],
                });
              }
            }
          ]
        );
      } else {
        showAlert(
          'Verification Failed', 
          'We couldn\'t verify your purchase. Please try "Restore Purchases" or contact support.',
          [
            { text: 'Restore Purchases', onPress: handleRestorePurchases },
            { text: 'Contact Support', onPress: () => showAlert('Support', 'Email: support@carbie.com') },
            { text: 'Try Again', onPress: () => handleVerifyPurchase(planId) }
          ]
        );
      }
    } catch (error) {
      console.error('Verification error:', error);
      showAlert('Error', 'Failed to verify purchase. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      console.log('Calling /api/v1/carbie/access-validate for restore');
      const response = await apiClient.get('/api/v1/carbie/access-validate');
      console.log('Restore response:', response);
      if (!response.success && response.data && response.data.detail) {
        console.error('Restore access-validate error detail:', response.data.detail);
      }
      if (response.success && response.data?.access_granted) {
        showAlert(
          'Purchases Restored!',
          'Your subscription has been restored successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainChat' }],
                });
              }
            }
          ]
        );
      } else {
        showAlert('No Active Subscription', 'No active subscription was found for this account.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      showAlert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const message = getPaywallMessage();

  if (loading) {
    return (
      <LinearGradient
        colors={['#A8E063', '#2E7D32']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#A8E063', '#2E7D32']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={[
            styles.paywallContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <MaterialIcons name={message.icon as any} size={48} color="#2E7D32" />
            </View>
            <Text style={styles.title}>{message.title}</Text>
            <Text style={styles.subtitle}>{message.subtitle}</Text>
            
            {reason === 'trial_expired' && daysLeft > 0 && (
              <View style={styles.urgencyContainer}>
                <Text style={styles.urgencyText}>⏰ Trial expires in {daysLeft} days</Text>
              </View>
            )}
          </View>

          {/* Plan Selection */}
          <View style={styles.plansSection}>
            <Text style={styles.plansTitle}>Choose Your Plan</Text>
            
            {SUBSCRIPTION_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planCardSelected,
                  plan.popular && styles.planCardPopular
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <View style={styles.planTitleSection}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {plan.savings && (
                      <Text style={styles.savingsText}>{plan.savings}</Text>
                    )}
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </View>
                
                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <MaterialIcons name="check" size={16} color="#2E7D32" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    selectedPlan === plan.id && styles.selectButtonSelected,
                    purchasing === plan.id && styles.selectButtonLoading
                  ]}
                  onPress={() => handlePurchase(plan.id)}
                  disabled={purchasing !== null}
                >
                  {purchasing === plan.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[
                      styles.selectButtonText,
                      selectedPlan === plan.id && styles.selectButtonTextSelected
                    ]}>
                      {selectedPlan === plan.id ? 'Subscribe Now' : 'Select Plan'}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer Actions */}
          <View style={styles.footerSection}>
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={purchasing !== null}
            >
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
            
            {reason !== 'trial_expired' && reason !== 'subscription_expired' && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={purchasing !== null}
              >
                <Text style={styles.backButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              Subscriptions auto-renew unless cancelled. You can cancel anytime in your device settings.
              {'\n'}By subscribing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  paywallContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  iconContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 50,
    padding: 15,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  urgencyContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 15,
  },
  urgencyText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
  },
  
  // Plans Section
  plansSection: {
    marginBottom: 25,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 20,
    marginBottom: 15,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F8FFF8',
  },
  planCardPopular: {
    borderColor: '#4CAF50',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  planTitleSection: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    backgroundColor: '#E8F5E8',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },
  planPeriod: {
    fontSize: 12,
    color: '#666',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  selectButtonSelected: {
    backgroundColor: '#2E7D32',
  },
  selectButtonLoading: {
    opacity: 0.6,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  selectButtonTextSelected: {
    color: '#FFFFFF',
  },
  
  // Footer Section
  footerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 14,
    color: '#999',
  },
  
  // Terms Section
  termsSection: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});