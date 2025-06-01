import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const FEATURES = [
  'Get your carb estimate, fast from AI',
  'Improve your confidence in estimating',
  'Let Carbie handle giving the AI additional context',
  'No commitment required',
  'Get 100 uses with your trial period',
  'Pay for uses, not subscription',
];

export default function TrialInfoScreen({ navigation }: any) {
  // Animated values
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const featureAnimations = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1) Scale in the title
    Animated.timing(titleScale, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();

    // 2) Stagger-fade each feature
    Animated.stagger(
      150,
      featureAnimations.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        })
      )
    ).start();

    // 3) Fade in the buttons after features
    Animated.timing(buttonOpacity, {
      toValue: 1,
      delay: 150 * FEATURES.length,
      duration: 800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient
      colors={['#A8E063', '#2E7D32']}
      style={styles.gradientContainer}
    >
      <Animated.View style={[styles.headerContainer, { transform: [{ scale: titleScale }] }]}>
        <Text style={styles.title}>Start Your Free Trial</Text>
        <Text style={styles.subtitle}>Get full access to Carbie’s features</Text>
      </Animated.View>

      <View style={styles.cardContainer}>
        <ScrollView
          contentContainerStyle={styles.featureList}
          showsVerticalScrollIndicator={false}
        >
          {FEATURES.map((feat, index) => (
            <Animated.View
              key={index}
              style={{ opacity: featureAnimations[index], transform: [{ translateY: featureAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }) }] }}
            >
              <View style={styles.featureRow}>
                <MaterialIcons name="check-circle" size={20} color="#2E7D32" style={{ marginRight: 8 }} />
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      <Animated.View style={{ opacity: buttonOpacity }}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Registration')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <Text style={styles.linkText}>Back</Text>
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
    marginBottom: 30,
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
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 30,
    elevation: 4, // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // iOS shadow
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 280,
  },
  featureList: {
    // Ensures inner content is centered if short
    paddingVertical: 0,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3, // Android
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
