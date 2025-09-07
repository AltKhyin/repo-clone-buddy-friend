// ABOUTME: TanStack Query mutation hooks for Pagar.me payment operations in EVIDENS
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { pagarmeClientConfig, type PagarmeOrder, type PixPaymentConfig, type CreditCardPaymentConfig } from '@/lib/pagarme';

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
 * Resolves the actual price for a plan considering promotional configurations
 */
const resolvePlanPricing = async (planId: string) => {
  const { data: plan, error } = await supabase
    .from('PaymentPlans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error || !plan) {
    throw new Error('Plan not found or invalid plan ID');
  }

  // Parse promotional configuration
  let finalPrice = plan.amount; // Default to base amount
  let displayName = plan.name;
  let promotionalActive = false;

  if (plan.promotional_config) {
    try {
      const promoConfig = typeof plan.promotional_config === 'string' 
        ? JSON.parse(plan.promotional_config) 
        : plan.promotional_config;

      // Check if promotion is active and not expired
      const isExpired = promoConfig.expiresAt 
        ? new Date(promoConfig.expiresAt) < new Date() 
        : false;

      if (promoConfig.isActive && !isExpired && promoConfig.finalPrice > 0) {
        finalPrice = promoConfig.finalPrice;
        promotionalActive = true;
      }

      // Use custom name if available and enabled
      if (plan.display_config) {
        const displayConfig = typeof plan.display_config === 'string'
          ? JSON.parse(plan.display_config)
          : plan.display_config;
        
        if (displayConfig.showCustomName && promoConfig.customName) {
          displayName = promoConfig.customName;
        }
      }
    } catch (error) {
      console.warn('Failed to parse promotional_config, using base price:', error);
    }
  }

  // Validate minimum amount (Pagar.me requirement)
  if (finalPrice < 50) {
    throw new Error('Amount is below Pagar.me minimum of R$ 0,50');
  }

  return {
    planId: plan.id,
    amount: finalPrice,
    originalAmount: plan.amount,
    description: displayName,
    promotional: promotionalActive,
    planType: plan.type,
    billingInterval: plan.billing_interval,
    metadata: {
      planId: plan.id,
      planName: plan.name,
      promotional: promotionalActive,
      originalAmount: plan.amount,
      finalAmount: finalPrice
    }
  };
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

  // Convert to standard PIX payment with resolved pricing
  const pixPaymentData: PixPaymentInput = {
    customerId: input.customerId,
    amount: planPricing.amount,
    description: planPricing.description,
    metadata: {
      ...input.metadata,
      planName: planPricing.description,
      ...planPricing.metadata
    }
  };

  // Use existing PIX payment creation
  return createPixPayment(pixPaymentData);
};

/**
 * Creates a Credit Card payment using PaymentPlans configuration
 * Resolves pricing from promotional_config and display_config
 */
const createPlanBasedCreditCardPayment = async (input: PlanBasedCreditCardPaymentInput): Promise<PagarmeOrder> => {
  // Resolve plan pricing first
  const planPricing = await resolvePlanPricing(input.planId);

  // Convert to standard credit card payment with resolved pricing
  const creditCardPaymentData: CreditCardPaymentInput = {
    customerId: input.customerId,
    amount: planPricing.amount,
    description: planPricing.description,
    cardToken: '', // Will be generated server-side
    installments: input.installments,
    billingAddress: input.billingAddress,
    cardData: input.cardData,
    metadata: {
      ...input.metadata,
      planName: planPricing.description,
      ...planPricing.metadata
    }
  };

  // Use existing credit card payment creation
  return createCreditCardPayment(creditCardPaymentData);
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