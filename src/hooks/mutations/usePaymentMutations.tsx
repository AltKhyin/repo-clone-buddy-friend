// ABOUTME: TanStack Query mutation hooks for Pagar.me payment operations in EVIDENS
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { pagarmeClientConfig, type PagarmeOrder, type PixPaymentConfig, type CreditCardPaymentConfig } from '@/lib/pagarme';

// =================================================================
// Type Definitions & Validation Schemas
// =================================================================

/**
 * PIX Payment Creation Schema
 */
export const pixPaymentSchema = z.object({
  customerId: z.string().min(1, { message: 'Customer ID é obrigatório' }),
  amount: z.number().min(100, { message: 'Valor mínimo é R$ 1,00' }), // Amount in cents
  description: z.string().min(1, { message: 'Descrição é obrigatória' }),
  productId: z.string().optional(),
  creatorId: z.string().optional(),
  metadata: z.record(z.string()).optional()
});

/**
 * Credit Card Payment Creation Schema
 */
export const creditCardPaymentSchema = z.object({
  customerId: z.string().min(1, { message: 'Customer ID é obrigatório' }),
  amount: z.number().min(100, { message: 'Valor mínimo é R$ 1,00' }),
  description: z.string().min(1, { message: 'Descrição é obrigatória' }),
  cardToken: z.string().min(1, { message: 'Token do cartão é obrigatório' }),
  installments: z.number().min(1).max(12, { message: 'Parcelamento deve ser entre 1 e 12x' }),
  productId: z.string().optional(),
  creatorId: z.string().optional(),
  metadata: z.record(z.string()).optional()
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
export type CustomerCreationInput = z.infer<typeof customerCreationSchema>;

// =================================================================
// API Functions (for Edge Function calls)
// =================================================================

/**
 * Creates a PIX payment through EVIDENS Edge Function
 * Edge Function will handle the actual Pagar.me API call with secret key
 */
const createPixPayment = async (input: PixPaymentInput): Promise<PagarmeOrder> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/create-pix-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Falha ao criar pagamento PIX');
  }

  return response.json();
};

/**
 * Creates a Credit Card payment through EVIDENS Edge Function
 */
const createCreditCardPayment = async (input: CreditCardPaymentInput): Promise<PagarmeOrder> => {
  const response = await fetch('/functions/v1/create-credit-card-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Falha ao processar pagamento com cartão');
  }

  return response.json();
};

/**
 * Creates a Pagar.me customer through EVIDENS Edge Function
 */
const createPagarmeCustomer = async (input: CustomerCreationInput) => {
  const response = await fetch('/functions/v1/create-pagarme-customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
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
  const response = await fetch(`/functions/v1/check-payment-status?orderId=${orderId}`, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Falha ao verificar status do pagamento');
  }

  return response.json();
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
      const response = await fetch(`/functions/v1/get-payment-history?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
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
        publicKey: config.publicKey ? `${config.publicKey.slice(0, 8)}...` : 'não configurado',
        environment: config.publicKey?.includes('test') ? 'teste' : 'produção'
      };
    },
    staleTime: Infinity, // Config doesn't change during runtime
  });
};

// =================================================================
// Client-side Tokenization Helpers
// =================================================================

/**
 * Card tokenization helper (client-side only)
 * This is safe to run in the browser as it only tokenizes card data
 */
export const tokenizeCard = async (cardData: {
  number: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}) => {
  // Validate Pagar.me configuration
  if (!pagarmeClientConfig.isConfigured()) {
    throw new Error('Pagar.me não está configurado');
  }

  // This would integrate with Pagar.me's client-side tokenization library
  // For now, we'll simulate the tokenization process
  // In a real implementation, this would use Pagar.me's JavaScript SDK
  
  try {
    // Simulate tokenization delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would call Pagar.me's tokenization API
    // const token = await pagarmeJs.security.encrypt(cardData);
    
    // For now, return a mock token for development
    return {
      success: true,
      token: `card_token_${Date.now()}`,
      lastDigits: cardData.number.slice(-4),
      brand: detectCardBrand(cardData.number)
    };
  } catch (error) {
    console.error('Card tokenization failed:', error);
    throw new Error('Falha ao processar dados do cartão');
  }
};

/**
 * Helper function to detect card brand
 */
const detectCardBrand = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.match(/^4/)) return 'visa';
  if (cleanNumber.match(/^5[1-5]/)) return 'mastercard';
  if (cleanNumber.match(/^3[47]/)) return 'amex';
  if (cleanNumber.match(/^6(?:011|5)/)) return 'discover';
  
  return 'unknown';
};