// ABOUTME: TanStack Query mutation hook for Google OAuth authentication
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const signInWithGoogle = async () => {
  console.log('Starting Google OAuth flow...');
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  console.log('Google OAuth response:', { data, error });

  if (error) {
    console.error('Google OAuth error details:', {
      message: error.message,
      status: error.status,
      code: error.code || 'unknown'
    });
    
    // Provide more specific error messages
    if (error.message.includes('popup_blocked')) {
      throw new Error('Pop-up bloqueado. Permita pop-ups para continuar com o Google.');
    } else if (error.message.includes('oauth_error')) {
      throw new Error('Erro de autenticação com Google. Tente novamente.');
    } else if (error.message.includes('access_denied')) {
      throw new Error('Acesso negado. Você cancelou a autenticação.');
    } else {
      throw new Error(`Erro ao conectar com Google: ${error.message}`);
    }
  }

  return data;
};

export const useGoogleAuth = () => {
  return useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: () => {
      toast.success('Conectando com Google...');
      // Note: The actual success will be handled after the redirect
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao conectar com Google');
      console.error('Google Auth error:', error);
    },
  });
};