// ABOUTME: Page for forgot password flow with split screen layout

import React from 'react';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

const ForgotPasswordPage = () => {
  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <ForgotPasswordForm />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default ForgotPasswordPage;