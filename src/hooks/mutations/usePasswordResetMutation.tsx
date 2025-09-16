// ABOUTME: TanStack Query mutation hooks for password reset functionality

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Schema for password reset request
export const resetRequestSchema = z.object({
  email: z.string().email({ message: 'Email inválido.' }),
});

// Schema for password reset confirmation
export const resetConfirmSchema = z.object({
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export type ResetRequestPayload = z.infer<typeof resetRequestSchema>;
export type ResetConfirmPayload = z.infer<typeof resetConfirmSchema>;

// Request password reset email
const requestPasswordReset = async (payload: ResetRequestPayload) => {
  const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
    redirectTo: `${window.location.origin}/redefinir-senha?email=${encodeURIComponent(payload.email)}`,
  });

  if (error) {
    // Provide user-friendly error messages in Portuguese
    if (error.message.toLowerCase().includes('user not found') || 
        error.message.toLowerCase().includes('email not found')) {
      throw new Error('Este email não está cadastrado em nossa plataforma');
    }
    
    if (error.message.toLowerCase().includes('too many requests') ||
        error.message.toLowerCase().includes('rate limit')) {
      throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente');
    }

    if (error.message.toLowerCase().includes('invalid email')) {
      throw new Error('Email inválido');
    }

    // Generic fallback
    throw new Error('Erro ao enviar email de redefinição. Tente novamente');
  }

  return { success: true };
};

// Confirm password reset with new password
const confirmPasswordReset = async (payload: ResetConfirmPayload) => {
  // First check if we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('❌ Password reset - No valid session:', sessionError);
    throw new Error('Sessão de redefinição inválida ou expirada. Clique novamente no link do email');
  }

  const { error } = await supabase.auth.updateUser({
    password: payload.password
  });

  if (error) {
    console.error('❌ Password update error:', error);

    // Handle different types of password reset errors
    if (error.message.toLowerCase().includes('session not found') ||
        error.message.toLowerCase().includes('invalid session')) {
      throw new Error('Sessão de redefinição inválida ou expirada. Solicite um novo link');
    }

    if (error.message.toLowerCase().includes('password') &&
        error.message.toLowerCase().includes('weak')) {
      throw new Error('Senha muito fraca. Use uma senha mais forte');
    }

    if (error.message.toLowerCase().includes('same password')) {
      throw new Error('A nova senha deve ser diferente da senha atual');
    }

    if (error.message.toLowerCase().includes('user not found')) {
      throw new Error('Usuário não encontrado. Solicite um novo link de redefinição');
    }

    // Generic fallback with actual error for debugging
    throw new Error(`Erro ao redefinir senha: ${error.message}`);
  }

  return { success: true };
};

// Hook for requesting password reset
export const usePasswordResetRequest = () => {
  return useMutation({
    mutationFn: requestPasswordReset,
  });
};

// Hook for confirming password reset
export const usePasswordResetConfirm = () => {
  return useMutation({
    mutationFn: confirmPasswordReset,
  });
};