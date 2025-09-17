
// ABOUTME: TanStack Query mutation hook for user signup with enhanced error handling.
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

export const signupSchema = z.object({
  fullName: z.string().min(3, { message: 'Nome completo é obrigatório.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
  confirmPassword: z.string().min(1, { message: 'Confirmação de senha é obrigatória.' }),
  birthday: z.string().optional(), // Made optional - no longer required
  phone: z.string().min(1, { message: 'Número de telefone é obrigatório.' }), // Mandatory phone field for Brazilian users
  countryCode: z.string().default('+55'), // Default to Brazil
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem.",
  path: ["confirmPassword"],
});

export type SignupPayload = z.infer<typeof signupSchema>;

const signUpUser = async (payload: SignupPayload) => {
  console.log('Starting signup process for:', payload.email);
  
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
        birthday: payload.birthday || null, // Handle optional birthday
        phone: payload.phone,
        country_code: payload.countryCode,
      },
      // This is critical for email confirmation flow
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  console.log('Signup response:', { data, error });

  if (error) {
    console.error('Signup error details:', {
      message: error.message,
      status: error.status,
      code: error.code || 'unknown'
    });
    
    // Provide more specific error messages
    if (error.message.includes('email_already_exists') || error.message.includes('already_exists')) {
      throw new Error('Este email já está em uso.');
    } else if (error.message.includes('invalid_email')) {
      throw new Error('Email inválido.');
    } else if (error.message.includes('weak_password')) {
      throw new Error('Senha muito fraca. Use pelo menos 8 caracteres.');
    } else if (error.message.includes('email_not_confirmed')) {
      throw new Error('Email não confirmado. Verifique sua caixa de entrada.');
    } else {
      throw new Error(`Erro no cadastro: ${error.message}`);
    }
  }

  if (!data.user) {
    throw new Error('Falha ao criar usuário. Tente novamente.');
  }

  return data;
};

export const useSignupMutation = () => {
  return useMutation({
    mutationFn: signUpUser,
  });
};
