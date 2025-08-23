// components/FoodInput.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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

interface FoodInputProps {
  inputText: string;
  onInputTextChange: (text: string) => void;
  imageUri: string | null;
  onImageChange: (uri: string | null) => void;
  loading: boolean;
  loadingStatus: string;
  onSubmit: () => void;
}

export default function FoodInput({
  inputText,
  onInputTextChange,
  imageUri,
  onImageChange,
  loading,
  loadingStatus,
  onSubmit,
}: FoodInputProps) {
  
  // Word limit constant
  const WORD_LIMIT = 250;
  
  // Calculate current word count
  const getWordCount = (text: string) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };
  
  const currentWordCount = getWordCount(inputText);
  const isAtWordLimit = currentWordCount >= WORD_LIMIT;
  
  // Handle text input with word limit
  const handleTextChange = (text: string) => {
    const newWordCount = getWordCount(text);
    if (newWordCount <= WORD_LIMIT) {
      onInputTextChange(text);
    }
  };
  
  // Image Picker Helpers
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission required', 'Camera roll permission is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onImageChange(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission required', 'Camera permission is needed.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onImageChange(result.assets[0].uri);
    }
  };

  const handleAttachImage = () => {
    showAlert('Add Image', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmitPress = () => {
    if (!inputText.trim() && !imageUri) {
      showAlert('Error', 'Please enter ingredients or attach an image');
      return;
    }
    onSubmit();
  };

  return (
    <View style={styles.container}>
      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.textInput, isAtWordLimit && styles.textInputAtLimit]}
            placeholder="What are you eating?"
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={handleTextChange}
            multiline
            editable={!loading}

          />
          
          {/* Word Counter in Bottom Right Corner */}
          <View style={styles.wordCounterOverlay}>
            <Text style={[
              styles.wordCounterText,
              isAtWordLimit && styles.wordCounterTextAtLimit
            ]}>
              {currentWordCount}/{WORD_LIMIT}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleAttachImage} style={styles.imageIconWrapper}>
            <MaterialIcons name="photo-camera" size={24} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmitPress}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color="#2E7D32" />
              <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                {loadingStatus || 'Processing...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <TouchableOpacity
            onPress={() => onImageChange(null)}
            style={styles.removeImageButton}
          >
            <MaterialIcons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 15,
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
    paddingBottom: 25,
    paddingRight: 50,
  },
  textInputAtLimit: {
    borderWidth: 2,
    borderColor: '#FF5722',
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
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 0,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordCounterOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    zIndex: 1,
  },
  wordCounterText: {
    fontSize: 11,
    color: 'rgba(102, 102, 102, 0.7)',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  wordCounterTextAtLimit: {
    color: 'rgba(255, 87, 34, 0.8)',
  },
});