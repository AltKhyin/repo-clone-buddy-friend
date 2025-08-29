# Frontend Payment Integration Patterns

## Overview

This guide covers frontend-specific patterns for implementing Pagar.me payments within EVIDENS React components, following TanStack Query patterns and existing codebase conventions.

## State Management Patterns

### Payment Flow State

```typescript
// src/hooks/usePaymentFlow.ts - Custom hook for payment flow management
import { useState, useCallback } from 'react';

interface PaymentFlowState {
  step: 'plan_selection' | 'customer_info' | 'payment_method' | 'confirmation';
  selectedPlan: string | null;
  customerData: CustomerData | null;
  paymentData: PaymentData | null;
  errors: Record<string, string>;
  isProcessing: boolean;
}

export const usePaymentFlow = () => {
  const [state, setState] = useState<PaymentFlowState>({
    step: 'plan_selection',
    selectedPlan: null,
    customerData: null,
    paymentData: null,
    errors: {},
    isProcessing: false
  });
  
  const updateStep = useCallback((step: PaymentFlowState['step']) => {
    setState(prev => ({ ...prev, step, errors: {} }));
  }, []);
  
  const updateSelectedPlan = useCallback((plan: string) => {
    setState(prev => ({ ...prev, selectedPlan: plan }));
  }, []);
  
  const updateCustomerData = useCallback((data: CustomerData) => {
    setState(prev => ({ ...prev, customerData: data }));
  }, []);
  
  const updatePaymentData = useCallback((data: PaymentData) => {
    setState(prev => ({ ...prev, paymentData: data }));
  }, []);
  
  const setError = useCallback((field: string, message: string) => {
    setState(prev => ({ 
      ...prev, 
      errors: { ...prev.errors, [field]: message }
    }));
  }, []);
  
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }));
  }, []);
  
  const setProcessing = useCallback((isProcessing: boolean) => {
    setState(prev => ({ ...prev, isProcessing }));
  }, []);
  
  return {
    ...state,
    updateStep,
    updateSelectedPlan,
    updateCustomerData,
    updatePaymentData,
    setError,
    clearErrors,
    setProcessing
  };
};
```

### Plan Comparison Hook

```typescript
// src/hooks/queries/usePlanQueries.ts
export const usePlanComparison = () => {
  return useQuery({
    queryKey: ['plan-comparison'],
    queryFn: async () => {
      // This would typically fetch from your backend/config
      return {
        plans: [
          {
            id: 'basic',
            name: 'EVIDENS Básico', 
            price: 1990,
            trial_days: 7,
            features: [
              'Até 5 reviews por mês',
              'Templates básicos',
              'Suporte por email'
            ],
            limits: {
              monthly_reviews: 5,
              template_access: 'basic',
              support_level: 'email'
            }
          },
          {
            id: 'premium',
            name: 'EVIDENS Premium',
            price: 4990,
            trial_days: 14,
            popular: true,
            features: [
              'Reviews ilimitados',
              'Todos os templates',
              'Suporte prioritário',
              'Analytics avançados'
            ],
            limits: {
              monthly_reviews: -1, // Unlimited
              template_access: 'all',
              support_level: 'priority'
            }
          },
          {
            id: 'enterprise',
            name: 'EVIDENS Enterprise',
            price: 9990,
            trial_days: 30,
            features: [
              'Tudo do Premium',
              'Colaboração em equipe',
              'Integrações personalizadas',
              'Suporte dedicado'
            ],
            limits: {
              monthly_reviews: -1,
              template_access: 'all',
              support_level: 'dedicated',
              team_members: 10
            }
          }
        ]
      };
    },
    staleTime: 60 * 60 * 1000,    // 1 hour
    select: (data) => ({
      ...data,
      recommendedPlan: data.plans.find(p => p.popular) || data.plans[1]
    })
  });
};
```

## Form Components

### Customer Information Form

```typescript
// src/components/billing/forms/CustomerInfoForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const customerInfoSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  document: z.string().min(11, 'CPF/CNPJ inválido'),
  document_type: z.enum(['cpf', 'cnpj']),
  address: z.object({
    line_1: z.string().min(5, 'Endereço deve ter ao menos 5 caracteres'),
    zip_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
    city: z.string().min(2, 'Cidade inválida'),
    state: z.string().length(2, 'Estado deve ter 2 caracteres'),
    country: z.literal('BR')
  }),
  phones: z.object({
    mobile_phone: z.object({
      country_code: z.literal('55'),
      area_code: z.string().length(2, 'DDD inválido'),
      number: z.string().min(8, 'Número de telefone inválido')
    })
  })
});

type CustomerInfoForm = z.infer<typeof customerInfoSchema>;

interface CustomerInfoFormProps {
  onSubmit: (data: CustomerInfoForm) => void;
  defaultValues?: Partial<CustomerInfoForm>;
  isLoading?: boolean;
}

export function CustomerInfoForm({ onSubmit, defaultValues, isLoading }: CustomerInfoFormProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CustomerInfoForm>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      document_type: 'cpf',
      address: {
        country: 'BR'
      },
      phones: {
        mobile_phone: {
          country_code: '55'
        }
      },
      ...defaultValues
    }
  });
  
  const documentType = watch('document_type');
  
  // Auto-format document input
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = documentType === 'cpf' 
      ? value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    setValue('document', formatted);
  };
  
  // Auto-complete address from ZIP code
  const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const zipCode = e.target.value.replace(/\D/g, '');
    if (zipCode.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
        const addressData = await response.json();
        
        if (!addressData.erro) {
          setValue('address.line_1', `${addressData.logradouro}, ${addressData.bairro}`);
          setValue('address.city', addressData.localidade);
          setValue('address.state', addressData.uf);
        }
      } catch (error) {
        console.log('CEP lookup failed:', error);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Name Field */}
        <div className="md:col-span-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Digite seu nome completo"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>
        
        {/* Document Type Selection */}
        <div>
          <Label htmlFor="document_type">Tipo de Documento</Label>
          <Select onValueChange={(value) => setValue('document_type', value)} defaultValue="cpf">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Document Number */}
        <div>
          <Label htmlFor="document">
            {documentType === 'cpf' ? 'CPF' : 'CNPJ'}
          </Label>
          <Input
            id="document"
            {...register('document')}
            onChange={handleDocumentChange}
            placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
            className={errors.document ? 'border-red-500' : ''}
          />
          {errors.document && (
            <p className="text-sm text-red-500 mt-1">{errors.document.message}</p>
          )}
        </div>
        
        {/* ZIP Code with auto-complete */}
        <div>
          <Label htmlFor="zip_code">CEP</Label>
          <Input
            id="zip_code"
            {...register('address.zip_code')}
            onBlur={handleZipCodeBlur}
            placeholder="00000-000"
            className={errors.address?.zip_code ? 'border-red-500' : ''}
          />
          {errors.address?.zip_code && (
            <p className="text-sm text-red-500 mt-1">{errors.address.zip_code.message}</p>
          )}
        </div>
        
        {/* Address */}
        <div>
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            {...register('address.line_1')}
            placeholder="Rua, número, bairro"
            className={errors.address?.line_1 ? 'border-red-500' : ''}
          />
          {errors.address?.line_1 && (
            <p className="text-sm text-red-500 mt-1">{errors.address.line_1.message}</p>
          )}
        </div>
        
        {/* City and State */}
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            {...register('address.city')}
            placeholder="Cidade"
            className={errors.address?.city ? 'border-red-500' : ''}
          />
        </div>
        
        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            {...register('address.state')}
            placeholder="UF"
            maxLength={2}
            className={errors.address?.state ? 'border-red-500' : ''}
          />
        </div>
        
        {/* Phone */}
        <div>
          <Label htmlFor="area_code">DDD</Label>
          <Input
            id="area_code"
            {...register('phones.mobile_phone.area_code')}
            placeholder="11"
            maxLength={2}
            className={errors.phones?.mobile_phone?.area_code ? 'border-red-500' : ''}
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            {...register('phones.mobile_phone.number')}
            placeholder="999999999"
            className={errors.phones?.mobile_phone?.number ? 'border-red-500' : ''}
          />
        </div>
        
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Salvando...' : 'Continuar'}
      </Button>
    </form>
  );
}
```

### Payment Method Form

```typescript
// src/components/billing/forms/PaymentMethodForm.tsx
export function PaymentMethodForm({ onSubmit }: { onSubmit: (data: PaymentData) => void }) {
  const [selectedMethod, setSelectedMethod] = useState<'credit_card' | 'pix' | 'boleto'>('credit_card');
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [couponCode, setCouponCode] = useState('');
  
  const validateCoupon = useCouponValidation();
  const { data: couponValidation } = validateCoupon;
  
  const handleCouponValidation = async (code: string) => {
    if (code.length >= 3) {
      try {
        await validateCoupon.mutateAsync(code);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };
  
  const handleCardTokenization = async (cardFormData: CardFormData): Promise<string> => {
    // Frontend card tokenization (PCI compliance)
    const tokenizationScript = document.createElement('script');
    tokenizationScript.src = 'https://assets.pagar.me/js/crypto.js';
    document.head.appendChild(tokenizationScript);
    
    return new Promise((resolve, reject) => {
      tokenizationScript.onload = async () => {
        try {
          // Use Pagar.me tokenization library
          const encryptor = new window.PagarMeEncrypt();
          const cardToken = await encryptor.encrypt({
            card_number: cardFormData.number,
            card_holder_name: cardFormData.holder_name,
            card_expiration_date: `${cardFormData.exp_month}${cardFormData.exp_year}`,
            card_cvv: cardFormData.cvv
          });
          
          resolve(cardToken);
        } catch (error) {
          reject(new Error('Card tokenization failed'));
        }
      };
    });
  };
  
  const handleSubmit = async () => {
    try {
      let paymentData: PaymentData = {
        method: selectedMethod,
        couponCode: couponCode || undefined
      };
      
      if (selectedMethod === 'credit_card' && cardData) {
        // Tokenize card data securely
        const cardToken = await handleCardTokenization(cardData);
        paymentData.cardToken = cardToken;
      }
      
      onSubmit(paymentData);
      
    } catch (error) {
      toast.error(`Payment setup failed: ${error.message}`);
    }
  };
  
  return (
    <div className="space-y-6">
      
      {/* Payment Method Selection */}
      <div>
        <Label>Forma de Pagamento</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          
          <PaymentMethodOption
            type="credit_card"
            selected={selectedMethod === 'credit_card'}
            onSelect={() => setSelectedMethod('credit_card')}
            icon={<CreditCard className="h-5 w-5" />}
            title="Cartão de Crédito"
            subtitle="Pagamento imediato"
          />
          
          <PaymentMethodOption
            type="pix"
            selected={selectedMethod === 'pix'}
            onSelect={() => setSelectedMethod('pix')}
            icon={<Smartphone className="h-5 w-5" />}
            title="PIX"
            subtitle="Pagamento instantâneo"
          />
          
          <PaymentMethodOption
            type="boleto"
            selected={selectedMethod === 'boleto'}
            onSelect={() => setSelectedMethod('boleto')}
            icon={<FileText className="h-5 w-5" />}
            title="Boleto"
            subtitle="Vencimento em 3 dias"
          />
          
        </div>
      </div>
      
      {/* Credit Card Form */}
      {selectedMethod === 'credit_card' && (
        <div className="space-y-4">
          <CreditCardForm onChange={setCardData} />
        </div>
      )}
      
      {/* PIX Instructions */}
      {selectedMethod === 'pix' && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900">Pagamento PIX</h4>
          <p className="text-sm text-blue-700 mt-1">
            Após confirmar, você receberá um QR Code para pagamento instantâneo via PIX.
            O pagamento expira em 5 minutos.
          </p>
        </div>
      )}
      
      {/* Boleto Instructions */}
      {selectedMethod === 'boleto' && (
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-900">Boleto Bancário</h4>
          <p className="text-sm text-yellow-700 mt-1">
            O boleto será gerado com vencimento em 3 dias úteis. 
            Você pode pagar em qualquer banco, lotérica ou pelo internet banking.
          </p>
        </div>
      )}
      
      {/* Coupon Code Input */}
      <div>
        <Label htmlFor="coupon">Código de Desconto (opcional)</Label>
        <div className="flex gap-2">
          <Input
            id="coupon"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onBlur={() => handleCouponValidation(couponCode)}
            placeholder="Digite o código"
            className={validateCoupon.error ? 'border-red-500' : ''}
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => handleCouponValidation(couponCode)}
            disabled={!couponCode || validateCoupon.isPending}
          >
            {validateCoupon.isPending ? 'Validando...' : 'Aplicar'}
          </Button>
        </div>
        
        {validateCoupon.error && (
          <p className="text-sm text-red-500 mt-1">
            {validateCoupon.error.message}
          </p>
        )}
        
        {couponValidation?.isValid && (
          <p className="text-sm text-green-600 mt-1">
            ✓ Desconto aplicado: {couponValidation.discount.type === 'percentage' 
              ? `${couponValidation.discount.value}% off`
              : `R$ ${couponValidation.discount.value / 100} off`}
          </p>
        )}
      </div>
      
      <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
        {isLoading ? 'Processando...' : 'Finalizar Assinatura'}
      </Button>
      
    </div>
  );
}
```

### Credit Card Component

```typescript
// src/components/billing/forms/CreditCardForm.tsx
interface CardFormData {
  number: string;
  holder_name: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
}

export function CreditCardForm({ onChange }: { onChange: (data: CardFormData) => void }) {
  const [cardData, setCardData] = useState<CardFormData>({
    number: '',
    holder_name: '',
    exp_month: new Date().getMonth() + 1,
    exp_year: new Date().getFullYear(),
    cvv: ''
  });
  
  const updateField = (field: keyof CardFormData, value: string | number) => {
    const updated = { ...cardData, [field]: value };
    setCardData(updated);
    onChange(updated);
  };
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim()
      .substring(0, 19);
  };
  
  // Detect card brand
  const getCardBrand = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
    if (cleaned.startsWith('3')) return 'amex';
    return 'unknown';
  };
  
  return (
    <div className="space-y-4">
      
      {/* Card Number */}
      <div>
        <Label htmlFor="card_number">Número do Cartão</Label>
        <div className="relative">
          <Input
            id="card_number"
            value={formatCardNumber(cardData.number)}
            onChange={(e) => updateField('number', e.target.value.replace(/\s/g, ''))}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
          />
          <div className="absolute right-3 top-2">
            <CardBrandIcon brand={getCardBrand(cardData.number)} />
          </div>
        </div>
      </div>
      
      {/* Cardholder Name */}
      <div>
        <Label htmlFor="holder_name">Nome no Cartão</Label>
        <Input
          id="holder_name"
          value={cardData.holder_name}
          onChange={(e) => updateField('holder_name', e.target.value.toUpperCase())}
          placeholder="NOME COMO NO CARTÃO"
        />
      </div>
      
      {/* Expiration and CVV */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="exp_month">Mês</Label>
          <Select 
            value={cardData.exp_month.toString()} 
            onValueChange={(value) => updateField('exp_month', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {(i + 1).toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="exp_year">Ano</Label>
          <Select 
            value={cardData.exp_year.toString()}
            onValueChange={(value) => updateField('exp_year', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => {
                const year = new Date().getFullYear() + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            value={cardData.cvv}
            onChange={(e) => updateField('cvv', e.target.value)}
            placeholder="000"
            maxLength={4}
            type="password"
          />
        </div>
      </div>
      
      {/* Security Notice */}
      <div className="p-3 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-800">
            Seus dados são protegidos por criptografia de nível bancário
          </p>
        </div>
      </div>
      
    </div>
  );
}
```

## Real-time Updates

### Subscription Status Sync

```typescript
// src/hooks/useSubscriptionSync.ts - Real-time subscription status updates
export const useSubscriptionSync = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('subscription_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${user?.id}`
      }, (payload) => {
        // Update subscription status in real-time
        if (payload.new.subscription_status !== payload.old.subscription_status) {
          queryClient.setQueryData(['subscription-status'], {
            status: payload.new.subscription_status,
            subscription_id: payload.new.subscription_id,
            plan_tier: payload.new.subscription_plan_id
          });
          
          // Show user notification for status changes
          if (payload.new.subscription_status === 'active') {
            toast.success('Pagamento confirmado! Sua assinatura está ativa.');
          } else if (payload.new.subscription_status === 'past_due') {
            toast.error('Falha no pagamento. Atualize sua forma de pagamento.');
          }
        }
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [user?.id, queryClient]);
};
```

### PIX Payment Status Tracking

```typescript
// src/hooks/usePixPaymentTracking.ts
export const usePixPaymentTracking = (orderId: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['pix-payment-status', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/orders/${orderId}/status`);
      return response.json();
    },
    refetchInterval: (data) => {
      // Stop polling once payment is confirmed or expired
      if (data?.status === 'paid' || data?.status === 'expired') {
        return false;
      }
      return 5000; // Poll every 5 seconds for pending PIX
    },
    enabled: !!orderId,
    onSuccess: (data) => {
      if (data.status === 'paid') {
        queryClient.invalidateQueries({ queryKey: ['user-status'] });
        toast.success('Pagamento PIX confirmado!');
      }
    }
  });
};
```

## User Experience Components

### Payment Success Flow

```typescript
// src/components/billing/PaymentSuccess.tsx
export function PaymentSuccess({ paymentType, subscriptionData }: PaymentSuccessProps) {
  const { data: userStatus } = useUserStatus();
  
  useEffect(() => {
    // Track conversion event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: subscriptionData.id,
        value: subscriptionData.amount / 100,
        currency: 'BRL',
        payment_type: paymentType
      });
    }
  }, [paymentType, subscriptionData]);
  
  return (
    <div className="text-center space-y-6 p-8">
      
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {paymentType === 'pix' ? 'Pagamento PIX Confirmado!' : 'Assinatura Criada!'}
        </h2>
        <p className="text-gray-600 mt-2">
          {status?.isTrialing 
            ? `Seu período de teste gratuito de ${userStatus.daysUntilTrialEnd} dias começou agora.`
            : 'Você já tem acesso total à plataforma EVIDENS.'
          }
        </p>
      </div>
      
      {/* Next Steps */}
      <div className="bg-gray-50 rounded-lg p-6 text-left">
        <h3 className="font-semibold mb-3">Próximos Passos:</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Explore os recursos premium em sua dashboard
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Configure suas preferências de perfil
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Comece a criar seus primeiros reviews
          </li>
        </ul>
      </div>
      
      <div className="flex gap-4 justify-center">
        <Button onClick={() => window.location.href = '/dashboard'}>
          Ir para Dashboard
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/profile'}>
          Configurar Perfil
        </Button>
      </div>
      
    </div>
  );
}
```

### Payment Failure Recovery

```typescript
// src/components/billing/PaymentFailureRecovery.tsx
export function PaymentFailureRecovery({ subscriptionId }: { subscriptionId: string }) {
  const retryPayment = useRetryPayment();
  const updatePaymentMethod = useUpdatePaymentMethod();
  
  const [recoveryOption, setRecoveryOption] = useState<'retry' | 'update_payment' | 'change_plan'>('retry');
  
  const handleRecovery = async () => {
    switch (recoveryOption) {
      case 'retry':
        await retryPayment.mutateAsync({ subscriptionId });
        break;
        
      case 'update_payment':
        // Navigate to payment method update
        window.location.href = '/billing/payment-methods';
        break;
        
      case 'change_plan':
        // Navigate to plan change
        window.location.href = '/billing/change-plan';
        break;
    }
  };
  
  return (
    <div className="border border-red-200 rounded-lg p-6 bg-red-50">
      
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <div>
          <h3 className="font-semibold text-red-900">Problema com Pagamento</h3>
          <p className="text-sm text-red-700">
            Não conseguimos processar seu último pagamento.
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <Label>Como deseja resolver?</Label>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recovery"
              checked={recoveryOption === 'retry'}
              onChange={() => setRecoveryOption('retry')}
            />
            <span className="text-sm">Tentar cobrança novamente</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recovery"
              checked={recoveryOption === 'update_payment'}
              onChange={() => setRecoveryOption('update_payment')}
            />
            <span className="text-sm">Atualizar forma de pagamento</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="recovery"
              checked={recoveryOption === 'change_plan'}
              onChange={() => setRecoveryOption('change_plan')}
            />
            <span className="text-sm">Alterar plano</span>
          </label>
        </div>
      </div>
      
      <Button 
        onClick={handleRecovery}
        disabled={retryPayment.isPending || updatePaymentMethod.isPending}
        className="w-full mt-4"
      >
        {retryPayment.isPending ? 'Tentando...' : 'Resolver Agora'}
      </Button>
      
    </div>
  );
}
```

## Performance Optimization

### Lazy Loading Payment Components

```typescript
// src/pages/Billing.tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy payment components
const SubscriptionFlow = lazy(() => import('@/components/billing/SubscriptionFlow'));
const PaymentHistory = lazy(() => import('@/components/billing/PaymentHistory'));
const BillingAnalytics = lazy(() => import('@/components/billing/BillingAnalytics'));

export function BillingPage() {
  const { data: userStatus } = useUserStatus();
  
  return (
    <div className="container mx-auto p-6">
      
      <PageHeader 
        title="Pagamentos e Assinatura"
        subtitle="Gerencie sua assinatura e formas de pagamento"
      />
      
      {!userStatus?.hasActiveSubscription ? (
        <Suspense fallback={<SubscriptionFlowSkeleton />}>
          <SubscriptionFlow />
        </Suspense>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div>
            <SubscriptionStatus />
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
              <PaymentHistory />
            </Suspense>
          </div>
          
          <div>
            <PaymentMethodManager />
            {userStatus?.userrole === 'admin' && (
              <Suspense fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
                <BillingAnalytics />
              </Suspense>
            )}
          </div>
          
        </div>
      )}
      
    </div>
  );
}
```

### Caching Strategy

```typescript
// src/lib/queryClient.ts - Payment-specific cache configuration
export const paymentQueryDefaults = {
  staleTime: 5 * 60 * 1000,      // 5 minutes for most payment data
  gcTime: 10 * 60 * 1000,        // 10 minutes garbage collection
  retry: (failureCount: number, error: any) => {
    // Don't retry payment failures
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    return failureCount < 2;
  }
};

// Apply payment-specific defaults to payment queries
queryClient.setQueryDefaults(['subscription-status'], paymentQueryDefaults);
queryClient.setQueryDefaults(['payment-history'], paymentQueryDefaults);
queryClient.setQueryDefaults(['customer-data'], { 
  ...paymentQueryDefaults, 
  staleTime: 30 * 60 * 1000      // Customer data changes less frequently
});
```

## Testing Patterns

### Payment Component Testing

```typescript
// src/components/billing/__tests__/SubscriptionFlow.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubscriptionFlow } from '../SubscriptionFlow';

describe('SubscriptionFlow', () => {
  const mockCreateSubscription = vi.fn();
  
  beforeEach(() => {
    // Mock payment hooks
    vi.mocked(useCreateSubscription).mockReturnValue({
      mutateAsync: mockCreateSubscription,
      isPending: false,
      error: null
    });
  });
  
  it('should complete subscription flow with credit card', async () => {
    render(<SubscriptionFlow />);
    
    // Step 1: Select plan
    fireEvent.click(screen.getByText('EVIDENS Premium'));
    fireEvent.click(screen.getByText('Continuar'));
    
    // Step 2: Fill customer info
    fireEvent.change(screen.getByLabelText('Nome Completo'), {
      target: { value: 'João Silva' }
    });
    fireEvent.change(screen.getByLabelText('CPF'), {
      target: { value: '000.000.000-00' }
    });
    fireEvent.click(screen.getByText('Continuar'));
    
    // Step 3: Payment method
    fireEvent.click(screen.getByText('Cartão de Crédito'));
    fireEvent.change(screen.getByLabelText('Número do Cartão'), {
      target: { value: '4000000000000010' }
    });
    
    fireEvent.click(screen.getByText('Finalizar Assinatura'));
    
    await waitFor(() => {
      expect(mockCreateSubscription).toHaveBeenCalledWith({
        planTier: 'premium',
        paymentMethod: 'credit_card',
        cardToken: expect.any(String)
      });
    });
  });
  
  it('should display error for invalid payment data', async () => {
    mockCreateSubscription.mockRejectedValue(new Error('Card declined'));
    
    render(<SubscriptionFlow />);
    
    // Navigate to payment step and submit invalid data
    // ... navigation steps ...
    
    fireEvent.click(screen.getByText('Finalizar Assinatura'));
    
    await waitFor(() => {
      expect(screen.getByText(/cartão foi recusado/i)).toBeInTheDocument();
    });
  });
});
```

## Security Best Practices

### Frontend Security Implementation

```typescript
// src/utils/paymentSecurity.ts
export class PaymentSecurity {
  
  // Validate all payment data before submission
  static validatePaymentSubmission(data: any): ValidationResult {
    const errors: string[] = [];
    
    // Never send raw card data to backend
    if (data.card?.number) {
      errors.push('Raw card data detected - use tokenization');
    }
    
    // Validate required fields
    if (!data.customer_id && !data.customer) {
      errors.push('Customer data required');
    }
    
    // Validate amount
    if (!data.amount || data.amount < 100) {
      errors.push('Invalid payment amount');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Sanitize data before sending to API
  static sanitizePaymentData(data: any): any {
    const sanitized = { ...data };
    
    // Remove any sensitive fields that shouldn't go to backend
    delete sanitized.card?.number;
    delete sanitized.card?.cvv;
    delete sanitized.card?.exp_month;
    delete sanitized.card?.exp_year;
    
    return sanitized;
  }
}

// Payment form security wrapper
export const withPaymentSecurity = <T,>(Component: React.ComponentType<T>) => {
  return (props: T) => {
    const [isSecureContext, setIsSecureContext] = useState(false);
    
    useEffect(() => {
      // Verify HTTPS in production
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost';
      setIsSecureContext(isSecure);
      
      if (!isSecure && process.env.NODE_ENV === 'production') {
        toast.error('Conexão insegura detectada. Payments requerem HTTPS.');
      }
    }, []);
    
    if (!isSecureContext && process.env.NODE_ENV === 'production') {
      return (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">
            Esta página requer uma conexão segura (HTTPS) para processar pagamentos.
          </p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};
```

## Mobile Responsiveness

### Mobile Payment Flow

```typescript
// src/components/billing/mobile/MobilePaymentFlow.tsx
export function MobilePaymentFlow() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const { isMobile } = useMediaQuery();
  
  if (!isMobile) {
    return <SubscriptionFlow />; // Use desktop version
  }
  
  return (
    <div className="pb-20"> {/* Account for mobile safe area */}
      
      {/* Mobile-optimized plan cards */}
      <div className="px-4 space-y-3">
        {plans.map(plan => (
          <MobilePlanCard key={plan.id} plan={plan} />
        ))}
      </div>
      
      {/* Bottom sheet for payment details */}
      <BottomSheet 
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      >
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Finalizar Assinatura</h3>
          <PaymentMethodForm onSubmit={handlePaymentSubmit} />
        </div>
      </BottomSheet>
      
      {/* Fixed bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button 
          onClick={() => setIsBottomSheetOpen(true)}
          className="w-full"
          size="lg"
        >
          Continuar Pagamento
        </Button>
      </div>
      
    </div>
  );
}
```

## Performance Metrics

### Payment Performance Monitoring

```typescript
// Monitor payment flow performance
export const usePaymentPerformance = () => {
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    formLoadTime: 0,
    tokenizationTime: 0,
    apiResponseTime: 0,
    totalFlowTime: 0
  });
  
  const startTimer = (operation: keyof PaymentMetrics) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      setMetrics(prev => ({ ...prev, [operation]: duration }));
    };
  };
  
  return { metrics, startTimer };
};

// Report performance to analytics
export const reportPaymentMetrics = (metrics: PaymentMetrics) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'payment_performance', {
      form_load_time: Math.round(metrics.formLoadTime),
      tokenization_time: Math.round(metrics.tokenizationTime),
      api_response_time: Math.round(metrics.apiResponseTime),
      total_flow_time: Math.round(metrics.totalFlowTime)
    });
  }
};
```

## Rate Limiting & Best Practices

- **Form Submissions**: Debounce validation by 300ms
- **Card Tokenization**: Maximum 3 attempts per session
- **API Calls**: Exponential backoff for retries
- **Real-time Updates**: Use Supabase realtime for status changes
- **Always** validate payment data client-side before submission
- **Never** store sensitive payment information in local storage
- **Implement** proper loading states for all payment operations
- **Use** optimistic updates for better perceived performance

## Next Steps

See also:
- [Edge Function Implementation](evidens-implementation-guide.md)
- [Subscription Management](../subscriptions/subscriptions.md)
- [Error Handling](../api-reference/error-handling.md)
- [Testing Strategies](../../testing/payment-testing.md)