// ABOUTME: Simple profile completion page to prevent users from getting lost between flows

import React from 'react';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import ProfileCompletionForm from '@/components/auth/ProfileCompletionForm';

const ProfileCompletionPage = () => {
  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <ProfileCompletionForm />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default ProfileCompletionPage;