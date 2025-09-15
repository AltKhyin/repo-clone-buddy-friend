// ABOUTME: Simplified login form component for post-payment users - no registration options, Google auth removed
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useLoginMutation, loginSchema } from '../../hooks/mutations/useLoginMutation';
import { toast } from 'sonner';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { Mail, AlertCircle } from 'lucide-react';

const LoginFormSimplified = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mutation = useLoginMutation();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isProcessingPaymentToken, setIsProcessingPaymentToken] = useState(false);

  // Check for payment token in URL
  const paymentToken = searchParams.get('payment_token');
  const accountCreatedMessage = searchParams.get('message') === 'created_account';

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Show welcome message for new accounts
  useEffect(() => {
    if (accountCreatedMessage) {
      toast.success('Conta criada com sucesso! Faça login para acessar sua conta premium.');
    }
  }, [accountCreatedMessage]);

  // Clear error when user starts typing
  const clearErrorOnChange = () => {
    if (loginError) {
      setLoginError('');
    }
  };

  // Handle payment token completion after successful login
  const handlePaymentTokenCompletion = async (userId: string) => {
    if (!paymentToken) return;

    setIsProcessingPaymentToken(true);

    try {
      console.log('🔗 Processing payment token after login');

      const { completeAccountLinking } = await import('@/services/accountLinkingService');
      const result = await completeAccountLinking(paymentToken, userId);

      if (result.success) {
        toast.success('Login realizado e assinatura ativada com sucesso!');
      } else {
        console.error('❌ Payment token completion failed:', result.error);
        toast.warning('Login realizado, mas houve um problema na ativação da assinatura. Entre em contato conosco.');
      }
    } catch (error) {
      console.error('💥 Error processing payment token:', error);
      toast.warning('Login realizado, mas houve um problema na ativação da assinatura.');
    } finally {
      setIsProcessingPaymentToken(false);
    }
  };

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    // Clear any previous errors
    setLoginError('');
    setUserEmail(values.email);

    mutation.mutate(values, {
      onSuccess: async (data) => {
        console.log('✅ Login successful');

        // If there's a payment token, complete account linking
        if (paymentToken && data?.user?.id) {
          await handlePaymentTokenCompletion(data.user.id);
        } else {
          toast.success('Login bem-sucedido!');
        }

        navigate('/');
      },
      onError: (error) => {
        if (error.message === 'EMAIL_NOT_CONFIRMED') {
          setShowEmailConfirmation(true);
        } else {
          // Display the error message directly in the form instead of just toast
          setLoginError(error.message);
          // Keep the toast for consistency but make it less generic
          toast.error(error.message);
          console.error('Login error:', error);
        }
      },
    });
  };

  // Email confirmation prompt state
  if (showEmailConfirmation) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[350px]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <h2 className="text-xl font-serif tracking-tight text-black mb-2">
            Confirme seu email
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Precisamos que você confirme o email{' '}
            <span className="font-medium text-black">{userEmail}</span>{' '}
            antes de fazer login. Verifique sua caixa de entrada e clique no link de confirmação.
          </p>

          <Button
            onClick={() => setShowEmailConfirmation(false)}
            variant="outline"
            className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 mb-3"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[350px]">
      <div className="flex items-center space-x-2 text-black">
        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
        <h2 className="text-xl font-serif tracking-tight">Entrar</h2>
      </div>

      {/* Payment token indicator */}
      {paymentToken && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💳 Você tem uma assinatura pendente. Após o login, sua assinatura será ativada automaticamente.
          </p>
        </div>
      )}

      {/* Account created success message */}
      {accountCreatedMessage && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✅ Sua conta premium foi criada com sucesso! Faça login para acessar.
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    placeholder="Email"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      clearErrorOnChange();
                    }}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Senha"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      clearErrorOnChange();
                    }}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                className="border-black data-[state=checked]:bg-black data-[state=checked]:border-black"
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-gray-700 select-none"
              >
                Lembrar de mim
              </label>
            </div>
            <Link
              to="/esqueci-senha"
              className="text-sm text-gray-700 hover:text-black hover:underline"
            >
              Criar nova senha
            </Link>
          </div>

          {/* Login Error Display */}
          {loginError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full !mt-8 !bg-black hover:!bg-gray-800 !text-white"
            disabled={mutation.isPending || isProcessingPaymentToken}
          >
            {isProcessingPaymentToken ? 'Ativando assinatura...' :
             mutation.isPending ? 'Entrando...' :
             paymentToken ? 'Entrar e ativar assinatura' : 'Entrar'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginFormSimplified;