
// ABOUTME: The user login form component, matching the visual replica.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useLoginMutation, loginSchema } from '../../hooks/mutations/useLoginMutation';
import { useGoogleAuth } from '../../hooks/mutations/useGoogleAuth';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import GoogleIcon from '@/components/icons/GoogleIcon';
import { useAuthFormTransition } from '@/hooks/useAuthFormTransition';
import { useState } from 'react';
import { Mail, AlertCircle } from 'lucide-react';

const LoginForm = () => {
  const navigate = useNavigate();
  const mutation = useLoginMutation();
  const googleAuthMutation = useGoogleAuth();
  const { switchToRegister } = useAuthFormTransition();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Clear error when user starts typing
  const clearErrorOnChange = () => {
    if (loginError) {
      setLoginError('');
    }
  };

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    // Clear any previous errors
    setLoginError('');
    setUserEmail(values.email);
    
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Login bem-sucedido!');
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
          
          <button 
            type="button" 
            onClick={switchToRegister} 
            className="text-sm text-gray-600 hover:text-black underline"
          >
            Criar nova conta
          </button>
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
              Esqueceu?
            </Link>
          </div>

          {/* Login Error Display */}
          {loginError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}
          
          <Button type="submit" className="w-full !mt-8 !bg-black hover:!bg-gray-800 !text-white" disabled={mutation.isPending}>
            {mutation.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Form>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-600">
            ou continue com
          </span>
        </div>
      </div>
      
      <div className="mt-6">
        <Button 
          type="button"
          onClick={() => {
            // Clear any previous errors when attempting Google auth
            setLoginError('');
            googleAuthMutation.mutate(undefined, {
              onError: (error) => {
                // Display Google auth errors in the same format as login errors
                setLoginError(error.message || 'Erro ao conectar com Google');
              },
            });
          }}
          disabled={googleAuthMutation.isPending}
          variant="outline" 
          className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          {googleAuthMutation.isPending ? 'Conectando...' : 'Google'}
        </Button>
      </div>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-700">
          Não tem uma conta?{' '}
          <button type="button" onClick={switchToRegister} className="text-black font-medium hover:underline">
            Registrar
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
