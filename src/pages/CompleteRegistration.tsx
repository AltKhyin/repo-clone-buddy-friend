// ABOUTME: Supabase native registration completion page for payment-to-account linking flow

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Registration form schema - only password needed (name comes from invitation)
const registrationSchema = z.object({
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação de senha obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface PaymentMetadata {
  paymentData: any;
  customerData: any;
  planData: any;
}

export default function CompleteRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [paymentMetadata, setPaymentMetadata] = useState<PaymentMetadata | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationValid, setInvitationValid] = useState(false);

  // Form setup
  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Handle password setup flow on page load
  useEffect(() => {
    const handlePasswordSetupFlow = async () => {
      try {
        console.log('🔍 Checking user session for password setup requirement');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setError('Erro ao validar sessão');
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // User is authenticated - check if they need password setup
          const userMeta = session.user.user_metadata;
          console.log('👤 User metadata:', userMeta);
          
          const needsPasswordSetup = userMeta?.needs_password_setup === 'true' || userMeta?.needs_password_setup === true;
          const invitedViaPayment = userMeta?.invited_via === 'payment';
          
          if (needsPasswordSetup && invitedViaPayment) {
            // This user needs password setup after payment
            console.log('✅ User needs password setup after payment');
            setUserMetadata(userMeta);
            
            // Parse payment metadata if available
            if (userMeta.payment_metadata) {
              try {
                const parsedPaymentMeta = JSON.parse(userMeta.payment_metadata);
                setPaymentMetadata(parsedPaymentMeta);
              } catch (parseError) {
                console.warn('⚠️ Could not parse payment metadata:', parseError);
              }
            }
            
            setInvitationValid(true);
          } else {
            // User doesn't need password setup or not from payment
            console.log('ℹ️ User does not need password setup, redirecting to dashboard');
            navigate('/dashboard');
            return;
          }
        } else {
          // No session - redirect to login
          console.log('❌ No active session - redirecting to login');
          navigate('/login');
          return;
        }
        
      } catch (error) {
        console.error('💥 Error handling password setup flow:', error);
        setError('Erro ao processar configuração de senha');
      } finally {
        setIsLoading(false);
      }
    };

    handlePasswordSetupFlow();
  }, [navigate]);

  // Handle form submission - complete password setup for Supabase invitation
  const onSubmit = async (data: RegistrationFormData) => {
    if (!userMetadata || !paymentMetadata) {
      toast.error('Dados de convite não encontrados');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Completing Supabase invitation with password setup');

      // Step 1: Update user password and clear the setup requirement flag
      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password: data.password,
        data: {
          // Keep existing metadata but remove the password setup flag
          ...userMetadata,
          needs_password_setup: false, // Clear the flag
          password_set_at: new Date().toISOString(), // Track when password was set
        }
      });

      if (updatePasswordError) {
        console.error('❌ Password update error:', updatePasswordError);
        throw new Error(updatePasswordError.message);
      }

      console.log('✅ Password updated and setup flag cleared');

      // Step 2: Get current user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Falha ao obter dados do usuário');
      }

      console.log('✅ User authenticated:', user.id);

      // Step 3: Activate subscription via Edge Function
      // Note: Practitioners record is automatically created by database trigger
      const { data: activationResult, error: activationError } = await supabase.functions.invoke('activate-subscription-v2', {
        body: {
          userId: user.id,
          paymentData: paymentMetadata.paymentData,
          planData: paymentMetadata.planData,
        }
      });

      if (activationError || !activationResult?.success) {
        console.error('❌ Subscription activation failed:', activationError || activationResult);
        
        // Account created but subscription activation failed
        toast.success('Conta criada com sucesso!');
        toast.warn('Erro ao ativar assinatura. Entre em contato com o suporte.');
        
        setTimeout(() => {
          navigate('/dashboard?message=manual_activation_needed');
        }, 2000);
        return;
      }

      console.log('✅ Subscription activated successfully:', activationResult);

      // Step 4: Success - redirect to dashboard
      toast.success('Conta criada e assinatura ativada com sucesso!');
      
      setTimeout(() => {
        navigate('/dashboard?message=welcome_premium');
      }, 2000);

    } catch (error: any) {
      console.error('💥 Registration completion error:', error);
      setError(error.message || 'Erro ao finalizar cadastro');
      toast.error(error.message || 'Erro ao finalizar cadastro');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 text-center">Verificando configuração de senha...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (!invitationValid || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-red-900">Erro de Acesso</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              {error || 'Não foi possível acessar a configuração de senha.'}
            </p>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state (submitting)
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 text-center mb-2">Criando sua conta...</p>
            <p className="text-sm text-gray-500 text-center">Isso pode levar alguns instantes</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Complete seu Cadastro
          </CardTitle>
          <p className="text-gray-600">
            Seu pagamento foi aprovado! Complete seu cadastro para ativar sua assinatura.
          </p>
        </CardHeader>

        <CardContent>
          {/* Plan info */}
          {paymentMetadata?.planData && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertDescription>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">
                    Plano: {paymentMetadata.planData.name}
                  </p>
                  <p className="text-blue-700">
                    Nome: {userMetadata?.full_name}
                  </p>
                  <p className="text-blue-700">
                    Email: {userMetadata?.email || 'Não disponível'}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Crie uma senha forte"
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirme sua senha"
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando Conta...
                  </>
                ) : (
                  'Criar Conta e Ativar Assinatura'
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Já tem uma conta?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => navigate('/login')}
              >
                Faça login
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}