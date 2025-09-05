// ABOUTME: Payment page using same layout structure as login/register pages for consistent UX
import React from 'react';
import PaymentForm from '@/components/payment/PaymentForm';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract plan information from URL parameters with sensible defaults
  const planName = searchParams.get('plan') || 'Teste - R$ 0,01';
  const planPrice = parseInt(searchParams.get('price') || '1'); // Default R$ 0,01 for testing
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
        <PaymentForm 
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