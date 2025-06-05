// screens/LoginScreen.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

// API base URL
const API_BASE_URL = 'https://bartstolarek.com';

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

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dotCount, setDotCount] = useState(0);

  // Animated values
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const emailAnim = useRef(new Animated.Value(0)).current;
  const passAnim = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Button pulse animation
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Animate dots ("Signing In.", "Signing In..", "Signing In...")
  useEffect(() => {
    let dotInterval: NodeJS.Timer;

    if (loading) {
      dotInterval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 400);
    } else {
      setDotCount(0);
    }

    return () => {
      if (dotInterval) clearInterval(dotInterval);
    };
  }, [loading]);

  // When `loading` toggles, start/stop the pulsing loop
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 1.05,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset scale back to 1 immediately when not loading
      buttonScale.setValue(1);
    }
  }, [loading]);

  useEffect(() => {
    // 1) Scale in the title
    Animated.timing(titleScale, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();

    // 2) Fade in email, password, then button
    Animated.sequence([
      Animated.timing(emailAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(passAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/token/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the token securely
        try {
          await SecureStore.setItemAsync('auth_token', data.access_token);
        } catch (error) {
          console.warn('Could not store token securely:', error);
          // Fallback for platforms that don't support SecureStore
          if (Platform.OS === 'web') {
            localStorage.setItem('auth_token', data.access_token);
          }
        }

        // Navigate immediately to MainChat
        navigation.navigate('MainChat');
        
        // Show success message
        showAlert(
          'Welcome Back!',
          'You have been signed in successfully.'
        );
      } else {
        let errorMessage = 'Login failed. Please try again.';

        if (response.status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (response.status === 422) {
          // Handle validation errors
          if (data.detail && Array.isArray(data.detail)) {
            errorMessage = data.detail.map((err: any) => err.msg).join(', ');
          } else if (data.detail) {
            errorMessage = data.detail;
          } else {
            errorMessage = 'Please check your input and try again.';
          }
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        showAlert('Login Failed', errorMessage);
      }
    } catch (error) {
      showAlert(
        'Network Error',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Compose "Signing In" text with animated dots
  const loadingText = 'Signing In' + '.'.repeat(dotCount);

  return (
    <LinearGradient
      colors={['#A8E063', '#2E7D32']}
      style={styles.gradientContainer}
    >
      <Animated.View
        style={[
          styles.headerContainer,
          { transform: [{ scale: titleScale }] },
        ]}
      >
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to continue your nutrition journey
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.inputContainer,
          {
            opacity: emailAnim,
            transform: [
              {
                translateY: emailAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <MaterialIcons
            name="email"
            size={20}
            color="#666"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.inputContainer,
          {
            opacity: passAnim,
            transform: [
              {
                translateY: passAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <MaterialIcons
            name="lock"
            size={20}
            color="#666"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: buttonOpacity }}>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.button, loading ? styles.buttonDisabled : {}]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color="#2E7D32" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  {loadingText}
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Registration')}
          activeOpacity={0.6}
          disabled={loading}
        >
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.linkButton, { marginTop: 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
          disabled={loading}
        >
          <Text style={styles.linkText}>Back to Welcome</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    color: '#E0F2F1',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Android
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3, // Android
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});