// screens/MainChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../services/ApiClient';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

// Import the new components
import FoodInput from '../components/FoodInput';
import AnalysisMessage from '../components/AnalysisMessage';
import DebugPanel from '../components/DebugPanel';
import IngredientsTable, { ResultItem } from '../components/IngredientsTable';
import TotalAnalysis from '../components/TotalAnalysis';
import CarbAbsorptionChart from '../components/CarbAbsorptionChart';
import MenuDropdown from '../components/MenuDropdown';
import { authService } from '../services/AuthService';
import { accessService, AccessResult } from '../services/AccessService';
import { loggingService, LogMessage } from '../services/LoggingService';
import TestDataService from '../services/TestDataService';
import { CarbieResult, IngredientData, JobResponse } from '../types/CarbieTypes';

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
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessResult, setAccessResult] = useState<AccessResult | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);

  // Animate the title scaling in
  const titleScale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.timing(titleScale, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
    
    // Add a test log when component mounts
    loggingService.info('MainChatScreen component mounted');
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Add some initial logging to test the debug panel
      loggingService.info('MainChatScreen focused - starting access check');
      
    }, [])
  );

  // Listen to log events
  useEffect(() => {
    const handleLogAdded = () => {
      setLogs(loggingService.getLogs());
    };

    loggingService.addListener(handleLogAdded);

    // Initialize logs
    setLogs(loggingService.getLogs());
    
    // Add initial debug message to ensure panel is visible
    loggingService.info('Debug panel initialized and ready');
    loggingService.info('Platform:', Platform.OS);
    loggingService.info('Component mounted on:', Platform.OS);

    return () => {
      loggingService.removeListener(handleLogAdded);
    };
  }, []);

  const pollJobStatus = async (jobId: string): Promise<CarbieResult | null> => {
    const maxAttempts = 60; // Poll for up to 5 minutes (1s intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        setLoadingStatus(`Checking status... (${attempts + 1}/${maxAttempts})`);

        const statusResponse = await apiClient.get(`/api/v1/job/status/${jobId}`);

        if (!statusResponse.success) {
          loggingService.error('Failed to check job status:', statusResponse.error);
          throw new Error(statusResponse.error || 'Failed to check job status');
        }

        const statusData = statusResponse.data;

        if (statusData.status === 'completed') {
          loggingService.info('Job completed, fetching result...');
          // Get the result
          const resultResponse = await apiClient.get<CarbieResult>(`/api/v1/job/result/${jobId}`);

          if (resultResponse.success && resultResponse.data) {
            loggingService.info('Successfully retrieved job result');
            return resultResponse.data;
          } else {
            loggingService.error('Failed to get job result:', resultResponse.error);
            throw new Error(resultResponse.error || 'Failed to get job result');
          }
        } else if (statusData.status === 'failed') {
          loggingService.error('Job processing failed');
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
        loggingService.error('Error polling job status:', error);
        throw error;
      }
    }

    loggingService.error(`Request timed out after ${maxAttempts} attempts`);
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
    
    loggingService.info('Starting API request submission...');

    try {
      // Check if this is a test prompt
      if (TestDataService.isTestCommand(inputText)) {
        const testResponse = TestDataService.getTestResponse(inputText);
        if (testResponse) {
          setLoadingStatus(TestDataService.getTestLoadingStatus(inputText));
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Using test response for:', inputText);
          setFullResponse(testResponse);
          const parsedResults = parseStructuredResponse(testResponse);
          setResults(parsedResults);
          return;
        }
      }

      // Check access and handle authentication/paywall automatically
      const accessResult = await accessService.checkAccess(navigation);
      if (!accessResult.hasAccess) {
        loggingService.warn('User does not have access after paywall handling');
        showAlert('Subscription Required', 'Please purchase a subscription to use this feature.');
        return;
      }

      // Prepare prompt
      let prompt = inputText.trim();
      if (imageUri) {
        prompt += imageUri ? '\n[Image attached - please analyze the food items in the image]' : '';
      }

      // Submit to Carbie inference endpoint using API client
      loggingService.info('Submitting request to API with prompt:', prompt);
      const response = await apiClient.post<JobResponse>('/api/v1/carbie/', {
        model_name: 'claude-haiku',
        model_version: 'latest',
        prompt: prompt,
      });

      if (!response.success) {
        if (response.statusCode === 401) {
          loggingService.warn('API returned 401, session expired');
          showAlert('Session Expired', 'Please login again');
          await authService.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
          return;
        }
        loggingService.error('API request failed:', response.error);
        throw new Error(response.error || 'Failed to submit request');
      }

      if (!response.data) {
        loggingService.error('No job ID received from server');
        throw new Error('No job ID received from server');
      }

      loggingService.info('Job submitted successfully:', response.data.job_id);

      // Poll for results
      loggingService.info('Starting to poll for job results...');
      const result = await pollJobStatus(response.data.job_id);

      if (result) {
        loggingService.info('Received successful result from API');
        setFullResponse(result);
        const parsedResults = parseStructuredResponse(result);
        setResults(parsedResults);
      } else {
        loggingService.error('No result received from polling');
        throw new Error('No result received');
      }

    } catch (error) {
      loggingService.error('Error submitting request:', error);
      showAlert(
        'Error',
        error instanceof Error ? error.message : 'Failed to process your request. Please try again.'
      );
    } finally {
      setLoading(false);
      setInputText('');
      setImageUri(null);
      loggingService.info('Request submission completed');
    }
  };

  // Loading screen while checking access
  if (!accessChecked) {
    return (
      <LinearGradient
        colors={['#A8E063', '#2E7D32']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Checking access...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#A8E063', '#2E7D32']} style={styles.gradientContainer}>
        {/* Header with menu button - Outside ScrollView */}
        <View style={styles.header}>
          <Animated.View style={[styles.headerContainer, { transform: [{ scale: titleScale }] }]}>
            <Text style={styles.title}>Carbie's Estimation</Text>
          </Animated.View>
          <MenuDropdown navigation={navigation} />
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

        </ScrollView>

        {/* Debug Panel Component - Outside ScrollView, always visible */}
        <DebugPanel 
          fullResponse={fullResponse} 
          logs={logs}
          initiallyExpanded={true} 
        />
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
  scrollView: {
    flex: 1,
    marginBottom: 10, // Add space for debug panel
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Add padding at bottom for better scrolling
  },
  // Added the missing loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
});