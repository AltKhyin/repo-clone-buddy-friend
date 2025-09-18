// ABOUTME: Institutional plan request form with validation and elegant styling matching login form

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSubmitInstitutionalRequestMutation } from '../../../packages/hooks/useSubmitInstitutionalRequestMutation';
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  phone: z.string()
    .regex(/^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/, "Telefone inválido. Use: (11) 99999-9999"),
  email: z.string()
    .email("Email inválido")
    .max(320, "Email deve ter no máximo 320 caracteres"),
  business_name: z.string()
    .min(1, "Nome da empresa é obrigatório")
    .max(200, "Nome da empresa deve ter no máximo 200 caracteres"),
  specific_needs: z.string()
    .min(10, "Mínimo 10 caracteres")
    .max(1000, "Máximo 1000 caracteres")
});

type FormData = z.infer<typeof formSchema>;

export const InstitutionalPlanRequestForm: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      business_name: '',
      specific_needs: ''
    }
  });

  const submitMutation = useSubmitInstitutionalRequestMutation();

  const onSubmit = async (data: FormData) => {
    try {
      await submitMutation.mutateAsync(data);

      setIsSubmitted(true);
      form.reset();

      toast({
        title: "Solicitação enviada!",
        description: "Recebemos sua solicitação e entraremos em contato em breve.",
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Erro ao enviar",
        description: error instanceof Error ? error.message : "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-[400px]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <h2 className="text-xl font-serif tracking-tight text-black mb-2">
            Solicitação enviada!
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Recebemos sua solicitação de plano institucional. Nossa equipe entrará em contato em breve para discutir as melhores opções para sua empresa.
          </p>

          <p className="text-xs text-gray-500 mb-6">
            Você pode esperar um retorno em até 24 horas úteis.
          </p>

          <Button
            onClick={() => navigate('/login')}
            className="w-full !bg-black hover:!bg-gray-800 !text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8 w-full max-w-md">
      <div className="flex items-center space-x-2 text-black mb-8">
        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
        <h2 className="text-xl font-serif tracking-tight">Plano Institucional</h2>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Nome */}
        <div className="space-y-2">
          <Input
            id="name"
            type="text"
            placeholder="Seu nome completo"
            {...form.register('name')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 bg-white/50"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Input
            id="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            {...form.register('phone')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 bg-white/50"
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Input
            id="email"
            type="email"
            placeholder="email"
            {...form.register('email')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 bg-white/50"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Nome da Empresa */}
        <div className="space-y-2">
          <Input
            id="business_name"
            type="text"
            placeholder="Nome da sua empresa"
            {...form.register('business_name')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 bg-white/50"
          />
          {form.formState.errors.business_name && (
            <p className="text-sm text-red-600">{form.formState.errors.business_name.message}</p>
          )}
        </div>

        {/* Necessidades Específicas */}
        <div className="space-y-2">
          <Textarea
            id="specific_needs"
            placeholder="Descreva aproximadamente quantos acessos deseja e qualquer outra dúvida que tenha"
            rows={4}
            {...form.register('specific_needs')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 bg-white/50 resize-none"
          />
          {form.formState.errors.specific_needs && (
            <p className="text-sm text-red-600">{form.formState.errors.specific_needs.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full bg-black text-white hover:bg-gray-800 py-3 px-4 rounded-xl font-medium transition-colors"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Solicitar Plano Institucional'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Ao enviar, você concorda em ser contatado por nossa equipe comercial
        </p>
      </div>
    </div>
  );
};

