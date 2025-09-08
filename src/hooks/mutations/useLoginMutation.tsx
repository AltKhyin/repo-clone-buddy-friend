
// ABOUTME: TanStack Query mutation hook for user login.
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
});

export type LoginPayload = z.infer<typeof loginSchema>;

// Map Supabase auth errors to user-friendly Portuguese messages
const getAuthErrorMessage = (error: any) => {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';

  // Email not confirmed
  if (errorMessage.includes('email_not_confirmed') || errorMessage.includes('not confirmed')) {
    return 'EMAIL_NOT_CONFIRMED';
  }

  // Invalid credentials (wrong email/password combination)
  if (errorMessage.includes('invalid_login_credentials') || 
      errorMessage.includes('invalid login credentials') ||
      errorMessage.includes('invalid credentials') ||
      errorCode === 'invalid_credentials') {
    return 'Este email ou senha estão incorretos';
  }

  // User not found / Email doesn't exist
  if (errorMessage.includes('user_not_found') || 
      errorMessage.includes('email not found') ||
      errorMessage.includes('no user found')) {
    return 'Este usuário não existe';
  }

  // Wrong password specifically
  if (errorMessage.includes('invalid_password') || 
      errorMessage.includes('wrong password') ||
      errorMessage.includes('incorrect password')) {
    return 'Senha incorreta';
  }

  // Too many attempts / rate limiting
  if (errorMessage.includes('too_many_requests') || 
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many attempts')) {
    return 'Muitas tentativas de login. Tente novamente em alguns minutos';
  }

  // Account locked/disabled
  if (errorMessage.includes('user_disabled') || 
      errorMessage.includes('account_disabled') ||
      errorMessage.includes('user_locked')) {
    return 'Conta temporariamente bloqueada. Entre em contato com o suporte';
  }

  // Network/connection issues
  if (errorMessage.includes('network') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection')) {
    return 'Problema de conexão. Verifique sua internet e tente novamente';
  }

  // Signup required (user needs to create account first)
  if (errorMessage.includes('signup_required') || 
      errorMessage.includes('account_not_found')) {
    return 'Conta não encontrada. Você precisa criar uma conta primeiro';
  }

  // Generic fallback for unknown errors
  return 'Erro ao fazer login. Tente novamente';
};

const loginWithPassword = async (payload: LoginPayload) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    const friendlyMessage = getAuthErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: loginWithPassword,
  });
};
