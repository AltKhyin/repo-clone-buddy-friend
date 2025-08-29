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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// =================================================================
// Types & Interfaces
// =================================================================

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
});

// Combined schema for full form
const paymentFormSchema = step1Schema.merge(step2Schema);

type Step1FormInput = z.infer<typeof step1Schema>;
type Step2FormInput = z.infer<typeof step2Schema>;
type PaymentFormInput = z.infer<typeof paymentFormSchema>;

interface SimpleEmbeddedPaymentFormProps {
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
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${currentStep === 1 ? 'text-black' : 'text-gray-600'}`}>
          Dados
        </span>
        <span className={`text-sm font-medium ${currentStep === 2 ? 'text-black' : 'text-gray-600'}`}>
          Pagamento
        </span>
      </div>
      <div className="flex items-center">
        {/* Step 1 */}
        <div className={`w-full h-2 rounded-l-full ${currentStep >= 1 ? 'bg-gray-600' : 'bg-gray-200'}`} />
        {/* Step 2 */}
        <div className={`w-full h-2 rounded-r-full ${currentStep === 2 ? 'bg-gray-600' : 'bg-gray-200'}`} />
      </div>
    </div>
  );
};

// =================================================================
// Phone Number Formatting Utility
// =================================================================

const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format as (XX) XXXXX-XXXX
  if (digits.length <= 2) {
    return `(${digits}`;
  } else if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  
  // Limit to 11 digits max
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

// =================================================================
// Component
// =================================================================

const SimpleEmbeddedPaymentForm: React.FC<SimpleEmbeddedPaymentFormProps> = ({
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
  };

  const onSubmit = async (values: PaymentFormInput) => {
    if (currentStep === 1) {
      handleStep1Continue();
      return;
    }

    // Step 2: Process payment
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      if (selectedMethod === 'pix') {
        // Show PIX code for demonstration
        setShowPixCode(true);
        toast.success('Código PIX gerado com sucesso!');
      } else if (selectedMethod === 'credit_card') {
        // Simulate credit card processing
        toast.success('Pagamento com cartão processado com sucesso!');
        onSuccess?.({ id: 'demo_card_success', method: 'credit_card', customerData: values });
      } else if (selectedMethod === 'boleto') {
        // Simulate boleto generation
        toast.success('Boleto gerado com sucesso!');
        onSuccess?.({ id: 'demo_boleto_success', method: 'boleto', customerData: values });
      }
      setIsProcessing(false);
    }, 2000);
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
          <div className="bg-gray-100 h-48 w-48 mx-auto mb-4 flex items-center justify-center rounded-lg border">
            <div className="text-center">
              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">QR Code de demonstração</p>
            </div>
          </div>

          {/* Copy PIX Code Button */}
          <Button 
            onClick={() => {
              const demoPixCode = '00020126580014BR.GOV.BCB.PIX013636297087-532a-4f3d-b2a5-19d03d2d2458520400005303986540519.905802BR5925PAGAR ME PAGAMENTOS S A6009SAO PAULO61080540901062070503***630466D4';
              navigator.clipboard.writeText(demoPixCode);
              toast.success('Código PIX copiado! (demonstração)');
            }}
            variant="outline" 
            className="w-full h-11 sm:h-12 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 mb-3 touch-manipulation"
          >
            Copiar código PIX (demo)
          </Button>

          <div className="text-xs sm:text-sm text-gray-500 mb-4">
            Válido por 1 hora • R$ {(planPrice / 100).toFixed(2).replace('.', ',')}
          </div>
          
          <Button 
            onClick={() => {
              setShowPixCode(false);
              onSuccess?.({ id: 'demo_pix_success', method: 'pix' });
            }}
            className="w-full h-12 sm:h-14 !bg-black hover:!bg-gray-800 !text-white text-base sm:text-lg font-medium touch-manipulation"
          >
            Simular pagamento realizado
          </Button>

          <Button 
            onClick={() => setShowPixCode(false)}
            variant="outline"
            className="w-full h-11 sm:h-12 mt-3 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 touch-manipulation"
          >
            Voltar
          </Button>
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

      {/* Payment Method Selection - Dropdown */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-black mb-3">Método de pagamento</h4>
        <Select onValueChange={(value: PaymentMethod) => setSelectedMethod(value)} defaultValue={selectedMethod}>
          <SelectTrigger className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black h-16 sm:h-18 p-3 touch-manipulation">
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
          <SelectContent className="bg-white">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSpecialMethod = method.id === 'pix' || method.id === 'credit_card';
              return (
                <SelectItem key={method.id} value={method.id} className="p-3 h-16 sm:h-18 touch-manipulation">
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Customer Information */}
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormControl>
                  <Input
                    placeholder="Nome completo"
                    {...field}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11"
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
              <FormItem className="space-y-1">
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Email"
                    {...field}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11"
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
              <FormItem className="space-y-1">
                <FormControl>
                  <Input
                    placeholder="CPF ou CNPJ"
                    {...field}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                        placeholder="Número do cartão"
                        {...field}
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
                      <SelectContent className="bg-white">
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
          
          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <Button 
              type="submit" 
              className="w-full h-12 sm:h-14 !bg-black hover:!bg-gray-800 !text-white text-base sm:text-lg font-medium touch-manipulation" 
              disabled={isProcessing}
            >
              {isProcessing 
                ? 'Processando...' 
                : 'Pagar agora'}
            </Button>

            <Button 
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full h-11 sm:h-12 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 touch-manipulation"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>

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

export default SimpleEmbeddedPaymentForm;