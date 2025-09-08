// ABOUTME: Two-step embedded payment form with sophisticated UX and lead generation capabilities
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { CreditCard, Smartphone, QrCode, ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useCreatePlanBasedPixPayment, useCreatePlanBasedCreditCardPayment, usePaymentStatus, planBasedPixPaymentSchema, planBasedCreditCardPaymentSchema, type PlanBasedPixPaymentInput, type PlanBasedCreditCardPaymentInput } from '../../hooks/mutations/usePaymentMutations';
import { EnhancedPlanDisplay } from './EnhancedPlanDisplay';
import { PaymentResultDisplay, type PaymentResultData } from './PaymentResultDisplay';
import { PaymentResultConfigs } from './paymentResultConfigs';
import { useContactInfo } from '@/hooks/useContactInfo';
import { triggerPaymentSuccessWebhook } from '@/services/makeWebhookService';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { 
  getUserAuthenticationStatus, 
  authenticateUser, 
  createUserAccount,
  type AuthStatus 
} from '@/services/authenticationService';

// =================================================================
// Types & Interfaces
// =================================================================

type PaymentMethod = 'pix' | 'credit_card';

// Dynamic Step System Types
type PaymentStep = 'plan_selection' | 'authentication' | 'payment_details';
type AuthStep = 'login' | 'signup' | null;

interface StepFlowState {
  currentStepIndex: number;
  steps: PaymentStep[];
  authStep: AuthStep;
  authStatus: AuthStatus;
  userEmail?: string;
}

interface AuthenticationData {
  email: string;
  password: string;
  confirmPassword?: string;
}

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
  plan: Tables<'PaymentPlans'>; // Required - plan object with promotional config
  customerId?: string; // Optional customer ID
  onSuccess?: (orderId: string, customerData?: {
    customerName: string;
    customerEmail: string;
    customerDocument?: string;
    customerPhone?: string;
    planId: string;
    amount: number;
    paymentMethod: string;
  }) => void;
  onCancel?: () => void;
}

// =================================================================
// Progress Steps Component
// =================================================================

interface ProgressStepsProps {
  currentStepIndex: number;
  totalSteps: number;
  steps: PaymentStep[];
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStepIndex, totalSteps, steps }) => {
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
      {/* Optional step labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {steps.map((step, index) => (
          <span 
            key={step}
            className={`${index <= currentStepIndex ? 'text-gray-700 font-medium' : 'text-gray-400'}`}
          >
            {step === 'plan_selection' ? 'Dados' : 
             step === 'authentication' ? 'Login' : 'Pagamento'}
          </span>
        ))}
      </div>
    </div>
  );
};


// =================================================================
// Component
// =================================================================

const TwoStepPaymentForm: React.FC<TwoStepPaymentFormProps> = ({
  plan,
  customerId,
  onSuccess,
  onCancel
}) => {
  // Dynamic Step Flow State
  const [stepFlow, setStepFlow] = useState<StepFlowState>({
    currentStepIndex: 0,
    steps: ['plan_selection', 'payment_details'], // Default for logged-in users
    authStep: null,
    authStatus: 'logged_in', // Will be updated after auth check
    userEmail: undefined,
  });
  
  // Authentication State
  const [authData, setAuthData] = useState<AuthenticationData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Payment State (existing)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('credit_card'); // Default to credit card
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPixCode, setShowPixCode] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResultData | null>(null);
  const { displayText: contactEmail, href: contactLink } = useContactInfo();

  // Initialize result configs with support info
  const resultConfigs = new PaymentResultConfigs({
    email: contactEmail,
    link: contactLink
  });

  // Helper function to validate PIX payment response has all required QR code data
  const validatePixPaymentResponse = (paymentResponse: any): { valid: boolean; reason?: string } => {
    if (!paymentResponse) {
      return { valid: false, reason: 'Resposta do pagamento está vazia' };
    }

    // Check for payment ID (different field names for different payment types)
    const paymentId = paymentResponse.id || paymentResponse.subscription_id || paymentResponse.order_id;
    if (!paymentId) {
      return { valid: false, reason: 'ID do pagamento não foi gerado' };
    }

    // For subscription payments, we don't expect charges array
    if (paymentResponse.subscription_id) {
      // This is a subscription response - different validation
      if (paymentResponse.status === 'active') {
        return { valid: true }; // Subscription is active, no QR code needed
      }
    }

    // CRITICAL FIX: PIX payments can have two different response structures
    // 1. Order format with charges array (old format)
    // 2. Direct PIX response with qr_code in root (new format)
    
    console.log('PIX validation: Checking response structure...');
    console.log('Has charges:', !!paymentResponse.charges);
    console.log('Has qr_code:', !!paymentResponse.qr_code);
    console.log('Has qr_code_url:', !!paymentResponse.qr_code_url);
    console.log('Payment method:', paymentResponse.payment_method);
    
    // NEW FORMAT: PIX data directly in response root (current format)
    if (paymentResponse.payment_method === 'pix') {
      console.log('PIX validation: Using direct PIX response format');
      
      if (!paymentResponse.qr_code_url && !paymentResponse.qr_code) {
        console.error('PIX validation: No QR code data in direct PIX response. Available fields:', 
          Object.keys(paymentResponse));
        return { valid: false, reason: 'QR code do PIX não foi gerado' };
      }
      
      console.log('PIX validation: Direct PIX QR code validation passed');
      return { valid: true };
    }
    
    // OLD FORMAT: PIX data in charges array (fallback)
    const charges = paymentResponse.charges;
    if (!charges || charges.length === 0) {
      console.error('PIX validation: No charges found and not direct PIX format');
      return { valid: false, reason: 'Nenhuma cobrança foi criada' };
    }
    
    console.log(`PIX validation: Found ${charges.length} charges`);
    
    const pixCharge = charges.find((charge: any) => charge.payment_method === 'pix');
    if (!pixCharge) {
      console.error('PIX validation: No PIX charge found. Available payment methods:', 
        charges.map((c: any) => c.payment_method));
      return { valid: false, reason: 'Cobrança PIX não foi encontrada' };
    }
    
    console.log('PIX validation: Found PIX charge:', pixCharge.id);
    
    const pixTransaction = pixCharge.last_transaction;
    if (!pixTransaction) {
      console.error('PIX validation: No last_transaction found in PIX charge');
      return { valid: false, reason: 'Transação PIX não foi criada' };
    }
    
    console.log('PIX validation: Found transaction:', pixTransaction.id);
    
    // PIX transaction data is directly in last_transaction, not in a nested pix object
    // Check for QR code data directly in the transaction
    if (!pixTransaction.qr_code_url && !pixTransaction.qr_code) {
      console.error('PIX validation: No QR code data found in transaction. Available fields:', 
        Object.keys(pixTransaction));
      return { valid: false, reason: 'QR code do PIX não foi gerado' };
    }
    
    console.log('PIX validation: Charge-based QR code validation passed');

    return { valid: true };
  };

  // Helper function to trigger webhook for payment success
  const triggerWebhookIfUserAuthenticated = async (paymentData: {
    id: string;
    amount: number;
    method: string;
    status: string;
    metadata?: Record<string, any>;
    pagarme_transaction_id?: string;
  }) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        console.log('Triggering payment success webhook for user:', user.id);
        console.log('Payment data:', paymentData);
        
        // Trigger webhook asynchronously - don't block success flow
        triggerPaymentSuccessWebhook(user.id, paymentData).catch((error) => {
          console.error('Webhook trigger failed (non-blocking):', error);
        });
      } else {
        console.log('No authenticated user found, skipping webhook trigger');
      }
    } catch (error) {
      console.error('Error checking user authentication for webhook:', error);
    }
  };

  // Use plan directly (now required prop)
  const displayPlan = plan;
  
  // Calculate display price (with promotional pricing if active)
  const getDisplayPrice = () => {
    const promoConfig = plan.promotional_config as any;
    if (promoConfig?.isActive && promoConfig?.finalPrice > 0) {
      const expiresAt = promoConfig.expiresAt;
      const isExpired = expiresAt && new Date(expiresAt) < new Date();
      if (!isExpired) {
        return promoConfig.finalPrice;
      }
    }
    return plan.amount;
  };
  
  const displayPrice = getDisplayPrice();
  const [paymentError, setPaymentError] = useState<{
    message: string;
    canRetry: boolean;
  } | null>(null);

  // =================================================================
  // Step Flow Logic Functions
  // =================================================================

  const determineStepFlow = (authStatus: AuthStatus, email?: string): PaymentStep[] => {
    console.log('Determining step flow for auth status:', authStatus);
    
    if (authStatus === 'logged_in') {
      return ['plan_selection', 'payment_details'];
    }
    if (authStatus === 'account_exists' || authStatus === 'no_account') {
      return ['plan_selection', 'authentication', 'payment_details'];
    }
    return ['plan_selection', 'payment_details']; // fallback
  };

  const updateStepFlow = async (email?: string) => {
    try {
      const authStatusResult = await getUserAuthenticationStatus(email);
      const newSteps = determineStepFlow(authStatusResult.status, email);
      
      setStepFlow(prev => ({
        ...prev,
        steps: newSteps,
        authStatus: authStatusResult.status,
        userEmail: authStatusResult.email,
        authStep: authStatusResult.status === 'account_exists' ? 'login' : 
                 authStatusResult.status === 'no_account' ? 'signup' : null,
      }));
      
      console.log('Step flow updated:', { 
        authStatus: authStatusResult.status, 
        steps: newSteps,
        authStep: authStatusResult.status === 'account_exists' ? 'login' : 
                 authStatusResult.status === 'no_account' ? 'signup' : null
      });
    } catch (error) {
      console.error('Error updating step flow:', error);
      // Fallback to default flow
      setStepFlow(prev => ({
        ...prev,
        steps: ['plan_selection', 'payment_details'],
        authStatus: 'logged_in',
      }));
    }
  };

  const advanceStep = () => {
    setStepFlow(prev => ({
      ...prev,
      currentStepIndex: Math.min(prev.currentStepIndex + 1, prev.steps.length - 1)
    }));
  };

  const goBackStep = () => {
    setStepFlow(prev => ({
      ...prev,
      currentStepIndex: Math.max(prev.currentStepIndex - 1, 0)
    }));
  };

  // Plan-based payment mutation hooks
  const pixPaymentMutation = useCreatePlanBasedPixPayment();
  const creditCardPaymentMutation = useCreatePlanBasedCreditCardPayment();

  // Form setup - MUST be declared before useEffect that uses it
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

  // Poll payment status when PIX QR code is displayed
  const { data: paymentStatus } = usePaymentStatus(
    pixData?.id, 
    showPixCode // Only poll when QR code is shown
  );

  // Auto-redirect to success page when PIX payment is confirmed
  useEffect(() => {
    if (paymentStatus?.status === 'paid' && pixData) {
      console.log('PIX payment confirmed, showing success result');
      
      // Trigger webhook for PIX payment success
      const webhookPaymentData = {
        id: pixData.id || pixData.subscription_id || 'unknown',
        amount: displayPrice,
        method: 'pix',
        status: 'paid',
        metadata: {
          planId: plan.id,
          planName: plan.name,
          customerName: form.getValues('customerName'),
          customerEmail: form.getValues('customerEmail'),
          customerDocument: form.getValues('customerDocument'),
          customerPhone: form.getValues('customerPhone'),
          paymentFlow: 'pix_payment'
        },
        pagarme_transaction_id: pixData.id
      };
      
      triggerWebhookIfUserAuthenticated(webhookPaymentData);
      
      // PIX Payment Success - Auto-redirect to success result
      const context = {
        orderId: pixData.id,
        amount: displayPrice,
        paymentMethod: 'pix' as const,
        planName: plan.name
      };
      
      const result = resultConfigs.pixSuccess(context);
      setPaymentResult(result);
    }
  }, [paymentStatus?.status, pixData, displayPrice, plan.name, resultConfigs, form, triggerWebhookIfUserAuthenticated]);

  // Initialize authentication status on component mount
  useEffect(() => {
    updateStepFlow();
  }, []);

  // Update authentication status when email changes (debounced)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'customerEmail') {
        const email = value.customerEmail;
        if (email && email.includes('@') && email !== stepFlow.userEmail) {
          const timeoutId = setTimeout(() => {
            updateStepFlow(email);
          }, 500); // 500ms debounce
          
          return () => clearTimeout(timeoutId);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [stepFlow.userEmail]);

  // =================================================================
  // Step Transition Logic (Updated for Dynamic Steps)
  // =================================================================

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
      
      // Update auth data with email for next step
      setAuthData(prev => ({
        ...prev,
        email: form.getValues('customerEmail')
      }));
      
      // Update step flow based on latest email
      await updateStepFlow(form.getValues('customerEmail'));
      
      console.log('Lead captured:', customerData);
      toast.success('Dados salvos! Prosseguindo...');
      advanceStep();
    }
  };

  const handleBackStep = () => {
    goBackStep();
    setPaymentError(null); // Clear errors when going back
  };

  // Authentication handlers
  const handleAuthenticationSuccess = async (user: any) => {
    console.log('Authentication successful:', user.id);
    toast.success('Login realizado com sucesso!');
    
    // Update step flow to logged in status
    setStepFlow(prev => ({
      ...prev,
      authStatus: 'logged_in',
      authStep: null
    }));
    
    advanceStep(); // Move to payment step
  };

  const handleLogin = async () => {
    if (!authData.email || !authData.password) {
      toast.error('Email e senha são obrigatórios');
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await authenticateUser(authData.email, authData.password);
      
      if (result.success && result.user) {
        handleAuthenticationSuccess(result.user);
      } else {
        toast.error(result.error || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro inesperado ao fazer login');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignup = async () => {
    if (!authData.email || !authData.password || !authData.confirmPassword) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    if (authData.password !== authData.confirmPassword) {
      toast.error('Senhas não coincidem');
      return;
    }

    if (authData.password.length < 8) {
      toast.error('Senha deve ter pelo menos 8 caracteres');
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await createUserAccount(authData.email, authData.password, {
        customerName: form.getValues('customerName'),
        customerPhone: form.getValues('customerPhone'),
      });
      
      if (result.success && result.user) {
        handleAuthenticationSuccess(result.user);
      } else {
        toast.error(result.error || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Erro inesperado ao criar conta');
    } finally {
      setIsAuthenticating(false);
    }
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
    const currentStepType = stepFlow.steps[stepFlow.currentStepIndex];
    
    if (currentStepType === 'plan_selection') {
      handleStep1Continue();
      return;
    }
    
    if (currentStepType === 'authentication') {
      if (stepFlow.authStep === 'login') {
        handleLogin();
      } else if (stepFlow.authStep === 'signup') {
        handleSignup();
      }
      return;
    }

    // Step 2: Process payment with plan-based pricing
    setIsProcessing(true);
    
    if (selectedMethod === 'pix') {
      // Plan-based PIX Payment Logic
      const pixPaymentData: PlanBasedPixPaymentInput = {
        planId: plan.id,
        customerId: customerId || values.customerEmail,
        metadata: {
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerDocument: values.customerDocument,
          customerPhone: values.customerPhone
        }
      };

      pixPaymentMutation.mutate(pixPaymentData, {
        onSuccess: (data) => {
          console.log('PIX payment response:', data);
          console.log('PIX payment charges:', data.charges);
          
          // CRITICAL FIX: Add detailed logging for PIX validation debugging
          if (data.charges && data.charges.length > 0) {
            console.log('First charge:', data.charges[0]);
            console.log('First charge payment_method:', data.charges[0].payment_method);
            console.log('Last transaction:', data.charges[0].last_transaction);
          }
          
          // Validate PIX response has required QR code data
          const hasValidPixData = validatePixPaymentResponse(data);
          if (!hasValidPixData.valid) {
            console.error('PIX payment validation failed:', hasValidPixData.reason);
            console.error('Full PIX response for debugging:', JSON.stringify(data, null, 2));
            
            const context = {
              orderId: data.id || data.subscription_id,
              amount: displayPrice,
              paymentMethod: 'pix' as const
            };
            
            const result = resultConfigs.technicalError(context, hasValidPixData.reason);
            setPaymentResult(result);
            setIsProcessing(false);
            return;
          }
          
          setPixData(data);
          setShowPixCode(true);
          setIsProcessing(false);
        },
        onError: (error) => {
          console.error('PIX payment error:', error);
          
          const context = {
            orderId: undefined,
            amount: displayPrice,
            paymentMethod: 'pix' as const
          };
          
          // Determine error type and show appropriate result
          const errorMessage = error.message || '';
          let result;
          
          if (errorMessage.includes('network') || errorMessage.includes('connection')) {
            result = resultConfigs.networkError(context);
          } else {
            result = resultConfigs.technicalError(context);
          }
          
          setPaymentResult(result);
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
        
        // Validate billing address fields
        if (!values.billingStreet || !values.billingZipCode || !values.billingCity || !values.billingState) {
          toast.error('Todos os campos de endereço são obrigatórios para pagamento com cartão');
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

        const creditCardPaymentData: PlanBasedCreditCardPaymentInput = {
          planId: plan.id,
          customerId: customerId || values.customerEmail,
          installments: parseInt(values.installments || '1'),
          metadata: {
            customerName: values.customerName,
            customerEmail: values.customerEmail,
            customerDocument: values.customerDocument,
            customerPhone: values.customerPhone
          },
          billingAddress: {
            line_1: values.billingStreet || '',
            zip_code: values.billingZipCode?.replace(/\D/g, '') || '',
            city: values.billingCity || '',
            state: values.billingState || '',
            country: 'BR'
          },
          cardData: {
            number: values.cardNumber?.replace(/\s/g, '') || '',
            holderName: values.cardHolderName || '',
            expirationMonth: month.padStart(2, '0'),
            expirationYear: year,
            cvv: values.cardCvv || ''
          }
        };

        creditCardPaymentMutation.mutate(creditCardPaymentData, {
          onSuccess: (data) => {
            // CRITICAL FIX: Handle both subscription and order response structures
            // Subscription responses have subscription_id, order responses have id
            const paymentId = data.subscription_id || data.id;
            
            console.log('Credit card payment success:', { 
              hasSubscriptionId: !!data.subscription_id, 
              hasOrderId: !!data.id, 
              paymentId,
              responseType: data.subscription_id ? 'subscription' : 'order',
              status: data.status
            });
            
            // Check for failed payments (e.g., card declined)
            if (data.status === 'failed') {
              const context = {
                orderId: paymentId,
                amount: displayPrice,
                paymentMethod: 'credit_card' as const,
                installments: parseInt(values.installments || '1')
              };
              
              // Show elegant failure result
              const result = resultConfigs.creditCardDeclined(context, 'installment_not_supported');
              setPaymentResult(result);
              setIsProcessing(false);
              return;
            }
            
            // IMPORTANT: Only trigger webhook if payment is actually confirmed/paid
            // For credit cards, this happens immediately if approved
            if (data.status === 'paid' || data.status === 'approved') {
              console.log('Credit card payment confirmed, triggering webhook');
              
              const webhookPaymentData = {
                id: paymentId || 'unknown',
                amount: displayPrice,
                method: 'credit_card',
                status: 'paid',
                metadata: {
                  planId: plan.id,
                  planName: plan.name,
                  customerName: values.customerName,
                  customerEmail: values.customerEmail,
                  customerDocument: values.customerDocument,
                  customerPhone: values.customerPhone,
                  installments: parseInt(values.installments || '1'),
                  paymentFlow: data.subscription_id ? 'subscription_signup' : 'one_time_payment',
                  cardLastDigits: values.cardNumber?.slice(-4) || '',
                  billingAddress: {
                    street: values.billingStreet || '',
                    zipCode: values.billingZipCode || '',
                    city: values.billingCity || '',
                    state: values.billingState || ''
                  }
                },
                pagarme_transaction_id: paymentId
              };
              
              triggerWebhookIfUserAuthenticated(webhookPaymentData);
            } else {
              console.log(`Credit card payment not yet confirmed (status: ${data.status}), webhook not triggered`);
            }
            
            // Success case - determine if it's subscription or one-time
            const context = {
              orderId: paymentId,
              amount: displayPrice,
              paymentMethod: 'credit_card' as const,
              planName: plan.name,
              installments: parseInt(values.installments || '1')
            };
            
            const result = data.subscription_id 
              ? resultConfigs.subscriptionSuccess(context)
              : resultConfigs.creditCardSuccess(context);
            
            setPaymentResult(result);
            setIsProcessing(false);
            
            // SUCCESS: Don't call onSuccess callback - we're showing unified result instead of navigating
            // The unified result will handle the user flow with proper success messaging
          },
          onError: (error) => {
            console.error('Credit card payment error:', error);
            
            const context = {
              orderId: undefined,
              amount: displayPrice,
              paymentMethod: 'credit_card' as const,
              installments: parseInt(values.installments || '1')
            };
            
            // Determine error type and show appropriate result
            const errorMessage = error.message || '';
            let result;
            
            if (errorMessage.includes('insufficient')) {
              result = resultConfigs.creditCardDeclined(context, 'insufficient_funds');
            } else if (errorMessage.includes('expired')) {
              result = resultConfigs.creditCardDeclined(context, 'expired_card');
            } else if (errorMessage.includes('blocked')) {
              result = resultConfigs.creditCardDeclined(context, 'blocked_card');
            } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
              result = resultConfigs.networkError(context);
            } else {
              result = resultConfigs.technicalError(context);
            }
            
            setPaymentResult(result);
            setIsProcessing(false);
          }
        });
      } catch (error) {
        console.error('Payment processing error:', error);
        
        const context = {
          orderId: undefined,
          amount: displayPrice,
          paymentMethod: selectedMethod
        };
        
        const result = resultConfigs.technicalError(context, 'Erro no processamento do pagamento');
        setPaymentResult(result);
        setIsProcessing(false);
      }
    }
  };

  // Payment Result Display (unified success/failure handling)
  if (paymentResult) {
    return <PaymentResultDisplay result={paymentResult} />;
  }

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

          {/* PIX QR Code */}
          <div className="bg-white h-48 w-48 mx-auto mb-4 flex items-center justify-center rounded-lg border">
            {(() => {
              // Handle both response formats: direct PIX response and charge-based
              let qrCodeUrl;
              
              if (pixData?.payment_method === 'pix') {
                // NEW FORMAT: Direct PIX response format
                qrCodeUrl = pixData.qr_code_url;
              } else {
                // OLD FORMAT: PIX QR code URL is in the last_transaction of the first charge
                const pixCharge = pixData?.charges?.[0];
                qrCodeUrl = pixCharge?.last_transaction?.qr_code_url;
              }
              
              return qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="PIX QR Code"
                  className="h-44 w-44 object-contain"
                />
              ) : (
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">QR Code PIX</p>
                </div>
              );
            })()}
          </div>

          {/* Copy PIX Code Button */}
          <Button 
            onClick={async () => {
              // Handle both response formats: direct PIX response and charge-based
              let pixCode;
              
              if (pixData?.payment_method === 'pix') {
                // NEW FORMAT: Direct PIX response format
                pixCode = pixData.qr_code;
              } else {
                // OLD FORMAT: PIX code is in the last_transaction of the first charge
                const pixCharge = pixData?.charges?.[0];
                pixCode = pixCharge?.last_transaction?.qr_code;
              }
              
              if (pixCode) {
                try {
                  // Check if clipboard API is available
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(pixCode);
                    toast.success('Código PIX copiado!');
                  } else {
                    // Fallback for non-HTTPS or unsupported browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = pixCode;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                      document.execCommand('copy');
                      toast.success('Código PIX copiado!');
                    } catch (fallbackError) {
                      console.error('Fallback clipboard error:', fallbackError);
                      toast.error('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
                    }
                    
                    document.body.removeChild(textArea);
                  }
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
            Válido por 1 hora • R$ {(displayPrice / 100).toFixed(2).replace('.', ',')}
          </div>
          
          {/* Payment status monitoring - Auto-redirects when paid via useEffect */}

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
      <ProgressSteps 
        currentStepIndex={stepFlow.currentStepIndex} 
        totalSteps={stepFlow.steps.length}
        steps={stepFlow.steps}
      />

      {/* Enhanced Plan Information */}
      <div className="mb-6">
        <EnhancedPlanDisplay plan={displayPlan} />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Step 1: Customer Data Collection */}
          {stepFlow.steps[stepFlow.currentStepIndex] === 'plan_selection' && (
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

          {/* Authentication Step */}
          {stepFlow.steps[stepFlow.currentStepIndex] === 'authentication' && (
            <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-4 space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-black mb-2">
                  {stepFlow.authStep === 'login' ? 'Fazer Login' : 'Criar Conta'}
                </h3>
                <p className="text-sm text-gray-600">
                  {stepFlow.authStep === 'login' 
                    ? 'Digite sua senha para continuar com o pagamento'
                    : 'Crie uma senha para prosseguir com o pagamento'
                  }
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-700 font-medium">Email: {authData.email}</p>
              </div>

              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  value={authData.password}
                  onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-white border-gray-300 focus:border-black focus:ring-0"
                />
                
                {stepFlow.authStep === 'signup' && (
                  <Input
                    type="password"
                    placeholder="Confirme sua senha"
                    value={authData.confirmPassword}
                    onChange={(e) => setAuthData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0"
                  />
                )}
              </div>

              <Button
                type="submit"
                disabled={isAuthenticating || !authData.password || (stepFlow.authStep === 'signup' && !authData.confirmPassword)}
                className="w-full bg-black hover:bg-gray-800 text-white h-12 rounded-md font-medium"
              >
                {isAuthenticating ? 'Processando...' : 
                 stepFlow.authStep === 'login' ? 'Fazer Login e Continuar' : 'Criar Conta e Continuar'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Payment Method Selection */}
          {stepFlow.steps[stepFlow.currentStepIndex] === 'payment_details' && (
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
                            <SelectItem value="1" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">1x de R$ {(displayPrice / 100).toFixed(2).replace('.', ',')} (à vista)</SelectItem>
                            <SelectItem value="2" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">2x de R$ {(displayPrice / 200).toFixed(2).replace('.', ',')}</SelectItem>
                            <SelectItem value="3" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">3x de R$ {(displayPrice / 300).toFixed(2).replace('.', ',')}</SelectItem>
                            <SelectItem value="6" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">6x de R$ {(displayPrice / 600).toFixed(2).replace('.', ',')}</SelectItem>
                            <SelectItem value="12" className="text-black hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 data-[state=checked]:text-black focus:text-black">12x de R$ {(displayPrice / 1200).toFixed(2).replace('.', ',')}</SelectItem>
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

      {/* Bottom Navigation - Show back button when not on first step */}
      {stepFlow.currentStepIndex > 0 && (
        <div className="mt-4">
          <Button 
            type="button"
            variant="outline"
            onClick={handleBackStep}
            className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 flex items-center justify-center gap-2 touch-manipulation"
            disabled={isProcessing || isAuthenticating}
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
          <a 
            href={contactLink} 
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

export default TwoStepPaymentForm;