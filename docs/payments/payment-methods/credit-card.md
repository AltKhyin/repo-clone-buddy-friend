# Credit Card Payment Implementation Guide

## Overview

Credit card payments provide immediate confirmation and installment options for EVIDENS subscriptions. This guide covers secure card tokenization, PCI compliance, installment processing, and comprehensive error handling.

## Credit Card Advantages

### **Business Benefits**
- **💳 Highest Conversion**: Superior conversion rates vs other payment methods
- **📊 Installments**: 1-12x installment options increase accessibility
- **⚡ Immediate Confirmation**: Instant payment authorization and processing
- **🔄 Recurring Billing**: Perfect for subscription model
- **🎯 Premium Users**: Attracts users comfortable with digital payments

### **Technical Benefits**
- **Instant Processing**: No waiting period like boleto
- **Secure Tokenization**: PCI compliant card data handling
- **Rich Transaction Data**: Detailed authorization and processing info
- **Fraud Protection**: Built-in fraud detection and prevention

## Credit Card Payment Structure

### **Card Object Structure (API Reference)**

```typescript
// Official Pagar.me card structure from API collection
interface PagarmeCardData {
  // Card details (for tokenization only - never store)
  number: string;              // Card number (16 digits)
  holder_name: string;         // Cardholder full name
  exp_month: number;           // Expiration month (1-12)
  exp_year: number;            // Expiration year (YY format)
  cvv: string;                 // Security code (3-4 digits)
  
  // Billing address (required for fraud prevention)
  billing_address: {
    line_1: string;            // Street address
    line_2?: string;           // Apartment/suite (optional)
    zip_code: string;          // CEP (8 digits)
    city: string;              // City name
    state: string;             // Two-letter state (SP, RJ)
    country: string;           // Always "BR"
  };
}

// Credit card payment configuration
interface CreditCardPaymentConfig {
  payment_method: 'credit_card';
  credit_card: {
    operation_type: 'auth_and_capture'; // Standard for EVIDENS
    installments: number;               // 1-12 installments
    statement_descriptor: string;       // Max 13 characters
    
    // Card data (use card_token instead of raw card in production)
    card?: PagarmeCardData;            // For direct card data (PCI compliance required)
    card_token?: string;               // Tokenized card (recommended)
    card_id?: string;                  // Saved card ID
  };
}
```

## Secure Card Tokenization

### **Client-Side Tokenization Pattern**

```typescript
// EVIDENS secure card tokenization (client-side only)
import { loadScript } from '@/utils/loadScript';

export const useCreditCardTokenization = () => {
  const [pagarmeJs, setPagarmeJs] = useState<any>(null);
  
  // Load Pagar.me.js library
  useEffect(() => {
    const loadPagarmeJs = async () => {
      await loadScript('https://assets.pagar.me/checkout/1.1.0/js/pagarme.min.js');
      
      const publicKey = import.meta.env.VITE_PAGARME_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Pagar.me public key not configured');
      }
      
      const pagarme = window.pagarme;
      await pagarme.client.connect({ publicKey });
      setPagarmeJs(pagarme);
    };
    
    loadPagarmeJs().catch(console.error);
  }, []);
  
  // Tokenize card data securely
  const tokenizeCard = useCallback(async (cardData: {
    number: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
  }) => {
    if (!pagarmeJs) {
      throw new Error('Pagar.me.js not loaded');
    }
    
    try {
      // Client-side tokenization (never sends card data to EVIDENS servers)
      const cardToken = await pagarmeJs.security.encrypt({
        card_number: cardData.number.replace(/\D/g, ''),
        card_holder_name: cardData.holderName.toUpperCase(),
        card_expiration_date: `${cardData.expirationMonth.padStart(2, '0')}${cardData.expirationYear}`,
        card_cvv: cardData.cvv
      });
      
      return {
        success: true,
        token: cardToken,
        lastDigits: cardData.number.slice(-4),
        brand: detectCardBrand(cardData.number),
        expirationMonth: cardData.expirationMonth,
        expirationYear: cardData.expirationYear
      };
      
    } catch (error) {
      console.error('Card tokenization failed:', error);
      throw new Error('Erro ao processar dados do cartão. Verifique as informações.');
    }
  }, [pagarmeJs]);
  
  return {
    tokenizeCard,
    isReady: Boolean(pagarmeJs),
    loading: !pagarmeJs
  };
};

// Card brand detection utility
const detectCardBrand = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Brazilian card patterns
  if (cleanNumber.match(/^4/)) return 'visa';
  if (cleanNumber.match(/^5[1-5]/)) return 'mastercard';
  if (cleanNumber.match(/^3[47]/)) return 'amex';
  if (cleanNumber.match(/^(4011|4312|4389|4514|4573|5066|5067|5090|6277|6363|6504|6516|6550|6551|6552|6553|6554|6555)/)) return 'elo';
  if (cleanNumber.match(/^(38[0-9]|60[0-9])/)) return 'hipercard';
  
  return 'unknown';
};
```

### **Card Validation Utilities**

```typescript
// Comprehensive card validation
export const cardValidation = {
  
  // Validate card number using Luhn algorithm
  validateCardNumber: (number: string): boolean => {
    const cleanNumber = number.replace(/\D/g, '');
    
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }
    
    let sum = 0;
    let shouldDouble = false;
    
    // Luhn algorithm
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  },
  
  // Validate expiration date
  validateExpiration: (month: string, year: string): boolean => {
    const expMonth = parseInt(month);
    const expYear = parseInt(`20${year}`); // Convert YY to YYYY
    
    if (expMonth < 1 || expMonth > 12) return false;
    
    const now = new Date();
    const expDate = new Date(expYear, expMonth - 1);
    
    return expDate > now;
  },
  
  // Validate CVV
  validateCVV: (cvv: string, cardBrand: string): boolean => {
    const cleanCVV = cvv.replace(/\D/g, '');
    
    // American Express uses 4 digits, others use 3
    if (cardBrand === 'amex') {
      return cleanCVV.length === 4;
    }
    
    return cleanCVV.length === 3;
  },
  
  // Format card number for display
  formatCardNumber: (number: string): string => {
    const clean = number.replace(/\D/g, '');
    
    // Detect Amex pattern (4-6-5)
    if (clean.match(/^3[47]/)) {
      return clean.replace(/(\d{4})(\d{6})(\d{0,5})/, '$1 $2 $3').trim();
    }
    
    // Standard pattern (4-4-4-4)
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
};
```

## Credit Card Payment Implementation

### **Credit Card Payment Edge Function**

```typescript
// Edge Function: create-credit-card-payment
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticatePagarme, validateAuth, sendError, sendSuccess } from '../_shared/helpers.ts';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return sendError('Method not allowed', 405);
  }

  try {
    // 1. Authenticate EVIDENS user
    const { user } = await validateAuth(req);
    
    // 2. Validate payment data
    const paymentData = await req.json();
    const validation = creditCardPaymentSchema.safeParse(paymentData);
    
    if (!validation.success) {
      return sendError('Invalid payment data', 400, validation.error.errors);
    }
    
    const { 
      customerId, 
      amount, 
      description, 
      cardToken, 
      installments,
      productId,
      metadata 
    } = validation.data;
    
    // 3. Create credit card order using official API structure
    const headers = authenticatePagarme(Deno.env.get('PAGARME_SECRET_KEY')!);
    
    const orderPayload = {
      closed: true, // Important: close order immediately for credit cards
      customer_id: customerId, // Use customer_id when customer already exists
      items: [
        {
          amount: amount, // Amount in cents
          description: description,
          quantity: 1,
          code: productId || 'EVIDENS_SUBSCRIPTION'
        }
      ],
      payments: [
        {
          payment_method: 'credit_card',
          credit_card: {
            operation_type: 'auth_and_capture', // Authorize and capture immediately
            installments: installments,
            statement_descriptor: 'EVIDENS', // Max 13 characters - appears on bank statement
            card_token: cardToken // Use tokenized card data (PCI compliant)
          }
        }
      ],
      metadata: {
        evidens_user_id: user.id,
        evidens_email: user.email,
        payment_flow: 'subscription_signup',
        installment_plan: `${installments}x`,
        created_via: 'evidens_platform',
        ...metadata
      }
    };

    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Pagar.me card order creation failed:', error);
      return sendError('Credit card payment failed', 400, error);
    }

    const order = await response.json();
    const charge = order.charges?.[0];
    
    if (!charge) {
      return sendError('No charge created for credit card payment', 500);
    }

    // 4. Store payment transaction in EVIDENS
    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      pagarme_order_id: order.id,
      pagarme_charge_id: charge.id,
      amount: amount,
      payment_method: 'credit_card',
      installments: installments,
      status: charge.status === 'paid' ? 'completed' : 'processing',
      auth_code: charge.last_transaction?.auth_code,
      acquirer_name: charge.last_transaction?.acquirer_name,
      card_brand: charge.last_transaction?.card?.brand,
      card_last_digits: charge.last_transaction?.card?.last_four_digits,
      created_at: new Date().toISOString()
    });

    // 5. Return payment result
    return sendSuccess({
      orderId: order.id,
      chargeId: charge.id,
      amount: amount,
      installments: installments,
      status: charge.status,
      authCode: charge.last_transaction?.auth_code,
      cardData: {
        brand: charge.last_transaction?.card?.brand,
        lastDigits: charge.last_transaction?.card?.last_four_digits
      },
      success: charge.status === 'paid',
      requiresConfirmation: charge.status === 'processing'
    });
    
  } catch (error) {
    console.error('Credit card payment creation error:', error);
    return sendError('Internal server error', 500);
  }
}
```

## Credit Card Frontend Implementation

### **Card Input Form Component**

```typescript
// Secure credit card input form with validation
export const CreditCardForm = ({ 
  onTokenGenerated,
  planId,
  customerId,
  loading = false
}: {
  onTokenGenerated: (tokenData: CardTokenData) => void;
  planId: string;
  customerId: string;
  loading?: boolean;
}) => {
  const [cardData, setCardData] = useState({
    number: '',
    holderName: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: ''
  });
  
  const [cardBrand, setCardBrand] = useState<string>('');
  const [installments, setInstallments] = useState(1);
  
  const { tokenizeCard, isReady } = useCreditCardTokenization();
  const planDetails = getSubscriptionPlan(planId);
  
  // Update card brand as user types
  useEffect(() => {
    const brand = detectCardBrand(cardData.number);
    setCardBrand(brand);
  }, [cardData.number]);
  
  // Calculate installment options
  const installmentOptions = useMemo(() => {
    const maxInstallments = Math.min(12, Math.floor(planDetails.price)); // R$ 1.00 minimum per installment
    const options = [];
    
    for (let i = 1; i <= maxInstallments; i++) {
      const installmentValue = planDetails.price / i;
      options.push({
        number: i,
        value: installmentValue,
        total: planDetails.price,
        label: i === 1 
          ? `À vista - R$ ${planDetails.price.toFixed(2)}` 
          : `${i}x de R$ ${installmentValue.toFixed(2)} sem juros`
      });
    }
    
    return options;
  }, [planDetails.price]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate all fields
      if (!cardValidation.validateCardNumber(cardData.number)) {
        toast.error('Número do cartão inválido');
        return;
      }
      
      if (!cardValidation.validateExpiration(cardData.expirationMonth, cardData.expirationYear)) {
        toast.error('Data de validade inválida');
        return;
      }
      
      if (!cardValidation.validateCVV(cardData.cvv, cardBrand)) {
        toast.error('CVV inválido');
        return;
      }
      
      // Tokenize card data
      const tokenResult = await tokenizeCard(cardData);
      
      if (tokenResult.success) {
        onTokenGenerated({
          token: tokenResult.token,
          brand: tokenResult.brand,
          lastDigits: tokenResult.lastDigits,
          installments: installments,
          expirationMonth: tokenResult.expirationMonth,
          expirationYear: tokenResult.expirationYear
        });
      }
      
    } catch (error) {
      console.error('Card tokenization failed:', error);
      toast.error('Erro ao processar cartão. Verifique os dados.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Number Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Número do Cartão
        </label>
        <div className="relative">
          <Input
            type="text"
            placeholder="1234 1234 1234 1234"
            value={cardValidation.formatCardNumber(cardData.number)}
            onChange={(e) => setCardData(prev => ({ 
              ...prev, 
              number: e.target.value.replace(/\D/g, '').slice(0, 16)
            }))}
            className="pr-12"
            maxLength={19} // Formatted length
          />
          {cardBrand && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CardBrandIcon brand={cardBrand} />
            </div>
          )}
        </div>
      </div>
      
      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Nome no Cartão
        </label>
        <Input
          type="text"
          placeholder="João Silva"
          value={cardData.holderName}
          onChange={(e) => setCardData(prev => ({ 
            ...prev, 
            holderName: e.target.value.toUpperCase()
          }))}
        />
      </div>
      
      {/* Expiration and CVV */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Mês
          </label>
          <Select value={cardData.expirationMonth} onValueChange={(value) => 
            setCardData(prev => ({ ...prev, expirationMonth: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, '0');
                return (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Ano
          </label>
          <Select value={cardData.expirationYear} onValueChange={(value) =>
            setCardData(prev => ({ ...prev, expirationYear: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => {
                const year = (new Date().getFullYear() + i).toString().slice(-2);
                return (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            CVV
          </label>
          <Input
            type="text"
            placeholder={cardBrand === 'amex' ? '1234' : '123'}
            value={cardData.cvv}
            onChange={(e) => setCardData(prev => ({ 
              ...prev, 
              cvv: e.target.value.replace(/\D/g, '').slice(0, cardBrand === 'amex' ? 4 : 3)
            }))}
            maxLength={cardBrand === 'amex' ? 4 : 3}
          />
        </div>
      </div>
      
      {/* Installment Selection */}
      {installmentOptions.length > 1 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Forma de Pagamento
          </label>
          <Select value={installments.toString()} onValueChange={(value) => 
            setInstallments(parseInt(value))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {installmentOptions.map((option) => (
                <SelectItem key={option.number} value={option.number.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={loading || !isReady || !cardData.number || !cardData.holderName || 
                  !cardData.expirationMonth || !cardData.expirationYear || !cardData.cvv}
      >
        {loading ? 'Processando...' : `Pagar R$ ${planDetails.price.toFixed(2)}`}
      </Button>
      
      {/* Security Notice */}
      <div className="text-xs text-gray-600 text-center">
        <Lock className="inline w-3 h-3 mr-1" />
        Seus dados estão protegidos com criptografia de nível bancário
      </div>
    </form>
  );
};
```

### **Installment Calculator**

```typescript
// Calculate installment options and interest
export const useInstallmentCalculator = (baseAmount: number) => {
  
  // EVIDENS installment configuration (no interest policy)
  const calculateInstallments = useCallback((amount: number) => {
    const amountInCents = amount * 100;
    const minInstallmentValue = 500; // R$ 5.00 minimum per installment
    const maxInstallments = 12;
    
    const availableInstallments = [];
    
    for (let i = 1; i <= maxInstallments; i++) {
      const installmentValue = Math.round(amountInCents / i);
      
      // Skip if installment would be too small
      if (installmentValue < minInstallmentValue) {
        break;
      }
      
      availableInstallments.push({
        number: i,
        valueInCents: installmentValue,
        valueInReais: installmentValue / 100,
        totalInCents: installmentValue * i,
        totalInReais: (installmentValue * i) / 100,
        
        // Display formatting
        displayText: i === 1 
          ? `À vista - R$ ${(installmentValue / 100).toFixed(2)}`
          : `${i}x de R$ ${(installmentValue / 100).toFixed(2)} sem juros`,
        
        // Recommendation score (lower installments are better for business)
        recommendationScore: maxInstallments - i + 1
      });
    }
    
    return availableInstallments;
  }, []);
  
  const installmentOptions = useMemo(() => calculateInstallments(baseAmount), [baseAmount, calculateInstallments]);
  
  return {
    installmentOptions,
    maxInstallments: installmentOptions.length,
    minInstallmentValue: 5.00,
    
    // Helper methods
    getInstallmentByNumber: (number: number) => 
      installmentOptions.find(opt => opt.number === number),
    
    getRecommendedInstallment: () => 
      installmentOptions.sort((a, b) => b.recommendationScore - a.recommendationScore)[0]
  };
};
```

## Credit Card Status Management

### **Card Payment Processing Flow**

```typescript
// Credit card payment flow with real-time status
export const useCreditCardPaymentFlow = (customerId: string) => {
  const createCardPayment = useCreateCreditCardPayment();
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'tokenizing' | 'processing' | 'completed' | 'failed'>('idle');
  
  const processCardPayment = useCallback(async (
    tokenData: CardTokenData,
    paymentDetails: {
      amount: number;
      description: string;
      productId?: string;
    }
  ) => {
    try {
      setProcessingStatus('processing');
      
      const result = await createCardPayment.mutateAsync({
        customerId,
        amount: paymentDetails.amount,
        description: paymentDetails.description,
        cardToken: tokenData.token,
        installments: tokenData.installments,
        productId: paymentDetails.productId
      });
      
      setPaymentResult(result);
      
      if (result.success) {
        setProcessingStatus('completed');
        
        // Track successful payment
        analyticsTrack('card_payment_success', {
          orderId: result.orderId,
          amount: result.amount,
          installments: result.installments,
          cardBrand: result.cardData?.brand,
          authCode: result.authCode
        });
        
        toast.success('Pagamento processado com sucesso!');
        
        // Immediate subscription activation for card payments
        await activateSubscription(result.orderId);
        
      } else {
        setProcessingStatus('failed');
        toast.error('Pagamento não autorizado. Tente outro cartão.');
      }
      
      return result;
      
    } catch (error) {
      setProcessingStatus('failed');
      console.error('Card payment processing failed:', error);
      
      const handledError = handleCreditCardError(error);
      toast.error(handledError.message);
      
      throw error;
    }
  }, [createCardPayment, customerId]);
  
  return {
    processCardPayment,
    paymentResult,
    processingStatus,
    isProcessing: processingStatus === 'processing',
    isCompleted: processingStatus === 'completed',
    isFailed: processingStatus === 'failed'
  };
};
```

### **Card Payment Confirmation UI**

```typescript
// Credit card payment confirmation screen
export const CreditCardConfirmation = ({ 
  paymentResult,
  onContinue 
}: {
  paymentResult: any;
  onContinue: () => void;
}) => {
  
  if (!paymentResult?.success) {
    return (
      <Card className="p-6 text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">
          Pagamento Não Autorizado
        </h3>
        <p className="text-gray-600 mb-4">
          O pagamento não foi processado. Verifique os dados do cartão ou tente outro cartão.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </Card>
    );
  }
  
  return (
    <Card className="p-6 text-center">
      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
      
      <h3 className="text-lg font-semibold text-green-600 mb-2">
        Pagamento Aprovado!
      </h3>
      
      <div className="bg-green-50 p-4 rounded-lg mb-4">
        <div className="text-sm text-gray-700 space-y-1">
          <div className="flex justify-between">
            <span>Valor:</span>
            <span className="font-medium">R$ {(paymentResult.amount / 100).toFixed(2)}</span>
          </div>
          
          {paymentResult.installments > 1 && (
            <div className="flex justify-between">
              <span>Parcelamento:</span>
              <span className="font-medium">{paymentResult.installments}x sem juros</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Cartão:</span>
            <span className="font-medium">
              {paymentResult.cardData?.brand?.toUpperCase()} •••• {paymentResult.cardData?.lastDigits}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Autorização:</span>
            <span className="font-medium">{paymentResult.authCode}</span>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Seu acesso foi liberado imediatamente. Bem-vindo ao EVIDENS!
      </p>
      
      <Button onClick={onContinue} className="w-full">
        Acessar Plataforma
      </Button>
    </Card>
  );
};
```

## Installment Management

### **Installment Configuration (Official API Structure)**

```typescript
// Installment configuration following official API pattern
export const createInstallmentConfig = (
  totalAmount: number,
  selectedInstallments: number
): Array<{ number: number; total: number }> => {
  const installments = [];
  
  for (let i = 1; i <= selectedInstallments; i++) {
    installments.push({
      number: i,
      total: totalAmount // Same total for all installments (no interest)
    });
  }
  
  return installments;
};

// EVIDENS installment business logic
export const installmentBusinessLogic = {
  
  // Calculate if installments are profitable
  calculateInstallmentProfitability: (amount: number, installments: number) => {
    const monthlyValue = amount / installments;
    const processingFee = amount * 0.039; // ~3.9% average card processing fee
    const costPerInstallment = processingFee / installments;
    
    return {
      monthlyValue,
      processingFee,
      costPerInstallment,
      profitPerInstallment: monthlyValue - costPerInstallment,
      totalProfit: amount - processingFee,
      isProfi table: (amount - processingFee) > 0
    };
  },
  
  // Recommend optimal installment for user
  recommendInstallment: (userProfile: { 
    averageOrderValue?: number;
    paymentHistory?: any[];
    riskScore?: number;
  }) => {
    // Conservative recommendation for new users
    if (!userProfile.paymentHistory?.length) {
      return 1; // À vista for new users
    }
    
    // Based on user's payment pattern
    if (userProfile.averageOrderValue && userProfile.averageOrderValue > 100) {
      return 3; // 3x for established users
    }
    
    return 1; // Default to à vista
  }
};
```

## Credit Card Error Handling

### **Comprehensive Card Error Management**

```typescript
// Advanced credit card error handling
export const handleCreditCardError = (error: any) => {
  const errorCode = error.code;
  const acquirerMessage = error.acquirer_message;
  
  // Card-specific error codes
  const cardErrors: Record<string, {
    userMessage: string;
    action: string;
    field?: string;
    severity: 'low' | 'medium' | 'high';
  }> = {
    
    // Authorization errors
    'card_declined': {
      userMessage: 'Cartão recusado pelo banco. Tente outro cartão.',
      action: 'try_different_card',
      field: 'card',
      severity: 'medium'
    },
    
    'insufficient_funds': {
      userMessage: 'Saldo insuficiente. Tente com menor quantidade de parcelas.',
      action: 'reduce_installments',
      field: 'installments',
      severity: 'medium'
    },
    
    'card_expired': {
      userMessage: 'Cartão expirado. Atualize a data de validade.',
      action: 'update_expiration',
      field: 'expiration',
      severity: 'high'
    },
    
    'invalid_cvv': {
      userMessage: 'CVV inválido. Verifique o código de segurança.',
      action: 'check_cvv',
      field: 'cvv',
      severity: 'low'
    },
    
    'invalid_card_number': {
      userMessage: 'Número do cartão inválido.',
      action: 'check_card_number',
      field: 'number',
      severity: 'high'
    },
    
    // Limit errors
    'transaction_limit_exceeded': {
      userMessage: 'Limite de transação excedido. Use menor valor ou tente amanhã.',
      action: 'reduce_amount',
      field: 'amount',
      severity: 'medium'
    },
    
    'daily_limit_exceeded': {
      userMessage: 'Limite diário excedido. Tente novamente amanhã.',
      action: 'wait_24h',
      severity: 'low'
    },
    
    // Security errors
    'suspected_fraud': {
      userMessage: 'Transação bloqueada por segurança. Entre em contato com seu banco.',
      action: 'contact_bank',
      severity: 'high'
    },
    
    'card_blocked': {
      userMessage: 'Cartão bloqueado. Entre em contato com seu banco.',
      action: 'contact_bank',
      field: 'card',
      severity: 'high'
    }
  };
  
  const errorInfo = cardErrors[errorCode] || {
    userMessage: 'Erro no processamento do cartão. Tente novamente.',
    action: 'retry',
    severity: 'medium' as const
  };
  
  // Track error for analytics
  analyticsTrack('card_payment_error', {
    errorCode,
    acquirerMessage,
    action: errorInfo.action,
    severity: errorInfo.severity
  });
  
  return errorInfo;
};
```

## Advanced Credit Card Features

### **Card Brand Optimization**

```typescript
// Optimize payment flow based on card brand
export const useCardBrandOptimization = () => {
  
  const getCardBrandFeatures = (brand: string) => {
    const brandFeatures = {
      visa: {
        maxInstallments: 12,
        supportsCVV: true,
        requiresBillingAddress: true,
        averageApprovalRate: 0.92,
        averageProcessingTime: 2000 // ms
      },
      mastercard: {
        maxInstallments: 12,
        supportsCVV: true,
        requiresBillingAddress: true,
        averageApprovalRate: 0.90,
        averageProcessingTime: 2200
      },
      elo: {
        maxInstallments: 12,
        supportsCVV: true,
        requiresBillingAddress: true,
        averageApprovalRate: 0.88,
        averageProcessingTime: 2500
      },
      amex: {
        maxInstallments: 12,
        supportsCVV: true,
        requiresBillingAddress: true,
        averageApprovalRate: 0.85,
        averageProcessingTime: 3000,
        cvvDigits: 4 // American Express uses 4-digit CVV
      },
      hipercard: {
        maxInstallments: 10,
        supportsCVV: true,
        requiresBillingAddress: true,
        averageApprovalRate: 0.82,
        averageProcessingTime: 2800
      }
    };
    
    return brandFeatures[brand] || brandFeatures.visa; // Fallback to Visa
  };
  
  return { getCardBrandFeatures };
};
```

### **Card Payment Analytics**

```typescript
// Credit card payment performance analytics
export const useCreditCardAnalytics = (timeframe: 'day' | 'week' | 'month' = 'week') => {
  return useQuery({
    queryKey: ['credit-card-analytics', timeframe],
    queryFn: async () => {
      const response = await fetch(`/functions/v1/card-analytics?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch card analytics');
      }
      
      const data = await response.json();
      
      return {
        ...data,
        
        // Computed card metrics
        cardConversionRate: data.cardAttempts > 0 ? (data.cardPaid / data.cardAttempts) * 100 : 0,
        averageInstallments: data.cardPaid > 0 ? data.totalInstallments / data.cardPaid : 0,
        installmentDistribution: data.installmentBreakdown,
        
        // Brand performance
        brandPerformance: data.brandStats,
        topPerformingBrand: data.brandStats?.reduce((top: any, brand: any) => 
          brand.conversionRate > (top?.conversionRate || 0) ? brand : top
        ),
        
        // Revenue insights
        averageCardTransaction: data.cardPaid > 0 ? data.cardRevenue / data.cardPaid : 0,
        installmentRevenueImpact: data.installmentRevenue / data.cardRevenue,
        
        // Business insights
        optimalInstallmentNumber: data.installmentConversion?.find((i: any) => 
          i.conversionRate === Math.max(...data.installmentConversion.map((x: any) => x.conversionRate))
        )?.number || 1
      };
    },
    staleTime: 300000, // Cache for 5 minutes
  });
};
```

## Testing Credit Card Payments

### **Card Testing Utilities**

```typescript
// Credit card testing with different scenarios
export const testCreditCardScenarios = async () => {
  console.log('Testing credit card payment scenarios...');
  
  const testScenarios = [
    {
      name: 'Successful Payment',
      cardData: {
        number: '4000000000000010', // Visa test card
        holderName: 'TEST USER',
        expirationMonth: '12',
        expirationYear: '30',
        cvv: '123'
      },
      installments: 1,
      expectedResult: 'success'
    },
    {
      name: 'Declined Card',
      cardData: {
        number: '4000000000000002', // Declined test card
        holderName: 'TEST USER',
        expirationMonth: '12', 
        expirationYear: '30',
        cvv: '123'
      },
      installments: 1,
      expectedResult: 'failure'
    },
    {
      name: 'Insufficient Funds',
      cardData: {
        number: '4000000000000341', // Insufficient funds test card
        holderName: 'TEST USER',
        expirationMonth: '12',
        expirationYear: '30', 
        cvv: '123'
      },
      installments: 6,
      expectedResult: 'insufficient_funds'
    }
  ];
  
  const results = [];
  
  for (const scenario of testScenarios) {
    try {
      console.log(`Testing: ${scenario.name}`);
      
      const tokenResult = await tokenizeCard(scenario.cardData);
      
      const paymentResult = await createCreditCardPayment({
        customerId: 'cus_test_customer',
        amount: 2990, // R$ 29.90
        description: `Test Payment - ${scenario.name}`,
        cardToken: tokenResult.token,
        installments: scenario.installments
      });
      
      const success = paymentResult.success;
      const match = (success && scenario.expectedResult === 'success') ||
                   (!success && scenario.expectedResult !== 'success');
      
      results.push({
        scenario: scenario.name,
        expected: scenario.expectedResult,
        actual: success ? 'success' : 'failure',
        match,
        authCode: paymentResult.authCode,
        orderId: paymentResult.orderId
      });
      
      console.log(`${scenario.name}:`, match ? 'PASS' : 'FAIL');
      
    } catch (error) {
      console.log(`${scenario.name}: ERROR -`, error.message);
      results.push({
        scenario: scenario.name,
        expected: scenario.expectedResult,
        actual: 'error',
        match: false,
        error: error.message
      });
    }
  }
  
  return {
    results,
    overallSuccess: results.every(r => r.match),
    passedTests: results.filter(r => r.match).length,
    totalTests: results.length
  };
};
```

## Credit Card Security

### **PCI Compliance Guidelines**

```typescript
// PCI DSS compliance helpers for EVIDENS
export const pciComplianceHelpers = {
  
  // Validate that no sensitive card data is being stored
  validateNoCardStorage: (data: any): { compliant: boolean; violations: string[] } => {
    const violations: string[] = [];
    const sensitiveFields = ['card_number', 'number', 'cvv', 'cvc', 'security_code'];
    
    const checkObject = (obj: any, path = '') => {
      if (typeof obj !== 'object' || obj === null) return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check for sensitive field names
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          violations.push(`Sensitive field detected: ${currentPath}`);
        }
        
        // Check for card number patterns in strings
        if (typeof value === 'string' && /^\d{13,19}$/.test(value.replace(/\s/g, ''))) {
          violations.push(`Potential card number in field: ${currentPath}`);
        }
        
        // Recursively check nested objects
        if (typeof value === 'object') {
          checkObject(value, currentPath);
        }
      });
    };
    
    checkObject(data);
    
    return {
      compliant: violations.length === 0,
      violations
    };
  },
  
  // Mask card data for logging
  maskCardData: (data: any) => {
    const masked = JSON.parse(JSON.stringify(data));
    
    const maskSensitiveData = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;
      
      Object.keys(obj).forEach(key => {
        if (key.toLowerCase().includes('number') && typeof obj[key] === 'string') {
          obj[key] = `****${obj[key].slice(-4)}`;
        } else if (key.toLowerCase().includes('cvv') || key.toLowerCase().includes('cvc')) {
          obj[key] = '***';
        } else if (typeof obj[key] === 'object') {
          maskSensitiveData(obj[key]);
        }
      });
    };
    
    maskSensitiveData(masked);
    return masked;
  }
};
```

### **Card Fraud Prevention**

```typescript
// Credit card fraud detection patterns
export const creditCardFraudDetection = {
  
  // Analyze card transaction for fraud indicators
  assessTransactionRisk: async (
    cardData: { brand: string; lastDigits: string },
    amount: number,
    userId: string,
    installments: number
  ) => {
    const riskFactors: Array<{ factor: string; weight: number; reason: string }> = [];
    
    // Amount-based risk assessment
    if (amount > 50000) { // R$ 500+
      riskFactors.push({
        factor: 'high_amount',
        weight: 3,
        reason: 'Transaction amount exceeds typical subscription value'
      });
    }
    
    // Installment risk (higher installments = higher risk for chargebacks)
    if (installments > 6) {
      riskFactors.push({
        factor: 'high_installments',
        weight: 2,
        reason: 'High installment numbers increase chargeback risk'
      });
    }
    
    // Check recent failed attempts
    const { data: recentFailures } = await supabase
      .from('payment_transactions')
      .select('created_at, failure_reason')
      .eq('user_id', userId)
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .limit(5);
    
    if (recentFailures && recentFailures.length > 2) {
      riskFactors.push({
        factor: 'multiple_failures',
        weight: 4,
        reason: `${recentFailures.length} failed attempts in last hour`
      });
    }
    
    // Calculate total risk score
    const totalRisk = riskFactors.reduce((sum, factor) => sum + factor.weight, 0);
    const riskLevel = totalRisk > 6 ? 'high' : totalRisk > 3 ? 'medium' : 'low';
    
    return {
      riskLevel,
      riskScore: totalRisk,
      riskFactors,
      recommendations: generateRiskRecommendations(riskLevel, riskFactors)
    };
  }
};

const generateRiskRecommendations = (riskLevel: string, factors: any[]) => {
  if (riskLevel === 'low') {
    return ['Process payment normally'];
  }
  
  const recommendations = [];
  
  if (factors.some(f => f.factor === 'high_amount')) {
    recommendations.push('Consider requiring additional verification for high-value transactions');
  }
  
  if (factors.some(f => f.factor === 'multiple_failures')) {
    recommendations.push('Suggest alternative payment method (PIX) to user');
  }
  
  if (factors.some(f => f.factor === 'high_installments')) {
    recommendations.push('Limit installments to reduce chargeback risk');
  }
  
  return recommendations;
};
```

## Card Brand Integration

### **Brazilian Card Brand Support**

```typescript
// Brazilian credit card brands configuration
export const brazilianCardBrands = {
  
  // Supported card brands with configurations
  supportedBrands: {
    visa: {
      name: 'Visa',
      maxInstallments: 12,
      processingFee: 3.2, // Approximate percentage
      averageApprovalRate: 92,
      logo: '/images/cards/visa.svg'
    },
    mastercard: {
      name: 'Mastercard',
      maxInstallments: 12,
      processingFee: 3.1,
      averageApprovalRate: 91,
      logo: '/images/cards/mastercard.svg'
    },
    elo: {
      name: 'Elo',
      maxInstallments: 12,
      processingFee: 2.9,
      averageApprovalRate: 89,
      logo: '/images/cards/elo.svg'
    },
    amex: {
      name: 'American Express',
      maxInstallments: 12,
      processingFee: 4.2,
      averageApprovalRate: 85,
      logo: '/images/cards/amex.svg',
      cvvDigits: 4
    },
    hipercard: {
      name: 'Hipercard',
      maxInstallments: 10,
      processingFee: 3.5,
      averageApprovalRate: 82,
      logo: '/images/cards/hipercard.svg'
    }
  },
  
  // Get optimal brand for amount and installments
  getOptimalBrand: (amount: number, requestedInstallments: number) => {
    const brands = Object.entries(brazilianCardBrands.supportedBrands);
    
    return brands
      .filter(([_, config]) => config.maxInstallments >= requestedInstallments)
      .sort((a, b) => {
        // Sort by approval rate for high amounts, processing fee for lower amounts
        if (amount > 10000) { // R$ 100+
          return b[1].averageApprovalRate - a[1].averageApprovalRate;
        } else {
          return a[1].processingFee - b[1].processingFee;
        }
      })
      .map(([brand, config]) => ({ brand, ...config }));
  }
};
```

### **Card Payment Optimization**

```typescript
// Optimize card payment flow for conversion
export const useCreditCardOptimization = () => {
  
  const optimizeInstallmentDisplay = (amount: number) => {
    const { installmentOptions } = useInstallmentCalculator(amount);
    
    // Business logic: promote 3x installments for amounts > R$ 50
    if (amount > 50) {
      const threeInstallments = installmentOptions.find(opt => opt.number === 3);
      if (threeInstallments) {
        return {
          recommended: threeInstallments,
          highlight: true,
          reason: 'Parcelamento mais popular'
        };
      }
    }
    
    // Default to à vista for smaller amounts
    return {
      recommended: installmentOptions[0], // À vista
      highlight: false,
      reason: 'Menor custo operacional'
    };
  };
  
  const optimizeFormFields = (detectedBrand: string) => {
    const brandConfig = brazilianCardBrands.supportedBrands[detectedBrand];
    
    return {
      cvvDigits: brandConfig?.cvvDigits || 3,
      maxInstallments: brandConfig?.maxInstallments || 12,
      showBillingAddress: brandConfig?.requiresBillingAddress ?? true,
      expectedProcessingTime: brandConfig?.averageProcessingTime || 2500
    };
  };
  
  return {
    optimizeInstallmentDisplay,
    optimizeFormFields
  };
};
```

## Integration Checklist

### **Credit Card Technical Setup**
- [ ] Pagar.me.js SDK loaded on client-side
- [ ] Card tokenization working without sending data to EVIDENS servers
- [ ] Credit card payment Edge Function deployed (`create-credit-card-payment`)
- [ ] PCI compliance validation implemented
- [ ] Card brand detection functioning

### **Credit Card User Experience**
- [ ] Real-time card validation during input
- [ ] Card brand icons displayed correctly
- [ ] Installment calculator working
- [ ] Payment confirmation immediate for approved cards
- [ ] Card error messages user-friendly and actionable

### **Credit Card Business Features**
- [ ] Installment options configured (1-12x without interest)
- [ ] Statement descriptor set to "EVIDENS" (13 char limit)
- [ ] Card payment analytics tracking
- [ ] Fraud detection patterns configured
- [ ] Card brand performance monitoring

### **Security & Compliance**
- [ ] No card data stored in EVIDENS databases
- [ ] Card tokenization happens client-side only
- [ ] PCI compliance validation tools implemented
- [ ] Card data masking in logs functional
- [ ] Fraud risk assessment working

---

**Credit Card Summary**: Credit cards offer the highest conversion rates and immediate payment confirmation for EVIDENS subscriptions. Implementation focuses on secure client-side tokenization, comprehensive installment options, and robust fraud prevention while maintaining PCI compliance.

**Next Steps**: 
1. [Boleto Implementation](./boleto.md) - Traditional bank slip payments
2. [Payment Method Comparison](./comparison-guide.md) - Choose optimal methods for different scenarios
3. [Edge Function Templates](../edge-functions/credit-card-payment.md) - Complete card processing code