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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function RegistrationScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Animated values
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const emailAnim = useRef(new Animated.Value(0)).current;
  const passAnim = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

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

    setLoading(true);
    // TODO: Implement real registration API call
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('MainChat');
    }, 1000);
  };

  return (
    <LinearGradient
      colors={['#A8E063', '#2E7D32']}
      style={styles.gradientContainer}
    >
      <Animated.View style={[styles.headerContainer, { transform: [{ scale: titleScale }] }]}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Carbie to start your nutrition journey</Text>
      </Animated.View>

      <Animated.View style={[styles.inputContainer, { opacity: emailAnim, transform: [{ translateY: emailAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="email" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.inputContainer, { opacity: passAnim, transform: [{ translateY: passAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="lock" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: buttonOpacity }}>
        <TouchableOpacity
          style={[
            styles.button,
            loading ? styles.buttonDisabled : {},
          ]}
          onPress={handleRegistration}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
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
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '600',
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
