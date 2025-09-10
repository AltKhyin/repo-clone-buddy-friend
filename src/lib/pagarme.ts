// ABOUTME: Pagar.me API client configuration for EVIDENS payment system integration

/**
 * Pagar.me API Configuration
 * 
 * This module provides a configured HTTP client for interacting with Pagar.me's API v5.
 * It handles authentication, request/response configuration, and provides type-safe
 * interfaces for payment operations.
 * 
 * Security Note: 
 * - Public key (VITE_PAGARME_PUBLIC_KEY) is used for client-side tokenization only
 * - Secret key (PAGARME_SECRET_KEY) is only used in Edge Functions/server-side operations
 * 
 * Reference: https://docs.pagar.me/reference/autenticação-2
 */

// =================================================================
// Environment Configuration
// =================================================================

const PAGARME_CONFIG = {
  // API Configuration
  baseURL: 'https://sdx-api.pagar.me/core/v5',
  apiVersion: import.meta.env.PAGARME_API_VERSION || '2019-09-01',
  
  // Client-side keys (safe for browser)
  publicKey: import.meta.env.VITE_PAGARME_PUBLIC_KEY,
  
  // Server-side keys (only for Edge Functions - not included in client bundle)
  get secretKey() {
    // This will only be available in server-side contexts
    return typeof window === 'undefined' ? process.env.PAGARME_SECRET_KEY : null;
  },
  
  // Webhook configuration
  webhookEndpointId: import.meta.env.PAGARME_WEBHOOK_ENDPOINT_ID,
} as const;

// =================================================================
// API Client Configuration
// =================================================================

/**
 * Creates HTTP client for Pagar.me API operations
 * Note: This is for server-side operations only (Edge Functions)
 * Client-side operations should use the tokenization functions below
 */
export const createPagarmeClient = (secretKey?: string) => {
  const apiKey = secretKey || PAGARME_CONFIG.secretKey;
  
  if (!apiKey) {
    throw new Error('Pagar.me secret key is required for API operations');
  }

  // Create base64 encoded auth header (Basic Authentication)
  const authToken = btoa(`${apiKey}:`);

  return {
    baseURL: PAGARME_CONFIG.baseURL,
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'EVIDENS/1.0'
    }
  };
};

// =================================================================
// Client-Side Payment Operations
// =================================================================

/**
 * Configuration for client-side payment operations
 * These operations are safe to run in the browser and only handle
 * payment method tokenization (no sensitive API calls)
 */
export const pagarmeClientConfig = {
  publicKey: PAGARME_CONFIG.publicKey,
  apiVersion: PAGARME_CONFIG.apiVersion,
  
  // Validation
  isConfigured(): boolean {
    return Boolean(this.publicKey);
  },
  
  // Get configuration for client-side tokenization
  getTokenizationConfig() {
    if (!this.publicKey) {
      throw new Error('Pagar.me public key is required for tokenization');
    }
    
    return {
      publicKey: this.publicKey,
      apiVersion: this.apiVersion
    };
  }
} as const;

// =================================================================
// Type Definitions
// =================================================================

/**
 * Common Pagar.me API response structure
 */
export interface PagarmeResponse<T = any> {
  id: string;
  object: string;
  status: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

/**
 * Pagar.me Customer object structure
 */
export interface PagarmeCustomer extends PagarmeResponse {
  name: string;
  email: string;
  document: string;
  type: 'individual' | 'company';
  address?: {
    country: string;
    state: string;
    city: string;
    street: string;
    street_number: string;
    zipcode: string;
  };
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
}

/**
 * Pagar.me Order object structure  
 */
export interface PagarmeOrder extends PagarmeResponse {
  code: string;
  amount: number;
  currency: string;
  closed: boolean;
  items: Array<{
    id: string;
    description: string;
    amount: number;
    quantity: number;
  }>;
  customer: PagarmeCustomer;
  charges: PagarmeCharge[];
}

/**
 * Pagar.me Charge object structure
 */
export interface PagarmeCharge extends PagarmeResponse {
  code: string;
  amount: number;
  currency: string;
  payment_method: 'pix' | 'credit_card' | 'boleto';
  last_transaction?: {
    id: string;
    transaction_type: string;
    status: string;
    qr_code?: string;
    qr_code_url?: string;
    qr_code_text?: string;
    expires_at?: string;
    authorization_code?: string;
    url?: string;
  };
}

/**
 * PIX Payment Configuration
 */
export interface PixPaymentConfig {
  expires_in: number; // Expiration time in seconds (default: 3600)
  additional_info?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Credit Card Payment Configuration
 */
export interface CreditCardPaymentConfig {
  card_token: string; // Tokenized card data
  installments: number; // Number of installments (1-12)
  statement_descriptor?: string; // Appears on card statement
  authentication?: {
    type: 'threed_secure';
    threed_secure: {
      mpi: string;
      cavv?: string;
      eci?: string;
      transaction_id?: string;
    };
  };
}

// =================================================================
// Validation Helpers
// =================================================================

/**
 * Validates if the Pagar.me configuration is properly set up
 */
export const validatePagarmeConfig = () => {
  const issues: string[] = [];
  
  if (!PAGARME_CONFIG.publicKey) {
    issues.push('VITE_PAGARME_PUBLIC_KEY is not configured');
  }
  
  // Only check secret key in server environment
  if (typeof window === 'undefined' && !PAGARME_CONFIG.secretKey) {
    issues.push('PAGARME_SECRET_KEY is not configured');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Configuration information utility
 */
export const pagarmeEnvironment = {
  getConfigurationInfo() {
    return {
      publicKey: PAGARME_CONFIG.publicKey ? `${PAGARME_CONFIG.publicKey.slice(0, 8)}...` : 'not-configured',
      configuredEndpoints: {
        api: PAGARME_CONFIG.baseURL,
        webhooks: Boolean(PAGARME_CONFIG.webhookEndpointId)
      }
    };
  }
} as const;