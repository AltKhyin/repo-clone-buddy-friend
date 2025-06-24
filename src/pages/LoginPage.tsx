
// ABOUTME: Login page with form validation and authentication handling.
import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';

const LoginPage = () => {
  return (
    <SplitScreenAuthLayout>
      <LoginForm />
    </SplitScreenAuthLayout>
  );
};

export default LoginPage;
