// screens/MainChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ResultItem {
  ingredient: string;
  carbRange: string;
  peakTime: string;
}

export default function MainChatScreen({ navigation }: any) {
  const [inputText, setInputText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Animate the title scaling in
  const titleScale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.timing(titleScale, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = async () => {
    if (!inputText.trim() && !imageUri) {
      Alert.alert('Error', 'Please enter ingredients or attach an image');
      return;
    }

    setLoading(true);
    setResults([]);

    // ─── Simulate an API call ──────────────────────────────────────────────────────
    setTimeout(() => {
      // For demo: split the input by commas into “ingredients”
      const items = inputText
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const simulated: ResultItem[] = items.map(ing => ({
        ingredient: ing,
        carbRange: '10-20',   // Dummy carb range (g)
        peakTime: '1-2 hrs',  // Dummy peak time
      }));

      setResults(simulated);
      setLoading(false);
    }, 1500);
    // ────────────────────────────────────────────────────────────────────────────────
  };

  // ─── Image Picker Helpers ───────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll permission is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.cancelled) {
      setImageUri(result.uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.cancelled) {
      setImageUri(result.uri);
    }
  };

  const handleAttachImage = () => {
    Alert.alert('Add Image', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  // ────────────────────────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={['#A8E063', '#2E7D32']} style={styles.gradientContainer}>
      {/* ─── Title ───────────────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.headerContainer, { transform: [{ scale: titleScale }] }]}>
        <Text style={styles.title}>Carbie's Estimation</Text>
      </Animated.View>
      {/* ──────────────────────────────────────────────────────────────────────────────── */}

      {/* ─── Prompt Input + Attach Image + Submit ────────────────────────────────────── */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="What are you eating?"
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity onPress={handleAttachImage} style={styles.imageIconWrapper}>
            <MaterialIcons name="photo-camera" size={24} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#2E7D32" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* ──────────────────────────────────────────────────────────────────────────────── */}

      {/* ─── Image Preview (if added) ────────────────────────────────────────────────── */}
      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        </View>
      )}
      {/* ──────────────────────────────────────────────────────────────────────────────── */}

      {/* ─── Results Table ───────────────────────────────────────────────────────────── */}
      <ScrollView style={styles.resultsContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        {results.length > 0 && (
          <View style={styles.table}>
            {/* Header Row */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.headerCell, { flex: 0.4 }]}>Ingredient</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 0.3 }]}>Carb (g)</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 0.3 }]}>Peak BG Time</Text>
            </View>

            {/* Data Rows */}
            {results.map((item, index) => (
              <View
                key={index.toString()}
                style={[
                  styles.row,
                  index % 2 === 0 ? styles.evenRow : styles.oddRow,
                ]}
              >
                <Text style={[styles.cell, { flex: 0.4 }]} numberOfLines={1}>
                  {item.ingredient}
                </Text>
                <Text style={[styles.cell, { flex: 0.3 }]}>{item.carbRange}</Text>
                <Text style={[styles.cell, { flex: 0.3 }]}>{item.peakTime}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      {/* ──────────────────────────────────────────────────────────────────────────────── */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ─── Input + Attach Image + Submit ─────────────────────────────────────────────
  inputSection: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    maxHeight: 80,
    fontSize: 16,
    color: '#333',
    paddingBottom: 10,
  },
  imageIconWrapper: {
    padding: 8,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    borderRadius: 30,
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // ────────────────────────────────────────────────────────────────────────────────

  // ─── Image Preview ──────────────────────────────────────────────────────────────
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  // ────────────────────────────────────────────────────────────────────────────────

  // ─── Results Table ──────────────────────────────────────────────────────────────
  resultsContainer: {
    flex: 1,
  },
  table: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  evenRow: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  oddRow: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  cell: {
    fontSize: 15,
    color: '#333',
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  // ────────────────────────────────────────────────────────────────────────────────
});
