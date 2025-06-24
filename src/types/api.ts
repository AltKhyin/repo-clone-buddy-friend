
// ABOUTME: Centralized API response and error handling types for improved type safety across the application.

// Generic API response wrapper - eliminates any usage
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Standardized error interface
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Form validation types - improved type safety
export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
}

// Generic pagination parameters - reusable across the app
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Generic pagination response - eliminates any usage
export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    total?: number;
  };
}

// HTTP method types for API calls
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Generic query parameters type
export type QueryParams = Record<string, string | number | boolean | undefined>;
