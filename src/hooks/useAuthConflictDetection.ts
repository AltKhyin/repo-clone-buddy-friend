// ABOUTME: Hook for detecting and handling auth method conflicts to prevent user confusion

import { useState, useCallback } from 'react';
import { detectAuthMethodConflict } from '@/lib/profileCompleteness';
import { toast } from 'sonner';

interface AuthConflictState {
  hasConflict: boolean;
  existingMethod?: 'email' | 'google';
  message?: string;
  email?: string;
}

export function useAuthConflictDetection() {
  const [conflictState, setConflictState] = useState<AuthConflictState>({
    hasConflict: false
  });

  const checkForConflict = useCallback(async (
    email: string,
    attemptedMethod: 'email' | 'google'
  ) => {
    try {
      const result = await detectAuthMethodConflict(email, attemptedMethod);
      
      if (result.hasConflict) {
        setConflictState({
          hasConflict: true,
          existingMethod: result.existingMethod,
          message: result.message,
          email: email
        });
        return true;
      }
      
      clearConflict();
      return false;
    } catch (error) {
      console.error('Error checking auth conflict:', error);
      return false;
    }
  }, []);

  const clearConflict = useCallback(() => {
    setConflictState({
      hasConflict: false
    });
  }, []);

  const handleCorrectMethod = useCallback(() => {
    if (!conflictState.existingMethod) return;

    if (conflictState.existingMethod === 'google') {
      // Trigger Google auth flow
      toast.info('Use o botão "Entrar com Google" acima para continuar.');
    } else {
      // Guide to email/password form
      toast.info('Use o formulário de email e senha para continuar.');
    }
    
    clearConflict();
  }, [conflictState.existingMethod, clearConflict]);

  return {
    conflictState,
    checkForConflict,
    clearConflict,
    handleCorrectMethod,
    hasActiveConflict: conflictState.hasConflict
  };
}