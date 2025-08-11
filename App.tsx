// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Purchases from 'react-native-purchases';

import WelcomeScreen from './screens/WelcomeScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import LoginScreen from './screens/LoginScreen';
import MainChatScreen from './screens/MainChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import AccountScreen from './screens/AccountScreen';

import { authService } from './services/AuthService';
import { REVENUECAT_CONFIG } from './config/revenuecat';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize RevenueCat
      console.log('Initializing RevenueCat...');
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_CONFIG.API_KEY_IOS : REVENUECAT_CONFIG.API_KEY_ANDROID;
      console.log('Using RevenueCat API key:', apiKey);
      console.log('Platform:', Platform.OS);
      
      await Purchases.configure({
        apiKey: apiKey,
        appUserID: null, // Will be set when user logs in
      });
      console.log('RevenueCat initialized successfully');
      
      // Test RevenueCat configuration
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        console.log('RevenueCat customer info:', customerInfo);
        
        // Check offerings
        const offerings = await Purchases.getOfferings();
        console.log('RevenueCat offerings:', {
          current: offerings.current?.identifier,
          available: Object.keys(offerings.all),
          all: offerings.all
        });
      } catch (error) {
        console.error('Error getting RevenueCat customer info:', error);
      }

      // Check authentication status
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#A8E063', '#2E7D32']}
        style={styles.loadingContainer}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'MainChat' : 'Welcome'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Public screens */}
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Registration"
          component={RegistrationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Protected screens */}
        <Stack.Screen
          name="MainChat"
          component={MainChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{ title: 'Account' }}
        />
        

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});