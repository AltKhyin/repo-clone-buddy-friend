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
  // For now, fall back to standard Supabase invoke which uses POST
  // This avoids the HTML response issue we're seeing with direct fetch
  console.log(`Invoking function ${functionName} via Supabase client`);
  
  try {
    return await invokeFunction<T>(functionName, { headers });
  } catch (error) {
    console.error(`Function ${functionName} failed via Supabase client:`, error);
    
    // If Supabase client fails, try direct fetch as fallback
    console.log(`Attempting direct fetch fallback for ${functionName}`);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'GET',
      headers: {
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        'Content-Type': 'application/json',
        ...headers
      }
    });

    // Check content type first
    const contentType = response.headers.get('content-type');
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`Function ${functionName} failed with status ${response.status}:`, responseText);
      throw new Error(`Function ${functionName} failed: ${response.status} ${response.statusText}`);
    }

    // Check if response is actually JSON
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Function ${functionName} returned non-JSON response:`, responseText);
      throw new Error(`Function ${functionName} returned invalid response (expected JSON, got ${contentType || 'unknown'})`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`Function ${functionName} JSON parse error:`, parseError, 'Response:', responseText);
      throw new Error(`Function ${functionName} returned invalid JSON`);
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