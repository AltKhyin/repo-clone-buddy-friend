// ABOUTME: Pagar.me V2.0 API integration with environment-based configuration
const PAGARME_V2_CONFIG = {
  baseURL: 'https://api.pagar.me/core/v5',
  secretKey: import.meta.env.VITE_PAGARME_SECRET_KEY || 'sk_503afc1f882248718635c3e92591c79c',
  publicKey: import.meta.env.VITE_PAGARME_PUBLIC_KEY || 'pk_BYm9A8QCrqFKK2Zn',
} as const;

// Runtime validation of API keys
console.log('🔍 Frontend Pagarme Config:', {
  baseURL: PAGARME_V2_CONFIG.baseURL,
  secretKeyPrefix: PAGARME_V2_CONFIG.secretKey.substring(0, 15) + '...',
  publicKeyPrefix: PAGARME_V2_CONFIG.publicKey.substring(0, 15) + '...',
  isUsingProductionKeys: !PAGARME_V2_CONFIG.secretKey.startsWith('sk_test_'),
  hasEnvVars: {
    secret: Boolean(import.meta.env.VITE_PAGARME_SECRET_KEY),
    public: Boolean(import.meta.env.VITE_PAGARME_PUBLIC_KEY)
  }
});

if (import.meta.env.PROD && PAGARME_V2_CONFIG.secretKey.startsWith('sk_test_')) {
  console.error('🚨 CRITICAL: Using test API keys in production! Set VITE_PAGARME_SECRET_KEY environment variable.');
}

if (import.meta.env.PROD && PAGARME_V2_CONFIG.publicKey.startsWith('pk_test_')) {
  console.error('🚨 CRITICAL: Using test public key in production! Set VITE_PAGARME_PUBLIC_KEY environment variable.');
}

// Official Pagar.me test card numbers
export const TEST_CARDS = {
  APPROVED: {
    number: '4000000000000010',
    cvv: '123',
    expiry: '12/30',
    name: 'Teste Aprovado'
  },
  INSUFFICIENT_FUNDS: {
    number: '4000000000000028',
    cvv: '123', 
    expiry: '12/30',
    name: 'Teste Saldo Insuficiente'
  },
  PROCESSING_ERROR: {
    number: '4000000000000036',
    cvv: '123',
    expiry: '12/30', 
    name: 'Teste Erro Processamento'
  }
} as const;

// Fee rates for installment calculations
export const INSTALLMENT_FEES = {
  1: 0.0299,    // 2.99%
  3: 0.0699,    // 6.99%
  6: 0.0999,    // 9.99%
  12: 0.1499,   // 14.99%
} as const;

export type InstallmentOption = keyof typeof INSTALLMENT_FEES;

export interface PaymentV2Request {
  code: string;
  customer: {
    name: string;
    type: 'individual';
    email: string;
    document: string;
    address: {
      line_1: string;
      zip_code: string;
      city: string;
      state: string;
      country: 'BR';
    };
    phones: {
      mobile_phone: {
        country_code: '55';
        area_code: string;
        number: string;
      };
    };
  };
  billing_type: 'prepaid';
  interval: 'month';
  interval_count: 1;
  items: Array<{
    description: string;
    quantity: 1;
    code: string;
    pricing_scheme: {
      scheme_type: 'unit';
      price: number;
    };
  }>;
  payment_method: 'credit_card';
  card: {
    number: string;
    holder_name: string;
    exp_month: number;
    exp_year: number;
    cvv: string;
    billing_address: {
      line_1: string;
      zip_code: string;
      city: string;
      state: string;
      country: 'BR';
    };
  };
  installments: number;
  statement_descriptor: 'EVIDENS';
  metadata: {
    platform: 'evidens';
    plan_type: 'premium';
    installments: string;
    base_price: number;
    fee_included: number;
    fee_rate: string;
  };
}

export interface PaymentV2Response {
  id: string;
  status: string;
  code: string;
  payment_method: string;
  customer?: {
    id: string;
    email: string;
  };
  items?: Array<{
    pricing_scheme?: {
      price: number;
    };
  }>;
  installments?: number;
  next_billing_at?: string;
  created_at?: string;
}

export interface CardTokenResponse {
  id: string;
  type: 'card';
  created_at: string;
  expires_at: string;
  card: {
    brand: string;
    holder_name: string;
    first_digits: string;
    last_digits: string;
    country: string;
    fingerprint: string;
  };
}

// Calculate pricing with fees
export function calculatePricing(installments: InstallmentOption, basePrice: number = 1990) {
  const feeRate = INSTALLMENT_FEES[installments];
  const totalPrice = Math.round(basePrice * (1 + feeRate));
  const monthlyPrice = totalPrice / installments;
  
  return {
    basePrice,
    feeRate,
    totalPrice,
    monthlyPrice: Math.round(monthlyPrice * 100) / 100,
    fee: totalPrice - basePrice,
    displayMonthly: (totalPrice / 100 / installments).toFixed(2),
    displayTotal: (totalPrice / 100).toFixed(2),
  };
}

// Format phone number for Pagar.me
export function formatPhoneForPagarme(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  
  // Extract area code and number
  if (cleaned.length === 11) {
    return {
      area_code: cleaned.substring(0, 2),
      number: cleaned.substring(2),
    };
  } else if (cleaned.length === 10) {
    return {
      area_code: cleaned.substring(0, 2),
      number: cleaned.substring(2),
    };
  }
  
  // Fallback
  return {
    area_code: '11',
    number: '999999999',
  };
}

// Format CPF for Pagar.me (remove formatting)
export function formatDocumentForPagarme(document: string): string {
  return document.replace(/\D/g, '');
}

// Format ZIP code for Pagar.me
export function formatZipCodeForPagarme(zipCode: string): string {
  return zipCode.replace(/\D/g, '');
}

// Parse card expiry MM/YY to month/year
export function parseCardExpiry(expiry: string) {
  const [month, year] = expiry.split('/');
  return {
    exp_month: parseInt(month, 10),
    exp_year: parseInt(`20${year}`, 10),
  };
}

// Tokenize card data securely using Pagar.me API (client-side - currently unused)
export async function tokenizeCardV2(cardData: {
  number: string;
  holder_name: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
}): Promise<CardTokenResponse> {
  const response = await fetch(`${PAGARME_V2_CONFIG.baseURL}/tokens?appId=${PAGARME_V2_CONFIG.publicKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'card',
      card: {
        number: cardData.number.replace(/\s/g, ''),
        holder_name: cardData.holder_name,
        exp_month: cardData.exp_month,
        exp_year: cardData.exp_year,
        cvv: cardData.cvv,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Card tokenization V2 error:', {
      status: response.status,
      data,
    });
    
    throw new Error(
      data.message || 
      'Erro na tokenização do cartão. Verifique os dados informados.'
    );
  }

  return data;
}

// Build Pagar.me subscription request with token
export function buildSubscriptionRequestWithToken(
  formData: {
    name: string;
    email: string;
    document: string;
    phone: string;
    zipCode: string;
    address: string;
    city: string;
    state: string;
    installments: string;
  },
  cardToken: string
): Omit<PaymentV2Request, 'card'> & { card_token: string } {
  const installmentCount = parseInt(formData.installments, 10) as InstallmentOption;
  const pricing = calculatePricing(installmentCount);
  const phoneData = formatPhoneForPagarme(formData.phone);
  
  return {
    code: `evidens-v2-${Date.now()}`,
    customer: {
      name: formData.name,
      type: 'individual',
      email: formData.email,
      document: formatDocumentForPagarme(formData.document),
      address: {
        line_1: formData.address,
        zip_code: formatZipCodeForPagarme(formData.zipCode),
        city: formData.city,
        state: formData.state,
        country: 'BR',
      },
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: phoneData.area_code,
          number: phoneData.number,
        },
      },
    },
    billing_type: 'prepaid',
    interval: 'month',
    interval_count: 1,
    items: [
      {
        description: `EVIDENS - Plano Premium (${installmentCount}x)`,
        quantity: 1,
        code: `evidens-premium-${installmentCount}x`,
        pricing_scheme: {
          scheme_type: 'unit',
          price: pricing.totalPrice,
        },
      },
    ],
    payment_method: 'credit_card',
    card_token: cardToken,
    installments: installmentCount,
    statement_descriptor: 'EVIDENS',
    metadata: {
      platform: 'evidens',
      plan_type: 'premium',
      installments: `${installmentCount}x`,
      base_price: pricing.basePrice,
      fee_included: pricing.fee,
      fee_rate: `${(pricing.feeRate * 100).toFixed(2)}%`,
    },
  };
}

// Legacy function for backward compatibility
export function buildSubscriptionRequest(formData: {
  name: string;
  email: string;
  document: string;
  phone: string;
  zipCode: string;
  address: string;
  city: string;
  state: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  installments: string;
}): PaymentV2Request {
  const installmentCount = parseInt(formData.installments, 10) as InstallmentOption;
  const pricing = calculatePricing(installmentCount);
  const phoneData = formatPhoneForPagarme(formData.phone);
  const cardExpiry = parseCardExpiry(formData.cardExpiry);
  
  return {
    code: `evidens-v2-${Date.now()}`,
    customer: {
      name: formData.name,
      type: 'individual',
      email: formData.email,
      document: formatDocumentForPagarme(formData.document),
      address: {
        line_1: formData.address,
        zip_code: formatZipCodeForPagarme(formData.zipCode),
        city: formData.city,
        state: formData.state,
        country: 'BR',
      },
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: phoneData.area_code,
          number: phoneData.number,
        },
      },
    },
    billing_type: 'prepaid',
    interval: 'month',
    interval_count: 1,
    items: [
      {
        description: `EVIDENS - Plano Premium (${installmentCount}x)`,
        quantity: 1,
        code: `evidens-premium-${installmentCount}x`,
        pricing_scheme: {
          scheme_type: 'unit',
          price: pricing.totalPrice,
        },
      },
    ],
    payment_method: 'credit_card',
    card: {
      number: formData.cardNumber.replace(/\s/g, ''),
      holder_name: formData.cardName,
      exp_month: cardExpiry.exp_month,
      exp_year: cardExpiry.exp_year,
      cvv: formData.cardCvv,
      billing_address: {
        line_1: formData.address,
        zip_code: formatZipCodeForPagarme(formData.zipCode),
        city: formData.city,
        state: formData.state,
        country: 'BR',
      },
    },
    installments: installmentCount,
    statement_descriptor: 'EVIDENS',
    metadata: {
      platform: 'evidens',
      plan_type: 'premium',
      installments: `${installmentCount}x`,
      base_price: pricing.basePrice,
      fee_included: pricing.fee,
      fee_rate: `${(pricing.feeRate * 100).toFixed(2)}%`,
    },
  };
}

// V2.0 Enhanced: Build credit card subscription request with PaymentPlanV2 (FIXED STRUCTURE)
export function buildSubscriptionRequestV2(
  formData: {
    name: string;
    email: string;
    document: string;
    phone: string;
    zipCode: string;
    address: string;
    city: string;
    state: string;
    cardNumber: string;
    cardName: string;
    cardExpiry: string;
    cardCvv: string;
    installments: number;
  },
  paymentPlan: {
    id: string;
    name: string;
    final_amount: number;
    installment_config: any;
    duration_days: number;
    plan_type: string;
  },
  installmentOption: {
    installments: number;
    totalAmount: number;
    feeRate: number;
  }
): PaymentV2Request {
  const phoneData = formatPhoneForPagarme(formData.phone);
  const cardExpiry = parseCardExpiry(formData.cardExpiry);

  return {
    code: `ev2-${paymentPlan.id.slice(0, 8)}-${Date.now().toString().slice(-10)}`,
    customer: {
      name: formData.name,
      type: 'individual',
      email: formData.email,
      document: formatDocumentForPagarme(formData.document),
      address: {
        line_1: formData.address,
        zip_code: formatZipCodeForPagarme(formData.zipCode),
        city: formData.city,
        state: formData.state,
        country: 'BR',
      },
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: phoneData.area_code,
          number: phoneData.number,
        },
      },
    },
    billing_type: 'prepaid',
    interval: 'month',
    interval_count: 1,
    // ✅ FIX: Top-level pricing_scheme (REQUIRED for Pagar.me subscriptions)
    pricing_scheme: {
      scheme_type: 'unit',
      price: installmentOption.totalAmount,  // Total price in cents
    },
    items: [
      {
        description: `EVIDENS - ${paymentPlan.name} (${formData.installments}x)`,
        quantity: 1,
        code: `evidens-v2-${paymentPlan.plan_type}-${formData.installments}x`,
        // ✅ FIX: Items need pricing_scheme for Pagar.me subscriptions
        pricing_scheme: {
          scheme_type: 'unit',
          price: installmentOption.totalAmount,  // Total price in cents
        },
      },
    ],
    // ✅ FIX: Will be converted to payment_methods array in Edge Function
    payment_methods: [],  // Placeholder - Edge Function will populate with card_token
    // ✅ FIX: Billing placeholder - Edge Function will populate from card data
    billing: {
      name: '',
      address: {
        line_1: '',
        zip_code: '',
        city: '',
        state: '',
        country: 'BR',
      },
    },
    card: {
      number: formData.cardNumber.replace(/\s/g, ''),
      holder_name: formData.cardName,
      exp_month: cardExpiry.exp_month,
      exp_year: cardExpiry.exp_year,
      cvv: formData.cardCvv,
      billing_address: {
        line_1: formData.address,
        zip_code: formatZipCodeForPagarme(formData.zipCode),
        city: formData.city,
        state: formData.state,
        country: 'BR',
      },
    },
    installments: formData.installments,
    statement_descriptor: 'EVIDENS',
    currency: 'BRL',  // ✅ FIX: Added currency specification
    metadata: {
      platform: 'evidens',
      plan_type: paymentPlan.plan_type,
      plan_id: paymentPlan.id,
      installments: `${formData.installments}x`,
      base_price: paymentPlan.final_amount,
      fee_included: installmentOption.totalAmount - paymentPlan.final_amount,
      fee_rate: `${(installmentOption.feeRate * 100).toFixed(2)}%`,
      duration_days: paymentPlan.duration_days.toString(),
    },
  };
}

// PIX Payment Types
export interface PixPaymentRequest {
  code: string;
  customer: {
    name: string;
    type: 'individual';
    email: string;
    document: string;
    phones: {
      mobile_phone: {
        country_code: '55';
        area_code: string;
        number: string;
      };
    };
  };
  items: Array<{
    description: string;
    quantity: 1;
    amount: number;
  }>;
  payments: Array<{
    payment_method: 'pix';
    amount: number;
    pix: {
      expires_in: number;
    };
  }>;
}

export interface PixPaymentResponse {
  id: string;
  status: string;
  code: string;
  amount: number;
  customer?: {
    id: string;
    email: string;
  };
  charges?: Array<{
    id: string;
    payment_method: string;
    status: string;
    last_transaction?: {
      qr_code: string;
      qr_code_url: string;
      expires_at: string;
      id: string;
      status: string;
    };
  }>;
  created_at?: string;
}

// Build PIX payment request (Legacy)
export function buildPixPaymentRequest(formData: {
  name: string;
  email: string;
  document: string;
  phone: string;
  amount?: number;
}): PixPaymentRequest {
  const phoneData = formatPhoneForPagarme(formData.phone);
  const baseAmount = formData.amount || 1990; // Default R$ 19.90
  
  return {
    code: `evidens-pix-${Date.now()}`,
    customer: {
      name: formData.name,
      type: 'individual',
      email: formData.email,
      document: formatDocumentForPagarme(formData.document),
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: phoneData.area_code,
          number: phoneData.number,
        },
      },
    },
    items: [
      {
        description: 'EVIDENS - Plano Premium',
        quantity: 1,
        amount: baseAmount,
      },
    ],
    payments: [
      {
        payment_method: 'pix',
        amount: baseAmount,
        pix: {
          expires_in: 3600, // 1 hour
        },
      },
    ],
  };
}

// V2.0 Enhanced: Build PIX payment request with PaymentPlanV2
export function buildPixPaymentRequestV2(
  formData: {
    name: string;
    email: string;
    document: string;
    phone: string;
  },
  paymentPlan: {
    id: string;
    name: string;
    final_amount: number;
    pixFinalAmount: number; // Pre-calculated PIX price with discount
    pix_config: any;
    duration_days: number;
  }
): PixPaymentRequest {
  const phoneData = formatPhoneForPagarme(formData.phone);
  const pixAmount = paymentPlan.pixFinalAmount || paymentPlan.final_amount;
  const expirationMinutes = paymentPlan.pix_config?.expirationMinutes || 60;
  
  return {
    code: `ev2-pix-${paymentPlan.id.slice(0, 8)}-${Date.now().toString().slice(-10)}`,
    customer: {
      name: formData.name,
      type: 'individual',
      email: formData.email,
      document: formatDocumentForPagarme(formData.document),
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: phoneData.area_code,
          number: phoneData.number,
        },
      },
    },
    items: [
      {
        description: `EVIDENS - ${paymentPlan.name} (PIX)`,
        quantity: 1,
        amount: pixAmount,
      },
    ],
    payments: [
      {
        payment_method: 'pix',
        amount: pixAmount,
        pix: {
          expires_in: expirationMinutes * 60, // Convert minutes to seconds
        },
      },
    ],
  };
}

// Make PIX API call through Edge Function (to avoid CORS issues)
export async function createPixPaymentV2(request: PixPaymentRequest, supabaseUrl: string, accessToken: string): Promise<PixPaymentResponse> {
  const response = await fetch(`${supabaseUrl}/functions/v1/payment-v2-pix`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('PIX Payment V2 Edge Function Error:', {
      status: response.status,
      data,
    });
    
    throw new Error(
      data.error || 
      'Erro no processamento do PIX. Tente novamente.'
    );
  }

  return data.order;
}

// Make API call through Edge Function (to avoid CORS issues)
export async function createSubscriptionV2(request: PaymentV2Request, supabaseUrl: string, accessToken: string): Promise<PaymentV2Response> {
  const response = await fetch(`${supabaseUrl}/functions/v1/payment-v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Payment V2 Edge Function Error:', {
      status: response.status,
      data,
    });
    
    throw new Error(
      data.error || 
      'Erro no processamento do pagamento. Tente novamente.'
    );
  }

  return data.subscription;
}

// Validate form data before submission
export function validatePaymentForm(data: any): string[] {
  const errors: string[] = [];
  
  if (!data.name?.trim()) errors.push('Nome é obrigatório');
  if (!data.email?.trim()) errors.push('Email é obrigatório');
  if (!data.document?.trim()) errors.push('CPF é obrigatório');
  if (!data.phone?.trim()) errors.push('Telefone é obrigatório');
  if (!data.address?.trim()) errors.push('Endereço é obrigatório');
  if (!data.city?.trim()) errors.push('Cidade é obrigatória');
  if (!data.state?.trim()) errors.push('Estado é obrigatório');
  if (!data.zipCode?.trim()) errors.push('CEP é obrigatório');
  
  if (!data.cardNumber?.trim()) errors.push('Número do cartão é obrigatório');
  if (!data.cardName?.trim()) errors.push('Nome no cartão é obrigatório');
  if (!data.cardExpiry?.trim()) errors.push('Data de vencimento é obrigatória');
  if (!data.cardCvv?.trim()) errors.push('CVV é obrigatório');
  
  if (!data.installments) errors.push('Selecione o número de parcelas');
  
  return errors;
}