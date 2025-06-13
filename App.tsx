// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import WelcomeScreen from './screens/WelcomeScreen';
import TrialInfoScreen from './screens/TrialInfoScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import LoginScreen from './screens/LoginScreen';
import MainChatScreen from './screens/MainChatScreen';
import PurchaseScreen from './screens/PurchaseScreen';

import { authService } from './services/AuthService';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
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
          // cardStyle is not needed with createNativeStackNavigator
        }}
      >
        {/* Public screens */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TrialInfo" 
          component={TrialInfoScreen}
          options={{ title: 'Free Trial' }}
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
          name="Purchase" 
          component={PurchaseScreen}
          options={{ title: 'Purchase Credits' }}
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