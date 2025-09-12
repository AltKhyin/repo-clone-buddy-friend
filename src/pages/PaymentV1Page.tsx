// ABOUTME: Payment V1.0 page with URL parameter support for plan selection and production-ready configuration

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PaymentFormV1 from '@/components/payment/PaymentFormV1';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';

const PaymentV1Page = () => {
  const location = useLocation();
  
  // Parse and validate URL parameters for plan selection (same as V2)
  const urlParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Get raw parameters
    const plano = searchParams.get('plano');
    const paymentMethod = searchParams.get('method');
    
    // Validate plano parameter (should be alphanumeric with hyphens/underscores if provided)
    const validPlano = plano && /^[a-zA-Z0-9_-]+$/.test(plano) 
      ? plano 
      : null;
    
    // Validate payment method
    const validPaymentMethod = paymentMethod === 'pix' || paymentMethod === 'credit_card' 
      ? paymentMethod as 'pix' | 'credit_card' 
      : null;
    
    // Log validation results for debugging (only when parameters change)
    if (process.env.NODE_ENV === 'development') {
      console.log('PaymentV1Page URL Parameters Debug:', {
        rawPlano: plano,
        validPlano: validPlano,
        rawPaymentMethod: paymentMethod,
        validPaymentMethod: validPaymentMethod,
        fullSearchString: location.search,
        urlSearchParams: Object.fromEntries(searchParams.entries())
      });
    }
    
    return {
      plano: validPlano,
      paymentMethod: validPaymentMethod,
    };
  }, [location.search]);

  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Finalizar Pagamento
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sistema de pagamento simplificado - Ambiente de Produção
            </p>
          </div>
          
          <PaymentFormV1 
            initialCustomParameter={urlParams.plano}
            initialPaymentMethod={urlParams.paymentMethod}
          />
        </div>
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default PaymentV1Page;