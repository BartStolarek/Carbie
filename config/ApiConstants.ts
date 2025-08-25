// config/ApiConstants.ts

export const CARBIE_API_ENDPOINT = '/api/v1/carbie/';

export const DEFAULT_CARBIE_REQUEST_VALUES = {
  model_name: 'claude-haiku',
  model_version: 'latest',
  max_tokens: 1024,
  temperature: 0.3,
} as const;

export const CARBIE_REQUEST_SPEC = {
  method: 'POST' as const,
  endpoint: CARBIE_API_ENDPOINT,
  content_type: 'multipart/form-data' as const,
  fields: {
    user_prompt: {
      type: 'string' as const,
      required: false,
      default: '',
      description: 'Text description or empty string',
    },
    model_name: {
      type: 'string' as const,
      required: false,
      default: DEFAULT_CARBIE_REQUEST_VALUES.model_name,
      description: 'AI model name',
    },
    model_version: {
      type: 'string' as const,
      required: false,
      default: DEFAULT_CARBIE_REQUEST_VALUES.model_version,
      description: 'Model version',
    },
    max_tokens: {
      type: 'integer' as const,
      required: false,
      default: DEFAULT_CARBIE_REQUEST_VALUES.max_tokens,
      description: 'Maximum tokens',
    },
    temperature: {
      type: 'float' as const,
      required: false,
      default: DEFAULT_CARBIE_REQUEST_VALUES.temperature,
      description: 'Temperature setting',
    },
    images: {
      type: 'file[]' as const,
      required: false,
      description: 'One or more image files, all using same field name \'images\'',
    },
  },
} as const;
