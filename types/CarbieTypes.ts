// types/CarbieTypes.ts

export interface IngredientData {
  ingredient: string;
  is_liquid: boolean;
  estimated_weight_volume: number;
  low_carb_estimate: number;
  high_carb_estimate: number;
  gi_index: number;
  peak_bg_time: string;
}

export interface StructuredData {
  is_food_related: boolean;
  ingredients: IngredientData[];
  aggregated_peak_bg_time_minutes: number;
  message: string;
}

export interface JobResponse {
  job_id: string;
  status: string;
}

export interface CarbieResult {
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