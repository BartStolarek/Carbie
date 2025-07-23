// screens/AccountScreen.tsx - Enhanced Version
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

interface SubscriptionInfo {
  type: 'trial' | 'monthly' | 'yearly' | 'expired';
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  renewalDate?: string;
  trialExpiryDate?: string;
  trialStartDate?: string;
  price?: string;
  billingCycle?: 'monthly' | 'yearly';
  usageThisMonth: number;
  usageLimit: number; // -1 for unlimited
  daysLeftInTrial?: number;
  usesRemainingInTrial?: number;
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

  // Focus listener to refresh data when returning from subscription screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAccountData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAccountData = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Enhanced mock subscription data - replace with real API call
        const mockSubscription: SubscriptionInfo = {
          type: currentUser.user_type === 'trial' ? 'trial' : 'monthly',
          planName: currentUser.user_type === 'trial' ? 'Free Trial' : 'Carbie Premium',
          status: currentUser.is_active ? 'active' : 'expired',
          trialExpiryDate: currentUser.user_type === 'trial' ? '2025-01-29' : undefined,
          trialStartDate: currentUser.user_type === 'trial' ? '2025-01-22' : undefined,
          renewalDate: currentUser.user_type !== 'trial' ? '2025-02-01' : undefined,
          price: currentUser.user_type === 'trial' ? undefined : '$9.99',
          billingCycle: currentUser.user_type === 'trial' ? undefined : 'monthly',
          usageThisMonth: currentUser.user_type === 'trial' ? 73 : 156,
          usageLimit: currentUser.user_type === 'trial' ? 100 : -1, // -1 = unlimited
          daysLeftInTrial: currentUser.user_type === 'trial' ? 7 : undefined,
          usesRemainingInTrial: currentUser.user_type === 'trial' ? 27 : undefined,
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'expired': return '#F44336';
      case 'cancelled': return '#FF9800';
      case 'pending': return '#2196F3';
      default: return '#666';
    }
  };

  const getTrialProgress = (): number => {
    if (!subscriptionInfo?.trialStartDate || !subscriptionInfo?.trialExpiryDate) return 0;
    
    const startDate = new Date(subscriptionInfo.trialStartDate).getTime();
    const endDate = new Date(subscriptionInfo.trialExpiryDate).getTime();
    const currentDate = new Date().getTime();
    
    const totalDuration = endDate - startDate;
    const elapsed = currentDate - startDate;
    
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  const handleSubscribe = () => {
    // Navigate to paywall with specific reason
    navigation.navigate('SubscriptionPaywall', {
      reason: subscriptionInfo?.type === 'trial' ? 'trial_expired' : 'access_denied',
      daysLeft: subscriptionInfo?.daysLeftInTrial,
      usesLeft: subscriptionInfo?.usesRemainingInTrial,
    });
  };

  const handleUpgradeSubscription = () => {
    navigation.navigate('SubscriptionPaywall', {
      reason: 'access_denied',
    });
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
        showAlert('Purchases Restored!', 'Your subscription has been restored successfully.');
        // Reload account data to reflect changes
        await loadAccountData();
      } else {
        showAlert('No Active Subscription', 'No active subscription was found for this account.');
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      showAlert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    showAlert('Contact Support', 'Email: support@carbie.com\nWe typically respond within 24 hours.');
  };

  const openTermsOfService = async () => {
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
      <LinearGradient
        colors={['#A8E063', '#2E7D32']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading account information...</Text>
      </LinearGradient>
    );
  }

  const trialProgress = getTrialProgress();
  const isTrialNearExpiry = (subscriptionInfo?.daysLeftInTrial || 0) <= 3;
  const isUsageNearLimit = subscriptionInfo?.usageLimit !== -1 && 
    ((subscriptionInfo?.usageThisMonth || 0) / (subscriptionInfo?.usageLimit || 1)) >= 0.8;

  return (
    <LinearGradient
      colors={['#A8E063', '#2E7D32']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={[
            styles.accountContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header Section - Enhanced */}
          <View style={styles.headerSection}>
            <View style={styles.statusContainer}>
              <View style={styles.avatarContainer}>
                <MaterialIcons 
                  name={subscriptionInfo?.type === 'trial' ? 'schedule' : 'star'} 
                  size={32} 
                  color="#2E7D32" 
                />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.planName}>{subscriptionInfo?.planName}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(subscriptionInfo?.status || '') }]}>
                  {subscriptionInfo?.status ? 
                    subscriptionInfo.status.charAt(0).toUpperCase() + subscriptionInfo.status.slice(1)
                    : ''}
                </Text>
              </View>
            </View>

            {/* Trial Warning Banner */}
            {subscriptionInfo?.type === 'trial' && isTrialNearExpiry && (
              <View style={styles.warningBanner}>
                <MaterialIcons name="warning" size={20} color="#F57C00" />
                <Text style={styles.warningText}>
                  Trial expires in {subscriptionInfo.daysLeftInTrial} days!
                </Text>
              </View>
            )}
          </View>

          {/* Trial Progress Section (only for trial users) */}
          {subscriptionInfo?.type === 'trial' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="timeline" size={24} color="#2E7D32" />
                <Text style={styles.sectionTitle}>Trial Progress</Text>
              </View>
              
              <View style={styles.trialProgressContainer}>
                <View style={styles.trialProgressHeader}>
                  <Text style={styles.trialDaysLeft}>
                    {subscriptionInfo.daysLeftInTrial} days remaining
                  </Text>
                  <Text style={styles.trialExpiryDate}>
                    Expires {formatDate(subscriptionInfo.trialExpiryDate || '')}
                  </Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${trialProgress}%`,
                          backgroundColor: isTrialNearExpiry ? '#F57C00' : '#4CAF50'
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.upgradeButton,
                    isTrialNearExpiry && styles.upgradeButtonUrgent
                  ]} 
                  onPress={handleSubscribe}
                >
                  <MaterialIcons name="upgrade" size={20} color="#FFFFFF" />
                  <Text style={styles.upgradeButtonText}>
                    {isTrialNearExpiry ? 'Purchase Before Expiry' : 'Purchase'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
                  <Text style={[
                    styles.detailValue,
                    isTrialNearExpiry && { color: '#F57C00', fontWeight: '700' }
                  ]}>
                    {formatDate(subscriptionInfo.trialExpiryDate)}
                  </Text>
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

          {/* Usage Statistics */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="analytics" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Usage This Month</Text>
            </View>
            
            <View style={styles.creditsContainer}>
              <View style={styles.creditsHeader}>
                <Text style={[
                  styles.creditsRemaining,
                  isUsageNearLimit && { color: '#F57C00' }
                ]}>
                  {subscriptionInfo?.usageThisMonth}
                </Text>
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
                        { 
                          width: `${((subscriptionInfo?.usageThisMonth || 0) / (subscriptionInfo?.usageLimit || 1)) * 100}%`,
                          backgroundColor: isUsageNearLimit ? '#F57C00' : '#4CAF50'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[
                    styles.progressText,
                    isUsageNearLimit && { color: '#F57C00', fontWeight: '600' }
                  ]}>
                    {(subscriptionInfo?.usageLimit ?? 0) - (subscriptionInfo?.usageThisMonth ?? 0)} uses remaining
                    {subscriptionInfo?.type === 'trial' && ' in trial'}
                  </Text>
                </View>
              )}
              
              {subscriptionInfo?.type === 'trial' ? (
                <TouchableOpacity 
                  style={[
                    styles.purchaseButton,
                    (isUsageNearLimit || isTrialNearExpiry) && styles.purchaseButtonUrgent
                  ]} 
                  onPress={handleSubscribe}
                >
                  <MaterialIcons name="upgrade" size={20} color="#FFFFFF" />
                  <Text style={styles.purchaseButtonText}>Subscribe for Unlimited</Text>
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
              {subscriptionInfo?.type !== 'trial' && (
                <TouchableOpacity style={styles.managementButton} onPress={handleManageSubscription}>
                  <MaterialIcons name="edit" size={20} color="#2E7D32" />
                  <Text style={styles.managementButtonText}>Manage Subscription</Text>
                  <MaterialIcons name="open-in-new" size={16} color="#666" />
                </TouchableOpacity>
              )}
              
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
    marginBottom: 15,
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
  avatarContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 50,
    padding: 10,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F57C00',
  },
  warningText: {
    color: '#F57C00',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Trial Progress Section
  trialProgressContainer: {
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  trialProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  trialDaysLeft: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  trialExpiryDate: {
    fontSize: 12,
    color: '#666',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonUrgent: {
    backgroundColor: '#F57C00',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    marginBottom: 8,
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
  },
  purchaseButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonUrgent: {
    backgroundColor: '#F57C00',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Management Container
  managementContainer: {
    gap: 12,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    justifyContent: 'space-between',
  },
  managementButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  
  // Legal Container
  legalContainer: {
    gap: 8,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
  },
  legalButtonText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});