// ABOUTME: Payment V2.0 form component with enhanced UX: processing states, clean design, and page refresh protection
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, ArrowLeft, ArrowRight, Smartphone, CheckCircle2, Loader2 } from 'lucide-react';
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
import { usePaymentPlanSelector } from '@/hooks/usePaymentPlanSelector';
import { EnhancedPlanDisplayV2 } from './EnhancedPlanDisplayV2';
import { supabase } from '@/integrations/supabase/client';
import { PixDisplayV2 } from './PixDisplayV2';
import { PaymentResultV2, type PaymentResultV2Data } from './PaymentResultV2';
import { PaymentProcessingV2 } from './PaymentProcessingV2';
import { PaymentSuccessV2 } from './PaymentSuccessV2';
import { usePaymentStateProtection } from '@/hooks/usePaymentStateProtection';
import { sendAnalyticsWebhook, buildPaymentSuccessWebhookPayload } from '@/services/analyticsWebhook';
// Analytics: Added back client-side for payment_success events

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

type PaymentViewState = 'form' | 'pix-display' | 'processing' | 'success' | 'result';

interface PaymentData {
  pixQrCode?: string;
  pixQrCodeUrl?: string;
  paymentId?: string;
  paymentMethod?: PaymentMethod;
  // Account linking data for PIX payments
  customerData?: {
    name: string;
    email: string;
    document: string;
    phone: string;
  };
  planData?: {
    id: string;
    name: string;
    description?: string;
    durationDays: number;
    finalAmount: number;
  };
}

interface PaymentV2FormProps {
  initialCustomParameter?: string | null;
  initialPaymentMethod?: PaymentMethod | null;
  hideTestData?: boolean; // V1 specific: hide test data toggle
  useProductionEndpoint?: boolean; // V1 specific: use production endpoint
}

const PaymentV2Form = ({
  initialCustomParameter,
  initialPaymentMethod,
  hideTestData = false,
  useProductionEndpoint = false
}: PaymentV2FormProps = {}) => {
  // State protection for page refreshes
  const {
    paymentState,
    savePaymentState,
    clearPaymentState,
    isRestored,
    shouldShowRefreshWarning
  } = usePaymentStateProtection();

  const [currentStep, setCurrentStep] = useState(paymentState.currentStep || 0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(initialPaymentMethod || 'credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState<PaymentViewState>(paymentState.view || 'form');
  const [paymentData, setPaymentData] = useState<PaymentData>(paymentState.paymentData || {});
  const [paymentResult, setPaymentResult] = useState<PaymentResultV2Data | null>(paymentState.paymentResult || null);

  
  // V2.0 Dynamic Plan Selection Integration with custom parameter support
  // Plan is auto-selected based on URL parameter - no manual selection needed
  const planSelector = usePaymentPlanSelector({
    initialCustomParameter,
    initialPaymentMethod: initialPaymentMethod || selectedMethod
  });

  // Save state on critical changes
  useEffect(() => {
    if (!isRestored) return; // Don't save until we've restored initial state

    if (currentView === 'processing' || currentView === 'success' || currentView === 'pix-display') {
      const stateToSave = {
        view: currentView,
        currentStep,
        paymentData,
        paymentResult,
        processingStartTime: currentView === 'processing' ? Date.now() : undefined
      };
      savePaymentState(stateToSave);
    }
  }, [currentView, paymentData, paymentResult, currentStep, isRestored, savePaymentState]);

  // Clear state on successful completion
  useEffect(() => {
    if (currentView === 'form' && paymentResult?.type === 'success') {
      // Clear after a delay to prevent clearing during transitions
      const timer = setTimeout(() => clearPaymentState(), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView, paymentResult, clearPaymentState]);

  // 🎯 URL Parameter Auto-Fill - Safe implementation with conflict prevention
  useEffect(() => {
    // SAFETY: Only run after payment state is fully restored
    if (!isRestored) return;

    // SAFETY: Don't auto-fill if user already has form data (from restoration or manual input)
    const hasExistingData = form.getValues('customerEmail') ||
                           form.getValues('customerName') ||
                           form.getValues('customerPhone');

    if (hasExistingData) {
      console.log('⚠️ Skipping URL auto-fill - form already has data from restoration or user input');
      return;
    }

    // SAFETY: Only auto-fill on first step (customer data collection)
    if (currentStep !== 0) return;

    // SAFETY: Only auto-fill when in form view (not processing/success states)
    if (currentView !== 'form') return;

    // Extract URL parameters for auto-filling
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const nameParam = urlParams.get('name');
    const phoneParam = urlParams.get('phone');
    const documentParam = urlParams.get('document');

    // Auto-fill form fields if URL parameters are present
    let autoFillData: any = {};

    if (emailParam) {
      const decodedEmail = decodeURIComponent(emailParam);
      form.setValue('customerEmail', decodedEmail, { shouldValidate: false });
      form.setValue('customerEmailConfirm', decodedEmail, { shouldValidate: false });
      autoFillData.email = decodedEmail;
    }

    if (nameParam) {
      const decodedName = decodeURIComponent(nameParam);
      form.setValue('customerName', decodedName, { shouldValidate: false });
      autoFillData.name = decodedName;
    }

    if (phoneParam) {
      // Clean and format phone number
      const decodedPhone = decodeURIComponent(phoneParam);
      form.setValue('customerPhone', decodedPhone, { shouldValidate: false });
      autoFillData.phone = decodedPhone;
    }

    if (documentParam) {
      const decodedDocument = decodeURIComponent(documentParam);
      form.setValue('customerDocument', decodedDocument, { shouldValidate: false });
      autoFillData.document = decodedDocument;
    }

    // Log successful auto-fill
    if (Object.keys(autoFillData).length > 0) {
      console.log('✅ Form auto-filled from URL parameters:', autoFillData);
      toast.success('Dados preenchidos automaticamente!', {
        description: 'Informações capturadas do link de pagamento'
      });
    }
  }, [isRestored, currentStep, currentView, form]); // Safe dependencies

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

  // Sync payment method selection with plan selector
  React.useEffect(() => {
    planSelector.selectPaymentMethod(selectedMethod);
  }, [selectedMethod, planSelector.selectPaymentMethod]);

  // Get dynamic pricing from selected plan (moved before webhook callbacks)
  const selectedInstallments = planSelector.state.selectedInstallments;
  const basePrice = planSelector.selectedPlan?.final_amount || 0;
  const finalAmount = selectedMethod === 'pix'
    ? planSelector.getPixFinalAmount()
    : planSelector.getCreditCardFinalAmount();

  // Handle successful payment with account linking (moved before webhook callbacks)
  const handlePaymentSuccess = async (
    paymentData: {
      transactionId: string;
      amount: number;
      paymentMethod: string;
      paidAt: string;
    },
    customerData: PaymentV2FormData
  ) => {

    try {
      // 🎯 ACCOUNT LINKING DISABLED - Webhook Pagarme handles ALL user creation
      //
      // Why disabled:
      // 1. Webhook Pagarme creates users via supabase.auth.admin.inviteUserByEmail()
      // 2. Sets premium subscription, metadata, and sends confirmation emails
      // 3. Frontend account linking caused 429 rate limits and duplicate emails
      // 4. Webhook is standalone and doesn't depend on any frontend data
      //
      // Result: Clean payment flow with no conflicts or duplicate user creation

      console.log('✅ Payment success detected - Webhook Pagarme will handle user creation');
      console.log('📧 User will receive confirmation email from Webhook Pagarme');
      console.log('🎯 Account linking disabled to prevent conflicts');

      // Return success result for frontend confirmation
      return {
        success: true,
        action: 'immediate_link' as const,
        message: 'Pagamento realizado com sucesso! Verifique seu email para ativar sua conta.',
        data: {
          email: customerData.customerEmail,
          transactionId: paymentData.transactionId,
          planName: planSelector.selectedPlan?.name || '',
        }
      };

    } catch (error) {
      console.error('💥 Error in payment success handling:', error);
      toast.error('Erro ao processar pagamento. Entre em contato conosco.');
      throw error;
    }
  };

  // 🚫 DISABLED - Email dispatch no longer needed since Webhook Pagarme sends emails
  /*
  const dispatchAccountLinkingEmail = async (
    linkingResult: any,
    linkingData: any
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('⚠️ No session for email dispatch - this is expected for new users, webhook will handle email via Supabase native system');
        return;
      }
      // Email dispatch logic removed - Webhook Pagarme handles all emails
    } catch (error) {
      console.error('💥 Email dispatch error:', error);
    }
  };
  */

  // Simple payment status monitoring function
  const startPaymentStatusMonitoring = async (paymentId: string, formValues: PaymentV2FormData) => {
    const maxAttempts = 60; // 5 minutes (5 second intervals)
    let attempts = 0;

    // Analytics now handled server-side via webhook

    const checkStatus = async () => {
      try {
        attempts++;

        // Check payment_webhooks table for confirmation
        // If paymentId is an order ID (or_*), look for the corresponding charge ID
        let { data, error } = await supabase
          .from('payment_webhooks')
          .select('*')
          .eq('payment_id', paymentId)
          .eq('status', 'paid')
          .maybeSingle();

        // If not found and this is an order ID, look for the charge ID from the same transaction
        if (!data && !error && paymentId.startsWith('or_')) {
          // Get customer_id from the order record
          const { data: orderData } = await supabase
            .from('payment_webhooks')
            .select('customer_id, created_at')
            .eq('payment_id', paymentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (orderData?.customer_id) {
            // Look for charge with same customer and timestamp within 1 minute
            const timeWindow = new Date(orderData.created_at);
            timeWindow.setMinutes(timeWindow.getMinutes() + 1);

            const result = await supabase
              .from('payment_webhooks')
              .select('*')
              .eq('customer_id', orderData.customer_id)
              .eq('status', 'paid')
              .like('payment_id', 'ch_%')
              .gte('created_at', orderData.created_at)
              .lte('created_at', timeWindow.toISOString())
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            data = result.data;
            error = result.error;
          }
        }

        if (!error && data) {
          // Payment confirmed!
          setIsProcessing(false);

          // Send payment_success analytics webhook
          console.group('💳 PAYMENT SUCCESS - ANALYTICS WEBHOOK TRIGGER');
          console.log('🎯 Payment confirmed, preparing analytics webhook...');
          console.log('📦 Payment data received:', data);
          console.log('📋 Form values:', formValues);
          console.log('🎯 Plan selector data:', planSelector.selectedPlan);

          try {
            // Capture all URL parameters and buyer information
            const urlParams = new URLSearchParams(window.location.search);
            console.log('🌐 Current URL:', window.location.href);
            console.log('🔍 URL parameters:', Object.fromEntries(urlParams.entries()));
            console.log('👀 Document referrer:', document.referrer);

            const analyticsPayload = buildPaymentSuccessWebhookPayload({
              // Customer data
              customerName: formValues.customerName,
              customerEmail: formValues.customerEmail,
              customerDocument: formValues.customerDocument,
              customerPhone: formValues.customerPhone,

              // Transaction data
              transactionId: paymentId,
              transactionCode: data.payment_id || paymentId, // Use charge ID if available
              paymentMethod: (data.payment_method || selectedMethod) as 'credit_card' | 'pix',
              baseAmount: planSelector.selectedPlan?.original_amount || finalAmount,
              finalAmount: data.amount || finalAmount,

              // Plan data
              planId: planSelector.selectedPlan?.id || '',
              planName: planSelector.selectedPlan?.name || 'Reviews Premium',
              planType: 'premium',
              durationDays: planSelector.selectedPlan?.duration_days || 365,

              // Marketing data - capture ALL URL parameters as requested
              customParameter: urlParams.get('plano') || undefined,
              utmSource: urlParams.get('utm_source') || undefined,
              utmMedium: urlParams.get('utm_medium') || undefined,
              utmCampaign: urlParams.get('utm_campaign') || undefined,
              utmTerm: urlParams.get('utm_term') || undefined,
              utmContent: urlParams.get('utm_content') || undefined,
              referrer: document.referrer || undefined,
              landingPage: window.location.href,

              // Technical data
              userAgent: navigator.userAgent,
            });

            console.log('📝 Analytics payload prepared, sending to make.com...');
            await sendAnalyticsWebhook(analyticsPayload);
            console.log('✅ Payment form: Analytics webhook completed successfully');
          } catch (analyticsError) {
            console.error('💥 Payment form: Analytics webhook failed:', analyticsError);
            console.error('📋 Error details:', {
              name: analyticsError.name,
              message: analyticsError.message,
              stack: analyticsError.stack
            });
            // Don't fail the payment process if analytics fails
          } finally {
            console.groupEnd();
          }

          await handlePaymentSuccess({
            transactionId: paymentId,
            amount: data.amount || finalAmount,
            paymentMethod: data.payment_method || selectedMethod,
            paidAt: data.processed_at,
          }, formValues);

          // Show enhanced success screen
          setPaymentData({
            ...paymentData,
            orderId: paymentId,
            amount: data.amount || finalAmount,
            paymentMethod: data.payment_method || selectedMethod,
            planName: planSelector.selectedPlan?.name || 'Reviews Premium'
          });
          setCurrentView('success');
          toast.success('Pagamento confirmado!');
          return;
        }

        // Check for failed payment with same order-to-charge mapping logic
        let { data: failedData } = await supabase
          .from('payment_webhooks')
          .select('*')
          .eq('payment_id', paymentId)
          .eq('status', 'failed')
          .maybeSingle();

        // If not found and this is an order ID, look for failed charge in same transaction
        if (!failedData && paymentId.startsWith('or_')) {
          const { data: orderData } = await supabase
            .from('payment_webhooks')
            .select('customer_id, created_at')
            .eq('payment_id', paymentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (orderData?.customer_id) {
            const timeWindow = new Date(orderData.created_at);
            timeWindow.setMinutes(timeWindow.getMinutes() + 1);

            const result = await supabase
              .from('payment_webhooks')
              .select('*')
              .eq('customer_id', orderData.customer_id)
              .eq('status', 'failed')
              .like('payment_id', 'ch_%')
              .gte('created_at', orderData.created_at)
              .lte('created_at', timeWindow.toISOString())
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            failedData = result.data;
          }
        }

        if (failedData) {
          setIsProcessing(false);
          throw new Error('Pagamento não foi aprovado');
        }

        // Continue checking if not confirmed and not failed
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          // Timeout - show appropriate message
          setIsProcessing(false);
          setCurrentView('result');
          setPaymentResult({
            type: 'pending',
            title: 'Tempo limite atingido',
            message: 'Não conseguimos confirmar seu pagamento automaticamente. Verifique seu email para instruções.',
            details: 'Se o pagamento foi aprovado, você receberá um email de confirmação em breve.',
            actions: {
              primary: {
                label: 'Entrar em contato',
                action: () => window.open('mailto:suporte@igoreckert.com.br', '_blank')
              },
              back: {
                label: 'Voltar',
                action: () => setCurrentView('form')
              }
            }
          });
          toast.warning('Tempo limite atingido. Verifique seu email ou entre em contato.');
        }

      } catch (error) {
        console.error('❌ Error checking payment status:', error);
        setIsProcessing(false);
        toast.error('Erro ao verificar status do pagamento. Tente novamente.');
      }
    };

    // Start checking
    setTimeout(checkStatus, 2000); // Initial check after 2 seconds
  };

  // Helper function to populate test data (USER DATA + CREDIT CARD)
  const fillTestData = () => {
    // Customer Information
    form.setValue('customerName', 'João Silva Teste');
    form.setValue('customerEmail', 'test@evidens.com');
    form.setValue('customerEmailConfirm', 'test@evidens.com');
    form.setValue('customerDocument', '04094922059'); // Valid test CPF
    form.setValue('customerPhone', '(11) 99999-9999');
    
    // Billing Address (required for credit card payments)
    form.setValue('billingStreet', 'Rua Teste, 123');
    form.setValue('billingZipCode', '01310100'); // Valid São Paulo ZIP
    form.setValue('billingCity', 'São Paulo');
    form.setValue('billingState', 'SP');
    
    // Credit Card Information (using official Pagar.me test cards)
    form.setValue('cardNumber', TEST_CARDS.APPROVED.number);
    form.setValue('cardHolderName', TEST_CARDS.APPROVED.name);
    form.setValue('cardExpirationDate', TEST_CARDS.APPROVED.expiry);
    form.setValue('cardCvv', TEST_CARDS.APPROVED.cvv);
    
    toast.success('Dados de teste preenchidos! Pronto para testar pagamentos.');
  };

  // Separate helper for test credit card data (not automatically called)
  // Available test card data for manual entry when testing credit card payments:
  // Card Number: 4000000000000010 (Guaranteed Approval)
  // CVV: 123
  // Expiry: 12/30  
  // Name: Teste Aprovado
  const fillTestCreditCardData = () => {
    form.setValue('cardNumber', TEST_CARDS.APPROVED.number);
    form.setValue('cardHolderName', TEST_CARDS.APPROVED.name);
    form.setValue('cardExpirationDate', TEST_CARDS.APPROVED.expiry);
    form.setValue('cardCvv', TEST_CARDS.APPROVED.cvv);
    toast.success('Dados de teste do cartão preenchidos!');
  };

  const handleStep1Continue = async () => {
    const step1Fields = ['customerName', 'customerEmail', 'customerEmailConfirm', 'customerDocument', 'customerPhone'];
    const isStep1Valid = await form.trigger(step1Fields as any);
    
    if (isStep1Valid) {
      toast.success('Dados salvos! Prosseguindo...');
      setCurrentStep(1); // Go to step 1 (Payment Details) instead of step 2
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

    // Step 1: Process payment
    setIsProcessing(true);
    
    try {

      if (selectedMethod === 'pix') {
        // PIX Payment Logic with V2 Plan Integration
        
        const pixRequest = planSelector.buildPixRequest({
          name: values.customerName,
          email: values.customerEmail,
          document: values.customerDocument,
          phone: values.customerPhone,
        });
        
        if (!pixRequest) {
          throw new Error('Erro ao processar dados do PIX. Verifique o plano selecionado.');
        }
        
        
        const response = await createPixPaymentV2(
          pixRequest,
          supabase.supabaseUrl
        );
        
        
        // Handle PIX response - show QR code and start monitoring
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
              paymentMethod: 'pix',
              customerData: {
                name: values.customerName,
                email: values.customerEmail,
                document: values.customerDocument,
                phone: values.customerPhone,
              },
              planData: {
                id: planSelector.selectedPlan?.id || '',
                name: planSelector.selectedPlan?.name || '',
                description: planSelector.selectedPlan?.description,
                durationDays: planSelector.selectedPlan?.duration_days || 0,
                finalAmount: planSelector.selectedPlan?.final_amount || 0,
              }
            });
            setCurrentView('pix-display');

            // Start monitoring payment status
            startPaymentStatusMonitoring(response.id, values);

            toast.success('PIX gerado com sucesso! Escaneie o QR code para pagar.');

            // ✅ ANALYTICS: Client context already captured and will be sent via webhook confirmation
          } else {
            throw new Error('Erro ao gerar QR code do PIX');
          }
        } else {
          throw new Error('Resposta do PIX inválida');
        }
        
      } else if (selectedMethod === 'credit_card') {
        // Credit Card Payment Logic with V2 Plan Integration
        
        const subscriptionRequest = planSelector.buildCreditCardRequest({
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
        });
        
        if (!subscriptionRequest) {
          throw new Error('Erro ao processar dados do cartão. Verifique o plano selecionado.');
        }
        
        
        const response = await createSubscriptionV2(
          subscriptionRequest,
          supabase.supabaseUrl
        );
        

        const paymentId = response.subscription_id || response.id;

        // Check if payment was immediately successful (test cards)
        if (response.status === 'active' || response.status === 'paid') {

          // Show enhanced success for test payments
          toast.success('Pagamento aprovado com sucesso!');
          setPaymentData({
            orderId: paymentId,
            amount: finalAmount,
            paymentMethod: selectedMethod,
            customerName: values.customerName,
            customerEmail: values.customerEmail,
            planName: planSelector.selectedPlan?.name || 'Reviews Premium'
          });
          setCurrentView('success');
          setIsProcessing(false);
          return;
        }

        // For production payments, show processing state and monitor status via webhooks
        toast.success('Pagamento enviado! Aguardando confirmação...');
        setPaymentData({
          paymentId,
          customerName: values.customerName,
          customerEmail: values.customerEmail
        });
        setCurrentView('processing');
        startPaymentStatusMonitoring(paymentId, values);

          // ✅ ANALYTICS: Client context already captured and will be sent via webhook confirmation
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
        amount: finalAmount,
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
        amount={finalAmount}
        onBack={() => setCurrentView('form')}
      />
    );
  }

  // Show Enhanced Processing State
  if (currentView === 'processing') {
    return (
      <PaymentProcessingV2
        paymentMethod={selectedMethod}
        customerEmail={paymentData.customerEmail || ''}
        onTimeout={() => {
          setCurrentView('result');
          setPaymentResult({
            type: 'pending',
            title: 'Tempo limite atingido',
            message: 'Não conseguimos confirmar seu pagamento automaticamente.',
            details: 'Se o pagamento foi aprovado, você receberá um email de confirmação.',
            actions: {
              back: {
                label: 'Voltar',
                action: () => setCurrentView('form')
              }
            }
          });
        }}
      />
    );
  }

  // Show Enhanced Success State
  if (currentView === 'success') {
    return (
      <PaymentSuccessV2
        customerName={paymentData.customerName || ''}
        customerEmail={paymentData.customerEmail || ''}
        paymentMethod={paymentData.paymentMethod as 'pix' | 'credit_card'}
        amount={paymentData.amount || finalAmount}
        orderId={paymentData.orderId}
        planName={paymentData.planName || 'Reviews Premium'}
        onContinue={() => window.location.href = '/'}
      />
    );
  }

  // Show Payment Result (Success/Failure)
  if (currentView === 'result' && paymentResult) {
    return <PaymentResultV2 result={paymentResult} />;
  }

  // Show loading state until state is restored
  if (!isRestored) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
      </div>
    );
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
        {!hideTestData && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fillTestData}
            className="text-xs bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
          >
            Usar Test Data
          </Button>
        )}
      </div>


      {/* Enhanced Plan Display - Show selected plan at top like /pagamento */}
      {planSelector.selectedPlan && (
        <div className="mb-6">
          <EnhancedPlanDisplayV2 
            plan={planSelector.selectedPlan}
            formatCurrency={planSelector.formatCurrency}
            className="opacity-95"
          />
        </div>
      )}

      {/* Progress Indicator */}
      <ProgressSteps 
        currentStepIndex={currentStep} 
        totalSteps={2}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Step 0: Customer Data Collection */}
          {currentStep === 0 && (
            <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-right-4 space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        id="nome"
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
                        id="email"
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
                        id="telefone"
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
          {/* Step 1: Payment Method Selection */}
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
                          planSelector.selectInstallments(parseInt(value));
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black h-11">
                              <SelectValue placeholder="Parcelas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border border-gray-200">
                            {(() => {
                              if (!planSelector.pricing?.installmentOptions) return null;
                              
                              return planSelector.pricing.installmentOptions.map(option => {
                                const isVista = option.installments === 1;
                                
                                return (
                                  <SelectItem 
                                    key={option.installments}
                                    value={option.installments.toString()} 
                                    className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black py-1"
                                  >
                                    <span>
                                      {option.installments}x de {planSelector.formatCurrency(option.installmentAmount)}
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
                                placeholder="CEP: 00000-000"
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
                            <SelectContent className="bg-white border border-gray-200 max-h-60 overflow-y-auto">
                              <SelectItem value="AC" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Acre</SelectItem>
                              <SelectItem value="AL" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Alagoas</SelectItem>
                              <SelectItem value="AP" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Amapá</SelectItem>
                              <SelectItem value="AM" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Amazonas</SelectItem>
                              <SelectItem value="BA" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Bahia</SelectItem>
                              <SelectItem value="CE" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Ceará</SelectItem>
                              <SelectItem value="DF" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Distrito Federal</SelectItem>
                              <SelectItem value="ES" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Espírito Santo</SelectItem>
                              <SelectItem value="GO" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Goiás</SelectItem>
                              <SelectItem value="MA" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Maranhão</SelectItem>
                              <SelectItem value="MT" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Mato Grosso</SelectItem>
                              <SelectItem value="MS" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Mato Grosso do Sul</SelectItem>
                              <SelectItem value="MG" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Minas Gerais</SelectItem>
                              <SelectItem value="PA" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Pará</SelectItem>
                              <SelectItem value="PB" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Paraíba</SelectItem>
                              <SelectItem value="PR" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Paraná</SelectItem>
                              <SelectItem value="PE" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Pernambuco</SelectItem>
                              <SelectItem value="PI" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Piauí</SelectItem>
                              <SelectItem value="RJ" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Rio de Janeiro</SelectItem>
                              <SelectItem value="RN" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Rio Grande do Norte</SelectItem>
                              <SelectItem value="RS" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Rio Grande do Sul</SelectItem>
                              <SelectItem value="RO" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Rondônia</SelectItem>
                              <SelectItem value="RR" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Roraima</SelectItem>
                              <SelectItem value="SC" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Santa Catarina</SelectItem>
                              <SelectItem value="SP" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">São Paulo</SelectItem>
                              <SelectItem value="SE" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Sergipe</SelectItem>
                              <SelectItem value="TO" className="text-black hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:text-black">Tocantins</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 1 Submit Button */}
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
            href="mailto:suporte@igoreckert.com.br" 
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