
// ABOUTME: The user signup form component with enhanced error handling.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSignupMutation, signupSchema } from '@/hooks/mutations/useSignupMutation';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

const SignupForm = () => {
  const mutation = useSignupMutation();
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = (values: z.infer<typeof signupSchema>) => {
    console.log('Form submitted with values:', { 
      fullName: values.fullName, 
      email: values.email, 
      passwordLength: values.password.length 
    });
    
    setErrorDetails(null); // Clear previous errors
    
    mutation.mutate(values, {
      onSuccess: (data) => {
        console.log('Signup successful:', data);
        toast.success('Cadastro realizado!', {
          description: 'Verifique seu email para confirmar sua conta.',
        });
        form.reset();
      },
      onError: (error) => {
        console.error('Signup error caught:', error);
        
        const errorMessage = error.message || 'Erro desconhecido no cadastro';
        setErrorDetails(errorMessage);
        
        // Show different messages based on error type
        if (error.message.includes('já está em uso')) {
          toast.error('Este email já está em uso.');
        } else if (error.message.includes('Email inválido')) {
          toast.error('Por favor, insira um email válido.');
        } else if (error.message.includes('Senha')) {
          toast.error('Senha deve ter pelo menos 8 caracteres.');
        } else {
          toast.error('Erro no cadastro', {
            description: errorMessage,
          });
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {errorDetails && (
          <Alert variant="destructive">
            <AlertDescription>
              {errorDetails}
            </AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu Nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="seu@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Criando conta...' : 'Criar Conta'}
        </Button>
      </form>
    </Form>
  );
};

export default SignupForm;
