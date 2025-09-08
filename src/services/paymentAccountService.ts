// ABOUTME: Service for creating user accounts from payment data with comprehensive fraud protection and edge case handling

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// =================================================================
// Types & Interfaces
// =================================================================

export interface PaymentAccountCreationData {
  customerEmail: string;
  customerName: string;
  customerDocument?: string;
  customerPhone?: string;
  orderId: string;
  planId: string;
  amount: number;
  paymentMethod?: string;
}

export interface AccountCreationResult {
  success: boolean;
  user?: User;
  action: 'created' | 'found_existing' | 'needs_verification' | 'failed';
  message: string;
  requiresPasswordSetup?: boolean;
  conflictDetails?: {
    field: string;
    expected: string;
    received: string;
  }[];
}

interface ExistingUserData {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
    customer_document?: string;
    customer_phone?: string;
    created_from_payment?: boolean;
  };
  raw_user_meta_data?: any;
}

// =================================================================
// Core Account Creation Service
// =================================================================

/**
 * Main service function that creates or associates user accounts with payment data
 * Handles all scenarios: new users, existing users, data conflicts, and fraud protection
 */
export async function createOrAssociateAccountFromPayment(
  paymentData: PaymentAccountCreationData
): Promise<AccountCreationResult> {
  try {
    console.log('Starting account creation/association process:', {
      email: paymentData.customerEmail,
      orderId: paymentData.orderId,
      timestamp: new Date().toISOString()
    });

    // Step 1: Check if user already exists by email
    const existingUser = await findUserByEmail(paymentData.customerEmail);
    
    if (existingUser) {
      // User exists - verify data consistency and associate payment
      console.log('Found existing user, verifying data consistency...');
      return await handleExistingUser(existingUser, paymentData);
    } else {
      // New user - create account from payment data
      console.log('Creating new user from payment data...');
      return await createNewUserFromPayment(paymentData);
    }

  } catch (error) {
    console.error('Error in createOrAssociateAccountFromPayment:', {
      error,
      paymentData: {
        ...paymentData,
        customerDocument: paymentData.customerDocument ? '[REDACTED]' : undefined
      },
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      action: 'failed',
      message: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

// =================================================================
// User Lookup Functions
// =================================================================

/**
 * Finds user by email using Supabase Admin API
 * Returns null if user not found
 */
async function findUserByEmail(email: string): Promise<ExistingUserData | null> {
  try {
    // Use the auth admin API to look up user by email
    // Note: This requires service role key which should be available in Edge Functions
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return null;
    }

    // Find user with matching email
    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || email,
      user_metadata: user.user_metadata,
      raw_user_meta_data: user.raw_user_meta_data
    };

  } catch (error) {
    console.error('Error in findUserByEmail:', error);
    return null;
  }
}

// =================================================================
// Existing User Handling
// =================================================================

/**
 * Handles payment association for existing users
 * Includes data consistency verification and conflict resolution
 */
async function handleExistingUser(
  existingUser: ExistingUserData,
  paymentData: PaymentAccountCreationData
): Promise<AccountCreationResult> {
  
  // Verify data consistency to prevent fraud
  const dataVerification = verifyUserDataConsistency(existingUser, paymentData);
  
  if (!dataVerification.isValid) {
    console.warn('Data consistency check failed:', {
      userId: existingUser.id,
      email: paymentData.customerEmail,
      conflicts: dataVerification.conflicts,
      timestamp: new Date().toISOString()
    });

    // For security, we don't associate payments with conflicting user data
    // This prevents someone from using another person's email with different personal details
    return {
      success: false,
      action: 'needs_verification',
      message: 'Os dados fornecidos não coincidem com a conta existente. Por favor, verifique suas informações.',
      conflictDetails: dataVerification.conflicts
    };
  }

  // Data is consistent - associate payment with existing user
  try {
    // Update user metadata with any missing payment-related information
    const updatedMetadata = {
      ...existingUser.raw_user_meta_data,
      // Update name if not set or if payment has more complete name
      name: existingUser.user_metadata?.full_name || 
            existingUser.user_metadata?.name || 
            paymentData.customerName,
      
      // Add payment-specific metadata
      customer_document: paymentData.customerDocument || existingUser.raw_user_meta_data?.customer_document,
      customer_phone: paymentData.customerPhone || existingUser.raw_user_meta_data?.customer_phone,
      
      // Track that this user made a payment (for analytics)
      has_made_payment: true,
      last_payment_order_id: paymentData.orderId,
      last_payment_at: new Date().toISOString()
    };

    // Update user metadata in auth system
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        user_metadata: updatedMetadata
      }
    );

    if (updateError) {
      console.error('Error updating existing user metadata:', updateError);
      return {
        success: false,
        action: 'failed',
        message: 'Erro ao associar pagamento com conta existente.'
      };
    }

    console.log('Successfully associated payment with existing user:', {
      userId: existingUser.id,
      email: paymentData.customerEmail,
      orderId: paymentData.orderId
    });

    return {
      success: true,
      user: updatedUser.user,
      action: 'found_existing',
      message: 'Pagamento associado com sua conta existente.',
      requiresPasswordSetup: false // Existing users already have credentials
    };

  } catch (error) {
    console.error('Error handling existing user:', error);
    return {
      success: false,
      action: 'failed',
      message: 'Erro ao processar conta existente.'
    };
  }
}

// =================================================================
// New User Creation
// =================================================================

/**
 * Creates a new user account from payment data
 * Sets up proper metadata and sends welcome email
 */
async function createNewUserFromPayment(
  paymentData: PaymentAccountCreationData
): Promise<AccountCreationResult> {
  
  try {
    // Prepare user metadata with payment information
    const userMetadata = {
      name: paymentData.customerName,
      full_name: paymentData.customerName,
      customer_document: paymentData.customerDocument,
      customer_phone: paymentData.customerPhone,
      
      // Payment creation tracking
      created_from_payment: true,
      payment_order_id: paymentData.orderId,
      email_setup_completed: false, // User needs to set password
      
      // Payment details
      first_payment_amount: paymentData.amount,
      first_payment_method: paymentData.paymentMethod || 'unknown',
      first_payment_plan_id: paymentData.planId,
      
      // Creation metadata
      created_at: new Date().toISOString(),
      requires_password_setup: true
    };

    // Create user using Supabase Admin API
    // User will need to set password via email confirmation flow
    const { data, error } = await supabase.auth.admin.createUser({
      email: paymentData.customerEmail,
      user_metadata: userMetadata,
      email_confirm: false // We'll send custom welcome email with password setup
    });

    if (error) {
      console.error('Error creating new user:', {
        error,
        email: paymentData.customerEmail,
        orderId: paymentData.orderId
      });

      // Handle specific error cases
      if (error.message.includes('already registered')) {
        // Race condition - user was created between our check and creation attempt
        console.log('User was created by another process, attempting to find existing user...');
        const existingUser = await findUserByEmail(paymentData.customerEmail);
        if (existingUser) {
          return await handleExistingUser(existingUser, paymentData);
        }
      }

      return {
        success: false,
        action: 'failed',
        message: `Erro ao criar conta: ${error.message}`
      };
    }

    console.log('Successfully created new user from payment:', {
      userId: data.user.id,
      email: paymentData.customerEmail,
      orderId: paymentData.orderId,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      user: data.user,
      action: 'created',
      message: 'Conta criada com sucesso! Verifique seu email para definir sua senha.',
      requiresPasswordSetup: true
    };

  } catch (error) {
    console.error('Error in createNewUserFromPayment:', error);
    return {
      success: false,
      action: 'failed',
      message: 'Erro interno ao criar conta.'
    };
  }
}

// =================================================================
// Data Verification & Fraud Protection
// =================================================================

interface DataVerificationResult {
  isValid: boolean;
  conflicts: {
    field: string;
    expected: string;
    received: string;
  }[];
}

/**
 * Verifies that payment data matches existing user data
 * Helps prevent fraud and account hijacking attempts
 */
function verifyUserDataConsistency(
  existingUser: ExistingUserData,
  paymentData: PaymentAccountCreationData
): DataVerificationResult {
  
  const conflicts: DataVerificationResult['conflicts'] = [];

  // Get user metadata for comparison
  const userData = existingUser.raw_user_meta_data || existingUser.user_metadata || {};

  // Check name consistency (allow for variations)
  if (userData.name || userData.full_name) {
    const existingName = (userData.full_name || userData.name || '').toLowerCase().trim();
    const paymentName = paymentData.customerName.toLowerCase().trim();
    
    // Allow for reasonable name variations (different order, middle names, etc.)
    if (existingName && paymentName && !areNamesCompatible(existingName, paymentName)) {
      conflicts.push({
        field: 'name',
        expected: userData.full_name || userData.name || '',
        received: paymentData.customerName
      });
    }
  }

  // Check document consistency (strict match if both exist)
  if (userData.customer_document && paymentData.customerDocument) {
    const existingDoc = userData.customer_document.replace(/\D/g, ''); // Remove formatting
    const paymentDoc = paymentData.customerDocument.replace(/\D/g, '');
    
    if (existingDoc !== paymentDoc) {
      conflicts.push({
        field: 'document',
        expected: userData.customer_document,
        received: paymentData.customerDocument
      });
    }
  }

  // Check phone consistency (allow for different formatting)
  if (userData.customer_phone && paymentData.customerPhone) {
    const existingPhone = userData.customer_phone.replace(/\D/g, '');
    const paymentPhone = paymentData.customerPhone.replace(/\D/g, '');
    
    if (existingPhone !== paymentPhone) {
      conflicts.push({
        field: 'phone',
        expected: userData.customer_phone,
        received: paymentData.customerPhone
      });
    }
  }

  // Decision logic: Allow if no major conflicts
  // We're more lenient on names but strict on documents
  const hasDocumentConflict = conflicts.some(c => c.field === 'document');
  const isValid = !hasDocumentConflict;

  return {
    isValid,
    conflicts
  };
}

/**
 * Checks if two names are compatible (allowing for variations)
 */
function areNamesCompatible(name1: string, name2: string): boolean {
  // Simple compatibility check - can be enhanced with fuzzy matching
  const words1 = name1.split(/\s+/).filter(w => w.length > 1);
  const words2 = name2.split(/\s+/).filter(w => w.length > 1);
  
  // Check if there's significant overlap in name components
  const commonWords = words1.filter(w1 => 
    words2.some(w2 => w1.includes(w2) || w2.includes(w1) || levenshteinDistance(w1, w2) <= 1)
  );
  
  // Names are compatible if they share at least half of their components
  return commonWords.length >= Math.min(words1.length, words2.length) / 2;
}

/**
 * Simple Levenshtein distance calculation for name similarity
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// =================================================================
// Test & Development Functions
// =================================================================

/**
 * Test function to verify account creation with sample data
 * For development and testing purposes only
 */
export async function testAccountCreation(): Promise<AccountCreationResult> {
  const testPaymentData: PaymentAccountCreationData = {
    customerEmail: `test-${Date.now()}@example.com`,
    customerName: 'João Silva Teste',
    customerDocument: '12345678901',
    customerPhone: '+5511999999999',
    orderId: `test-order-${Date.now()}`,
    planId: 'test-plan-123',
    amount: 9990, // R$ 99,90
    paymentMethod: 'pix'
  };

  return await createOrAssociateAccountFromPayment(testPaymentData);
}