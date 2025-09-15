// ABOUTME: Backup of the original login page with all features (created for /login-modelo route)
import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';

const LoginModeloPage = () => {
  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <LoginForm />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default LoginModeloPage;