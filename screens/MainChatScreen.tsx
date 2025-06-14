// screens/MainChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../services/ApiClient';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../services/AuthService';

// Import the new components
import FoodInput from '../components/FoodInput';
import AnalysisMessage from '../components/AnalysisMessage';
import DebugResponse from '../components/DebugResponse';
import IngredientsTable, { ResultItem } from '../components/IngredientsTable';
import TotalAnalysis from '../components/TotalAnalysis';
import CarbAbsorptionChart from '../components/CarbAbsorptionChart';

interface IngredientData {
  ingredient: string;
  is_liquid: boolean;
  estimated_weight_volume: number;
  low_carb_estimate: number;
  high_carb_estimate: number;
  gi_index: number;
  peak_bg_time: string;
}

interface StructuredData {
  is_food_related: boolean;
  ingredients: IngredientData[];
  aggregated_peak_bg_time_minutes: number;
  message: string;
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
    input_cost_usd?: number;
    output_cost_usd?: number;
    cache_write_cost_usd?: number;
    cache_read_cost_usd?: number;
    total_cost_usd?: number;
  };
  elapsed_time_seconds: number;
}

// Hardcoded test response
const TEST_RESPONSE: CarbieResult = {
  "model_name": "claude-haiku",
  "model_version": "latest",
  "prompt": "test",
  "structured_data": {
    "is_food_related": true,
    "aggregated_peak_bg_time_minutes": 60,
    "ingredients": [
      {
        "ingredient": "Roast Potatoes",
        "is_liquid": false,
        "estimated_weight_volume": 200,
        "low_carb_estimate": 30,
        "high_carb_estimate": 40,
        "gi_index": 70,
        "peak_bg_time": "90min"
      },
      {
        "ingredient": "Roast Beef",
        "is_liquid": false,
        "estimated_weight_volume": 150,
        "low_carb_estimate": 0,
        "high_carb_estimate": 2,
        "gi_index": 0,
        "peak_bg_time": "45min"
      },
      {
        "ingredient": "Yorkshire Pudding",
        "is_liquid": false,
        "estimated_weight_volume": 50,
        "low_carb_estimate": 10,
        "high_carb_estimate": 15,
        "gi_index": 80,
        "peak_bg_time": "60min"
      },
      {
        "ingredient": "Roasted Vegetables",
        "is_liquid": false,
        "estimated_weight_volume": 100,
        "low_carb_estimate": 5,
        "high_carb_estimate": 10,
        "gi_index": 50,
        "peak_bg_time": "60min"
      },
      {
        "ingredient": "Gravy",
        "is_liquid": true,
        "estimated_weight_volume": 50,
        "low_carb_estimate": 2,
        "high_carb_estimate": 5,
        "gi_index": 20,
        "peak_bg_time": "45min"
      }
    ],
    "message": "Carb estimates for a typical Sunday roast dinner components"
  },
  "usage": {
    "input_tokens": 2947,
    "output_tokens": 839,
    "total_tokens": 3786,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "input_cost_usd": 0.0023576,
    "output_cost_usd": 0.003356,
    "cache_write_cost_usd": 0,
    "cache_read_cost_usd": 0,
    "total_cost_usd": 0.0057136
  },
  "elapsed_time_seconds": 13.724469
};

const TEST_RESPONSE2: CarbieResult = {
  "model_name": "claude-haiku",
  "model_version": "latest",
  "prompt": "sunday roast dinner, with lamb, pumpkin, potatoes, peas, mint jelly sauce and gravy and also 30 grams of glucose tablets",
  "structured_data": {
    "is_food_related": true,
    "ingredients": [
      {
        "ingredient": "Lamb",
        "is_liquid": false,
        "estimated_weight_volume": 150,
        "low_carb_estimate": 0,
        "high_carb_estimate": 0,
        "gi_index": 0,
        "peak_bg_time": "0min"
      },
      {
        "ingredient": "Pumpkin",
        "is_liquid": false,
        "estimated_weight_volume": 100,
        "low_carb_estimate": 10,
        "high_carb_estimate": 15,
        "gi_index": 75,
        "peak_bg_time": "45min"
      },
      {
        "ingredient": "Potatoes",
        "is_liquid": false,
        "estimated_weight_volume": 150,
        "low_carb_estimate": 25,
        "high_carb_estimate": 30,
        "gi_index": 80,
        "peak_bg_time": "60min"
      },
      {
        "ingredient": "Peas",
        "is_liquid": false,
        "estimated_weight_volume": 50,
        "low_carb_estimate": 5,
        "high_carb_estimate": 8,
        "gi_index": 50,
        "peak_bg_time": "45min"
      },
      {
        "ingredient": "Mint Jelly Sauce",
        "is_liquid": true,
        "estimated_weight_volume": 30,
        "low_carb_estimate": 5,
        "high_carb_estimate": 10,
        "gi_index": 70,
        "peak_bg_time": "45min"
      },
      {
        "ingredient": "Gravy",
        "is_liquid": true,
        "estimated_weight_volume": 50,
        "low_carb_estimate": 2,
        "high_carb_estimate": 5,
        "gi_index": 40,
        "peak_bg_time": "30min"
      },
      {
        "ingredient": "Glucose Tablets",
        "is_liquid": false,
        "estimated_weight_volume": 30,
        "low_carb_estimate": 30,
        "high_carb_estimate": 30,
        "gi_index": 100,
        "peak_bg_time": "15min"
      }
    ],
    "aggregated_peak_bg_time_minutes": 60,
    "message": "Sunday roast carb breakdown"
  },
  "usage": {
    "input_tokens": 1344,
    "output_tokens": 716,
    "total_tokens": 2060,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "input_cost_usd": 0.0010752,
    "output_cost_usd": 0.002864,
    "cache_write_cost_usd": 0,
    "cache_read_cost_usd": 0,
    "total_cost_usd": 0.0039392
  },
  "elapsed_time_seconds": 9.499581
};

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
    setLoading(true);
    setResults([]);
    setFullResponse(null);
    setAnalysisMessage('');
    setLoadingStatus('Submitting request...');

    try {
      // Check if this is a test prompt
      if (inputText.trim().toLowerCase() === 'test') {
        setLoadingStatus('Processing test request...');

        // Simulate some loading time for test
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Using test response');
        setFullResponse(TEST_RESPONSE);
        const parsedResults = parseStructuredResponse(TEST_RESPONSE);
        setResults(parsedResults);
        return;
      }

      if (inputText.trim().toLowerCase() === 'test2') {
        setLoadingStatus('Processing test2 request...');

        // Simulate some loading time for test
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Using test response');
        setFullResponse(TEST_RESPONSE2);
        const parsedResults = parseStructuredResponse(TEST_RESPONSE2);
        setResults(parsedResults);
        return;
      }

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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#A8E063', '#2E7D32']} style={styles.gradientContainer}>
        {/* Header with logout button - Outside ScrollView */}
        <View style={styles.header}>
          <Animated.View style={[styles.headerContainer, { transform: [{ scale: titleScale }] }]}>
            <Text style={styles.title}>Carbie's Estimation</Text>
          </Animated.View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ScrollView for main content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Food Input Component */}
          <FoodInput
            inputText={inputText}
            onInputTextChange={setInputText}
            imageUri={imageUri}
            onImageChange={setImageUri}
            loading={loading}
            loadingStatus={loadingStatus}
            onSubmit={handleSubmit}
          />

          {/* Analysis Message Component */}
          <AnalysisMessage message={analysisMessage} />



          {/* Total Analysis Component */}
          {fullResponse?.structured_data && (
            <TotalAnalysis aggregated_peak_bg_time_minutes={fullResponse.structured_data.aggregated_peak_bg_time_minutes} ingredients={fullResponse.structured_data.ingredients} />
          )}

          {/* Ingredients Table Component */}
          <IngredientsTable results={results} />

          {/* Carb Absorption Chart Component */}
          {fullResponse?.structured_data && (
            <CarbAbsorptionChart ingredients={fullResponse.structured_data.ingredients} />
          )}

          {/* Debug Response Component */}
          {fullResponse && (
            <DebugResponse fullResponse={fullResponse} initiallyExpanded={true} />
          )}

        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // Account for status bar
    paddingBottom: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Add padding at bottom for better scrolling
  },
});