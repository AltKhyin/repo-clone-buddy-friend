// ABOUTME: TanStack Query mutation hooks for Pagar.me payment operations in EVIDENS
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { pagarmeClientConfig, type PagarmeOrder, type PixPaymentConfig, type CreditCardPaymentConfig } from '@/lib/pagarme';
import { resolvePlanPricingAndFlow, type ResolvedPlanPricing, type PaymentFlowType } from '@/lib/paymentRouter';

// =================================================================
// Type Definitions & Validation Schemas
// =================================================================

/**
 * PIX Payment Creation Schema
 */
export const pixPaymentSchema = z.object({
  customerId: z.string().min(1, { message: 'Customer ID é obrigatório' }),
  amount: z.number().min(50, { message: 'Valor mínimo é R$ 0,50' }), // Pagar.me minimum // Amount in cents
  description: z.string().min(1, { message: 'Descrição é obrigatória' }),
  productId: z.string().optional(),
  creatorId: z.string().optional(),
  metadata: z.object({
    customerName: z.string(),
    customerEmail: z.string(),
    customerDocument: z.string(),
    customerPhone: z.string(),
    planName: z.string()
  }).optional()
});

/**
 * Plan-Based PIX Payment Creation Schema
 * Uses PaymentPlans table for dynamic pricing
 */
export const planBasedPixPaymentSchema = z.object({
  planId: z.string().min(1, { message: 'Plan ID é obrigatório' }),
  customerId: z.string().min(1, { message: 'Customer ID é obrigatório' }),
  metadata: z.object({
    customerName: z.string(),
    customerEmail: z.string(),
    customerDocument: z.string(),
    customerPhone: z.string()
  })
});

/**
 * Credit Card Payment Creation Schema
 */
export const creditCardPaymentSchema = z.object({
  customerId: z.string().min(1, { message: 'Customer ID é obrigatório' }),
  amount: z.number().min(50, { message: 'Valor mínimo é R$ 0,50' }), // Pagar.me minimum
  description: z.string().min(1, { message: 'Descrição é obrigatória' }),
  cardToken: z.string().min(1, { message: 'Token do cartão é obrigatório' }),
  installments: z.number().min(1).max(12, { message: 'Parcelamento deve ser entre 1 e 12x' }),
  productId: z.string().optional(),
  creatorId: z.string().optional(),
  metadata: z.object({
    customerName: z.string(),
    customerEmail: z.string(),
    customerDocument: z.string(),
    customerPhone: z.string(),
    planName: z.string()
  }).optional(),
  // Billing address for credit card payments (required by Pagar.me)
  billingAddress: z.object({
    line_1: z.string().min(1, { message: 'Endereço é obrigatório' }),
    zip_code: z.string().min(8, { message: 'CEP é obrigatório' }),
    city: z.string().min(1, { message: 'Cidade é obrigatória' }),
    state: z.string().min(2, { message: 'Estado é obrigatório' }),
    country: z.string().default('BR')
  }).optional(),
  // Optional card data for server-side tokenization
  cardData: z.object({
    number: z.string().min(13, { message: 'Número do cartão inválido' }),
    holderName: z.string().min(2, { message: 'Nome do portador é obrigatório' }),
    expirationMonth: z.string().length(2, { message: 'Mês inválido' }),
    expirationYear: z.string().length(2, { message: 'Ano inválido' }),
    cvv: z.string().min(3).max(4, { message: 'CVV inválido' })
  }).optional()
});

/**
 * Plan-Based Credit Card Payment Creation Schema
 * Uses PaymentPlans table for dynamic pricing
 */
export const planBasedCreditCardPaymentSchema = z.object({
  planId: z.string().min(1, { message: 'Plan ID é obrigatório' }),
  customerId: z.string().min(1, { message: 'Customer ID é obrigatório' }),
  installments: z.number().min(1).max(12, { message: 'Parcelamento deve ser entre 1 e 12x' }),
  metadata: z.object({
    customerName: z.string(),
    customerEmail: z.string(),
    customerDocument: z.string(),
    customerPhone: z.string()
  }),
  // Billing address for credit card payments (required by Pagar.me)
  billingAddress: z.object({
    line_1: z.string().min(1, { message: 'Endereço é obrigatório' }),
    zip_code: z.string().min(8, { message: 'CEP é obrigatório' }),
    city: z.string().min(1, { message: 'Cidade é obrigatória' }),
    state: z.string().min(2, { message: 'Estado é obrigatório' }),
    country: z.string().default('BR')
  }),
  // Card data for server-side tokenization
  cardData: z.object({
    number: z.string().min(13, { message: 'Número do cartão inválido' }),
    holderName: z.string().min(2, { message: 'Nome do portador é obrigatório' }),
    expirationMonth: z.string().length(2, { message: 'Mês inválido' }),
    expirationYear: z.string().length(2, { message: 'Ano inválido' }),
    cvv: z.string().min(3).max(4, { message: 'CVV inválido' })
  })
});

/**
 * Customer Creation Schema
 */
export const customerCreationSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  document: z.string().min(11, { message: 'Documento inválido' }),
  documentType: z.enum(['cpf', 'cnpj'], { message: 'Tipo de documento inválido' }),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().min(1, { message: 'Endereço é obrigatório' }),
    streetNumber: z.string().min(1, { message: 'Número é obrigatório' }),
    city: z.string().min(1, { message: 'Cidade é obrigatória' }),
    state: z.string().min(2, { message: 'Estado é obrigatório' }),
    zipcode: z.string().min(8, { message: 'CEP inválido' }),
    country: z.string().default('BR')
  }).optional()
});

export type PixPaymentInput = z.infer<typeof pixPaymentSchema>;
export type CreditCardPaymentInput = z.infer<typeof creditCardPaymentSchema>;
export type PlanBasedPixPaymentInput = z.infer<typeof planBasedPixPaymentSchema>;
export type PlanBasedCreditCardPaymentInput = z.infer<typeof planBasedCreditCardPaymentSchema>;
export type CustomerCreationInput = z.infer<typeof customerCreationSchema>;

// =================================================================
// Plan Pricing Resolution Functions
// =================================================================

/**
 * Resolves plan pricing and routing information using enhanced payment router
 * Determines whether to create subscription or one-time payment
 */
const resolvePlanPricing = async (planId: string): Promise<ResolvedPlanPricing> => {
  const { data: plan, error } = await supabase
    .from('PaymentPlans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error || !plan) {
    throw new Error('Plan not found or invalid plan ID');
  }

  // Use enhanced payment router for comprehensive analysis
  const resolvedPricing = resolvePlanPricingAndFlow(plan);

  // Validate minimum amount (Pagar.me requirement)
  if (resolvedPricing.finalAmount < 50) {
    throw new Error(`Amount (R$ ${(resolvedPricing.finalAmount / 100).toFixed(2)}) is below Pagar.me minimum of R$ 0,50`);
  }

  // Log routing decision for debugging
  console.log(`Payment routing for plan ${planId}:`, {
    flowType: resolvedPricing.flowType,
    amount: resolvedPricing.finalAmount,
    hasPromotion: resolvedPricing.hasPromotion,
    interval: resolvedPricing.interval
  });

  return resolvedPricing;
};

// =================================================================
// API Functions (for Edge Function calls)
// =================================================================

/**
 * Creates a PIX payment through EVIDENS Edge Function
 * Edge Function will handle the actual Pagar.me API call with secret key
 */
const createPixPayment = async (input: PixPaymentInput): Promise<PagarmeOrder> => {
  // Get the current user session for JWT token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/evidens-create-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      ...input,
      paymentMethod: 'pix'
    })
  });

  if (!response.ok) {
    let errorMessage = 'Falha ao criar pagamento PIX';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      const textError = await response.text();
      errorMessage = textError || `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Creates a Credit Card payment through EVIDENS Edge Function
 */
const createCreditCardPayment = async (input: CreditCardPaymentInput): Promise<PagarmeOrder> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/evidens-create-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      ...input,
      paymentMethod: 'credit_card'
    })
  });

  if (!response.ok) {
    let errorMessage = 'Falha ao processar pagamento com cartão';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      const textError = await response.text();
      errorMessage = textError || `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Creates a Pagar.me customer through EVIDENS Edge Function
 */
const createPagarmeCustomer = async (input: CustomerCreationInput) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/evidens-manage-customer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Falha ao criar cliente');
  }

  return response.json();
};

/**
 * Polls payment status for real-time updates (PIX payments)
 */
const checkPaymentStatus = async (orderId: string): Promise<PagarmeOrder> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/evidens-payment-status?orderId=${orderId}`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Falha ao verificar status do pagamento');
  }

  return response.json();
};

/**
 * Creates a PIX payment using PaymentPlans configuration
 * Resolves pricing from promotional_config and display_config
 */
const createPlanBasedPixPayment = async (input: PlanBasedPixPaymentInput): Promise<PagarmeOrder> => {
  // Resolve plan pricing first
  const planPricing = await resolvePlanPricing(input.planId);

  // Route based on payment flow type
  if (planPricing.flowType === 'subscription') {
    console.log(`Creating PIX subscription for plan ${input.planId}`);
    
    // Create subscription using the new Edge Function
    return createPlanBasedSubscription({
      planId: input.planId,
      customerId: input.customerId,
      paymentMethod: 'boleto', // PIX through boleto for subscriptions
      metadata: input.metadata
    });
  }

  // One-time payment flow
  console.log(`Creating one-time PIX payment for plan ${input.planId}`);
  
  const pixPaymentData: PixPaymentInput = {
    customerId: input.customerId,
    amount: planPricing.finalAmount, // Use finalAmount (includes promotions)
    description: planPricing.description,
    metadata: {
      ...input.metadata,
      planName: planPricing.name,
      flowType: planPricing.flowType,
      ...planPricing.metadata
    }
  };

  // Use existing PIX payment creation (one-time order)
  return createPixPayment(pixPaymentData);
};

/**
 * Creates a Credit Card payment using PaymentPlans configuration
 * Resolves pricing from promotional_config and display_config
 */
const createPlanBasedCreditCardPayment = async (input: PlanBasedCreditCardPaymentInput): Promise<PagarmeOrder> => {
  // Resolve plan pricing first
  const planPricing = await resolvePlanPricing(input.planId);

  // Route based on payment flow type
  if (planPricing.flowType === 'subscription') {
    console.log(`Creating credit card subscription for plan ${input.planId}`);
    
    // Create subscription using the new Edge Function
    return createPlanBasedSubscription({
      planId: input.planId,
      customerId: input.customerId,
      paymentMethod: 'credit_card',
      cardData: input.cardData,
      billingAddress: input.billingAddress,
      installments: input.installments,
      metadata: input.metadata
    });
  }

  // One-time payment flow
  console.log(`Creating one-time credit card payment for plan ${input.planId}`);
  
  const creditCardPaymentData: CreditCardPaymentInput = {
    customerId: input.customerId,
    amount: planPricing.finalAmount, // Use finalAmount (includes promotions)
    description: planPricing.description,
    cardToken: 'tokenize_on_server', // Trigger server-side tokenization
    installments: input.installments,
    billingAddress: input.billingAddress,
    cardData: input.cardData,
    metadata: {
      ...input.metadata,
      planName: planPricing.name,
      flowType: planPricing.flowType,
      ...planPricing.metadata
    }
  };

  // Use existing credit card payment creation (one-time order)
  return createCreditCardPayment(creditCardPaymentData);
};

/**
 * Creates a subscription using the new dual flow system
 */
const createPlanBasedSubscription = async (input: {
  planId: string;
  customerId: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'boleto';
  cardData?: {
    number: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
  };
  billingAddress?: {
    line_1: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  installments?: number;
  metadata: {
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    customerPhone: string;
  };
}): Promise<any> => {
  
  // Get the current user session for JWT token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/evidens-create-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    let errorMessage = 'Falha ao criar assinatura';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      const textError = await response.text();
      errorMessage = textError || `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  
  // Log successful subscription creation
  console.log('Subscription created successfully:', {
    subscription_id: result.subscription_id,
    status: result.status,
    plan_name: result.plan_name
  });

  return result;
};

// =================================================================
// Mutation Hooks
// =================================================================

/**
 * Hook for creating PIX payments
 * Follows [C6.2.4] directive for cache invalidation
 */
export const useCreatePixPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPixPayment,
    onSuccess: (data) => {
      // Invalidate related queries following [C6.2.4]
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
    },
    onError: (error) => {
      console.error('PIX payment creation failed:', error);
    }
  });
};

/**
 * Hook for creating Credit Card payments
 */
export const useCreateCreditCardPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCreditCardPayment,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
    },
    onError: (error) => {
      console.error('Credit card payment creation failed:', error);
    }
  });
};

/**
 * Hook for creating Pagar.me customers
 */
export const useCreatePagarmeCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPagarmeCustomer,
    onSuccess: (data) => {
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['pagarme-customer'] });
    },
    onError: (error) => {
      console.error('Customer creation failed:', error);
    }
  });
};

/**
 * Hook for creating PIX payments with plan-based pricing
 * Automatically resolves promotional pricing and custom plan names
 */
export const useCreatePlanBasedPixPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPlanBasedPixPayment,
    onSuccess: (data, variables) => {
      console.log('Plan-based PIX payment created:', data.id);
      
      // Invalidate payment-related queries
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      
      // Invalidate plan usage statistics
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
    },
    onError: (error, variables) => {
      console.error('Plan-based PIX payment failed:', error);
      console.error('Plan ID:', variables.planId);
    }
  });
};

/**
 * Hook for creating Credit Card payments with plan-based pricing
 * Automatically resolves promotional pricing and custom plan names
 */
export const useCreatePlanBasedCreditCardPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPlanBasedCreditCardPayment,
    onSuccess: (data, variables) => {
      console.log('Plan-based credit card payment created:', data.id);
      
      // Invalidate payment-related queries
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      
      // Invalidate plan usage statistics
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
    },
    onError: (error, variables) => {
      console.error('Plan-based credit card payment failed:', error);
      console.error('Plan ID:', variables.planId);
    }
  });
};

// =================================================================
// Query Hooks
// =================================================================

/**
 * Hook for polling payment status (useful for PIX payments)
 * Uses short polling interval for real-time updates
 */
export const usePaymentStatus = (orderId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: () => checkPaymentStatus(orderId!),
    enabled: enabled && Boolean(orderId),
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: false,
    // Stop polling when payment is confirmed or failed
    refetchOnWindowFocus: true,
    staleTime: 0 // Always consider data stale for real-time updates
  });
};

/**
 * Hook to get user's payment history
 */
export const usePaymentHistory = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['payment-history', userId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado. Faça login para continuar.');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/evidens-payment-history?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar histórico de pagamentos');
      }
      
      return response.json();
    },
    enabled: Boolean(userId),
    staleTime: 30000, // Consider stale after 30 seconds
  });
};

// =================================================================
// Utility Hooks
// =================================================================

/**
 * Hook to validate Pagar.me configuration
 * Useful for debugging and ensuring proper setup
 */
export const usePagarmeConfig = () => {
  return useQuery({
    queryKey: ['pagarme-config'],
    queryFn: () => {
      const config = pagarmeClientConfig;
      return {
        isConfigured: config.isConfigured(),
        publicKey: config.publicKey ? `${config.publicKey.slice(0, 8)}...` : 'não configurado'
      };
    },
    staleTime: Infinity, // Config doesn't change during runtime
  });
};

// =================================================================
// Client-side Tokenization Helpers
// =================================================================

/**
 * Real Pagar.me card tokenization using their JavaScript SDK
 * This integrates with Pagar.me's client-side tokenization API
 */
export const tokenizeCard = async (cardData: {
  number: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}) => {
  if (!pagarmeClientConfig.isConfigured()) {
    throw new Error('Pagar.me não está configurado');
  }

  const config = pagarmeClientConfig.getTokenizationConfig();
  
  try {
    // Real Pagar.me tokenization API call
    const response = await fetch('https://api.pagar.me/core/v5/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${config.publicKey}:`)}`,
      },
      body: JSON.stringify({
        type: 'card',
        card: {
          number: cardData.number.replace(/\s/g, ''),
          holder_name: cardData.holderName,
          exp_month: parseInt(cardData.expirationMonth),
          exp_year: parseInt(cardData.expirationYear),
          cvv: cardData.cvv
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Falha na tokenização do cartão');
    }

    const tokenData = await response.json();
    
    return {
      success: true,
      token: tokenData.id,
      lastDigits: tokenData.card.last_four_digits,
      brand: tokenData.card.brand,
      holderName: tokenData.card.holder_name
    };
  } catch (error) {
    console.error('Card tokenization failed:', error);
    throw new Error('Falha ao processar dados do cartão');
  }
};