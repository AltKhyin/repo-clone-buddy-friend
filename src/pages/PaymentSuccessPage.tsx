// ABOUTME: Enhanced payment success page with smooth auth flow bridging to prevent user loss

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, User, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useJourneyOrchestration } from '@/hooks/useJourneyOrchestration';
import { checkProfileCompleteness } from '@/lib/profileCompleteness';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { user, practitioner, isLoading } = useAuthStore();
  const { preservedPaymentData, journeyParams } = useJourneyOrchestration();
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
            Seu pagamento foi processado com sucesso. Você receberá um email de confirmação em breve.
          </p>
        </div>

        {/* Payment Details (if available) */}
        {preservedPaymentData && (
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <div className="space-y-1">
              {preservedPaymentData.planPurchased && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano:</span>
                  <span className="font-medium">{preservedPaymentData.planPurchased}</span>
                </div>
              )}
              {preservedPaymentData.amountPaid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium">R$ {preservedPaymentData.amountPaid}</span>
                </div>
              )}
              {preservedPaymentData.paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-mono text-xs">{preservedPaymentData.paymentId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Step */}
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

        {/* Help text */}
        <p className="text-xs text-gray-500">
          Se você tiver problemas, entre em contato com nosso suporte.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;