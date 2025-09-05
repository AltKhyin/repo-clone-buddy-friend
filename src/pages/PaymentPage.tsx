// ABOUTME: Payment page using same layout structure as login/register pages for consistent UX
import React from 'react';
import TwoStepPaymentForm from '@/components/payment/TwoStepPaymentForm';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract plan information from URL parameters with sensible defaults
  const planName = searchParams.get('plan') || 'Teste - R$ 2,00';
  const planPrice = parseInt(searchParams.get('price') || '200'); // Default R$ 2,00 for testing (above minimum)
  const planDescription = searchParams.get('description') || 'Teste do sistema de pagamento';

  const handlePaymentSuccess = (orderId: string) => {
    // Navigate to success page or dashboard
    navigate(`/pagamento-sucesso?orderId=${orderId}`);
  };

  const handlePaymentCancel = () => {
    // Navigate back to plans or home
    navigate('/');
  };

  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <TwoStepPaymentForm 
          planName={planName}
          planPrice={planPrice}
          planDescription={planDescription}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default PaymentPage;