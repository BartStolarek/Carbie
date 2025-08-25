# Carbie API Request Format

## Overview

All requests to the `/api/v1/carbie/` endpoint now use a consistent format regardless of whether they contain text, images, or both. This ensures uniformity and simplifies the API contract.

## Request Specification

```json
{
  "request_spec": {
    "method": "POST",
    "endpoint": "/api/v1/carbie/",
    "content_type": "multipart/form-data",
    "fields": {
      "user_prompt": {
        "type": "string",
        "required": false,
        "default": "",
        "description": "Text description or empty string"
      },
      "model_name": {
        "type": "string",
        "required": false,
        "default": "claude-haiku",
        "description": "AI model name"
      },
      "model_version": {
        "type": "string",
        "required": false,
        "default": "latest",
        "description": "Model version"
      },
      "max_tokens": {
        "type": "integer",
        "required": false,
        "default": 1024,
        "description": "Maximum tokens"
      },
      "temperature": {
        "type": "float",
        "required": false,
        "default": 0.3,
        "description": "Temperature setting"
      },
      "images": {
        "type": "file[]",
        "required": false,
        "description": "One or more image files, all using same field name 'images'"
      }
    }
  }
}
```

## Use Cases

### 1. Text Only
```json
{
  "user_prompt": "Analyze 1 banana and 2 slices of bread",
  "model_name": "claude-haiku",
  "model_version": "latest",
  "max_tokens": 1024,
  "temperature": 0.3
}
```

### 2. Text + Single Image
```json
{
  "user_prompt": "How many carbs in this meal?",
  "model_name": "claude-haiku",
  "model_version": "latest",
  "max_tokens": 1024,
  "temperature": 0.3,
  "images": [imageFile1]
}
```

### 3. Text + Multiple Images
```json
{
  "user_prompt": "Analyze all these meals for total carbs",
  "model_name": "claude-haiku",
  "model_version": "latest",
  "max_tokens": 1024,
  "temperature": 0.3,
  "images": [imageFile1, imageFile2, imageFile3]
}
```

### 4. Single Image Only
```json
{
  "user_prompt": "",
  "model_name": "claude-haiku",
  "model_version": "latest",
  "max_tokens": 1024,
  "temperature": 0.3,
  "images": [imageFile1]
}
```

### 5. Multiple Images Only
```json
{
  "user_prompt": "",
  "model_name": "claude-haiku",
  "model_version": "latest",
  "max_tokens": 1024,
  "temperature": 0.3,
  "images": [imageFile1, imageFile2]
}
```

## Implementation Details

### Frontend to API Gateway
- All requests use `multipart/form-data`
- All requests include the same field structure
- Images are always sent using the `images` field (array)
- Default values are applied for missing fields

### API Gateway to Inference
- Same `multipart/form-data` format is maintained
- Field names remain consistent throughout the pipeline
- No field name transformations occur

### Key Benefits
1. **Consistency**: Same request structure for all use cases
2. **Maintainability**: Single code path for request handling
3. **Scalability**: Easy to add new fields without breaking existing functionality
4. **Debugging**: Uniform logging and error handling

## Code Example

```typescript
// Using the constants
import { CARBIE_API_ENDPOINT, DEFAULT_CARBIE_REQUEST_VALUES } from '../config/ApiConstants';

const requestData = {
  model_name: DEFAULT_CARBIE_REQUEST_VALUES.model_name,
  model_version: DEFAULT_CARBIE_REQUEST_VALUES.model_version,
  user_prompt: userPrompt,
  max_tokens: DEFAULT_CARBIE_REQUEST_VALUES.max_tokens,
  temperature: DEFAULT_CARBIE_REQUEST_VALUES.temperature,
  ...(images.length > 0 && { images: images })
};

const response = await apiClient.postMultipart<JobResponse>(
  CARBIE_API_ENDPOINT, 
  requestData
);
```

## Migration Notes

- Old field names (`image`, `image2`) have been replaced with `images` array
- All requests now include `max_tokens` and `temperature` fields
- Default values ensure backward compatibility
- No changes required on the backend if it already supports the new field names
