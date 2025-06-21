// screens/AccountScreen.tsx
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { authService, User } from '../services/AuthService';
import { apiClient } from '../services/ApiClient';

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

// Mock data - replace with real API calls
interface SubscriptionInfo {
  type: 'trial' | 'monthly' | 'yearly' | 'expired';
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  renewalDate?: string;
  trialExpiryDate?: string;
  price?: string;
  billingCycle?: 'monthly' | 'yearly';
  usageThisMonth: number;
  usageLimit: number; // -1 for unlimited
}

export default function AccountScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadAccountData();
    
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

  const loadAccountData = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Mock subscription data - replace with real API call
        const mockSubscription: SubscriptionInfo = {
          type: currentUser.user_type === 'trial' ? 'trial' : 'monthly',
          planName: currentUser.user_type === 'trial' ? 'Free Trial' : 'Carbie Premium',
          status: currentUser.is_active ? 'active' : 'expired',
          trialExpiryDate: currentUser.user_type === 'trial' ? '2025-01-15' : undefined,
          renewalDate: currentUser.user_type !== 'trial' ? '2025-02-01' : undefined,
          price: currentUser.user_type === 'trial' ? undefined : '$9.99',
          billingCycle: currentUser.user_type === 'trial' ? undefined : 'monthly',
          usageThisMonth: 42,
          usageLimit: currentUser.user_type === 'trial' ? 100 : -1, // -1 = unlimited
        };
        
        setSubscriptionInfo(mockSubscription);
      } else {
        showAlert('Error', 'Could not load account information');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading account data:', error);
      showAlert('Error', 'Failed to load account information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Temporary handlers for purchase functionality
  const handleSubscribe = () => {
    showAlert('Coming Soon', 'Subscription functionality will be available soon!');
  };

  const handleUpgradeSubscription = () => {
    showAlert('Coming Soon', 'Subscription upgrades will be available soon!');
  };

  const handleManageSubscription = async () => {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    
    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        showAlert('Error', 'Cannot open subscription management');
      }
    } catch (error) {
      showAlert('Error', 'Failed to open subscription management');
    }
  };

  const handleRestorePurchases = () => {
    showAlert('Restore Purchases', 'Feature coming soon. Contact support if you need to restore purchases.');
  };

  const handleContactSupport = () => {
    showAlert('Contact Support', 'Email: support@carbie.com\nWe typically respond within 24 hours.');
  };

  const openTermsOfService = async () => {
    // Replace with your actual Terms of Service URL
    const url = 'https://carbie.com/terms';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showAlert('Error', 'Cannot open Terms of Service');
      }
    } catch (error) {
      showAlert('Error', 'Failed to open Terms of Service');
    }
  };

  const openPrivacyPolicy = async () => {
    // Replace with your actual Privacy Policy URL
    const url = 'https://carbie.com/privacy';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showAlert('Error', 'Cannot open Privacy Policy');
      }
    } catch (error) {
      showAlert('Error', 'Failed to open Privacy Policy');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#A8E063', '#2E7D32']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading Account...</Text>
      </LinearGradient>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'expired': return '#F44336';
      case 'cancelled': return '#FF9800';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <LinearGradient colors={['#A8E063', '#2E7D32']} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.accountContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Account Status Header */}
          <View style={styles.headerSection}>
            <View style={styles.statusContainer}>
              <MaterialIcons name="account-balance-wallet" size={40} color="#2E7D32" />
              <View style={styles.statusTextContainer}>
                <Text style={styles.planName}>{subscriptionInfo?.planName}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(subscriptionInfo?.status || '') }]}>
                  {(subscriptionInfo?.status
                    ? subscriptionInfo.status.charAt(0).toUpperCase() + subscriptionInfo.status.slice(1)
                    : '')}
                </Text>
              </View>
            </View>
          </View>

          {/* Subscription Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="card-membership" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Subscription Details</Text>
            </View>
            
            <View style={styles.detailsContainer}>
              {subscriptionInfo?.type === 'trial' && subscriptionInfo.trialExpiryDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trial Expires:</Text>
                  <Text style={styles.detailValue}>{formatDate(subscriptionInfo.trialExpiryDate)}</Text>
                </View>
              )}
              
              {subscriptionInfo && subscriptionInfo.type !== 'trial' && subscriptionInfo.renewalDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Next Billing:</Text>
                  <Text style={styles.detailValue}>{formatDate(subscriptionInfo.renewalDate)}</Text>
                </View>
              )}

              {subscriptionInfo && subscriptionInfo.type !== 'trial' && subscriptionInfo.price && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Plan Price:</Text>
                  <Text style={styles.detailValue}>
                    {subscriptionInfo.price}/{subscriptionInfo.billingCycle === 'yearly' ? 'year' : 'month'}
                  </Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Type:</Text>
                <Text style={styles.detailValue}>
                  {(user?.user_type ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1) : '')}
                </Text>
              </View>
            </View>
          </View>

          {/* Usage */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="analytics" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Usage This Month</Text>
            </View>
            
            <View style={styles.creditsContainer}>
              <View style={styles.creditsHeader}>
                <Text style={styles.creditsRemaining}>{subscriptionInfo?.usageThisMonth}</Text>
                <Text style={styles.creditsLabel}>
                  {subscriptionInfo?.usageLimit === -1 
                    ? 'Unlimited Usage' 
                    : `of ${subscriptionInfo?.usageLimit} uses`
                  }
                </Text>
              </View>
              
              {subscriptionInfo?.usageLimit !== -1 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${((subscriptionInfo?.usageThisMonth || 0) / (subscriptionInfo?.usageLimit || 1)) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {(subscriptionInfo?.usageLimit ?? 0) - (subscriptionInfo?.usageThisMonth ?? 0)} uses remaining this month
                  </Text>
                </View>
              )}
              
              {subscriptionInfo?.type === 'trial' ? (
                <TouchableOpacity style={styles.purchaseButton} onPress={handleSubscribe}>
                  <MaterialIcons name="upgrade" size={20} color="#FFFFFF" />
                  <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.purchaseButton} onPress={handleUpgradeSubscription}>
                  <MaterialIcons name="tune" size={20} color="#FFFFFF" />
                  <Text style={styles.purchaseButtonText}>Change Plan</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Subscription Management */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="settings" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Subscription Management</Text>
            </View>
            
            <View style={styles.managementContainer}>
              <TouchableOpacity style={styles.managementButton} onPress={handleManageSubscription}>
                <MaterialIcons name="edit" size={20} color="#2E7D32" />
                <Text style={styles.managementButtonText}>Manage Subscription</Text>
                <MaterialIcons name="open-in-new" size={16} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.managementButton} onPress={handleRestorePurchases}>
                <MaterialIcons name="restore" size={20} color="#2E7D32" />
                <Text style={styles.managementButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.managementButton} onPress={handleContactSupport}>
                <MaterialIcons name="support" size={20} color="#2E7D32" />
                <Text style={styles.managementButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="gavel" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Legal</Text>
            </View>
            
            <View style={styles.legalContainer}>
              <TouchableOpacity style={styles.legalButton} onPress={openTermsOfService}>
                <Text style={styles.legalButtonText}>Terms of Service</Text>
                <MaterialIcons name="open-in-new" size={16} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.legalButton} onPress={openPrivacyPolicy}>
                <Text style={styles.legalButtonText}>Privacy Policy</Text>
                <MaterialIcons name="open-in-new" size={16} color="#666" />
              </TouchableOpacity>
            </View>
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
  accountContainer: {
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
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Section Styles
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 10,
  },
  
  // Details Container
  detailsContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  
  // Credits Container
  creditsContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  creditsHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  creditsRemaining: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2E7D32',
  },
  creditsLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Management Container
  managementContainer: {
    gap: 10,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  managementButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    marginLeft: 10,
  },
  
  // Legal Container
  legalContainer: {
    gap: 10,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  legalButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
});