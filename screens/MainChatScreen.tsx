// screens/MainChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../services/ApiClient';
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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../services/AuthService';

interface IngredientData {
  ingredient: string;
  is_liquid: boolean;
  estimated_weight_volume: number;
  low_carb_estimate: number;
  high_carb_estimate: number;
  peak_bg_time: string;
}

interface StructuredData {
  is_food_related: boolean;
  ingredients: IngredientData[];
  message: string;
}

interface ResultItem {
  ingredient: string;
  weightVolume: string;
  carbRange: string;
  peakTime: string;
}

interface JobResponse {
  job_id: string;
  status: string;
}

interface CarbieResult {
  model_name: string;
  model_version: string;
  prompt: string;
  structured_data?: StructuredData;
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  elapsed_time_seconds: number;
}

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

export default function MainChatScreen({ navigation }: any) {
  const [inputText, setInputText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [fullResponse, setFullResponse] = useState<CarbieResult | null>(null);
  const [showDebugBox, setShowDebugBox] = useState(true);
  const [analysisMessage, setAnalysisMessage] = useState<string>('');

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

  const handleLogout = async () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await authService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          },
        },
      ]
    );
  };

  const pollJobStatus = async (jobId: string): Promise<CarbieResult | null> => {
    const maxAttempts = 60; // Poll for up to 5 minutes (1s intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        setLoadingStatus(`Checking status... (${attempts + 1}/${maxAttempts})`);
        
        const statusResponse = await apiClient.get(`/api/v1/job/status/${jobId}`);
        
        if (!statusResponse.success) {
          throw new Error(statusResponse.error || 'Failed to check job status');
        }

        const statusData = statusResponse.data;
        
        if (statusData.status === 'completed') {
          // Get the result
          const resultResponse = await apiClient.get<CarbieResult>(`/api/v1/job/result/${jobId}`);
          
          if (resultResponse.success && resultResponse.data) {
            return resultResponse.data;
          } else {
            throw new Error(resultResponse.error || 'Failed to get job result');
          }
        } else if (statusData.status === 'failed') {
          throw new Error('Job processing failed');
        } else if (statusData.status === 'processing') {
          setLoadingStatus('Processing your request...');
        } else if (statusData.status === 'queued') {
          setLoadingStatus('Your request is in queue...');
        }

        // Wait 1 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error('Error polling job status:', error);
        throw error;
      }
    }

    throw new Error('Request timed out');
  };

  const parseStructuredResponse = (response: CarbieResult): ResultItem[] => {
    // Check if we have structured data
    if (response.structured_data && response.structured_data.ingredients) {
      const { structured_data } = response;
      
      // Set the analysis message
      setAnalysisMessage(structured_data.message || '');
      
      // Convert structured ingredients to ResultItem format
      return structured_data.ingredients.map((ingredient: IngredientData) => {
        // Format weight/volume with appropriate unit
        const weightVolumeDisplay = ingredient.is_liquid 
          ? `${ingredient.estimated_weight_volume}ml`
          : `${ingredient.estimated_weight_volume}g`;
        
        // Format carb range
        const carbRange = ingredient.low_carb_estimate === ingredient.high_carb_estimate
          ? `${ingredient.low_carb_estimate}g`
          : `${ingredient.low_carb_estimate}-${ingredient.high_carb_estimate}g`;
        
        return {
          ingredient: ingredient.ingredient,
          weightVolume: weightVolumeDisplay,
          carbRange: carbRange,
          peakTime: ingredient.peak_bg_time,
        };
      });
    }
    
    // Fallback to old parsing method if no structured data
    setAnalysisMessage('Analysis completed');
    return [
      {
        ingredient: 'Analysis completed',
        weightVolume: 'See details',
        carbRange: 'See response',
        peakTime: 'Check details',
      }
    ];
  };

  const handleSubmit = async () => {
    if (!inputText.trim() && !imageUri) {
      showAlert('Error', 'Please enter ingredients or attach an image');
      return;
    }

    setLoading(true);
    setResults([]);
    setFullResponse(null);
    setAnalysisMessage('');
    setLoadingStatus('Submitting request...');

    try {
      // Check if user is still authenticated
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        showAlert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
        return;
      }

      // Prepare prompt
      let prompt = inputText.trim();
      if (imageUri) {
        prompt += imageUri ? '\n[Image attached - please analyze the food items in the image]' : '';
      }

      // Submit to Carbie inference endpoint using API client
      const response = await apiClient.post<JobResponse>('/api/v1/carbie/', {
        model_name: 'claude-haiku',
        model_version: 'latest',
        prompt: prompt,
      });

      if (!response.success) {
        if (response.statusCode === 401) {
          showAlert('Session Expired', 'Please login again');
          await authService.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
          return;
        }
        throw new Error(response.error || 'Failed to submit request');
      }

      if (!response.data) {
        throw new Error('No job ID received from server');
      }

      console.log('Job submitted:', response.data.job_id);

      // Poll for results
      const result = await pollJobStatus(response.data.job_id);
      
      if (result) {
        console.log('Got result:', result);
        setFullResponse(result);
        const parsedResults = parseStructuredResponse(result);
        setResults(parsedResults);
      } else {
        throw new Error('No result received');
      }

    } catch (error) {
      console.error('Error submitting request:', error);
      showAlert(
        'Error',
        error instanceof Error ? error.message : 'Failed to process your request. Please try again.'
      );
    } finally {
      setLoading(false);
      setLoadingStatus('');
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
      setImageUri(result.assets[0].uri);
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
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAttachImage = () => {
    showAlert('Add Image', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <LinearGradient colors={['#A8E063', '#2E7D32']} style={styles.gradientContainer}>
      {/* Header with logout button */}
      <View style={styles.header}>
        <Animated.View style={[styles.headerContainer, { transform: [{ scale: titleScale }] }]}>
          <Text style={styles.title}>Carbie's Estimation</Text>
        </Animated.View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="What are you eating?"
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!loading}
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
            onPress={() => setImageUri(null)}
            style={styles.removeImageButton}
          >
            <MaterialIcons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Analysis Message */}
      {analysisMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{analysisMessage}</Text>
        </View>
      )}

      {/* Debug Response Box */}
      {fullResponse && (
        <View style={styles.debugContainer}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Response Details (Debug)</Text>
            <TouchableOpacity 
              onPress={() => setShowDebugBox(!showDebugBox)}
              style={styles.toggleButton}
            >
              <MaterialIcons 
                name={showDebugBox ? "expand-less" : "expand-more"} 
                size={20} 
                color="#2E7D32" 
              />
            </TouchableOpacity>
          </View>
          
          {showDebugBox && (
            <ScrollView style={styles.debugContent} nestedScrollEnabled={true}>
              <Text style={styles.debugText}>
                <Text style={styles.debugLabel}>Model:</Text> {fullResponse.model_name} ({fullResponse.model_version})
              </Text>
              
              <Text style={styles.debugText}>
                <Text style={styles.debugLabel}>Prompt:</Text> {fullResponse.prompt}
              </Text>
              
              <Text style={styles.debugText}>
                <Text style={styles.debugLabel}>Elapsed Time:</Text> {fullResponse.elapsed_time_seconds.toFixed(2)}s
              </Text>
              
              <Text style={styles.debugText}>
                <Text style={styles.debugLabel}>Usage:</Text>
              </Text>
              <View style={styles.usageContainer}>
                {Object.entries(fullResponse.usage).map(([key, value]) => (
                  <Text key={key} style={styles.usageText}>
                    • {key}: {value}
                  </Text>
                ))}
              </View>
              
              <Text style={styles.debugText}>
                <Text style={styles.debugLabel}>Full Response JSON:</Text>
              </Text>
              <Text style={styles.jsonText}>
                {JSON.stringify(fullResponse, null, 2)}
              </Text>
            </ScrollView>
          )}
        </View>
      )}

      {/* Results Table */}
      <ScrollView style={styles.resultsContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        {results.length > 0 && (
          <View style={styles.table}>
            {/* Header Row */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.headerCell, { flex: 0.35 }]}>Ingredient</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 0.2 }]}>Amount</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 0.25 }]}>Carbs</Text>
              <Text style={[styles.cell, styles.headerCell, { flex: 0.2 }]}>Peak BG</Text>
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
                <Text style={[styles.cell, { flex: 0.35 }]} numberOfLines={2}>
                  {item.ingredient}
                </Text>
                <Text style={[styles.cell, { flex: 0.2 }]}>{item.weightVolume}</Text>
                <Text style={[styles.cell, { flex: 0.25 }]}>{item.carbRange}</Text>
                <Text style={[styles.cell, { flex: 0.2 }]}>{item.peakTime}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    padding: 8,
  },
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
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
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
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
  debugContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FFA726',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF3E0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  toggleButton: {
    padding: 4,
  },
  debugContent: {
    maxHeight: 200,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  debugLabel: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  usageContainer: {
    paddingLeft: 12,
    marginBottom: 8,
  },
  usageText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  jsonText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#444',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
    lineHeight: 16,
  },
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
    fontSize: 14,
    color: '#333',
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#2E7D32',
    fontSize: 14,
  },
});