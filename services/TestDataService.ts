// services/TestDataService.ts
import { CarbieResult } from '../types/CarbieTypes';

// Test response data
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

const TEST_RESPONSE3: CarbieResult = {
  "model_name": "claude-haiku",
  "model_version": "latest",
  "prompt": "a 3 course meal with chicken soup, roast lamb pumpkin and potato main, and apple crumb with ice cream dessert",
  "structured_data": {
    "is_food_related": true,
    "ingredients": [
      {
        "ingredient": "Chicken Soup",
        "is_liquid": true,
        "estimated_weight_volume": 250,
        "low_carb_estimate": 5,
        "high_carb_estimate": 10,
        "gi_index": 40,
        "peak_bg_time": "45min"
      },
      {
        "ingredient": "Roast Lamb",
        "is_liquid": false,
        "estimated_weight_volume": 150,
        "low_carb_estimate": 0,
        "high_carb_estimate": 2,
        "gi_index": 0,
        "peak_bg_time": "30min"
      },
      {
        "ingredient": "Pumpkin",
        "is_liquid": false,
        "estimated_weight_volume": 100,
        "low_carb_estimate": 10,
        "high_carb_estimate": 15,
        "gi_index": 75,
        "peak_bg_time": "60min"
      },
      {
        "ingredient": "Potato",
        "is_liquid": false,
        "estimated_weight_volume": 150,
        "low_carb_estimate": 20,
        "high_carb_estimate": 30,
        "gi_index": 80,
        "peak_bg_time": "75min"
      },
      {
        "ingredient": "Apple Crumb",
        "is_liquid": false,
        "estimated_weight_volume": 120,
        "low_carb_estimate": 25,
        "high_carb_estimate": 35,
        "gi_index": 70,
        "peak_bg_time": "90min"
      },
      {
        "ingredient": "Ice Cream",
        "is_liquid": true,
        "estimated_weight_volume": 100,
        "low_carb_estimate": 15,
        "high_carb_estimate": 25,
        "gi_index": 50,
        "peak_bg_time": "60min"
      }
    ],
    "aggregated_peak_bg_time_minutes": 75,
    "message": "Total carbs: 75-117g, peak BG around 75 minutes"
  },
  "usage": {
    "input_tokens": 1338,
    "output_tokens": 641,
    "total_tokens": 1979,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "input_cost_usd": 0.0010704,
    "output_cost_usd": 0.002564,
    "cache_write_cost_usd": 0,
    "cache_read_cost_usd": 0,
    "total_cost_usd": 0.0036344
  },
  "elapsed_time_seconds": 9.264172
};

// Test data mapping
const TEST_DATA_MAP: Record<string, CarbieResult> = {
  'test': TEST_RESPONSE,
  'test2': TEST_RESPONSE2,
  'test3': TEST_RESPONSE3,
};

class TestDataService {
  /**
   * Check if the given input text is a test command
   */
  static isTestCommand(inputText: string): boolean {
    const normalizedInput = inputText.trim().toLowerCase();
    return normalizedInput in TEST_DATA_MAP;
  }

  /**
   * Get test response for the given input text
   */
  static getTestResponse(inputText: string): CarbieResult | null {
    const normalizedInput = inputText.trim().toLowerCase();
    return TEST_DATA_MAP[normalizedInput] || null;
  }

  /**
   * Get the loading status message for a test command
   */
  static getTestLoadingStatus(inputText: string): string {
    const normalizedInput = inputText.trim().toLowerCase();
    return `Processing ${normalizedInput} request...`;
  }

  /**
   * Get all available test commands
   */
  static getAvailableTestCommands(): string[] {
    return Object.keys(TEST_DATA_MAP);
  }

  /**
   * Check if test mode is enabled (for future feature flags)
   */
  static isTestModeEnabled(): boolean {
    // This could be expanded to check environment variables or app settings
    return __DEV__; // Only enable in development mode
  }
}

export default TestDataService;