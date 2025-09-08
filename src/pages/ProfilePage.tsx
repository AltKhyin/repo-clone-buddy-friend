
// ABOUTME: Private user profile page with personal account management
import React from 'react';
import { useParams } from 'react-router-dom';
import { useUserProfileQuery } from '../../packages/hooks/useUserProfileQuery';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StandardLayout } from '@/components/layout/StandardLayout';
import { Footer } from '@/components/layout/Footer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const PerfilPageContent = () => {
  const { userId } = useParams();
  const isViewingOwnProfile = !userId; // No userId param means viewing own profile
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfileQuery();

  // Handle visitor profile (viewing someone else's profile)
  if (userId && userId !== userProfile?.id) {
    // TODO: Implement usePublicProfileQuery for viewing other users
    // For now, show visitor placeholder
    return (
      <StandardLayout type="wide" contentClassName="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarFallback className="text-lg">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-muted-foreground">Visitante</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Perfil não disponível
              </p>
            </div>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Handle errors for own profile
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
    <>
      <StandardLayout type="wide" contentClassName="space-y-6">
        {/* Profile Header */}
        <ProfileHeader 
          userProfile={userProfile} 
          isLoading={profileLoading} 
        />
      </StandardLayout>
      
      {/* Footer */}
      <Footer />
    </>
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
