// ABOUTME: Two-step embedded payment form with sophisticated UX and lead generation capabilities
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { CreditCard, Smartphone, FileText, QrCode, ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useCreatePixPayment, useCreateCreditCardPayment, usePaymentStatus, pixPaymentSchema, creditCardPaymentSchema, type PixPaymentInput, type CreditCardPaymentInput } from '../../hooks/mutations/usePaymentMutations';

// =================================================================
// Types & Interfaces
// =================================================================

type PaymentMethod = 'pix' | 'credit_card' | 'boleto';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'pix',
    name: 'PIX',
    description: 'Instantâneo • Sem taxas',
    icon: Smartphone,
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

// Step 1: Customer Data Collection (Lead Generation)
const step1Schema = z.object({
  customerName: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  customerEmail: z.string().email({ message: 'Email inválido' }),
  customerEmailConfirm: z.string().email({ message: 'Email inválido' }),
  customerDocument: z.string().min(11, { message: 'CPF/CNPJ inválido' }),
  customerPhone: z.string().min(14, { message: 'Telefone inválido' }),
}).refine((data) => data.customerEmail === data.customerEmailConfirm, {
  message: "Os emails não coincidem",
  path: ["customerEmailConfirm"],
});

// Step 2: Payment Data
const step2Schema = z.object({
  // Credit card fields (when credit card is selected)
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  cardExpirationDate: z.string().optional(),
  cardCvv: z.string().optional(),
  installments: z.string().optional(),
  // Billing address fields (required for credit card payments)
  billingStreet: z.string().optional(),
  billingZipCode: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
});

// Combined schema for full form
const paymentFormSchema = step1Schema.and(step2Schema);

type Step1FormInput = z.infer<typeof step1Schema>;
type Step2FormInput = z.infer<typeof step2Schema>;
type PaymentFormInput = z.infer<typeof paymentFormSchema>;

interface TwoStepPaymentFormProps {
  planName?: string;
  planPrice?: number; // Price in cents
  planDescription?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

// =================================================================
// Progress Steps Component
// =================================================================

interface ProgressStepsProps {
  currentStep: 1 | 2;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {/* Step 1 */}
        <div className={`w-full h-2 rounded-l-full transition-all duration-500 ease-in-out ${currentStep >= 1 ? 'bg-gray-600' : 'bg-gray-200'}`} />
        {/* Step 2 */}
        <div className={`w-full h-2 rounded-r-full transition-all duration-500 ease-in-out ${currentStep === 2 ? 'bg-gray-600' : 'bg-gray-200'}`} />
      </div>
    </div>
  );
};


// =================================================================
// Component
// =================================================================

const TwoStepPaymentForm: React.FC<TwoStepPaymentFormProps> = ({
  planName = "Plano Mensal",
  planPrice = 1990, // R$ 19.90
  planDescription = "Acesso completo à plataforma EVIDENS",
  onSuccess,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('credit_card'); // Default to credit card
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPixCode, setShowPixCode] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<{
    message: string;
    canRetry: boolean;
  } | null>(null);

  // Payment mutation hooks
  const pixPaymentMutation = useCreatePixPayment();
  const creditCardPaymentMutation = useCreateCreditCardPayment();

  // Poll payment status when PIX QR code is displayed
  const { data: paymentStatus } = usePaymentStatus(
    pixData?.id, 
    showPixCode // Only poll when QR code is shown
  );

  const form = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerEmailConfirm: '',
      customerDocument: '',
      customerPhone: '',
      cardNumber: '',
      cardHolderName: '',
      cardExpirationDate: '',
      cardCvv: '',
      installments: '1',
      billingStreet: '',
      billingZipCode: '',
      billingCity: '',
      billingState: '',
    }
  });

  // Step validation and transition logic
  const handleStep1Continue = async () => {
    const step1Fields = ['customerName', 'customerEmail', 'customerEmailConfirm', 'customerDocument', 'customerPhone'];
    const isStep1Valid = await form.trigger(step1Fields as any);
    
    if (isStep1Valid) {
      // Store lead data here for future marketing/follow-up
      const customerData = {
        name: form.getValues('customerName'),
        email: form.getValues('customerEmail'),
        document: form.getValues('customerDocument'),
        phone: form.getValues('customerPhone'),
      };
      
      // TODO: Send lead data to analytics/CRM
      console.log('Lead captured:', customerData);
      toast.success('Dados salvos! Prossiga para o pagamento.');
      setCurrentStep(2);
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setPaymentError(null); // Clear errors when going back
  };

  const parsePaymentError = (errorMessage: string) => {
    setPaymentError({
      message: errorMessage,
      canRetry: true
    });
  };

  const handleRetryPayment = () => {
    setPaymentError(null);
    setIsProcessing(false);
    // Stay on current step and method for retry
  };


  const onSubmit = async (values: PaymentFormInput) => {
    if (currentStep === 1) {
      handleStep1Continue();
      return;
    }

    // Step 2: Process payment
    setIsProcessing(true);
    
    if (selectedMethod === 'pix') {
      // PIX Payment Logic
      const pixPaymentData: PixPaymentInput = {
        customerId: values.customerEmail,
        amount: planPrice, // Use planPrice directly (critical fix)
        description: `EVIDENS - ${planName}`,
        metadata: {
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerDocument: values.customerDocument,
          customerPhone: values.customerPhone,
          planName: planName
        }
      };

      pixPaymentMutation.mutate(pixPaymentData, {
        onSuccess: (data) => {
          setPixData(data);
          setShowPixCode(true);
          toast.success('Código PIX gerado com sucesso!');
          setIsProcessing(false);
        },
        onError: (error) => {
          console.error(error);
          parsePaymentError(error.message);
          setIsProcessing(false);
        }
      });
    } else if (selectedMethod === 'credit_card') {
      // Credit Card Payment Logic
      try {
        // Validate credit card fields
        if (!values.cardNumber || !values.cardHolderName || !values.cardExpirationDate || !values.cardCvv) {
          toast.error('Todos os campos do cartão são obrigatórios');
          setIsProcessing(false);
          return;
        }

        // Split expiration date
        const [month, year] = values.cardExpirationDate.split('/');
        if (!month || !year) {
          toast.error('Data de expiração inválida. Use o formato MM/AA');
          setIsProcessing(false);
          return;
        }

        const creditCardPaymentData: CreditCardPaymentInput = {
          customerId: values.customerEmail,
          amount: planPrice, // Use planPrice directly (critical fix)
          description: `EVIDENS - ${planName}`,
          cardToken: 'tokenize_on_server',
          installments: values.installments,
          metadata: {
            customerName: values.customerName,
            customerEmail: values.customerEmail,
            customerDocument: values.customerDocument,
            customerPhone: values.customerPhone,
            planName: planName
          },
          billingAddress: {
            line_1: values.billingStreet,
            zip_code: values.billingZipCode.replace(/\D/g, ''),
            city: values.billingCity,
            state: values.billingState,
            country: 'BR'
          },
          cardData: {
            number: values.cardNumber.replace(/\s/g, ''),
            holderName: values.cardHolderName,
            expirationMonth: month.padStart(2, '0'),
            expirationYear: year,
            cvv: values.cardCvv
          }
        };

        creditCardPaymentMutation.mutate(creditCardPaymentData, {
          onSuccess: (data) => {
            toast.success('Pagamento processado com sucesso!');
            onSuccess?.(data.id);
            setIsProcessing(false);
          },
          onError: (error) => {
            console.error(error);
            parsePaymentError(error.message);
            setIsProcessing(false);
          }
        });
      } catch (error) {
        console.error(error);
        parsePaymentError(error.message || 'Erro no processamento do pagamento');
        setIsProcessing(false);
      }
    } else if (selectedMethod === 'boleto') {
      // Boleto coming soon
      toast.info('Boleto bancário em breve!');
      setIsProcessing(false);
    }
  };

  // PIX Code Display (for demo purposes)
  if (showPixCode) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full max-w-[400px]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-serif tracking-tight text-black mb-2">
            Pague com PIX
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            Use o QR Code ou copie o código PIX abaixo. O pagamento é confirmado instantaneamente.
          </p>

          {/* Mock QR Code */}
          <div className="bg-white h-48 w-48 mx-auto mb-4 flex items-center justify-center rounded-lg border">
            {pixData?.qr_code_url ? (
              <img 
                src={pixData.qr_code_url} 
                alt="PIX QR Code"
                className="h-44 w-44 object-contain"
              />
            ) : (
              <div className="text-center">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">QR Code PIX</p>
              </div>
            )}
          </div>

          {/* Copy PIX Code Button */}
          <Button 
            onClick={async () => {
              const pixCode = pixData?.qr_code_text || pixData?.qr_code || pixData?.pix_code;
              if (pixCode) {
                try {
                  await navigator.clipboard.writeText(pixCode);
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
            className="w-full h-11 sm:h-12 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 mb-3 touch-manipulation"
          >
            Copiar código PIX
          </Button>

          <div className="text-xs sm:text-sm text-gray-500 mb-4">
            Válido por 1 hora • R$ {(planPrice / 100).toFixed(2).replace('.', ',')}
          </div>
          
          {/* Payment status monitoring */}
          {paymentStatus?.status === 'paid' && (
            <Button 
              onClick={() => onSuccess?.(pixData.id)}
              className="w-full h-12 sm:h-14 !bg-green-600 hover:!bg-green-700 !text-white text-base sm:text-lg font-medium touch-manipulation"
            >
              Pagamento confirmado! ✓
            </Button>
          )}

          <Button 
            onClick={() => setShowPixCode(false)}
            variant="outline"
            className="w-full h-11 sm:h-12 mt-3 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 touch-manipulation"
          >
            Voltar
          </Button>

          {/* PIX Error Handling */}
          {paymentError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-center">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Problema com PIX
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  {paymentError.message}
                </p>
                
                <Button
                  type="button"
                  onClick={handleRetryPayment}
                  className="w-full bg-red-600 hover:bg-red-700 text-white mb-3"
                >
                  Tentar novamente
                </Button>
                
                <p className="text-xs text-gray-600">
                  Precisa de ajuda? <a href="mailto:suporte@evidens.com.br" className="text-blue-600 hover:underline">Fale com a gente clicando aqui</a>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full max-w-[400px] min-h-fit">
      {/* Header */}
      <div className="flex items-center space-x-2 text-black mb-4">
        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
        <h2 className="text-xl font-serif tracking-tight">Pagamento</h2>
      </div>

      {/* Progress Indicator */}
      <ProgressSteps currentStep={currentStep} />

      {/* Plan Information */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4">
        <h3 className="font-medium text-black mb-1 text-sm sm:text-base">{planName}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{planDescription}</p>
        <p className="text-base sm:text-lg font-semibold text-black">
          R$ {(planPrice / 100).toFixed(2).replace('.', ',')}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Step 1: Customer Data Collection */}
          {currentStep === 1 && (
            <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-right-4 space-y-4">
            <>
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
                name="customerEmailConfirm"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Confirmar email"
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
                        placeholder="000.000.000-00"
                        {...field}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 11) {
                            // CPF format: XXX.XXX.XXX-XX
                            value = value.replace(/(\d{3})(\d)/, '$1.$2');
                            value = value.replace(/(\d{3})(\d)/, '$1.$2');
                            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                          } else {
                            // CNPJ format: XX.XXX.XXX/XXXX-XX
                            value = value.replace(/(\d{2})(\d)/, '$1.$2');
                            value = value.replace(/(\d{3})(\d)/, '$1.$2');
                            value = value.replace(/(\d{3})(\d)/, '$1/$2');
                            value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
                          }
                          field.onChange(value);
                        }}
                        maxLength={18} // CNPJ max length with formatting
                        className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <PhoneInput
                        {...field}
                        className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Step 1 Continue Button */}
              <Button 
                type="submit" 
                className="w-full !mt-8 !bg-black hover:!bg-gray-800 !text-white flex items-center justify-center gap-2" 
                disabled={isProcessing}
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
            </div>
          )}

          {/* Step 2: Payment Method Selection */}
          {currentStep === 2 && (
            <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-4 space-y-4">
            <>
              {/* Payment Method Selection - Dropdown with sophisticated gray colors */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-black mb-3">Método de pagamento</h4>
                <Select onValueChange={(value: PaymentMethod) => {
                  setSelectedMethod(value);
                  setPaymentError(null); // Clear errors when switching methods
                }} defaultValue={selectedMethod}>
                  <SelectTrigger className="bg-white border-gray-300 focus:border-gray-600 focus:ring-0 text-black h-16 sm:h-18 p-3 touch-manipulation">
                    <SelectValue>
                      {(() => {
                        const method = paymentMethods.find(m => m.id === selectedMethod);
                        if (!method) return "Selecione um método";
                        const Icon = method.icon;
                        const isSpecialMethod = method.id === 'pix' || method.id === 'credit_card';
                        return (
                          <div className="flex items-center space-x-3 w-full">
                            <Icon className="h-5 w-5 text-gray-600" />
                            <div className="flex-1 text-left">
                              <div className="font-medium text-black text-sm">{method.name}</div>
                              <p className={`text-xs ${isSpecialMethod ? 'text-green-700 bg-green-50 px-2 py-0.5 rounded inline-block mt-0.5' : 'text-gray-600'}`}>
                                {method.description}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSpecialMethod = method.id === 'pix' || method.id === 'credit_card';
                      return (
                        <SelectItem 
                          key={method.id} 
                          value={method.id} 
                          className="p-3 h-16 sm:h-18 touch-manipulation text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:bg-gray-100 data-[state=checked]:text-black focus:text-black"
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <Icon className="h-5 w-5 text-gray-600" />
                            <div className="flex-1 text-left">
                              <div className="font-medium text-black text-sm">{method.name}</div>
                              <p className={`text-xs ${isSpecialMethod ? 'text-green-700 bg-green-50 px-2 py-0.5 rounded inline-block mt-0.5' : 'text-gray-600'}`}>
                                {method.description}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Credit Card Fields - Only show when credit card is selected */}
              {selectedMethod === 'credit_card' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg mt-4">
                  <h5 className="text-sm font-medium text-black mb-3">Dados do cartão</h5>
                  
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormControl>
                          <Input
                            placeholder="1234 5678 9012 3456"
                            {...field}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              // Format as XXXX XXXX XXXX XXXX
                              value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                              field.onChange(value);
                            }}
                            maxLength={19} // 16 digits + 3 spaces
                            className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11 sm:h-12 touch-manipulation"
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
                      <FormItem className="space-y-1">
                        <FormControl>
                          <Input
                            placeholder="Nome no cartão"
                            {...field}
                            className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11 sm:h-12 touch-manipulation"
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
                        <FormItem className="space-y-1">
                          <FormControl>
                            <Input
                              placeholder="MM/AA"
                              {...field}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 2) {
                                  value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                }
                                field.onChange(value);
                              }}
                              maxLength={5}
                              className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11 sm:h-12 touch-manipulation"
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
                        <FormItem className="space-y-1">
                          <FormControl>
                            <Input
                              placeholder="CVV"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                              maxLength={4}
                              className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11 sm:h-12 touch-manipulation"
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
                      <FormItem className="space-y-1">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black h-11">
                              <SelectValue placeholder="Parcelas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border border-gray-200">
                            <SelectItem value="1" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">1x de R$ {(planPrice / 100).toFixed(2)} (à vista)</SelectItem>
                            <SelectItem value="2" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">2x de R$ {(planPrice / 200).toFixed(2)}</SelectItem>
                            <SelectItem value="3" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">3x de R$ {(planPrice / 300).toFixed(2)}</SelectItem>
                            <SelectItem value="6" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">6x de R$ {(planPrice / 600).toFixed(2)}</SelectItem>
                            <SelectItem value="12" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">12x de R$ {(planPrice / 1200).toFixed(2)}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Billing Address Fields */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h6 className="text-sm font-medium text-black mb-3">Endereço de cobrança</h6>
                    
                    <FormField
                      control={form.control}
                      name="billingStreet"
                      render={({ field }) => (
                        <FormItem className="space-y-1 mb-3">
                          <FormControl>
                            <Input
                              placeholder="Endereço (rua, número)"
                              {...field}
                              className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11 sm:h-12 touch-manipulation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <FormField
                        control={form.control}
                        name="billingZipCode"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input
                                placeholder="00000-000"
                                {...field}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '');
                                  // CEP format: XXXXX-XXX
                                  if (value.length > 5) {
                                    value = value.replace(/(\d{5})(\d{1,3})/, '$1-$2');
                                  }
                                  field.onChange(value);
                                }}
                                maxLength={9} // 8 digits + 1 hyphen
                                className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11 sm:h-12 touch-manipulation"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="billingCity"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input
                                placeholder="Cidade"
                                {...field}
                                className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11 sm:h-12 touch-manipulation"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="billingState"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black h-11">
                                <SelectValue placeholder="Estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border border-gray-200">
                              <SelectItem value="AC" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Acre</SelectItem>
                              <SelectItem value="AL" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Alagoas</SelectItem>
                              <SelectItem value="AP" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Amapá</SelectItem>
                              <SelectItem value="AM" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Amazonas</SelectItem>
                              <SelectItem value="BA" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Bahia</SelectItem>
                              <SelectItem value="CE" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Ceará</SelectItem>
                              <SelectItem value="DF" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Distrito Federal</SelectItem>
                              <SelectItem value="ES" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Espírito Santo</SelectItem>
                              <SelectItem value="GO" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Goiás</SelectItem>
                              <SelectItem value="MA" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Maranhão</SelectItem>
                              <SelectItem value="MT" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Mato Grosso</SelectItem>
                              <SelectItem value="MS" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Mato Grosso do Sul</SelectItem>
                              <SelectItem value="MG" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Minas Gerais</SelectItem>
                              <SelectItem value="PA" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Pará</SelectItem>
                              <SelectItem value="PB" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Paraíba</SelectItem>
                              <SelectItem value="PR" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Paraná</SelectItem>
                              <SelectItem value="PE" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Pernambuco</SelectItem>
                              <SelectItem value="PI" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Piauí</SelectItem>
                              <SelectItem value="RJ" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Rio de Janeiro</SelectItem>
                              <SelectItem value="RN" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Rio Grande do Norte</SelectItem>
                              <SelectItem value="RS" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Rio Grande do Sul</SelectItem>
                              <SelectItem value="RO" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Rondônia</SelectItem>
                              <SelectItem value="RR" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Roraima</SelectItem>
                              <SelectItem value="SC" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Santa Catarina</SelectItem>
                              <SelectItem value="SP" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">São Paulo</SelectItem>
                              <SelectItem value="SE" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Sergipe</SelectItem>
                              <SelectItem value="TO" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">Tocantins</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2 Submit Button */}
              <Button 
                type="submit" 
                className="w-full !mt-8 !bg-black hover:!bg-gray-800 !text-white text-base font-medium"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {selectedMethod === 'pix' ? 'Gerando código PIX...' : 'Processando pagamento...'}
                  </div>
                ) : (
                  'Pagar agora'
                )}
              </Button>


              {/* Payment Error & Recovery Actions */}
              {paymentError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-5 w-5 text-red-400">⚠️</div>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-red-800 mb-2">
                        Problema no pagamento
                      </h3>
                      <p className="text-sm text-red-700 mb-4">
                        {paymentError.message}
                      </p>
                      
                      {/* Recovery Action Buttons */}
                      <Button
                        type="button"
                        onClick={handleRetryPayment}
                        className="w-full bg-red-600 hover:bg-red-700 text-white mb-3"
                      >
                        Tentar novamente
                      </Button>
                      
                      <p className="text-xs text-gray-600">
                        Precisa de ajuda? <a href="mailto:suporte@evidens.com.br" className="text-blue-600 hover:underline">Fale com a gente clicando aqui</a>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </>
            </div>
          )}
        </form>
      </Form>

      {/* Bottom Navigation - Only show Voltar when on Step 2 */}
      {currentStep === 2 && (
        <div className="mt-4">
          <Button 
            type="button"
            variant="outline"
            onClick={handleBackToStep1}
            className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 flex items-center justify-center gap-2 touch-manipulation"
            disabled={isProcessing}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      )}

      {/* Security and Support Info - matching /pagar form pattern */}
      <div className="mt-4 sm:mt-6 text-center">
        <div className="flex items-center justify-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
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
          <button type="button" className="text-black font-medium hover:underline touch-manipulation">
            Entre em contato
          </button>
        </p>
      </div>
    </div>
  );
};

export default TwoStepPaymentForm;