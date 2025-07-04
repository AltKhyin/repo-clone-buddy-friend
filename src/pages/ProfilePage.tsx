
// ABOUTME: Private user profile page with personal account management
import React from 'react';
import { useUserProfileQuery } from '../../packages/hooks/useUserProfileQuery';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StandardLayout } from '@/components/layout/StandardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const PerfilPageContent = () => {
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfileQuery();

  // Handle errors
  if (profileError) {
    return (
      <StandardLayout type="wide" contentClassName="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar perfil: {profileError.message}
          </AlertDescription>
        </Alert>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout type="wide" contentClassName="space-y-6">
      {/* Profile Header */}
      <ProfileHeader 
        userProfile={userProfile} 
        isLoading={profileLoading} 
      />
    </StandardLayout>
  );
};

export default function PerfilPage() {
  return (
    <ErrorBoundary 
      tier="page"
      context="página de perfil"
      showHomeButton={true}
      showBackButton={true}
    >
      <PerfilPageContent />
    </ErrorBoundary>
  );
}
