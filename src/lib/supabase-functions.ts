// ABOUTME: Wrapper for Supabase Functions with standardized response handling

import { supabase } from '@/integrations/supabase/client';

// Standardized response interface
interface StandardizedResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: any;
  timestamp?: string;
}

/**
 * Centralized function for invoking Supabase Edge Functions with automatic response unwrapping
 * @param functionName The name of the Edge Function to invoke
 * @param options Options including body and headers
 * @returns Unwrapped data from the function response
 */
export async function invokeFunction<T>(
  functionName: string,
  options?: {
    body?: Record<string, any>;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, options);
  
  if (error) {
    console.error(`Function ${functionName} failed:`, error);
    throw new Error(error.message || `Function ${functionName} failed`);
  }

  if (!data) {
    throw new Error(`No data returned from function ${functionName}`);
  }
  
  // Handle standardized error responses
  if (data?.success === false && data?.error) {
    throw new Error(data.error);
  }
  
  // Extract data from standardized wrapper if present
  if (data?.success === true && data?.data !== undefined) {
    return data.data as T;
  }
  
  // Return raw data if not wrapped (backward compatibility)
  return data as T;
}

/**
 * Type-safe wrapper for GET-style operations that don't require a body
 */
export async function invokeFunctionGet<T>(
  functionName: string,
  headers?: Record<string, string>
): Promise<T> {
  // Supabase functions.invoke always uses POST, so we need to handle GET differently
  // For functions expecting GET, we'll add a special header or use fetch directly
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'GET',
    headers: {
      'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
      'Content-Type': 'application/json',
      ...headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Function ${functionName} failed`);
  }

  const data = await response.json();
  
  // Handle standardized error responses
  if (data?.success === false && data?.error) {
    throw new Error(data.error);
  }
  
  // Extract data from standardized wrapper if present
  if (data?.success === true && data?.data !== undefined) {
    return data.data as T;
  }
  
  // Return raw data if not wrapped (backward compatibility)
  return data as T;
}

/**
 * Type-safe wrapper for POST-style operations that require a body
 */
export async function invokeFunctionPost<T>(
  functionName: string,
  body: Record<string, any>,
  headers?: Record<string, string>
): Promise<T> {
  return invokeFunction<T>(functionName, { body, headers });
}