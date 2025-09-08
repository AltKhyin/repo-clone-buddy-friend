// ABOUTME: Enhanced payment success page with automatic account creation and smooth auth flow

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, User, ArrowRight, Clock, Mail, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useJourneyOrchestration } from '@/hooks/useJourneyOrchestration';
import { checkProfileCompleteness } from '@/lib/profileCompleteness';
import { createOrAssociateAccountFromPayment, type PaymentAccountCreationData, type AccountCreationResult } from '@/services/paymentAccountService';
import { sendPaymentAccountWelcomeEmail } from '@/services/emailWelcomeService';
import { triggerPaymentSuccessWebhook } from '@/services/makeWebhookService';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, practitioner, isLoading } = useAuthStore();
  const { preservedPaymentData, journeyParams } = useJourneyOrchestration();
  
  // Account creation state
  const [accountStatus, setAccountStatus] = useState<'checking' | 'creating' | 'existing_user' | 'new_account_created' | 'setup_required' | 'error' | 'complete'>('checking');
  const [accountResult, setAccountResult] = useState<AccountCreationResult | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentAccountCreationData | null>(null);
  
  // Legacy auth flow state
  const [nextStep, setNextStep] = useState<'loading' | 'login' | 'complete_profile' | 'ready'>('loading');

  // Determine user's next step based on auth state
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // User is not logged in - they need to login or register
      setNextStep('login');
    } else {
      // User is logged in - check if profile is complete
      const completeness = checkProfileCompleteness(user, practitioner);
      if (!completeness.isComplete) {
        setNextStep('complete_profile');
      } else {
        setNextStep('ready');
      }
    }
  }, [user, practitioner, isLoading]);

  // Enhanced: Automatic account creation from payment data
  useEffect(() => {
    const processPaymentAndCreateAccount = async () => {
      // Extract order ID from URL parameters  
      const orderId = searchParams.get('orderId');
      
      if (!orderId) {
        console.log('No orderId in URL, skipping automatic account creation');
        setAccountStatus('complete');
        return;
      }

      console.log('Processing payment success with orderId:', orderId);

      try {
        setAccountStatus('checking');

        // Try to extract payment data from preserved data or mock it for now
        // In a real implementation, you might fetch this from Pagarme API or your database
        const extractedPaymentData = extractPaymentDataFromSources(orderId);
        
        if (!extractedPaymentData) {
          console.warn('Could not extract payment data for orderId:', orderId);
          setAccountStatus('complete');
          return;
        }

        setPaymentData(extractedPaymentData);
        setAccountStatus('creating');

        // Create or associate account
        const result = await createOrAssociateAccountFromPayment(extractedPaymentData);
        setAccountResult(result);

        if (result.success && result.user) {
          console.log('Account creation/association successful:', result.action);
          
          // Send welcome email for new accounts
          if (result.action === 'created' && result.requiresPasswordSetup) {
            try {
              await sendPaymentAccountWelcomeEmail(result.user, extractedPaymentData, {
                includePasswordSetup: true,
                paymentDetails: {
                  planName: extractedPaymentData.planId, // In real implementation, fetch plan name
                  amount: extractedPaymentData.amount,
                  paymentMethod: extractedPaymentData.paymentMethod || 'unknown'
                }
              });
              console.log('Welcome email sent successfully');
            } catch (emailError) {
              console.error('Welcome email failed (non-blocking):', emailError);
            }
          }

          // Trigger webhook with user data
          try {
            await triggerPaymentSuccessWebhook(result.user.id, {
              id: extractedPaymentData.orderId,
              amount: extractedPaymentData.amount,
              method: extractedPaymentData.paymentMethod || 'unknown',
              status: 'paid',
              metadata: {
                customerName: extractedPaymentData.customerName,
                customerEmail: extractedPaymentData.customerEmail,
                customerDocument: extractedPaymentData.customerDocument,
                customerPhone: extractedPaymentData.customerPhone,
                planId: extractedPaymentData.planId,
                accountAction: result.action
              }
            });
            console.log('Payment webhook triggered successfully');
          } catch (webhookError) {
            console.error('Webhook trigger failed (non-blocking):', webhookError);
          }

          // Update status based on result
          if (result.action === 'created') {
            setAccountStatus('new_account_created');
          } else if (result.action === 'found_existing') {
            setAccountStatus('existing_user');
          }
          
        } else {
          console.error('Account creation failed:', result.message);
          setAccountStatus('error');
        }

      } catch (error) {
        console.error('Error in payment processing:', error);
        setAccountStatus('error');
      }
    };

    // Only run once when component mounts
    if (accountStatus === 'checking') {
      processPaymentAndCreateAccount();
    }
  }, [searchParams, accountStatus]);

  // Helper function to extract payment data from available sources
  const extractPaymentDataFromSources = (orderId: string): PaymentAccountCreationData | null => {
    // Try to get from preserved payment data first
    if (preservedPaymentData) {
      return {
        customerEmail: preservedPaymentData.customerEmail || '',
        customerName: preservedPaymentData.customerName || '',
        customerDocument: preservedPaymentData.customerDocument,
        customerPhone: preservedPaymentData.customerPhone,
        orderId: orderId,
        planId: preservedPaymentData.planPurchased || 'unknown',
        amount: parseFloat(preservedPaymentData.amountPaid || '0') * 100, // Convert to cents
        paymentMethod: preservedPaymentData.paymentMethod
      };
    }

    // Try to get from URL parameters as fallback
    const customerEmail = searchParams.get('customerEmail');
    const customerName = searchParams.get('customerName'); 
    const planId = searchParams.get('planId');
    const amount = searchParams.get('amount');

    if (customerEmail && customerName) {
      return {
        customerEmail,
        customerName,
        customerDocument: searchParams.get('customerDocument') || undefined,
        customerPhone: searchParams.get('customerPhone') || undefined,
        orderId,
        planId: planId || 'unknown',
        amount: amount ? parseInt(amount) : 0,
        paymentMethod: searchParams.get('paymentMethod') || undefined
      };
    }

    // Could not extract payment data
    return null;
  };

  const handleNextAction = () => {
    switch (nextStep) {
      case 'login':
        // Preserve payment data in the login journey
        const loginUrl = new URL('/login', window.location.origin);
        if (preservedPaymentData) {
          if (preservedPaymentData.customerName) loginUrl.searchParams.set('customerName', preservedPaymentData.customerName);
          if (preservedPaymentData.paymentId) loginUrl.searchParams.set('paymentId', preservedPaymentData.paymentId);
          if (preservedPaymentData.planPurchased) loginUrl.searchParams.set('planPurchased', preservedPaymentData.planPurchased);
          loginUrl.searchParams.set('source', 'payment');
        }
        navigate(loginUrl.pathname + loginUrl.search);
        break;
      
      case 'complete_profile':
        // Navigate to profile completion with preserved data
        const profileUrl = new URL('/completar-perfil', window.location.origin);
        if (preservedPaymentData) {
          if (preservedPaymentData.customerName) profileUrl.searchParams.set('customerName', preservedPaymentData.customerName);
          if (preservedPaymentData.paymentId) profileUrl.searchParams.set('paymentId', preservedPaymentData.paymentId);
          if (preservedPaymentData.planPurchased) profileUrl.searchParams.set('planPurchased', preservedPaymentData.planPurchased);
          profileUrl.searchParams.set('source', 'payment');
        }
        navigate(profileUrl.pathname + profileUrl.search);
        break;
      
      case 'ready':
        // User is ready - go to main app
        navigate('/');
        break;
    }
  };

  const getStepMessage = () => {
    switch (nextStep) {
      case 'loading':
        return {
          title: 'Processando...',
          description: 'Verificando seu acesso, aguarde um momento.',
          icon: <Clock className="w-8 h-8 text-blue-600" />,
          buttonText: 'Aguarde...',
          disabled: true
        };
      
      case 'login':
        return {
          title: 'Criar conta ou fazer login',
          description: 'Para acessar sua assinatura, você precisa criar uma conta ou fazer login.',
          icon: <User className="w-8 h-8 text-blue-600" />,
          buttonText: 'Criar conta / Login',
          disabled: false
        };
      
      case 'complete_profile':
        return {
          title: 'Complete seu perfil',
          description: 'Falta apenas completar algumas informações básicas para acessar sua conta.',
          icon: <User className="w-8 h-8 text-orange-600" />,
          buttonText: 'Completar perfil',
          disabled: false
        };
      
      case 'ready':
        return {
          title: 'Tudo pronto!',
          description: 'Sua conta está configurada e pronta para uso.',
          icon: <ArrowRight className="w-8 h-8 text-green-600" />,
          buttonText: 'Acessar plataforma',
          disabled: false
        };
    }
  };

  // Enhanced UI: Show account creation status
  const getAccountStatusDisplay = () => {
    switch (accountStatus) {
      case 'checking':
        return {
          icon: <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />,
          title: 'Verificando pagamento...',
          description: 'Processando os detalhes do seu pagamento.',
          showButton: false
        };

      case 'creating':
        return {
          icon: <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />,
          title: 'Criando sua conta...',
          description: 'Configurando seu acesso à plataforma.',
          showButton: false
        };

      case 'new_account_created':
        return {
          icon: <Mail className="w-8 h-8 text-green-600" />,
          title: '🎉 Conta criada com sucesso!',
          description: 'Enviamos um email com instruções para definir sua senha.',
          showButton: true,
          buttonText: 'Verificar meu email',
          buttonAction: () => window.open('mailto:', '_blank')
        };

      case 'existing_user':
        return {
          icon: <Shield className="w-8 h-8 text-blue-600" />,
          title: 'Pagamento associado à sua conta',
          description: 'Seu pagamento foi vinculado à sua conta existente.',
          showButton: true,
          buttonText: 'Acessar plataforma',
          buttonAction: () => navigate('/')
        };

      case 'error':
        return {
          icon: <Shield className="w-8 h-8 text-red-600" />,
          title: 'Erro ao processar conta',
          description: accountResult?.message || 'Houve um problema. Entre em contato com o suporte.',
          showButton: true,
          buttonText: 'Tentar novamente',
          buttonAction: () => {
            setAccountStatus('checking');
            window.location.reload();
          }
        };

      default: // 'complete' or fallback
        return null;
    }
  };

  const accountDisplay = getAccountStatusDisplay();
  const stepInfo = getStepMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
        {/* Payment Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        {/* Payment Success Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Pagamento Processado!
          </h1>
          <p className="text-gray-600">
            Seu pagamento foi processado com sucesso.
          </p>
        </div>

        {/* Payment Details */}
        {(paymentData || preservedPaymentData) && (
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <div className="space-y-1">
              {(paymentData?.planId || preservedPaymentData?.planPurchased) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano:</span>
                  <span className="font-medium">{paymentData?.planId || preservedPaymentData?.planPurchased}</span>
                </div>
              )}
              {(paymentData?.amount || preservedPaymentData?.amountPaid) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium">
                    {paymentData ? 
                      `R$ ${(paymentData.amount / 100).toFixed(2)}` : 
                      `R$ ${preservedPaymentData?.amountPaid}`
                    }
                  </span>
                </div>
              )}
              {(paymentData?.orderId || preservedPaymentData?.paymentId) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Pedido:</span>
                  <span className="font-mono text-xs">#{paymentData?.orderId || preservedPaymentData?.paymentId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Creation Status */}
        {accountDisplay && (
          <div className="bg-gray-50 p-4 rounded-lg border-t-2 border-blue-500">
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-white rounded-full">
                {accountDisplay.icon}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {accountDisplay.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {accountDisplay.description}
                </p>
              </div>

              {accountDisplay.showButton && (
                <Button 
                  onClick={accountDisplay.buttonAction}
                  className="w-full"
                >
                  {accountDisplay.buttonText}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Account Creation Details (if available) */}
        {accountResult && accountResult.success && (
          <div className="bg-green-50 p-3 rounded-lg text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{paymentData?.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{paymentData?.customerName}</span>
              </div>
              {accountResult.action === 'created' && (
                <p className="text-xs text-green-700 mt-2">
                  ✅ Nova conta criada automaticamente
                </p>
              )}
              {accountResult.action === 'found_existing' && (
                <p className="text-xs text-blue-700 mt-2">
                  ✅ Pagamento associado à conta existente
                </p>
              )}
            </div>
          </div>
        )}

        {/* Legacy Next Step (fallback for when account creation is not available) */}
        {accountStatus === 'complete' && (
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gray-100 rounded-full">
              {stepInfo.icon}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {stepInfo.title}
              </h2>
              <p className="text-sm text-gray-600">
                {stepInfo.description}
              </p>
            </div>

            <Button 
              onClick={handleNextAction}
              className="w-full"
              disabled={stepInfo.disabled}
            >
              {stepInfo.buttonText}
            </Button>
          </div>
        )}

        {/* Help text */}
        <p className="text-xs text-gray-500">
          Precisa de ajuda? Entre em contato com nosso suporte.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;