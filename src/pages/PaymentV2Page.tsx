// ABOUTME: Payment V2.0 page with isolated payment processing system
import React from 'react';
import PaymentV2Form from '@/components/payment-v2/PaymentV2Form';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';

const PaymentV2Page = () => {
  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <PaymentV2Form />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default PaymentV2Page;