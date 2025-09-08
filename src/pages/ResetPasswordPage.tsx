// ABOUTME: Page for password reset confirmation flow with split screen layout

import React from 'react';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

const ResetPasswordPage = () => {
  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <ResetPasswordForm />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default ResetPasswordPage;