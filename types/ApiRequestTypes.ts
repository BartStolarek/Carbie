// types/ApiRequestTypes.ts

export interface CarbieRequestFields {
  user_prompt: string;
  model_name: string;
  model_version: string;
  max_tokens: number;
  temperature: number;
  images?: (File | Blob)[];
}

export interface CarbieRequest {
  request_spec: {
    method: 'POST';
    endpoint: '/api/v1/carbie/';
    content_type: 'multipart/form-data';
    fields: {
      user_prompt: {
        type: 'string';
        required: false;
        default: string;
        description: string;
      };
      model_name: {
        type: 'string';
        required: false;
        default: string;
        description: string;
      };
      model_version: {
        type: 'string';
        required: false;
        default: string;
        description: string;
      };
      max_tokens: {
        type: 'integer';
        required: false;
        default: number;
        description: string;
      };
      temperature: {
        type: 'float';
        required: false;
        default: number;
        description: string;
      };
      images: {
        type: 'file[]';
        required: false;
        description: string;
      };
    };
  };
  use_cases: {
    text_only: Partial<CarbieRequestFields>;
    text_and_single_image: Partial<CarbieRequestFields>;
    text_and_multiple_images: Partial<CarbieRequestFields>;
    single_image_only: Partial<CarbieRequestFields>;
    multiple_images_only: Partial<CarbieRequestFields>;
  };
  flow: {
    frontend_to_apigateway: string;
    apigateway_to_inference: string;
    consistent_field_names: string;
  };
}
