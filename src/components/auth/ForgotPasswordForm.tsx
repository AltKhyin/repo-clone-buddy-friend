// ABOUTME: Form component for requesting password reset with clean and minimalistic UI

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { usePasswordResetRequest, resetRequestSchema } from '@/hooks/mutations/usePasswordResetMutation';
import type { z } from 'zod';

const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const resetMutation = usePasswordResetRequest();
  const [resetError, setResetError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const form = useForm<z.infer<typeof resetRequestSchema>>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: '' },
  });

  // Clear error when user starts typing
  const clearErrorOnChange = () => {
    if (resetError) {
      setResetError('');
    }
  };

  const onSubmit = (values: z.infer<typeof resetRequestSchema>) => {
    setResetError('');
    setSentToEmail(values.email);
    
    resetMutation.mutate(values, {
      onSuccess: () => {
        setEmailSent(true);
        toast.success('Email de redefinição enviado!');
      },
      onError: (error) => {
        setResetError(error.message);
        toast.error(error.message);
        console.error('Password reset request error:', error);
      },
    });
  };

  // Show success state after email is sent
  if (emailSent) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[400px]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-serif tracking-tight text-black mb-2">
            Email enviado!
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            Enviamos um link de redefinição de senha para{' '}
            <span className="font-medium text-black">{sentToEmail}</span>.
            Verifique sua caixa de entrada e clique no link para continuar.
          </p>

          <p className="text-xs text-gray-500 mb-6">
            Não recebeu o email? Verifique sua pasta de spam ou aguarde alguns minutos.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => {
                setEmailSent(false);
                setResetError('');
                form.reset();
              }}
              variant="outline" 
              className="w-full bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
            >
              Enviar para outro email
            </Button>
            
            <Button 
              onClick={() => navigate('/login')}
              variant="ghost"
              className="w-full text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[400px]">
      <div className="flex items-center space-x-2 text-black mb-4">
        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
        <h2 className="text-xl font-serif tracking-tight">Esqueceu sua senha?</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    placeholder="Seu email cadastrado"
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
                <Mail className="h-4 w-4 mr-2 animate-pulse" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar link de redefinição
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <Link 
          to="/login" 
          className="text-sm text-gray-600 hover:text-black flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;