// ABOUTME: Registration page using shared auth layout pattern

import React from 'react';
import RegistrationForm from '@/components/auth/RegistrationForm';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';

const RegistrationPage = () => {
  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <RegistrationForm />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default RegistrationPage;