// ABOUTME: Form component for confirming password reset with new password

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Key, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { usePasswordResetConfirm, resetConfirmSchema } from '@/hooks/mutations/usePasswordResetMutation';
import { supabase } from '@/integrations/supabase/client';
import type { z } from 'zod';

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetMutation = usePasswordResetConfirm();
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const userEmail = searchParams.get('email') || '';

  const form = useForm<z.infer<typeof resetConfirmSchema>>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Clear error when user starts typing
  const clearErrorOnChange = () => {
    if (resetError) {
      setResetError('');
    }
  };

  // Check if we have a valid session for password reset
  useEffect(() => {
    const handleAuthSession = async () => {
      try {
        // Get both current URL and hash parameters (similar to CompleteRegistration)
        const currentUrl = new URL(window.location.href);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // Check for auth-related URL parameters from both search and hash
        const accessToken = currentUrl.searchParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = currentUrl.searchParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = currentUrl.searchParams.get('type') || hashParams.get('type');

        // If we have tokens, set the session
        if (accessToken && refreshToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('❌ Failed to set session for password reset:', error);
            setResetError('Link de redefinição inválido ou expirado. Solicite um novo.');
            return;
          }

          // Clean URL after setting session
          window.history.replaceState({}, document.title, '/redefinir-senha');
        }
      } catch (error) {
        console.error('💥 Error handling auth session:', error);
      }
    };

    handleAuthSession();
  }, []);

  const onSubmit = (values: z.infer<typeof resetConfirmSchema>) => {
    setResetError('');
    
    resetMutation.mutate(values, {
      onSuccess: () => {
        setResetSuccess(true);
        toast.success('Senha redefinida com sucesso!');
      },
      onError: (error) => {
        setResetError(error.message);
        toast.error(error.message);
        console.error('Password reset confirm error:', error);
      },
    });
  };

  // Show success state after password is reset
  if (resetSuccess) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[400px]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-serif tracking-tight text-black mb-2">
            Senha redefinida!
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
          </p>
          
          <Button 
            onClick={() => navigate('/login')}
            className="w-full !bg-black hover:!bg-gray-800 !text-white"
          >
            Ir para o login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[400px]">
      <div className="flex items-center space-x-2 text-black mb-4">
        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
        <h2 className="text-xl font-serif tracking-tight">Definir nova senha</h2>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">
          Crie uma nova senha segura para sua conta.
        </p>
        {userEmail && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Email: {userEmail}
          </div>
        )}
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        clearErrorOnChange();
                      }}
                      className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar nova senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite novamente sua nova senha"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        clearErrorOnChange();
                      }}
                      className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <strong>Sua senha deve conter:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Pelo menos 8 caracteres</li>
              <li>• Uma letra minúscula</li>
              <li>• Uma letra maiúscula</li>
              <li>• Um número</li>
            </ul>
          </div>

          {/* Error Display */}
          {resetError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{resetError}</span>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full !mt-8 !bg-black hover:!bg-gray-800 !text-white" 
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? (
              <>
                <Key className="h-4 w-4 mr-2 animate-pulse" />
                Salvando nova senha...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Salvar nova senha
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <button 
          onClick={() => navigate('/login')}
          className="text-sm text-gray-600 hover:text-black flex items-center justify-center gap-2 w-full"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordForm;