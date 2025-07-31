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
  const [logs, setLogs] = useState<LogMessage[]>([]);

  // Animate the title scaling in
  const titleScale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    loggingService.info('MainChatScreen: Component mounting, starting title animation');
    
    Animated.timing(titleScale, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start(() => {
      loggingService.debug('MainChatScreen: Title animation completed');
    });
    
    // Add a test log when component mounts
    loggingService.info('MainChatScreen: Component mounted successfully');
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loggingService.info('MainChatScreen: Screen focused - starting access check');
      
    }, [])
  );

  // Listen to log events
  useEffect(() => {
    loggingService.debug('MainChatScreen: Setting up log listener');
    
    const handleLogAdded = () => {
      setLogs(loggingService.getLogs());
    };

    loggingService.addListener(handleLogAdded);

    // Initialize logs
    setLogs(loggingService.getLogs());
    
    // Add initial debug message to ensure panel is visible
    loggingService.info('MainChatScreen: Debug panel initialized and ready');
    loggingService.info('MainChatScreen: Platform information', { platform: Platform.OS });
    loggingService.info('MainChatScreen: Component mounted on', { platform: Platform.OS });

    return () => {
      loggingService.debug('MainChatScreen: Cleaning up log listener');
      loggingService.removeListener(handleLogAdded);
    };
  }, []);

  const pollJobStatus = async (jobId: string): Promise<CarbieResult | null> => {
    const methodName = 'pollJobStatus';
    loggingService.info(`${methodName}: Starting job status polling`, { jobId });
    
    const maxAttempts = 60; // Poll for up to 5 minutes (1s intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        setLoadingStatus(`Checking status... (${attempts + 1}/${maxAttempts})`);
        loggingService.debug(`${methodName}: Polling attempt`, { 
          attempt: attempts + 1, 
          maxAttempts,
          jobId 
        });

        const statusResponse = await apiClient.get(`/api/v1/job/status/${jobId}`);

        loggingService.info(`${methodName}: Status response received`, { 
          success: statusResponse.success,
          statusCode: statusResponse.statusCode,
          hasError: !!statusResponse.error,
          jobId 
        });

        if (!statusResponse.success) {
          loggingService.error(`${methodName}: Failed to check job status`, { 
            error: statusResponse.error,
            statusCode: statusResponse.statusCode,
            jobId 
          });
          throw new Error(statusResponse.error || 'Failed to check job status');
        }

        const statusData = statusResponse.data;
        loggingService.info(`${methodName}: Job status`, { 
          status: statusData.status,
          jobId 
        });

        if (statusData.status === 'completed') {
          loggingService.info(`${methodName}: Job completed, fetching result`, { jobId });
          // Get the result
          const resultResponse = await apiClient.get<CarbieResult>(`/api/v1/job/result/${jobId}`);

          loggingService.info(`${methodName}: Result response received`, { 
            success: resultResponse.success,
            statusCode: resultResponse.statusCode,
            hasData: !!resultResponse.data,
            hasError: !!resultResponse.error,
            jobId 
          });

          if (resultResponse.success && resultResponse.data) {
            loggingService.info(`${methodName}: Successfully retrieved job result`, { jobId });
            return resultResponse.data;
          } else {
            loggingService.error(`${methodName}: Failed to get job result`, { 
              error: resultResponse.error,
              statusCode: resultResponse.statusCode,
              jobId 
            });
            throw new Error(resultResponse.error || 'Failed to get job result');
          }
        } else if (statusData.status === 'failed') {
          loggingService.error(`${methodName}: Job processing failed`, { jobId });
          throw new Error('Job processing failed');
        } else if (statusData.status === 'processing') {
          setLoadingStatus('Processing your request...');
          loggingService.debug(`${methodName}: Job still processing`, { jobId });
        } else if (statusData.status === 'queued') {
          setLoadingStatus('Your request is in queue...');
          loggingService.debug(`${methodName}: Job in queue`, { jobId });
        }

        // Wait 1 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        loggingService.error(`${methodName}: Error polling job status`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          jobId,
          attempt: attempts + 1 
        });
        throw error;
      }
    }

    loggingService.error(`${methodName}: Request timed out`, { 
      maxAttempts,
      jobId 
    });
    throw new Error('Request timed out');
  };

  const parseStructuredResponse = (response: CarbieResult): ResultItem[] => {
    const methodName = 'parseStructuredResponse';
    loggingService.debug(`${methodName}: Starting response parsing`, { 
      hasStructuredData: !!response.structured_data,
      hasIngredients: !!response.structured_data?.ingredients 
    });
    
    // Check if we have structured data
    if (response.structured_data && response.structured_data.ingredients) {
      const { structured_data } = response;

      // Set the analysis message
      setAnalysisMessage(structured_data.message || '');
      loggingService.debug(`${methodName}: Set analysis message`, { 
        message: structured_data.message || 'No message' 
      });

      // Convert structured ingredients to ResultItem format
      const parsedResults = structured_data.ingredients.map((ingredient: IngredientData) => {
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

      loggingService.info(`${methodName}: Successfully parsed structured response`, { 
        ingredientCount: parsedResults.length,
        ingredients: parsedResults.map(r => r.ingredient) 
      });
      
      return parsedResults;
    }

    // Fallback to old parsing method if no structured data
    loggingService.warn(`${methodName}: No structured data found, using fallback parsing`);
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
    const methodName = 'handleSubmit';
    loggingService.info(`${methodName}: Starting submission process`, { 
      hasInputText: !!inputText,
      inputTextLength: inputText.length,
      hasImageUri: !!imageUri,
      imageUri: imageUri || 'none'
    });

    setLoading(true);
    setResults([]);
    setFullResponse(null);
    setAnalysisMessage('');
    setLoadingStatus('Submitting request...');
    
    loggingService.info(`${methodName}: Starting API request submission`);

    try {
      // Check if this is a test prompt
      if (TestDataService.isTestCommand(inputText)) {
        loggingService.info(`${methodName}: Detected test command`, { inputText });
        const testResponse = TestDataService.getTestResponse(inputText);
        if (testResponse) {
          setLoadingStatus(TestDataService.getTestLoadingStatus(inputText));
          await new Promise(resolve => setTimeout(resolve, 1000));
          loggingService.info(`${methodName}: Using test response`, { inputText });
          setFullResponse(testResponse);
          const parsedResults = parseStructuredResponse(testResponse);
          setResults(parsedResults);
          return;
        }
      }

      // Check access and handle authentication/paywall automatically
      loggingService.debug(`${methodName}: Checking access permissions`);
      const accessResult = await accessService.checkAccess(navigation);
      loggingService.info(`${methodName}: Access check result`, { 
        hasAccess: accessResult.hasAccess,
        isAuthenticated: accessResult.isAuthenticated,
        isAdmin: accessResult.isAdmin,
        hasSubscription: accessResult.hasSubscription,
        error: accessResult.error 
      });
      
      if (!accessResult.hasAccess) {
        loggingService.warn(`${methodName}: User does not have access after paywall handling`);
        showAlert('Subscription Required', 'Please purchase a subscription to use this feature.');
        return;
      }

      // Prepare prompt
      let prompt = inputText.trim();
      if (imageUri) {
        prompt += imageUri ? '\n[Image attached - please analyze the food items in the image]' : '';
      }

      loggingService.info(`${methodName}: Submitting request to API`, { 
        promptLength: prompt.length,
        hasImage: !!imageUri 
      });
      
      // Submit to Carbie inference endpoint using API client
      const response = await apiClient.post<JobResponse>('/api/v1/carbie/', {
        model_name: 'claude-haiku',
        model_version: 'latest',
        prompt: prompt,
      });

      loggingService.info(`${methodName}: API response received`, { 
        success: response.success,
        statusCode: response.statusCode,
        hasJobId: !!response.data?.job_id,
        hasError: !!response.error 
      });

      if (!response.success) {
        if (response.statusCode === 401) {
          loggingService.warn(`${methodName}: API returned 401, session expired`);
          showAlert('Session Expired', 'Please login again');
          await authService.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
          return;
        }
        loggingService.error(`${methodName}: API request failed`, { 
          error: response.error,
          statusCode: response.statusCode 
        });
        throw new Error(response.error || 'Failed to submit request');
      }

      if (!response.data) {
        loggingService.error(`${methodName}: No job ID received from server`);
        throw new Error('No job ID received from server');
      }

      loggingService.info(`${methodName}: Job submitted successfully`, { 
        jobId: response.data.job_id 
      });

      // Poll for results
      loggingService.info(`${methodName}: Starting to poll for job results`);
      const result = await pollJobStatus(response.data.job_id);

      if (result) {
        loggingService.info(`${methodName}: Received successful result from API`);
        setFullResponse(result);
        const parsedResults = parseStructuredResponse(result);
        setResults(parsedResults);
      } else {
        loggingService.error(`${methodName}: No result received from polling`);
        throw new Error('No result received');
      }

    } catch (error) {
      loggingService.error(`${methodName}: Error submitting request`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      showAlert(
        'Error',
        error instanceof Error ? error.message : 'Failed to process your request. Please try again.'
      );
    } finally {
      setLoading(false);
      setInputText('');
      setImageUri(null);
      loggingService.info(`${methodName}: Request submission completed`);
    }
  };

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