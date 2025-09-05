// ABOUTME: Payment form component following EVIDENS login/register UI pattern for consistent user experience
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useCreatePixPayment, useCreateCreditCardPayment, usePaymentStatus, pixPaymentSchema, creditCardPaymentSchema, tokenizeCard, type PixPaymentInput, type CreditCardPaymentInput } from '../../hooks/mutations/usePaymentMutations';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, FileText, Check, QrCode } from 'lucide-react';

// =================================================================
// Payment Method Types & Configuration
// =================================================================

type PaymentMethod = 'pix' | 'credit_card' | 'boleto';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  recommended?: boolean;
  comingSoon?: boolean;
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
    icon: CreditCard
  },
  {
    id: 'boleto',
    name: 'Boleto Bancário',
    description: '2-3 dias úteis',
    icon: FileText,
    comingSoon: true // Will be available in Phase C
  }
];

// =================================================================
// Form Schema (Starting with PIX only for MVP)
// =================================================================

const paymentFormSchema = z.object({
  customerName: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  customerEmail: z.string().email({ message: 'Email inválido' }),
  customerDocument: z.string().min(11, { message: 'CPF/CNPJ inválido' }),
  amount: z.number().min(1, { message: 'Valor mínimo é R$ 0,01' }), // Reduced for testing
  description: z.string().default('EVIDENS - Acesso à Plataforma'),
  // Credit card fields (optional, required only when credit_card is selected)
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  cardExpiryMonth: z.string().optional(),
  cardExpiryYear: z.string().optional(),
  cardCvv: z.string().optional(),
  installments: z.number().min(1).max(12).default(1)
});

type PaymentFormInput = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  planName?: string;
  planPrice?: number; // Price in cents
  planDescription?: string;
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
}

// =================================================================
// Payment Form Component
// =================================================================

const PaymentForm: React.FC<PaymentFormProps> = ({
  planName = "Plano Básico",
  planPrice = 2990, // Default R$ 29.90 in cents
  planDescription = "Acesso completo à plataforma EVIDENS",
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate();
  const pixPaymentMutation = useCreatePixPayment();
  const creditCardPaymentMutation = useCreateCreditCardPayment();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [showPixCode, setShowPixCode] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Poll payment status when PIX QR code is displayed
  const { data: paymentStatus } = usePaymentStatus(
    pixData?.id, 
    showPixCode // Only poll when QR code is shown
  );
  
  // Check for payment completion
  useEffect(() => {
    if (paymentStatus && pixData) {
      // Check if payment is completed (different PSPs may use different status values)
      const isCompleted = paymentStatus.status === 'paid' || 
                         paymentStatus.status === 'confirmed' ||
                         paymentStatus.charges?.[0]?.status === 'paid';
      
      if (isCompleted) {
        toast.success('Pagamento confirmado! Redirecionando...');
        setTimeout(() => {
          onSuccess?.(pixData.id);
        }, 2000);
      }
    }
  }, [paymentStatus, pixData, onSuccess]);
  
  const form = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerDocument: '',
      amount: planPrice,
      description: `EVIDENS - ${planName}`,
      cardNumber: '',
      cardHolderName: '',
      cardExpiryMonth: '',
      cardExpiryYear: '',
      cardCvv: '',
      installments: 1
    }
  });

  const onSubmit = async (values: PaymentFormInput) => {
    if (selectedMethod === 'pix') {
      // PIX Payment Logic
      const pixPaymentData: PixPaymentInput = {
        customerId: values.customerEmail, // Use email as identifier, Edge function will create/find customer
        amount: values.amount,
        description: values.description,
        metadata: {
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerDocument: values.customerDocument,
          planName: planName
        }
      };

      pixPaymentMutation.mutate(pixPaymentData, {
        onSuccess: (data) => {
          setPixData(data);
          setShowPixCode(true);
          toast.success('Código PIX gerado com sucesso!');
          // Don't call onSuccess immediately - wait for payment confirmation
        },
        onError: (error) => {
          toast.error('Falha ao gerar PIX. Tente novamente.');
          console.error(error);
        }
      });
    } else if (selectedMethod === 'credit_card') {
      // Credit Card Payment Logic
      setIsProcessing(true);
      
      try {
        // Validate credit card fields
        if (!values.cardNumber || !values.cardHolderName || !values.cardExpiryMonth || !values.cardExpiryYear || !values.cardCvv) {
          toast.error('Todos os campos do cartão são obrigatórios');
          setIsProcessing(false);
          return;
        }

        // Tokenize card with Pagar.me
        const tokenResult = await tokenizeCard({
          number: values.cardNumber,
          holderName: values.cardHolderName,
          expirationMonth: values.cardExpiryMonth,
          expirationYear: values.cardExpiryYear,
          cvv: values.cardCvv
        });

        if (!tokenResult.success) {
          toast.error('Dados do cartão inválidos');
          setIsProcessing(false);
          return;
        }

        // Process credit card payment
        const creditCardPaymentData: CreditCardPaymentInput = {
          customerId: values.customerEmail,
          amount: values.amount,
          description: values.description,
          cardToken: tokenResult.token,
          installments: values.installments,
          metadata: {
            customerName: values.customerName,
            customerEmail: values.customerEmail,
            customerDocument: values.customerDocument,
            planName: planName
          }
        };

        creditCardPaymentMutation.mutate(creditCardPaymentData, {
          onSuccess: (data) => {
            toast.success('Pagamento processado com sucesso!');
            onSuccess?.(data.id);
          },
          onError: (error) => {
            toast.error('Falha ao processar pagamento. Tente novamente.');
            console.error(error);
          },
          onSettled: () => {
            setIsProcessing(false);
          }
        });

      } catch (error) {
        console.error('Credit card processing error:', error);
        toast.error('Erro ao processar cartão');
        setIsProcessing(false);
      }
    }
  };

  // PIX Code Display (matching login form style)
  if (showPixCode && pixData) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[400px]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-serif tracking-tight text-black mb-2">
            Pague com PIX
          </h2>
          
          <p className="text-sm text-gray-600 mb-4">
            Use o QR Code ou copie o código PIX abaixo. O pagamento é confirmado instantaneamente.
          </p>
          
          {/* Payment Status Indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-700 font-medium">
                Aguardando pagamento...
              </span>
            </div>
            <p className="text-xs text-blue-600 text-center mt-1">
              Você será redirecionado automaticamente após a confirmação
            </p>
          </div>

          {/* QR Code Display */}
          {pixData?.qr_code_url ? (
            <div className="bg-white h-48 w-48 mx-auto mb-4 flex items-center justify-center rounded-lg border">
              <img 
                src={pixData.qr_code_url} 
                alt="PIX QR Code"
                className="h-44 w-44 object-contain"
                onError={(e) => {
                  // Fallback if QR code image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="h-44 w-44 items-center justify-center rounded-lg bg-gray-100 hidden">
                <div className="text-center">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">QR Code indisponível</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 h-48 w-48 mx-auto mb-4 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Gerando QR Code...</p>
              </div>
            </div>
          )}

          {/* Copy PIX Code Button */}
          <Button 
            onClick={async () => {
              const pixCode = pixData?.qr_code_text || pixData?.qr_code || pixData?.pix_code;
              if (pixCode) {
                try {
                  // Modern clipboard API with fallback
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(pixCode);
                  } else {
                    // Fallback for older browsers or non-HTTPS
                    const textArea = document.createElement('textarea');
                    textArea.value = pixCode;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    textArea.remove();
                  }
                  toast.success('Código PIX copiado!');
                } catch (error) {
                  console.error('Clipboard error:', error);
                  toast.error('Erro ao copiar código PIX');
                }
              } else {
                toast.error('Código PIX não disponível');
              }
            }}
            variant="outline" 
            className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 mb-3"
            disabled={!pixData?.qr_code_text && !pixData?.qr_code && !pixData?.pix_code}
          >
            {pixData?.qr_code_text || pixData?.qr_code || pixData?.pix_code 
              ? 'Copiar código PIX' 
              : 'Código PIX indisponível'}
          </Button>

          <div className="text-xs text-gray-500 mb-4">
            Válido por 1 hora • R$ {(planPrice / 100).toFixed(2).replace('.', ',')}
          </div>
          
          <Button 
            onClick={() => {
              setShowPixCode(false);
              navigate('/');
            }}
            className="w-full !bg-black hover:!bg-gray-800 !text-white"
          >
            Acompanhar pagamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[400px]">
      {/* Header - matching login form style */}
      <div className="flex items-center space-x-2 text-black mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
        <h2 className="text-xl font-serif tracking-tight">Pagamento</h2>
      </div>

      {/* Plan Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-black mb-1">{planName}</h3>
        <p className="text-sm text-gray-600 mb-2">{planDescription}</p>
        <p className="text-lg font-semibold text-black">
          R$ {(planPrice / 100).toFixed(2).replace('.', ',')}
        </p>
      </div>

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
                onClick={() => !method.comingSoon && setSelectedMethod(method.id)}
                disabled={method.comingSoon}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  selectedMethod === method.id
                    ? 'border-black bg-black/5'
                    : method.comingSoon
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
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
                        {method.comingSoon && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Em breve
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  {selectedMethod === method.id && !method.comingSoon && (
                    <Check className="h-4 w-4 text-black" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Form - matching login form structure exactly */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Credit Card Fields - only show when credit card is selected */}
          {selectedMethod === 'credit_card' && (
            <>
              <div className="border-t pt-6 space-y-6">
                <h4 className="text-sm font-medium text-black">Dados do cartão</h4>
                
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <Input
                          placeholder="0000 0000 0000 0000"
                          {...field}
                          className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                          onChange={(e) => {
                            // Format card number with spaces
                            const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                            field.onChange(formatted);
                          }}
                          maxLength={19}
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
                          className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="cardExpiryMonth"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input
                            placeholder="MM"
                            {...field}
                            className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                            maxLength={2}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardExpiryYear"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input
                            placeholder="YYYY"
                            {...field}
                            className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                            maxLength={4}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value);
                            }}
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
                            className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                            maxLength={4}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value);
                            }}
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
                      <FormControl>
                        <select
                          {...field}
                          className="w-full bg-white border border-gray-300 focus:border-black focus:ring-0 text-black rounded-md px-3 py-2"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        >
                          {[...Array(12)].map((_, i) => {
                            const installment = i + 1;
                            const installmentValue = planPrice / installment;
                            return (
                              <option key={installment} value={installment}>
                                {installment}x de R$ {(installmentValue / 100).toFixed(2).replace('.', ',')}
                                {installment === 1 ? ' à vista' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
          
          {/* Submit Button - matching login form style */}
          <Button 
            type="submit" 
            className="w-full !mt-8 !bg-black hover:!bg-gray-800 !text-white" 
            disabled={pixPaymentMutation.isPending || creditCardPaymentMutation.isPending || isProcessing || paymentMethods.find(m => m.id === selectedMethod)?.comingSoon}
          >
            {(pixPaymentMutation.isPending || creditCardPaymentMutation.isPending || isProcessing)
              ? 'Processando...' 
              : selectedMethod === 'pix'
                ? `Gerar PIX R$ ${(planPrice / 100).toFixed(2).replace('.', ',')}`
                : `Pagar R$ ${(planPrice / 100).toFixed(2).replace('.', ',')}`}
          </Button>
        </form>
      </Form>

      {/* Security and Support Info - matching login form pattern */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 bg-green-500 rounded-full"></span>
            <span>Pagamento seguro</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
            <span>Dados protegidos</span>
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

export default PaymentForm;