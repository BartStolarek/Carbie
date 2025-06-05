// screens/RegistrationScreen.tsx
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

// API base URL
const API_BASE_URL = 'https://bartstolarek.com';

export default function RegistrationScreen({ navigation }: any) {
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

  // Animate dots ("Creating Account.", "Creating Account..", "Creating Account...")
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

  const handleRegistration = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
          system: 'carbie',
          user_type: 'trial',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Log for debugging
        console.log('Registration successful, status:', response.status);
        console.log('User data:', data);
        console.log('Navigation object:', navigation);
        console.log('Available routes:', navigation.getState?.());
        
        // Navigate immediately without alert first to test
        console.log('Attempting immediate navigation...');
        try {
          navigation.navigate('MainChat');
          console.log('Navigation command sent successfully');
        } catch (navigationError) {
          console.error('Navigation error:', navigationError);
        }
        
        Alert.alert(
          'Success!',
          'Your account has been created successfully. You can now start using Carbie!',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('Alert OK pressed, navigating to MainChat...');
                try {
                  navigation.navigate('MainChat');
                  console.log('Navigation from alert completed');
                } catch (navigationError) {
                  console.error('Navigation error from alert:', navigationError);
                  // Fallback navigation
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainChat' }],
                  });
                }
              },
            },
          ]
        );
      } else {
        let errorMessage = 'Registration failed. Please try again.';

        if (response.status === 400) {
          // Handle email already registered
          if (data.detail && typeof data.detail === 'object' && data.detail.detail) {
            // Handle nested detail structure: {"detail":{"detail":"Email already registered for carbie"}}
            errorMessage = data.detail.detail;
          } else if (data.detail && typeof data.detail === 'string') {
            // Handle direct string detail: {"detail":"Email already registered for carbie"}
            errorMessage = data.detail;
          } else {
            errorMessage = 'This email address is already registered. Please try a different email or sign in instead.';
          }
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

        Alert.alert('Registration Failed', errorMessage);
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Compose "Creating Account" text with animated dots
  const loadingText = 'Creating Account' + '.'.repeat(dotCount);

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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join Carbie to start your nutrition journey
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
            placeholder="Password (min 6 characters)"
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
            onPress={handleRegistration}
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
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.linkButton}
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