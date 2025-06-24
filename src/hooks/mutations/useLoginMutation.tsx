
// ABOUTME: TanStack Query mutation hook for user login.
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
});

export type LoginPayload = z.infer<typeof loginSchema>;

const loginWithPassword = async (payload: LoginPayload) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: loginWithPassword,
  });
};
