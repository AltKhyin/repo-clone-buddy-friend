// ABOUTME: Institutional plan request page with elegant UI matching login page design

import React from 'react';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { InstitutionalPlanRequestForm } from '@/components/institutional/InstitutionalPlanRequestForm';

const SolicitarPlanoPage: React.FC = () => {
  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <InstitutionalPlanRequestForm />
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
};

export default SolicitarPlanoPage;