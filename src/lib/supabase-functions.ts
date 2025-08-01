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
  params?: Record<string, any>,
  headers?: Record<string, string>
): Promise<T> {
  // Use direct GET fetch as primary method since GET functions expect actual GET requests

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Build URL with query parameters
  const url = new URL(`https://qjoxiowuiiupbvqlssgk.supabase.co/functions/v1/${functionName}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        );
      }
    });
  }

  // Build headers object conditionally to avoid empty Authorization header
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Only add Authorization header if we have a valid session token
  if (session?.access_token) {
    requestHeaders.Authorization = `Bearer ${session.access_token}`;
  }

  console.log(`🌐 [${functionName}] Making GET request to: ${url.toString()}`);
  console.log(`🔑 [${functionName}] Request headers:`, requestHeaders);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: requestHeaders,
  });

  console.log(`📡 [${functionName}] Response status: ${response.status} ${response.statusText}`);

  // Check content type first
  const contentType = response.headers.get('content-type');
  const responseText = await response.text();

  console.log(`📄 [${functionName}] Response content-type: ${contentType}`);
  console.log(
    `📄 [${functionName}] Response text (first 500 chars): ${responseText.substring(0, 500)}`
  );

  if (!response.ok) {
    console.error(`❌ [${functionName}] HTTP Error ${response.status}: ${responseText}`);
  }

  if (!response.ok) {
    console.error(`Function ${functionName} failed with status ${response.status}:`, responseText);

    // If direct GET fails, try fallback to Supabase client (POST) for functions that support both

    try {
      return await invokeFunction<T>(functionName, { body: params, headers });
    } catch (fallbackError) {
      console.error(`Both GET and POST attempts failed for ${functionName}`);
      throw new Error(`Function ${functionName} failed: ${response.status} ${response.statusText}`);
    }
  }

  // Check if response is actually JSON
  if (!contentType || !contentType.includes('application/json')) {
    console.error(`Function ${functionName} returned non-JSON response:`, responseText);
    throw new Error(
      `Function ${functionName} returned invalid response (expected JSON, got ${contentType || 'unknown'})`
    );
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error(
      `Function ${functionName} JSON parse error:`,
      parseError,
      'Response:',
      responseText
    );
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

/**
 * Direct PUT request to Edge Function for update operations
 */
export async function invokeFunctionPut<T>(
  functionName: string,
  body: Record<string, any>,
  headers?: Record<string, string>
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = `https://qjoxiowuiiupbvqlssgk.supabase.co/functions/v1/${functionName}`;

  // Build headers object conditionally to avoid empty Authorization header
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Only add Authorization header if we have a valid session token
  if (session?.access_token) {
    requestHeaders.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: requestHeaders,
    body: JSON.stringify(body),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      `Function ${functionName} PUT failed with status ${response.status}:`,
      responseText
    );
    throw new Error(`Function ${functionName} failed: ${response.status} ${response.statusText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error(
      `Function ${functionName} JSON parse error:`,
      parseError,
      'Response:',
      responseText
    );
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

/**
 * Direct DELETE request to Edge Function for delete operations
 */
export async function invokeFunctionDelete<T>(
  functionName: string,
  params?: Record<string, any>,
  headers?: Record<string, string>
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Build URL with query parameters for DELETE
  const url = new URL(`https://qjoxiowuiiupbvqlssgk.supabase.co/functions/v1/${functionName}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        );
      }
    });
  }

  // Build headers object conditionally to avoid empty Authorization header
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Only add Authorization header if we have a valid session token
  if (session?.access_token) {
    requestHeaders.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: requestHeaders,
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      `Function ${functionName} DELETE failed with status ${response.status}:`,
      responseText
    );
    throw new Error(`Function ${functionName} failed: ${response.status} ${response.statusText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error(
      `Function ${functionName} JSON parse error:`,
      parseError,
      'Response:',
      responseText
    );
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
