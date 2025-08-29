// ABOUTME: Embedded payment form using Pagar.me tokenizecard.js for transparent checkout integration
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { CreditCard, Smartphone, FileText, Check, QrCode, Shield, Lock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// =================================================================
// Types & Global Declarations
// =================================================================

declare global {
  interface Window {
    PagarmeCheckout: {
      init: () => void;
    };
  }
}

type PaymentMethod = 'pix' | 'credit_card' | 'boleto';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  recommended?: boolean;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'pix',
    name: 'PIX',
    description: 'Pagamento instantâneo • Sem taxas',
    icon: Smartphone,
    recommended: true
  },
  {
    id: 'credit_card',
    name: 'Cartão de Crédito',
    description: 'Parcele em até 12x',
    icon: CreditCard,
  },
  {
    id: 'boleto',
    name: 'Boleto Bancário',
    description: '2-3 dias úteis',
    icon: FileText,
  }
];

// =================================================================
// Form Schema
// =================================================================

const embeddedPaymentFormSchema = z.object({
  customerName: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  customerEmail: z.string().email({ message: 'Email inválido' }),
  customerDocument: z.string().min(11, { message: 'CPF/CNPJ inválido' }),
  // Credit card fields (for transparent checkout)
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  cardExpirationDate: z.string().optional(),
  cardCvv: z.string().optional(),
  // Installments for credit card
  installments: z.string().optional(),
});

type EmbeddedPaymentFormInput = z.infer<typeof embeddedPaymentFormSchema>;

interface EmbeddedPaymentFormProps {
  planName?: string;
  planPrice?: number; // Price in cents
  planDescription?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

// =================================================================
// Component
// =================================================================

const EmbeddedPaymentForm: React.FC<EmbeddedPaymentFormProps> = ({
  planName = "Plano Mensal",
  planPrice = 1990, // R$ 19.90
  planDescription = "Acesso completo à plataforma EVIDENS",
  onSuccess,
  onCancel
}) => {
  const scriptLoaded = useRef(false);
  const [isScriptLoading, setIsScriptLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<EmbeddedPaymentFormInput>({
    resolver: zodResolver(embeddedPaymentFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerDocument: '',
      cardNumber: '',
      cardHolderName: '',
      cardExpirationDate: '',
      cardCvv: '',
      installments: '1',
    }
  });

  // Load tokenizecard.js script - Initialize only after form is rendered
  useEffect(() => {
    if (scriptLoaded.current) return;
    
    const script = document.createElement('script');
    script.src = 'https://checkout.pagar.me/v1/tokenizecard.js';
    script.setAttribute('data-pagarmecheckout-app-id', 'pk_test_your_public_key_here'); // TODO: Replace with actual public key
    script.async = true;
    script.onload = () => {
      setIsScriptLoading(false);
      // Don't initialize immediately - wait for form to be ready
      toast.success('Sistema de pagamento carregado!');
    };
    script.onerror = () => {
      setIsScriptLoading(false);
      toast.error('Falha ao carregar sistema de pagamento');
    };
    
    document.head.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize PagarmeCheckout only after form is rendered and script is loaded
  useEffect(() => {
    if (!isScriptLoading && window.PagarmeCheckout && !isProcessing) {
      // Small delay to ensure DOM elements are ready
      const initTimer = setTimeout(() => {
        try {
          window.PagarmeCheckout.init();
          console.log('PagarmeCheckout initialized successfully');
        } catch (error) {
          console.warn('PagarmeCheckout init failed (expected until form is submitted):', error);
        }
      }, 100);
      
      return () => clearTimeout(initTimer);
    }
  }, [isScriptLoading, isProcessing]);

  const onSubmit = async (values: EmbeddedPaymentFormInput) => {
    setIsProcessing(true);
    
    try {
      if (selectedMethod === 'pix') {
        // Handle PIX payment
        toast.success('PIX payment would be processed here');
        onSuccess?.({ id: 'pix_success', method: 'pix' });
      } else if (selectedMethod === 'credit_card') {
        // Handle credit card with tokenizecard.js
        toast.success('Credit card tokenization would happen here');
        onSuccess?.({ id: 'card_success', method: 'credit_card' });
      } else if (selectedMethod === 'boleto') {
        // Handle boleto
        toast.success('Boleto generation would happen here');
        onSuccess?.({ id: 'boleto_success', method: 'boleto' });
      }
    } catch (error) {
      toast.error('Erro no processamento do pagamento');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[400px]">
      {/* Header */}
      <div className="flex items-center space-x-2 text-black mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
        <h2 className="text-xl font-serif tracking-tight">Checkout Transparente</h2>
      </div>

      {/* Plan Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-black mb-1">{planName}</h3>
        <p className="text-sm text-gray-600 mb-2">{planDescription}</p>
        <p className="text-lg font-semibold text-black">
          R$ {(planPrice / 100).toFixed(2).replace('.', ',')}
        </p>
      </div>

      {/* Loading State */}
      {isScriptLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Carregando sistema de pagamento...</p>
        </div>
      )}

      {/* Payment Form */}
      {!isScriptLoading && (
        <>
          {/* Payment Method Selection */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-black mb-3">Método de pagamento</h4>
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedMethod === method.id
                        ? 'border-black bg-black/5'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-black text-sm">{method.name}</span>
                            {method.recommended && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Recomendado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{method.description}</p>
                        </div>
                      </div>
                      {selectedMethod === method.id && (
                        <Check className="h-4 w-4 text-black" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              className="space-y-6"
              data-pagarmecheckout-form // Required for tokenizecard.js
            >
              {/* Customer Information */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        placeholder="Nome completo"
                        {...field}
                        className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email"
                        {...field}
                        className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerDocument"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        placeholder="CPF ou CNPJ"
                        {...field}
                        className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credit Card Fields - Only show when credit card is selected */}
              {selectedMethod === 'credit_card' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-black">Dados do cartão</h5>
                  
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input
                            placeholder="Número do cartão"
                            {...field}
                            data-pagarmecheckout-element="number" // Required for tokenizecard.js
                            className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cardHolderName"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input
                            placeholder="Nome no cartão"
                            {...field}
                            data-pagarmecheckout-element="name" // Required for tokenizecard.js
                            className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="cardExpirationDate"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input
                              placeholder="MM/AA"
                              {...field}
                              data-pagarmecheckout-element="expiry" // Required for tokenizecard.js
                              className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cardCvv"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input
                              placeholder="CVV"
                              {...field}
                              data-pagarmecheckout-element="cvc" // Required for tokenizecard.js
                              className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black">
                              <SelectValue placeholder="Parcelas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1x de R$ {(planPrice / 100).toFixed(2)} (à vista)</SelectItem>
                            <SelectItem value="2">2x de R$ {(planPrice / 200).toFixed(2)}</SelectItem>
                            <SelectItem value="3">3x de R$ {(planPrice / 300).toFixed(2)}</SelectItem>
                            <SelectItem value="6">6x de R$ {(planPrice / 600).toFixed(2)}</SelectItem>
                            <SelectItem value="12">12x de R$ {(planPrice / 1200).toFixed(2)}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full !mt-8 !bg-black hover:!bg-gray-800 !text-white" 
                disabled={isProcessing}
              >
                {isProcessing 
                  ? 'Processando...' 
                  : `Pagar R$ ${(planPrice / 100).toFixed(2).replace('.', ',')}`}
              </Button>

              {/* Cancel Button */}
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                disabled={isProcessing}
              >
                Cancelar
              </Button>
            </form>
          </Form>
        </>
      )}

      {/* Security Info */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-green-500" />
            <span>Checkout transparente</span>
          </div>
          <div className="flex items-center space-x-1">
            <Lock className="h-3 w-3 text-blue-500" />
            <span>Tokenização segura</span>
          </div>
          <div className="flex items-center space-x-1">
            <Check className="h-3 w-3 text-purple-500" />
            <span>PCI Compliance</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-700">
          Problemas com o pagamento?{' '}
          <button type="button" className="text-black font-medium hover:underline">
            Entre em contato
          </button>
        </p>
      </div>
    </div>
  );
};

export default EmbeddedPaymentForm;