// ABOUTME: Payment V2.0 page with isolated payment processing system and URL parameter integration
//
// URL Parameter Support:
// - ?plano=<custom-parameter>   - Plan selection by custom parameter (e.g., premium-20-off)
// - ?method=pix|credit_card     - Pre-select payment method
// 
// Example URLs:
// - /pagamento-v2?plano=premium-20-off
// - /pagamento-v2?plano=basic-monthly&method=pix
// - /pagamento-v2?plano=special-offer
//
// Parameter Validation:
// - plano: Must be alphanumeric with hyphens/underscores only
// - method: Must be 'pix' or 'credit_card'
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PaymentV2Form from '@/components/payment-v2/PaymentV2Form';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';

const PaymentV2Page = () => {
  const location = useLocation();
  
  // Parse and validate URL parameters for plan selection
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
    
    // Log validation results for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('PaymentV2Page URL Parameters:', {
        raw: { plano, paymentMethod },
        validated: { validPlano, validPaymentMethod },
        invalid: {
          plano: plano && !validPlano,
          paymentMethod: paymentMethod && !validPaymentMethod
        }
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
        <PaymentV2Form 
          initialCustomParameter={urlParams.plano}
          initialPaymentMethod={urlParams.paymentMethod}
        />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default PaymentV2Page;