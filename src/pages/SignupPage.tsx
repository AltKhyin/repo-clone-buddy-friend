
// ABOUTME: Signup page with form validation and user registration handling.
import React from 'react';
import SignupForm from '@/components/auth/SignupForm';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';

const SignupPage = () => {
  return (
    <SplitScreenAuthLayout>
      <SignupForm />
    </SplitScreenAuthLayout>
  );
};

export default SignupPage;
