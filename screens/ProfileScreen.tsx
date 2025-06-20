// screens/ProfileScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUserProfile();
    
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

  const loadUserProfile = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email);
      } else {
        showAlert('Error', 'Could not load user profile');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      showAlert('Error', 'Failed to load user profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      showAlert('Error', 'Email cannot be empty');
      return;
    }

    if (!validateEmail(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    if (email === user?.email) {
      setIsEditingEmail(false);
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.put(`/api/v1/user/${user?.id}`, {
        email: email.toLowerCase().trim(),
      });

      if (response.success && response.data) {
        setUser(response.data);
        setIsEditingEmail(false);
        showAlert('Success', 'Email updated successfully');
      } else {
        throw new Error(response.error || 'Failed to update email');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to update email');
      setEmail(user?.email || ''); // Reset to original email
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showAlert('Error', 'Please enter your current password');
      return;
    }

    if (!newPassword) {
      showAlert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      showAlert('Error', 'New password must be different from current password');
      return;
    }

    setSaving(true);

    try {
      // First verify current password by attempting to login
      const loginResponse = await apiClient.post('/api/v1/token/login', {
        email: user?.email,
        password: currentPassword,
      }, { skipAuth: true });

      if (!loginResponse.success) {
        throw new Error('Current password is incorrect');
      }

      // If login successful, update password
      const response = await apiClient.put(`/api/v1/user/${user?.id}`, {
        password: newPassword,
      });

      if (response.success) {
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showAlert('Success', 'Password changed successfully');
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const cancelEmailEdit = () => {
    setEmail(user?.email || '');
    setIsEditingEmail(false);
  };

  const cancelPasswordChange = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#A8E063', '#2E7D32']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#A8E063', '#2E7D32']} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.profileContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Profile Header */}
          <View style={styles.headerSection}>
            <View style={styles.avatarContainer}>
              <MaterialIcons name="account-circle" size={80} color="#2E7D32" />
            </View>
            <Text style={styles.userTypeText}>
              {user?.email}
            </Text>
            <Text style={styles.systemText}>Carbie User Profile</Text>
          </View>

          {/* Email Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="email" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Email Address</Text>
            </View>
            
            {isEditingEmail ? (
              <View style={styles.editSection}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={cancelEmailEdit}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
                    onPress={handleUpdateEmail}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.displaySection}>
                <Text style={styles.displayText}>{user?.email}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditingEmail(true)}
                >
                  <MaterialIcons name="edit" size={20} color="#2E7D32" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Password Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="lock" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Password</Text>
            </View>
            
            {isChangingPassword ? (
              <View style={styles.editSection}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password (min 6 characters)"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!saving}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={cancelPasswordChange}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
                    onPress={handleChangePassword}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Change</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.displaySection}>
                <Text style={styles.displayText}>••••••••</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsChangingPassword(true)}
                >
                  <MaterialIcons name="edit" size={20} color="#2E7D32" />
                  <Text style={styles.editButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Profile Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="person" size={24} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User ID:</Text>
                <Text style={styles.infoValue}>{user?.id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Status:</Text>
                <Text style={[styles.infoValue, { color: user?.is_active ? '#4CAF50' : '#F44336' }]}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              {user?.is_admin && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Admin User:</Text>
                  <Text style={[styles.infoValue, { color: '#FF9800' }]}>Yes</Text>
                </View>
              )}
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
  profileContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 50,
    padding: 10,
    marginBottom: 15,
  },
  userTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 5,
  },
  systemText: {
    fontSize: 14,
    color: '#666',
  },
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
  displaySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
  },
  displayText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
  },
  editButtonText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 5,
  },
  editSection: {
    gap: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  button: {
    flex: 1,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});