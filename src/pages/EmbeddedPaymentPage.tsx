// ABOUTME: Embedded payment page using Pagar.me transparent checkout for better UX
import React from 'react';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TwoStepPaymentForm from '@/components/payment/TwoStepPaymentForm';

const EmbeddedPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract plan information from URL parameters
  const planName = searchParams.get('plan') || 'Plano Mensal';
  const planPrice = parseInt(searchParams.get('price') || '1990'); // Default R$ 19.90
  const planDescription = searchParams.get('description') || 'Acesso completo à plataforma EVIDENS';

  const handlePaymentSuccess = (data: any) => {
    console.log('Payment successful:', data);
    navigate(`/pagamento-sucesso?orderId=${data.id || 'success'}`);
  };

  const handlePaymentCancel = () => {
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

export default EmbeddedPaymentPage;