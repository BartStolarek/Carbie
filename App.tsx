import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import NavigationBar from './components/NavigationBar';

// Import your screens
import WelcomeScreen from './screens/WelcomeScreen';
import TrialInfoScreen from './screens/TrialInfoScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import MainChatScreen from './screens/MainChatScreen';
import PurchaseScreen from './screens/PurchaseScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Welcome"
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
          options={{ title: 'Create Account' }}
        />
        <Stack.Screen 
          name="MainChat" 
          component={MainChatScreen}
          options={{ title: 'Main' }}
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