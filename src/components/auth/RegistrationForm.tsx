// ABOUTME: Registration form component matching LoginForm visual design with birthday collection

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import { useSignupMutation, signupSchema } from '../../hooks/mutations/useSignupMutation';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@/components/icons/GoogleIcon';
import { useAuthFormTransition } from '@/hooks/useAuthFormTransition';
import { Mail } from 'lucide-react';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const mutation = useSignupMutation();
  const { switchToLogin } = useAuthFormTransition();
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { 
      fullName: '', 
      email: '', 
      password: '', 
      confirmPassword: '',
      birthday: ''
    },
  });

  const onSubmit = (values: z.infer<typeof signupSchema>) => {
    setUserEmail(values.email);
    mutation.mutate(values, {
      onSuccess: () => {
        setEmailSent(true);
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar conta.');
        console.error(error);
      },
    });
  };

  // Email confirmation success state
  if (emailSent) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[350px]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-serif tracking-tight text-black mb-2">
            Email de confirmação enviado
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            Enviamos um email de confirmação para{' '}
            <span className="font-medium text-black">{userEmail}</span>.
            Clique no link do email para concluir seu cadastro.
          </p>
          
          <Button 
            onClick={switchToLogin}
            variant="outline" 
            className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
          >
            Realizar login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[350px]">
      <div className="flex items-center space-x-2 text-black">
        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
        <h2 className="text-xl font-serif tracking-tight">Registrar</h2>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    placeholder="Nome completo"
                    {...field}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Email"
                    {...field}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthday"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    type="date"
                    placeholder="dd/mm/aaaa"
                    {...field}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                    lang="pt-BR"
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
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                  />
                </FormControl>
                <PasswordStrengthIndicator password={field.value} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirmar senha"
                    {...field}
                    className="bg-white border-gray-300 focus:border-black focus:ring-0 text-black placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full !mt-8 !bg-black hover:!bg-gray-800 !text-white" disabled={mutation.isPending}>
            {mutation.isPending ? 'Criando conta...' : 'Criar conta'}
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
        <Button variant="outline" className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700 flex items-center justify-center gap-2">
            <GoogleIcon />
            Google
        </Button>
      </div>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-700">
          Já tem uma conta?{' '}
          <button type="button" onClick={switchToLogin} className="text-black font-medium hover:underline">
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegistrationForm;