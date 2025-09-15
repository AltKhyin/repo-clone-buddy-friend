// ABOUTME: Simplified password creation page for Supabase invitation flow matching login/register UI

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SplitScreenAuthLayout from '@/components/auth/SplitScreenAuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';

// Simple password schema
const passwordSchema = z.object({
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação de senha obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function CompleteRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Form setup
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Handle invitation confirmation and password setup
  useEffect(() => {
    let authSubscription: any = null;

    const handleInvitationFlow = async () => {
      try {
        console.log('🔍 Handling invitation flow');

        // Get both current URL and hash parameters
        const currentUrl = new URL(window.location.href);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // Check for auth-related URL parameters from both search and hash
        const accessToken = currentUrl.searchParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = currentUrl.searchParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = currentUrl.searchParams.get('type') || hashParams.get('type');
        const token = currentUrl.searchParams.get('token') || hashParams.get('token');
        const tokenHash = currentUrl.searchParams.get('token_hash') || hashParams.get('token_hash');

        console.log('🔍 Complete URL breakdown:', {
          fullUrl: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          searchParams: Object.fromEntries(currentUrl.searchParams.entries()),
          hashParams: Object.fromEntries(hashParams.entries())
        });

        console.log('🔍 Extracted parameters:', {
          accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : null,
          refreshToken: refreshToken ? `${refreshToken.substring(0, 10)}...` : null,
          type,
          token: token ? `${token.substring(0, 10)}...` : null,
          tokenHash: tokenHash ? `${tokenHash.substring(0, 10)}...` : null
        });

        // Set up auth state change listener to handle async auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔄 Auth state change:', event, {
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email,
            userMeta: session?.user?.user_metadata
          });

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in via auth state change');
          }
        });
        authSubscription = subscription;

        // Handle token-based authentication (from email links)
        if (accessToken && refreshToken && type === 'invite') {
          console.log('📧 Processing invitation with access tokens...');

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('❌ Failed to set session from invitation:', error);
            navigate('/login?error=invalid_invitation');
            return;
          }

          console.log('✅ Invitation session set successfully');
          window.history.replaceState({}, document.title, '/complete-registration');
        }
        else if (token && type === 'invite') {
          console.log('📧 Processing invitation with verification token...');

          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash || token,
            type: 'invite'
          });

          if (error) {
            console.error('❌ Failed to verify invitation token:', error.message, error);
            navigate('/login?error=invalid_invitation_token');
            return;
          }

          console.log('✅ Invitation token verified successfully');
          window.history.replaceState({}, document.title, '/complete-registration');
        }

        // Now check for active session after token processing
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          console.log('❌ No valid session - redirecting to login');
          navigate('/login?error=no_session');
          return;
        }

        const user = session.user;
        const userMeta = user.user_metadata;

        console.log('👤 User metadata:', userMeta);

        // Check if user was created from payment
        const createdFromPayment = userMeta?.created_from_payment === true;

        if (createdFromPayment && userMeta?.full_name) {
          console.log('✅ Payment user confirmed - showing password setup');
          setUserInfo({
            name: userMeta.full_name,
            email: user.email,
            planDescription: userMeta.plan_description || 'EVIDENS Premium'
          });
        } else {
          console.log('ℹ️ User does not need password setup - redirecting to home');
          navigate('/?welcome=true');
          return;
        }

      } catch (error) {
        console.error('💥 Error in invitation flow:', error);
        navigate('/login?error=invitation_failed');
      } finally {
        setIsLoading(false);
      }
    };

    handleInvitationFlow();

    // Cleanup function
    return () => {
      authSubscription?.unsubscribe();
    };
  }, [navigate]);

  // Handle form submission - set password and complete account setup
  const onSubmit = async (data: PasswordFormData) => {
    if (!userInfo) {
      toast.error('Dados do usuário não encontrados');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Setting password for invited user');

      // Update user password and mark setup complete
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
        data: {
          password_setup_complete: true,
          password_set_at: new Date().toISOString(),
        }
      });

      if (updateError) {
        console.error('❌ Password update error:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ Password set successfully');

      // For premium payment users: Update subscription in Practitioners table
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.created_from_payment && user?.user_metadata?.subscription_tier === 'premium') {
        console.log('💳 Upgrading user to premium subscription...');

        // Extract subscription data from invitation metadata
        const subscriptionStartsAt = user.user_metadata.subscription_starts_at;
        const subscriptionEndsAt = user.user_metadata.subscription_ends_at;

        const { error: subscriptionError } = await supabase
          .from('Practitioners')
          .update({
            subscription_tier: 'premium',
            subscription_starts_at: subscriptionStartsAt,
            subscription_ends_at: subscriptionEndsAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (subscriptionError) {
          console.error('❌ Failed to upgrade subscription:', subscriptionError);
          // Don't fail the whole flow, just log the error
          toast.error('Atenção: Erro ao ativar assinatura premium. Entre em contato com o suporte.');
        } else {
          console.log('✅ Premium subscription activated successfully');

          // Fire Make.com webhook for successful premium account creation
          try {
            const webhookPayload = {
              event: {
                type: 'premium_account_activated',
                timestamp: new Date().toISOString(),
                source: 'complete_registration'
              },
              customer: {
                name: user.user_metadata.full_name,
                email: user.email,
                user_id: user.id
              },
              subscription: {
                tier: 'premium',
                starts_at: subscriptionStartsAt,
                ends_at: subscriptionEndsAt,
                payment_order_id: user.user_metadata.payment_order_id,
                payment_amount: user.user_metadata.payment_amount
              }
            };

            const webhookResponse = await fetch('https://hook.us2.make.com/qjdetduht1g375p7l556yrrutbi3j6cv', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookPayload),
            });

            if (webhookResponse.ok) {
              console.log('✅ Make.com webhook fired successfully');
            } else {
              console.warn('⚠️ Make.com webhook failed:', webhookResponse.status);
            }
          } catch (webhookError) {
            console.warn('⚠️ Make.com webhook error:', webhookError);
            // Don't fail the user flow for webhook errors
          }
        }
      }

      // Success - account is ready
      toast.success('Senha criada com sucesso!');
      toast.success('Sua conta premium está ativa!');

      setTimeout(() => {
        navigate('/?welcome=true');
      }, 2000);

    } catch (error: any) {
      console.error('💥 Password setup error:', error);
      toast.error(error.message || 'Erro ao criar senha');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SplitScreenAuthLayout>
        <AuthFormContainer>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-black mb-4" />
            <p className="text-black/80 text-center">Verificando convite...</p>
          </div>
        </AuthFormContainer>
      </SplitScreenAuthLayout>
    );
  }

  // Error state or no user info
  if (!userInfo) {
    return (
      <SplitScreenAuthLayout>
        <AuthFormContainer>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-black mb-4">Link inválido</h2>
            <p className="text-black/80 mb-6">
              Este link de ativação expirou ou não é válido.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-11 bg-black text-white hover:bg-black/90"
            >
              Ir para Login
            </Button>
          </div>
        </AuthFormContainer>
      </SplitScreenAuthLayout>
    );
  }

  // Success state (submitting)
  if (isSubmitting) {
    return (
      <SplitScreenAuthLayout>
        <AuthFormContainer>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-black mb-4" />
            <p className="text-black/80 text-center mb-2">Criando sua senha...</p>
            <p className="text-sm text-black/60 text-center">Aguarde um momento</p>
          </div>
        </AuthFormContainer>
      </SplitScreenAuthLayout>
    );
  }

  // Password creation form
  return (
    <SplitScreenAuthLayout>
      <AuthFormContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-black mb-2">
              Crie sua senha
            </h2>
            <p className="text-black/80 text-sm mb-2">
              Olá, {userInfo.name}
            </p>
            <p className="text-black/60 text-sm">
              Sua assinatura {userInfo.planDescription} está ativa!
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Sua senha (mín. 8 caracteres)"
                          className="h-11 pr-10 border-black/20 focus:border-black"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-black/50" />
                          ) : (
                            <Eye className="h-4 w-4 text-black/50" />
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
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirme sua senha"
                          className="h-11 pr-10 border-black/20 focus:border-black"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-black/50" />
                          ) : (
                            <Eye className="h-4 w-4 text-black/50" />
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
                className="w-full h-11 bg-black text-white hover:bg-black/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Senha e Acessar'
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-black/60">
              Já tem uma conta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-black underline hover:no-underline"
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      </AuthFormContainer>
    </SplitScreenAuthLayout>
  );
}