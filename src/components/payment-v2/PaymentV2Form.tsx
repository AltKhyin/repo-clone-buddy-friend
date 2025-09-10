// ABOUTME: Payment V2.0 form component with two-step UI matching original pagamento design
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { CreditCard, ArrowLeft, ArrowRight, Smartphone } from 'lucide-react';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { 
  calculatePricing, 
  buildSubscriptionRequest,
  createSubscriptionV2,
  buildPixPaymentRequest,
  createPixPaymentV2,
  validatePaymentForm,
  TEST_CARDS,
  type InstallmentOption 
} from '@/lib/pagarme-v2';
import { supabase } from '@/integrations/supabase/client';
import { PixDisplayV2 } from './PixDisplayV2';
import { PaymentResultV2, type PaymentResultV2Data } from './PaymentResultV2';

// Step 1: Customer Data Collection
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
  // Credit card fields
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  cardExpirationDate: z.string().optional(),
  cardCvv: z.string().optional(),
  installments: z.string().optional(),
  // Billing address fields
  billingStreet: z.string().optional(),
  billingZipCode: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
});

// Combined schema for full form
const paymentV2Schema = step1Schema.and(step2Schema);

type Step1FormInput = z.infer<typeof step1Schema>;
type Step2FormInput = z.infer<typeof step2Schema>;
type PaymentV2FormData = z.infer<typeof paymentV2Schema>;

type PaymentMethod = 'pix' | 'credit_card';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'credit_card',
    name: 'Cartão de Crédito',
    description: 'Parcele em até 12x',
    icon: CreditCard,
  },
  {
    id: 'pix',
    name: 'PIX',
    description: 'Instantâneo • Sem taxas',
    icon: Smartphone,
  }
];

// Progress Steps Component
interface ProgressStepsProps {
  currentStepIndex: number;
  totalSteps: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStepIndex, totalSteps }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {Array.from({ length: totalSteps }, (_, index) => {
          const isFirst = index === 0;
          const isLast = index === totalSteps - 1;
          const isActive = index <= currentStepIndex;
          
          let roundedClass = 'rounded-none';
          if (isFirst && isLast) {
            roundedClass = 'rounded-full';
          } else if (isFirst) {
            roundedClass = 'rounded-l-full';
          } else if (isLast) {
            roundedClass = 'rounded-r-full';
          }

          return (
            <div
              key={index}
              className={`w-full h-2 transition-all duration-500 ease-in-out ${roundedClass} ${
                isActive ? 'bg-gray-600' : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span className={`${0 <= currentStepIndex ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
          Dados
        </span>
        <span className={`${1 <= currentStepIndex ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
          Pagamento
        </span>
      </div>
    </div>
  );
};

// Brazilian installment fee calculation
const calculateInstallmentTotal = (baseAmount: number, installments: number): {
  totalAmount: number;
  installmentAmount: number;
  feeAmount: number;
  feePercentage: number;
} => {
  if (installments <= 1) {
    return {
      totalAmount: baseAmount,
      installmentAmount: baseAmount,
      feeAmount: 0,
      feePercentage: 1.6
    };
  }
  
  // 3% fee per month after first month (2x-12x)
  const feePercentage = (installments - 1) * 3;
  const feeAmount = Math.round(baseAmount * (feePercentage / 100));
  const totalAmount = baseAmount + feeAmount;
  const installmentAmount = Math.round(totalAmount / installments);
  
  return {
    totalAmount,
    installmentAmount,
    feeAmount,
    feePercentage
  };
};

const formatCurrency = (amountInCents: number): string => {
  return (amountInCents / 100).toFixed(2).replace('.', ',');
};

type PaymentViewState = 'form' | 'pix-display' | 'result';

interface PaymentData {
  pixQrCode?: string;
  pixQrCodeUrl?: string;
  paymentId?: string;
  paymentMethod?: PaymentMethod;
}

const PaymentV2Form = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('credit_card');
  const [selectedInstallments, setSelectedInstallments] = useState<InstallmentOption>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState<PaymentViewState>('form');
  const [paymentData, setPaymentData] = useState<PaymentData>({});
  const [paymentResult, setPaymentResult] = useState<PaymentResultV2Data | null>(null);
  
  // Using EVIDENS base price from the original pricing
  const basePrice = 1990; // R$ 19,90 in cents
  const form = useForm<PaymentV2FormData>({
    resolver: zodResolver(paymentV2Schema),
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
    },
  });
  const pricing = calculateInstallmentTotal(basePrice, selectedInstallments);

  // Helper function to populate test data
  const fillTestData = () => {
    form.setValue('customerName', TEST_CARDS.APPROVED.name);
    form.setValue('customerEmail', 'test@evidens.com');
    form.setValue('customerEmailConfirm', 'test@evidens.com');
    form.setValue('customerDocument', '04094922059');
    form.setValue('customerPhone', '(11) 99999-9999');
    form.setValue('billingStreet', 'Rua Teste, 123');
    form.setValue('billingZipCode', '01310100');
    form.setValue('billingCity', 'São Paulo');
    form.setValue('billingState', 'SP');
    form.setValue('cardNumber', TEST_CARDS.APPROVED.number);
    form.setValue('cardHolderName', TEST_CARDS.APPROVED.name);
    form.setValue('cardExpirationDate', TEST_CARDS.APPROVED.expiry);
    form.setValue('cardCvv', TEST_CARDS.APPROVED.cvv);
  };

  const handleStep1Continue = async () => {
    const step1Fields = ['customerName', 'customerEmail', 'customerEmailConfirm', 'customerDocument', 'customerPhone'];
    const isStep1Valid = await form.trigger(step1Fields as any);
    
    if (isStep1Valid) {
      toast.success('Dados salvos! Prosseguindo...');
      setCurrentStep(1);
    }
  };

  const handleBackStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const onSubmit = async (values: PaymentV2FormData) => {
    if (currentStep === 0) {
      handleStep1Continue();
      return;
    }

    // Step 2: Process payment
    setIsProcessing(true);
    
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      if (selectedMethod === 'pix') {
        // PIX Payment Logic
        console.log('Payment V2.0 - Building PIX payment request...');
        
        const pixRequestData = {
          name: values.customerName,
          email: values.customerEmail,
          document: values.customerDocument,
          phone: values.customerPhone,
          amount: basePrice, // R$ 19.90 in cents
        };
        
        const pixRequest = buildPixPaymentRequest(pixRequestData);
        
        console.log('Payment V2.0 - Sending PIX request to Edge Function:', pixRequest);
        
        const response = await createPixPaymentV2(
          pixRequest,
          supabase.supabaseUrl,
          session.access_token
        );
        
        console.log('Payment V2.0 - PIX response:', response);
        
        // Handle PIX response - show QR code
        if (response.charges && response.charges.length > 0) {
          const pixCharge = response.charges[0];
          const qrCode = pixCharge.last_transaction?.qr_code;
          const qrCodeUrl = pixCharge.last_transaction?.qr_code_url;
          
          if (qrCode && qrCodeUrl) {
            // Store PIX data and show PIX display
            setPaymentData({
              pixQrCode: qrCode,
              pixQrCodeUrl: qrCodeUrl,
              paymentId: response.id,
              paymentMethod: 'pix'
            });
            setCurrentView('pix-display');
            toast.success('PIX gerado com sucesso! Use o QR code para pagar.');
          } else {
            throw new Error('Erro ao gerar QR code do PIX');
          }
        } else {
          throw new Error('Resposta do PIX inválida');
        }
        
      } else if (selectedMethod === 'credit_card') {
        // Credit Card Payment Logic
        console.log('Payment V2.0 - Building subscription request for server-side tokenization...');
        
        const requestData = {
          name: values.customerName,
          email: values.customerEmail,
          document: values.customerDocument,
          phone: values.customerPhone,
          zipCode: values.billingZipCode || '',
          address: values.billingStreet || '',
          city: values.billingCity || '',
          state: values.billingState || '',
          cardNumber: values.cardNumber || '',
          cardName: values.cardHolderName || '',
          cardExpiry: values.cardExpirationDate || '',
          cardCvv: values.cardCvv || '',
          installments: values.installments || '1',
        };
        
        const subscriptionRequest = buildSubscriptionRequest(requestData);
        
        console.log('Payment V2.0 - Sending credit card request to Edge Function:', subscriptionRequest);
        
        const response = await createSubscriptionV2(
          subscriptionRequest, 
          supabase.supabaseUrl, 
          session.access_token
        );
        
        console.log('Payment V2.0 - Credit card response:', response);
        
        // Show success result
        setPaymentResult({
          type: 'success',
          title: 'Pagamento aprovado!',
          message: 'Sua assinatura foi criada com sucesso. Bem-vindo(a) ao EVIDENS!',
          orderId: response.id,
          paymentMethod: 'credit_card',
          amount: basePrice,
          actions: {
            primary: {
              label: 'Acessar plataforma',
              action: () => {
                // TODO: Redirect to platform
                console.log('Redirecting to platform...');
              }
            },
            secondary: {
              label: 'Ver detalhes',
              action: () => {
                console.log('Show payment details...');
              }
            }
          }
        });
        setCurrentView('result');
        toast.success(`Assinatura criada com sucesso! ID: ${response.id}`);
      }
      
    } catch (error: any) {
      console.error('Payment V2.0 - Error:', error);
      
      // Show error result
      setPaymentResult({
        type: 'failure',
        title: 'Pagamento não aprovado',
        message: 'Houve um problema ao processar seu pagamento. Verifique os dados e tente novamente.',
        details: error.message || 'Erro no processamento do pagamento',
        paymentMethod: selectedMethod,
        amount: basePrice,
        actions: {
          primary: {
            label: 'Tentar novamente',
            action: () => {
              setCurrentView('form');
              setPaymentResult(null);
            },
            variant: 'destructive'
          },
          back: {
            label: 'Voltar ao formulário',
            action: () => {
              setCurrentView('form');
              setPaymentResult(null);
            }
          }
        }
      });
      setCurrentView('result');
      toast.error(error.message || 'Erro no processamento do pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show PIX QR Code Display
  if (currentView === 'pix-display' && paymentData.pixQrCode && paymentData.pixQrCodeUrl) {
    return (
      <PixDisplayV2
        qrCode={paymentData.pixQrCode}
        qrCodeUrl={paymentData.pixQrCodeUrl}
        amount={basePrice}
        onBack={() => setCurrentView('form')}
      />
    );
  }

  // Show Payment Result (Success/Failure)
  if (currentView === 'result' && paymentResult) {
    return <PaymentResultV2 result={paymentResult} />;
  }

  // Show Payment Form (default)
  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full max-w-[400px] min-h-fit">
      {/* Header */}
      <div className="flex items-center justify-between text-black mb-4">
        <div className="flex items-center space-x-2">
          <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
          <h2 className="text-xl font-serif tracking-tight">Pagamento</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fillTestData}
          className="text-xs bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
        >
          Usar Test Data
        </Button>
      </div>

      {/* Progress Indicator */}
      <ProgressSteps 
        currentStepIndex={currentStep} 
        totalSteps={2}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Step 1: Customer Data Collection */}
          {currentStep === 0 && (
            <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-right-4 space-y-4">
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
                        placeholder="Digite seu CPF ou CNPJ"
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
                        maxLength={18}
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
            </div>
          )}
          {/* Step 2: Payment Method Selection */}
          {currentStep === 1 && (
            <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-4 space-y-4">
              {/* Payment Method Selection */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-black mb-3">Método de pagamento</h4>
                <Select onValueChange={(value: PaymentMethod) => {
                  setSelectedMethod(value);
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
                      })()
                    }
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
                            maxLength={19}
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
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedInstallments(parseInt(value) as InstallmentOption);
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black h-11">
                              <SelectValue placeholder="Parcelas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border border-gray-200">
                            {(() => {
                              const installmentOptions = [1, 2, 3, 6, 12];
                              return installmentOptions.map(installmentCount => {
                                const calculation = calculateInstallmentTotal(basePrice, installmentCount);
                                const isVista = installmentCount === 1;
                                
                                return (
                                  <SelectItem 
                                    key={installmentCount}
                                    value={installmentCount.toString()} 
                                    className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black"
                                  >
                                    <span>
                                      {installmentCount}x de R$ {formatCurrency(calculation.installmentAmount)}
                                      {isVista && " (à vista)"}
                                    </span>
                                  </SelectItem>
                                );
                              });
                            })()
                          }
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
                                  if (value.length > 5) {
                                    value = value.replace(/(\d{5})(\d{1,3})/, '$1-$2');
                                  }
                                  field.onChange(value);
                                }}
                                maxLength={9}
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
                              <SelectItem value="SP" className="text-black hover:bg-gray-50 focus:bg-gray-50">São Paulo</SelectItem>
                              <SelectItem value="RJ" className="text-black hover:bg-gray-50 focus:bg-gray-50">Rio de Janeiro</SelectItem>
                              <SelectItem value="MG" className="text-black hover:bg-gray-50 focus:bg-gray-50">Minas Gerais</SelectItem>
                              <SelectItem value="RS" className="text-black hover:bg-gray-50 focus:bg-gray-50">Rio Grande do Sul</SelectItem>
                              <SelectItem value="PR" className="text-black hover:bg-gray-50 focus:bg-gray-50">Paraná</SelectItem>
                              <SelectItem value="SC" className="text-black hover:bg-gray-50 focus:bg-gray-50">Santa Catarina</SelectItem>
                              <SelectItem value="BA" className="text-black hover:bg-gray-50 focus:bg-gray-50">Bahia</SelectItem>
                              <SelectItem value="GO" className="text-black hover:bg-gray-50 focus:bg-gray-50">Goiás</SelectItem>
                              <SelectItem value="ES" className="text-black hover:bg-gray-50 focus:bg-gray-50">Espírito Santo</SelectItem>
                              <SelectItem value="DF" className="text-black hover:bg-gray-50 focus:bg-gray-50">Distrito Federal</SelectItem>
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
            </div>
          )}
        </form>
      </Form>

      {/* Bottom Navigation - Show back button when not on first step */}
      {currentStep > 0 && (
        <div className="mt-4">
          <Button 
            type="button"
            variant="outline"
            onClick={handleBackStep}
            className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 flex items-center justify-center gap-2 touch-manipulation"
            disabled={isProcessing}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      )}

      {/* Security and Support Info */}
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
          <a 
            href="mailto:suporte@evidens.com.br" 
            className="text-black font-medium hover:underline touch-manipulation"
            target="_blank"
            rel="noopener noreferrer"
          >
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  );
};

export default PaymentV2Form;