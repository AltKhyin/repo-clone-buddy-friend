
// ABOUTME: Private user profile page with personal account management
import React from 'react';
import { useUserProfileQuery } from '../../packages/hooks/useUserProfileQuery';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const PerfilPageContent = () => {
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfileQuery();

  // Handle errors
  if (profileError) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar perfil: {profileError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <ProfileHeader 
        userProfile={userProfile} 
        isLoading={profileLoading} 
      />
    </div>
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
