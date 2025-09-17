// ABOUTME: Registration page with temporary access control - requires specific token or redirects to login

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RegistrationForm from '@/components/auth/RegistrationForm';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // TEMPORARY: Block access unless specific token is provided
    const temporaryAccessToken = searchParams.get('temporary_access_token');

    if (temporaryAccessToken !== 'da13e451') {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  // Double-check before rendering
  const temporaryAccessToken = searchParams.get('temporary_access_token');
  if (temporaryAccessToken !== 'da13e451') {
    return null;
  }

  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <RegistrationForm />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default RegistrationPage;