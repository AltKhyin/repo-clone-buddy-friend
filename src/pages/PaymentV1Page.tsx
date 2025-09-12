// ABOUTME: Payment V1.0 page - identical to V2 but with production endpoint and no test data

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PaymentV2Form from '@/components/payment-v2/PaymentV2Form';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const PaymentV1Page = () => {
  const location = useLocation();
  const siteSettings = useSiteSettings();
  
  // Parse and validate URL parameters for plan selection (identical to V2)
  const urlParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Get raw parameters
    const plano = searchParams.get('plano');
    const paymentMethod = searchParams.get('method');
    
    // Validate plano parameter (should be alphanumeric with hyphens/underscores if provided)
    const validPlano = plano && /^[a-zA-Z0-9_-]+$/.test(plano) 
      ? plano 
      : null;
    
    // Use default offer from site settings if no plano parameter is provided
    const defaultOffer = siteSettings.getSetting('default_payment_offer', null);
    const finalPlano = validPlano || defaultOffer;
    
    // Validate payment method
    const validPaymentMethod = paymentMethod === 'pix' || paymentMethod === 'credit_card' 
      ? paymentMethod as 'pix' | 'credit_card' 
      : null;
    
    // Log validation results for debugging (only when parameters change)
    if (process.env.NODE_ENV === 'development') {
      console.log('PaymentV1Page URL Parameters Debug:', {
        rawPlano: plano,
        validPlano: validPlano,
        defaultOffer: defaultOffer,
        finalPlano: finalPlano,
        rawPaymentMethod: paymentMethod,
        validPaymentMethod: validPaymentMethod,
        fullSearchString: location.search,
        urlSearchParams: Object.fromEntries(searchParams.entries())
      });
    }
    
    return {
      plano: finalPlano,
      paymentMethod: validPaymentMethod,
    };
  }, [location.search, siteSettings.getSetting]);

  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <PaymentV2Form 
          initialCustomParameter={urlParams.plano}
          initialPaymentMethod={urlParams.paymentMethod}
          // V1 specific props: no test data, use production endpoint
          hideTestData={true}
          useProductionEndpoint={true}
        />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default PaymentV1Page;